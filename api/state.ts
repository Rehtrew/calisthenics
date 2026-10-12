import type { VercelRequest, VercelResponse } from '@vercel/node'
import { timingSafeEqual } from 'node:crypto'
import { createClient } from 'redis'

/**
 * One JSON document per deployment, stored in Redis. Works with either
 *   - REDIS_URL / KV_URL  (Vercel Redis, a redis:// or rediss:// connection string), or
 *   - KV_REST_API_URL + KV_REST_API_TOKEN (Upstash REST, also UPSTASH_REDIS_REST_URL/TOKEN).
 * Protected by APP_SECRET, which the app sends as a bearer token.
 */

const KEY = process.env.STATE_KEY ?? 'cali:state'
const MAX_BYTES = 4_000_000

interface Store {
  get(key: string): Promise<string | null>
  set(key: string, value: string): Promise<void>
}

let client: ReturnType<typeof createClient> | null = null

async function tcpStore(url: string): Promise<Store> {
  if (!client) {
    client = createClient({ url })
    client.on('error', (err) => console.error('redis', err))
  }
  if (!client.isOpen) await client.connect()
  const c = client
  return {
    get: (key) => c.get(key),
    set: async (key, value) => {
      await c.set(key, value)
    },
  }
}

function restStore(url: string, token: string): Store {
  const run = async (parts: string[]): Promise<unknown> => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(parts),
    })
    if (!res.ok) throw new Error(`redis rest ${res.status}`)
    const data = (await res.json()) as { result?: unknown; error?: string }
    if (data.error) throw new Error(data.error)
    return data.result
  }
  return {
    get: async (key) => {
      const v = await run(['GET', key])
      return typeof v === 'string' ? v : null
    },
    set: async (key, value) => {
      await run(['SET', key, value])
    },
  }
}

async function getStore(): Promise<Store | null> {
  const restUrl = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL
  const restToken = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN
  if (restUrl && restToken) return restStore(restUrl, restToken)
  const tcpUrl = process.env.REDIS_URL ?? process.env.KV_URL
  if (tcpUrl) return tcpStore(tcpUrl)
  return null
}

function authorized(req: VercelRequest, secret: string): boolean {
  const header = req.headers.authorization ?? ''
  const given = header.startsWith('Bearer ') ? header.slice(7) : ''
  const a = Buffer.from(given)
  const b = Buffer.from(secret)
  return a.length === b.length && timingSafeEqual(a, b)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')
  const secret = process.env.APP_SECRET
  if (!secret || secret.length < 6) {
    return res.status(503).json({ error: 'APP_SECRET is not set' })
  }
  if (!authorized(req, secret)) {
    return res.status(401).json({ error: 'unauthorized' })
  }

  try {
    const store = await getStore()
    if (!store) return res.status(503).json({ error: 'no database configured' })

    if (req.method === 'GET') {
      const raw = await store.get(KEY)
      if (raw === null) return res.status(404).json({ error: 'empty' })
      res.setHeader('Content-Type', 'application/json')
      return res.status(200).send(raw)
    }

    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? null)
      if (Buffer.byteLength(body) > MAX_BYTES) return res.status(413).json({ error: 'too large' })
      let parsed: { sessions?: unknown; updatedAt?: unknown }
      try {
        parsed = JSON.parse(body)
      } catch {
        return res.status(400).json({ error: 'bad json' })
      }
      if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.sessions) || typeof parsed.updatedAt !== 'number') {
        return res.status(400).json({ error: 'bad state' })
      }
      await store.set(KEY, body)
      return res.status(200).json({ ok: true, updatedAt: parsed.updatedAt })
    }

    res.setHeader('Allow', 'GET, PUT')
    return res.status(405).json({ error: 'method not allowed' })
  } catch (err) {
    console.error(err)
    return res.status(502).json({ error: 'storage unavailable' })
  }
}

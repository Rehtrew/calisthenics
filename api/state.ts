import type { VercelRequest, VercelResponse } from '@vercel/node'
import { timingSafeEqual } from 'node:crypto'

/**
 * One JSON document per deployment, stored in Redis (Upstash via the Vercel
 * Marketplace, or any Upstash-compatible REST endpoint). Protected by a shared
 * secret the app sends as a bearer token.
 *
 * Env vars: KV_REST_API_URL + KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_URL/TOKEN), APP_SECRET
 */

const KEY = process.env.STATE_KEY ?? 'cali:state'
const MAX_BYTES = 4_000_000

type Command = (parts: string[]) => Promise<unknown>

function redis(): Command | null {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return async (parts) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(parts),
    })
    if (!res.ok) throw new Error(`redis ${res.status}`)
    const data = (await res.json()) as { result?: unknown; error?: string }
    if (data.error) throw new Error(data.error)
    return data.result
  }
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
  const run = redis()
  if (!secret || secret.length < 6 || !run) {
    return res.status(503).json({ error: 'not configured' })
  }
  if (!authorized(req, secret)) {
    return res.status(401).json({ error: 'unauthorized' })
  }

  try {
    if (req.method === 'GET') {
      const raw = await run(['GET', KEY])
      if (typeof raw !== 'string') return res.status(404).json({ error: 'empty' })
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
      await run(['SET', KEY, body])
      return res.status(200).json({ ok: true, updatedAt: parsed.updatedAt })
    }

    res.setHeader('Allow', 'GET, PUT')
    return res.status(405).json({ error: 'method not allowed' })
  } catch (err) {
    console.error(err)
    return res.status(502).json({ error: 'storage unavailable' })
  }
}

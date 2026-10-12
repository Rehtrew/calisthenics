import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * In `npm run dev` there is no Vercel function, so this serves /api/state from
 * memory with the same contract (secret defaults to "dev"). Production uses api/state.ts.
 */
function devSyncApi(): Plugin {
  let stored: string | null = null
  return {
    name: 'dev-sync-api',
    configureServer(server) {
      server.middlewares.use('/api/state', (req, res) => {
        const secret = process.env.APP_SECRET ?? 'dev'
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Cache-Control', 'no-store')
        if ((req.headers.authorization ?? '') !== `Bearer ${secret}`) {
          res.statusCode = 401
          res.end('{"error":"unauthorized"}')
          return
        }
        if (req.method === 'GET') {
          if (stored === null) {
            res.statusCode = 404
            res.end('{"error":"empty"}')
            return
          }
          res.end(stored)
          return
        }
        if (req.method === 'PUT') {
          let body = ''
          req.on('data', (chunk: Buffer) => {
            body += chunk.toString()
          })
          req.on('end', () => {
            stored = body
            res.end('{"ok":true}')
          })
          return
        }
        res.statusCode = 405
        res.end('{"error":"method not allowed"}')
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), devSyncApi()],
  test: {
    environment: 'node',
  },
})

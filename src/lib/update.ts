import { getState } from './store'

/**
 * iOS keeps a home-screen web app running with whatever was loaded last, so a
 * new deploy is not picked up until the app is force-closed. This compares the
 * bundle referenced by the live index.html with the one running, and reloads
 * when they differ. Never mid-workout; state lives in localStorage anyway.
 */
function currentBundle(): string | null {
  const script = document.querySelector<HTMLScriptElement>('script[type="module"][src*="/assets/"]')
  return script?.getAttribute('src') ?? null
}

async function liveBundle(): Promise<string | null> {
  try {
    const res = await fetch('/', { cache: 'no-store', headers: { Accept: 'text/html' } })
    if (!res.ok) return null
    const html = await res.text()
    return html.match(/<script[^>]+type="module"[^>]+src="([^"]*\/assets\/[^"]+)"/)?.[1] ?? null
  } catch {
    return null
  }
}

let checking = false

export async function checkForUpdate() {
  if (checking || getState().active) return
  const mine = currentBundle()
  if (!mine) return
  checking = true
  try {
    const live = await liveBundle()
    if (live && live !== mine && !getState().active) location.reload()
  } finally {
    checking = false
  }
}

export function startUpdateCheck() {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void checkForUpdate()
  })
  setInterval(() => {
    if (document.visibilityState === 'visible') void checkForUpdate()
  }, 10 * 60_000)
}

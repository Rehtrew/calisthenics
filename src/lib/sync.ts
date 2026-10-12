import { useSyncExternalStore } from 'react'
import { applyRemoteState, getState, normalize, onLocalChange } from './store'
import { fingerprint, mergeStates } from './merge'

const SECRET_KEY = 'calisthenics:sync-secret'
const ENDPOINT = '/api/state'

export interface SyncStatus {
  state: 'off' | 'idle' | 'syncing' | 'error'
  message: string
  lastSyncedAt: number | null
}

function readSecret(): string {
  try {
    return localStorage.getItem(SECRET_KEY) ?? ''
  } catch {
    return ''
  }
}

let secret = readSecret()
let status: SyncStatus = secret
  ? { state: 'idle', message: 'Ikke synkroniseret endnu', lastSyncedAt: null }
  : { state: 'off', message: 'Ikke slået til', lastSyncedAt: null }
const listeners = new Set<() => void>()

function setStatus(patch: Partial<SyncStatus>) {
  status = { ...status, ...patch }
  listeners.forEach((l) => l())
}

export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => {
        listeners.delete(l)
      }
    },
    () => status,
    () => status,
  )
}

export const getSyncSecret = () => secret

export function setSyncSecret(next: string) {
  secret = next.trim()
  try {
    if (secret) localStorage.setItem(SECRET_KEY, secret)
    else localStorage.removeItem(SECRET_KEY)
  } catch {
    /* ignore */
  }
  if (secret) {
    setStatus({ state: 'idle', message: 'Ikke synkroniseret endnu', lastSyncedAt: null })
    void syncNow()
  } else {
    setStatus({ state: 'off', message: 'Ikke slået til', lastSyncedAt: null })
  }
}

function request(method: 'GET' | 'PUT', body?: string) {
  return fetch(ENDPOINT, {
    method,
    headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
    body,
    cache: 'no-store',
  })
}

async function run(): Promise<void> {
  if (!secret) return
  if (!navigator.onLine) {
    setStatus({ state: 'error', message: 'Offline, gemmer lokalt indtil videre' })
    return
  }
  setStatus({ state: 'syncing', message: 'Synkroniserer…' })
  try {
    const res = await request('GET')
    if (res.status === 401) return setStatus({ state: 'error', message: 'Forkert sync-kode' })
    if (res.status === 503) return setStatus({ state: 'error', message: 'Serveren mangler opsætning (database eller APP_SECRET)' })
    if (res.status !== 200 && res.status !== 404) return setStatus({ state: 'error', message: `Serverfejl ${res.status}` })

    const remote = res.status === 404 ? null : normalize(await res.json())
    const local = getState()
    const merged = remote ? mergeStates(local, remote) : local

    if (!remote || fingerprint(merged) !== fingerprint(remote) || merged.updatedAt > remote.updatedAt) {
      const toPush = { ...merged, updatedAt: Math.max(merged.updatedAt, Date.now()) }
      const put = await request('PUT', JSON.stringify(toPush))
      if (put.status === 401) return setStatus({ state: 'error', message: 'Forkert sync-kode' })
      if (!put.ok) return setStatus({ state: 'error', message: `Kunne ikke gemme (${put.status})` })
      if (fingerprint(toPush) !== fingerprint(getState())) applyRemoteState(toPush)
      else applyRemoteState({ ...getState(), updatedAt: toPush.updatedAt })
    } else if (fingerprint(merged) !== fingerprint(local) || merged.updatedAt !== local.updatedAt) {
      applyRemoteState(merged)
    }
    setStatus({ state: 'idle', message: 'Synkroniseret', lastSyncedAt: Date.now() })
  } catch {
    setStatus({ state: 'error', message: 'Kunne ikke nå serveren' })
  }
}

let inFlight: Promise<void> | null = null
let again = false

/** Pull, merge and push. Safe to call often; overlapping calls are queued. */
export function syncNow(): Promise<void> {
  if (inFlight) {
    again = true
    return inFlight
  }
  inFlight = run().finally(() => {
    inFlight = null
    if (again) {
      again = false
      void syncNow()
    }
  })
  return inFlight
}

let timer: ReturnType<typeof setTimeout> | undefined

export function startSync() {
  onLocalChange(() => {
    if (!secret) return
    clearTimeout(timer)
    timer = setTimeout(() => void syncNow(), 1500)
  })
  window.addEventListener('online', () => void syncNow())
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void syncNow()
  })
  setInterval(() => {
    if (document.visibilityState === 'visible') void syncNow()
  }, 60_000)
  void syncNow()
}

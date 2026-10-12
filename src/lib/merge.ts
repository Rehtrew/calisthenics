import type { AppState, Session } from './types'

/**
 * Combine the state on this device with the copy on the server.
 * Sessions are a union by id minus anything either side deleted; for everything
 * else (settings, active workout) the more recently changed side wins.
 */
export function mergeStates(local: AppState, remote: AppState): AppState {
  const newer = remote.updatedAt > local.updatedAt ? remote : local
  const deleted = new Set([...remote.deleted, ...local.deleted])
  const byId = new Map<string, Session>()
  for (const s of [...remote.sessions, ...local.sessions]) {
    if (!deleted.has(s.id)) byId.set(s.id, s)
  }
  const sessions = [...byId.values()].sort((a, b) => a.endedAt - b.endedAt)
  return {
    ...newer,
    sessions,
    deleted: [...deleted].sort(),
    updatedAt: Math.max(local.updatedAt, remote.updatedAt),
  }
}

/** Stable serialization so two states with the same content compare equal. */
export function fingerprint(state: AppState): string {
  return JSON.stringify({
    settings: state.settings,
    active: state.active,
    sessions: state.sessions.map((s) => s.id).sort(),
    deleted: [...state.deleted].sort(),
  })
}

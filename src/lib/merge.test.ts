import { describe, expect, it } from 'vitest'
import { fingerprint, mergeStates } from './merge'
import { weightLog } from './stats'
import { fmtKg, parseKg } from './format'
import type { AppState, Session } from './types'

const session = (id: string, endedAt: number): Session => ({
  id,
  programId: 'beginner',
  levelIndex: 0,
  dayId: 'd1',
  dayLabel: 'Dag 1',
  startedAt: endedAt - 1000,
  endedAt,
  status: 'completed',
  restSeconds: 120,
  skipLegs: false,
  exercises: [],
})

const base = (over: Partial<AppState>): AppState => ({
  version: 1,
  settings: { programId: 'beginner', levelIndex: 0, restSeconds: 120, skipLegs: false, theme: 'dark', weightKg: 106 },
  sessions: [],
  active: null,
  updatedAt: 0,
  deleted: [],
  ...over,
})

describe('mergeStates', () => {
  it('unions sessions from both sides', () => {
    const local = base({ sessions: [session('a', 1), session('c', 3)], updatedAt: 10 })
    const remote = base({ sessions: [session('b', 2)], updatedAt: 20 })
    expect(mergeStates(local, remote).sessions.map((s) => s.id)).toEqual(['a', 'b', 'c'])
  })

  it('lets the newer side win settings and active workout', () => {
    const local = base({ updatedAt: 10, settings: { programId: 'beginner', levelIndex: 2, restSeconds: 90, skipLegs: true, theme: 'dark', weightKg: 106 } })
    const remote = base({ updatedAt: 20, settings: { programId: 'intermediate', levelIndex: 0, restSeconds: 120, skipLegs: false, theme: 'light', weightKg: 106 } })
    expect(mergeStates(local, remote).settings.programId).toBe('intermediate')
    expect(mergeStates(remote, local).settings.programId).toBe('intermediate')
    expect(mergeStates(local, remote).updatedAt).toBe(20)
  })

  it('keeps deletions from either side', () => {
    const local = base({ sessions: [session('a', 1)], deleted: ['b'], updatedAt: 10 })
    const remote = base({ sessions: [session('a', 1), session('b', 2)], deleted: [], updatedAt: 20 })
    const merged = mergeStates(local, remote)
    expect(merged.sessions.map((s) => s.id)).toEqual(['a'])
    expect(merged.deleted).toEqual(['b'])
  })

  it('fingerprint ignores ordering', () => {
    const a = base({ sessions: [session('a', 1), session('b', 2)] })
    const b = base({ sessions: [session('b', 2), session('a', 1)] })
    expect(fingerprint(a)).toBe(fingerprint(b))
  })
})

describe('weight log', () => {
  it('lists logged weights oldest first and formats them', () => {
    const a = { ...session('a', 1), weightKg: 106.2 }
    const b = session('b', 2)
    const c = { ...session('c', 3), weightKg: 105.8 }
    expect(weightLog([c, b, a]).map((w) => w.kg)).toEqual([106.2, 105.8])
    expect(fmtKg(105.84)).toBe('105,8')
    expect(parseKg('106,2')).toBe(106.2)
    expect(parseKg('abc')).toBeNull()
    expect(parseKg('5')).toBeNull()
  })
})

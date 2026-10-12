import { useSyncExternalStore } from 'react'
import type { ActiveWorkout, AppState, Exercise, ProgramDay, ProgramId, Session, SessionStatus, SetLog, Settings } from './types'
import { parseReps } from './reps'

const KEY = 'calisthenics:v1'

const defaultSettings: Settings = {
  programId: 'beginner',
  levelIndex: 0,
  restSeconds: 120,
  skipLegs: false,
  theme: 'dark',
}

const defaultState: AppState = { version: 1, settings: defaultSettings, sessions: [], active: null, updatedAt: 0, deleted: [] }

export function normalize(input: unknown): AppState {
  const p = (input && typeof input === 'object' ? input : {}) as Partial<AppState>
  return {
    version: 1,
    settings: { ...defaultSettings, ...(p.settings ?? {}) },
    sessions: Array.isArray(p.sessions) ? p.sessions : [],
    active: p.active ?? null,
    updatedAt: typeof p.updatedAt === 'number' ? p.updatedAt : 0,
    deleted: Array.isArray(p.deleted) ? p.deleted.filter((x): x is string => typeof x === 'string') : [],
  }
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? normalize(JSON.parse(raw)) : defaultState
  } catch {
    return defaultState
  }
}

let state: AppState = load()
const listeners = new Set<() => void>()
const localListeners = new Set<() => void>()

function persist(next: AppState) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* storage unavailable: keep going in memory */
  }
  listeners.forEach((l) => l())
}

/** A change made on this device: stamps updatedAt and tells the sync layer. */
function commit(next: Omit<AppState, 'updatedAt'> & { updatedAt?: number }) {
  persist({ ...next, updatedAt: Date.now() })
  localListeners.forEach((l) => l())
}

/** Adopt a state that came from the server without treating it as a local change. */
export function applyRemoteState(next: AppState) {
  persist(normalize(next))
}

export const getState = () => state

export function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function onLocalChange(listener: () => void) {
  localListeners.add(listener)
  return () => {
    localListeners.delete(listener)
  }
}

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, getState, getState)
}

export function updateSettings(patch: Partial<Settings>) {
  commit({ ...state, settings: { ...state.settings, ...patch } })
}

const makeId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8)

function closeActive(a: ActiveWorkout, status: SessionStatus): Session {
  return {
    id: makeId(),
    programId: a.programId,
    levelIndex: a.levelIndex,
    dayId: a.dayId,
    dayLabel: a.dayLabel,
    startedAt: a.startedAt,
    endedAt: Date.now(),
    status,
    restSeconds: a.restSeconds,
    skipLegs: a.skipLegs,
    exercises: a.exercises,
  }
}

export function startWorkout(opts: {
  programId: ProgramId
  levelIndex: number
  day: ProgramDay
  exercises: Exercise[]
  restSeconds: number
  skipLegs: boolean
}) {
  let sessions = state.sessions
  if (state.active) sessions = [...sessions, closeActive(state.active, 'aborted')]
  const active: ActiveWorkout = {
    programId: opts.programId,
    levelIndex: opts.levelIndex,
    dayId: opts.day.id,
    dayLabel: opts.day.label,
    startedAt: Date.now(),
    restSeconds: opts.restSeconds,
    skipLegs: opts.skipLegs,
    exercises: opts.exercises.map((e) => ({ name: e.name, reps: e.reps, sets: e.sets, logs: [] })),
    exerciseIndex: 0,
    setIndex: 0,
    phase: 'set',
    restEndsAt: null,
  }
  commit({
    ...state,
    active,
    sessions,
    settings: { ...state.settings, restSeconds: opts.restSeconds, skipLegs: opts.skipLegs },
  })
}

/** Log the current set. Returns the finished session id when this was the last set. */
export function logSet(achieved: number | null, full: boolean): string | null {
  const a = state.active
  if (!a) return null
  const ex = a.exercises[a.exerciseIndex]
  const target = parseReps(ex.reps, a.setIndex)
  const log: SetLog = {
    target: target.value,
    achieved: full && !target.isMax ? target.value : achieved,
    full,
    unit: target.unit,
  }
  const exercises = a.exercises.map((e, i) => (i === a.exerciseIndex ? { ...e, logs: [...e.logs, log] } : e))
  const lastSet = a.setIndex + 1 >= ex.sets
  const lastExercise = a.exerciseIndex + 1 >= a.exercises.length

  if (lastSet && lastExercise) {
    const session = closeActive({ ...a, exercises }, 'completed')
    commit({ ...state, active: null, sessions: [...state.sessions, session] })
    return session.id
  }

  const position = lastSet
    ? { exerciseIndex: a.exerciseIndex + 1, setIndex: 0 }
    : { exerciseIndex: a.exerciseIndex, setIndex: a.setIndex + 1 }
  commit({
    ...state,
    active: { ...a, exercises, ...position, phase: 'rest', restEndsAt: Date.now() + a.restSeconds * 1000 },
  })
  return null
}

export function undoLastSet() {
  const a = state.active
  if (!a) return
  let exerciseIndex = a.exerciseIndex
  if (a.exercises[exerciseIndex].logs.length === 0) {
    exerciseIndex -= 1
    if (exerciseIndex < 0) return
  }
  const exercises = a.exercises.map((e, i) => (i === exerciseIndex ? { ...e, logs: e.logs.slice(0, -1) } : e))
  commit({
    ...state,
    active: { ...a, exercises, exerciseIndex, setIndex: exercises[exerciseIndex].logs.length, phase: 'set', restEndsAt: null },
  })
}

export function extendRest(seconds: number) {
  const a = state.active
  if (!a || a.phase !== 'rest') return
  const base = Math.max(Date.now(), a.restEndsAt ?? 0)
  commit({ ...state, active: { ...a, restEndsAt: base + seconds * 1000 } })
}

export function finishRest() {
  const a = state.active
  if (!a || a.phase !== 'rest') return
  commit({ ...state, active: { ...a, phase: 'set', restEndsAt: null } })
}

export function abortWorkout(): string | null {
  const a = state.active
  if (!a) return null
  const session = closeActive(a, 'aborted')
  commit({ ...state, active: null, sessions: [...state.sessions, session] })
  return session.id
}

export function discardWorkout() {
  commit({ ...state, active: null })
}

export function deleteSession(id: string) {
  commit({ ...state, sessions: state.sessions.filter((s) => s.id !== id), deleted: [...new Set([...state.deleted, id])] })
}

/** Import a backup: its sessions win, even over earlier deletions of the same ids. */
export function replaceState(next: unknown) {
  const imported = normalize(next)
  const ids = new Set(imported.sessions.map((s) => s.id))
  commit({ ...imported, deleted: [...new Set([...state.deleted, ...imported.deleted])].filter((id) => !ids.has(id)) })
}

/** Wipe everything, and remember the ids so the server copy is wiped too. */
export function resetAll() {
  commit({ ...defaultState, deleted: [...new Set([...state.deleted, ...state.sessions.map((s) => s.id)])] })
}

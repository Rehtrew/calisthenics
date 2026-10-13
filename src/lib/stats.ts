import type { Exercise, ExerciseLog, Level, ProgramDay, Session, SetLog } from './types'
import { parseReps } from './reps'

export function setRatio(log: SetLog): number {
  if (log.full) return 1
  if (log.target && log.achieved != null) return Math.min(1, log.achieved / log.target)
  return log.achieved != null ? 1 : 0
}

export interface Score {
  setsPlanned: number
  setsDone: number
  /** sum of achieved reps (rep-based sets only) */
  reps: number
  /** 0-100, share of the planned work that was done */
  pct: number
}

export function exerciseScore(ex: ExerciseLog): Score {
  const setsDone = ex.logs.length
  const ratio = ex.logs.reduce((n, l) => n + setRatio(l), 0)
  const reps = ex.logs.reduce((n, l) => n + (l.unit === 'reps' && l.achieved != null ? l.achieved : 0), 0)
  return { setsPlanned: ex.sets, setsDone, reps, pct: ex.sets ? Math.round((100 * ratio) / ex.sets) : 0 }
}

export function sessionScore(session: Pick<Session, 'exercises'>): Score {
  let setsPlanned = 0
  let setsDone = 0
  let ratio = 0
  let reps = 0
  for (const ex of session.exercises) {
    setsPlanned += ex.sets
    setsDone += ex.logs.length
    for (const l of ex.logs) {
      ratio += setRatio(l)
      if (l.unit === 'reps' && l.achieved != null) reps += l.achieved
    }
  }
  return { setsPlanned, setsDone, reps, pct: setsPlanned ? Math.round((100 * ratio) / setsPlanned) : 0 }
}

export const byEnded = (a: Session, b: Session) => a.endedAt - b.endedAt

export function sessionsForDay(sessions: Session[], levelIndex: number, dayId: string): Session[] {
  return sessions.filter((s) => s.levelIndex === levelIndex && s.dayId === dayId).sort(byEnded)
}

export function previousSession(sessions: Session[], ref: Session): Session | undefined {
  return sessionsForDay(sessions, ref.levelIndex, ref.dayId)
    .filter((s) => s.id !== ref.id && s.endedAt <= ref.startedAt)
    .at(-1)
}

export function lastSetResult(session: Session | undefined, exerciseName: string, setIndex: number): SetLog | undefined {
  return session?.exercises.find((e) => e.name === exerciseName)?.logs[setIndex]
}

export function countThisMonth(sessions: Session[], now = Date.now()): number {
  const d = new Date(now)
  return sessions.filter((s) => {
    const x = new Date(s.startedAt)
    return x.getFullYear() === d.getFullYear() && x.getMonth() === d.getMonth()
  }).length
}

export function recentAverage(sessions: Session[], n = 5): number | null {
  const last = [...sessions]
    .filter((s) => s.status === 'completed')
    .sort(byEnded)
    .slice(-n)
  if (!last.length) return null
  return Math.round(last.reduce((sum, s) => sum + sessionScore(s).pct, 0) / last.length)
}

/**
 * Days finished in the current round at a level. A round is one pass through
 * all the level's days; once every day has been completed the round resets.
 */
export function doneThisRound(level: Level, sessions: Session[], levelIndex: number): Set<string> {
  const ids = level.days.map((d) => d.id)
  let done = new Set<string>()
  for (const s of sessions.filter((x) => x.levelIndex === levelIndex && x.status === 'completed').sort(byEnded)) {
    if (!ids.includes(s.dayId)) continue
    done.add(s.dayId)
    if (done.size === ids.length) done = new Set()
  }
  return done
}

/** The day to train next: an aborted day again, otherwise the first day not yet done this round. */
export function suggestNextDay(level: Level, sessions: Session[], levelIndex: number): ProgramDay {
  const atLevel = sessions.filter((s) => s.levelIndex === levelIndex).sort(byEnded)
  const last = atLevel.at(-1)
  if (last?.status === 'aborted') return level.days.find((d) => d.id === last.dayId) ?? level.days[0]
  const done = doneThisRound(level, sessions, levelIndex)
  return level.days.find((d) => !done.has(d.id)) ?? level.days[0]
}

export interface ExerciseHistoryEntry {
  sessionId: string
  at: number
  dayLabel: string
  levelIndex: number
  logs: SetLog[]
  /** reps achieved across the logged sets (seconds for holds) */
  total: number
  /** how much of the planned work was done, 0-100 */
  pct: number
}

/** Every time an exercise was logged, oldest first. */
export function exerciseHistory(sessions: Session[], name: string): ExerciseHistoryEntry[] {
  const out: ExerciseHistoryEntry[] = []
  for (const s of [...sessions].sort(byEnded)) {
    const ex = s.exercises.find((e) => e.name === name)
    if (!ex || ex.logs.length === 0) continue
    out.push({
      sessionId: s.id,
      at: s.endedAt,
      dayLabel: s.dayLabel,
      levelIndex: s.levelIndex,
      logs: ex.logs,
      total: ex.logs.reduce((n, l) => n + (l.achieved ?? 0), 0),
      pct: exerciseScore(ex).pct,
    })
  }
  return out
}

/** Sets logged the last time this exercise was trained, ignoring a session in progress. */
export function lastExerciseLogs(sessions: Session[], name: string): SetLog[] | undefined {
  return exerciseHistory(sessions, name).at(-1)?.logs
}

export function estimateMinutes(exercises: Pick<Exercise, 'reps' | 'sets'>[], restSeconds: number): number {
  let seconds = 0
  for (const ex of exercises) {
    const target = parseReps(ex.reps, 0)
    if (target.unit === 'min' && target.value) seconds += ex.sets * target.value * 60
    else seconds += ex.sets * (restSeconds + 45)
  }
  return Math.max(5, Math.round(seconds / 60 / 5) * 5)
}

/** Weights logged after workouts, oldest first. */
export function weightLog(sessions: Session[]): { sessionId: string; at: number; kg: number }[] {
  return sessions
    .filter((s): s is Session & { weightKg: number } => typeof s.weightKg === 'number')
    .sort(byEnded)
    .map((s) => ({ sessionId: s.id, at: s.endedAt, kg: s.weightKg }))
}

import type { Exercise, ExerciseLog, Level, ProgramDay, ProgramId, Session, SetLog } from './types'
import { parseReps } from './reps'
import { dayKey } from './format'

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

export function sessionsForDay(sessions: Session[], programId: ProgramId, levelIndex: number, dayId: string): Session[] {
  return sessions.filter((s) => s.programId === programId && s.levelIndex === levelIndex && s.dayId === dayId).sort(byEnded)
}

export function previousSession(sessions: Session[], ref: Session): Session | undefined {
  return sessionsForDay(sessions, ref.programId, ref.levelIndex, ref.dayId)
    .filter((s) => s.id !== ref.id && s.endedAt <= ref.startedAt)
    .at(-1)
}

export function lastSetResult(session: Session | undefined, exerciseName: string, setIndex: number): SetLog | undefined {
  return session?.exercises.find((e) => e.name === exerciseName)?.logs[setIndex]
}

export function trainedDays(sessions: Session[]): Set<string> {
  return new Set(sessions.map((s) => dayKey(s.startedAt)))
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

export interface GridCell {
  key: string
  trained: boolean
  future: boolean
  today: boolean
}

export function weeksGrid(sessions: Session[], weeks = 8, now = Date.now()): GridCell[] {
  const trained = trainedDays(sessions)
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const dow = (today.getDay() + 6) % 7
  const start = new Date(today)
  start.setDate(today.getDate() - dow - (weeks - 1) * 7)
  const cells: GridCell[] = []
  for (let i = 0; i < weeks * 7; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const key = dayKey(d.getTime())
    cells.push({ key, trained: trained.has(key), future: d > today, today: d.getTime() === today.getTime() })
  }
  return cells
}

export function suggestNextDay(level: Level, sessions: Session[], programId: ProgramId, levelIndex: number): ProgramDay {
  const atLevel = sessions.filter((s) => s.programId === programId && s.levelIndex === levelIndex).sort(byEnded)
  const last = atLevel.at(-1)
  if (!last) return level.days[0]
  const idx = Math.max(0, level.days.findIndex((d) => d.id === last.dayId))
  if (last.status === 'aborted') return level.days[idx]
  return level.days[(idx + 1) % level.days.length]
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

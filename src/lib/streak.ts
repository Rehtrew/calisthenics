import type { Session } from './types'
import { dayKey } from './format'

const DAY = 86_400_000

function startOfDay(ts: number): Date {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d
}

/** Monday 00:00 of the week containing ts, as a local timestamp. */
export function weekStart(ts: number): number {
  const d = startOfDay(ts)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d.getTime()
}

export interface Streak {
  /** consecutive weeks with at least one workout, counting the current week only once it has one */
  weeks: number
  /** workouts inside those weeks */
  activities: number
  /** true when the current week has no workout yet (the streak survives until Sunday) */
  pending: boolean
}

export function weekStreak(sessions: Session[], now = Date.now()): Streak {
  const perWeek = new Map<number, number>()
  for (const s of sessions) {
    const w = weekStart(s.startedAt)
    perWeek.set(w, (perWeek.get(w) ?? 0) + 1)
  }
  const current = weekStart(now)
  const pending = !perWeek.has(current)
  let week = pending ? weekStart(current - DAY) : current
  let weeks = 0
  let activities = 0
  while (perWeek.has(week)) {
    weeks += 1
    activities += perWeek.get(week) ?? 0
    week = weekStart(week - DAY)
  }
  return { weeks, activities, pending }
}

export interface CalendarDay {
  key: string
  date: number
  dayOfMonth: number
  inMonth: boolean
  trained: number
  today: boolean
  future: boolean
}

export type WeekStatus = 'done' | 'missed' | 'current' | 'future'

export interface CalendarWeek {
  days: CalendarDay[]
  status: WeekStatus
}

/** Monday-first calendar for the month of `monthDate`, with per-week activity status. */
export function monthCalendar(sessions: Session[], monthDate: Date, now = Date.now()): CalendarWeek[] {
  const trained = new Map<string, number>()
  for (const s of sessions) {
    const k = dayKey(s.startedAt)
    trained.set(k, (trained.get(k) ?? 0) + 1)
  }
  const today = startOfDay(now).getTime()
  const currentWeek = weekStart(now)
  const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
  const last = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
  const start = weekStart(first.getTime())
  const weeks: CalendarWeek[] = []
  for (let w = start; w <= last.getTime(); w = weekStart(w + 7 * DAY + DAY)) {
    const days: CalendarDay[] = []
    let count = 0
    for (let i = 0; i < 7; i++) {
      const d = new Date(w)
      d.setDate(d.getDate() + i)
      const key = dayKey(d.getTime())
      const n = trained.get(key) ?? 0
      count += n
      days.push({
        key,
        date: d.getTime(),
        dayOfMonth: d.getDate(),
        inMonth: d.getMonth() === monthDate.getMonth(),
        trained: n,
        today: d.getTime() === today,
        future: d.getTime() > today,
      })
    }
    const status: WeekStatus = w === currentWeek ? 'current' : w > currentWeek ? 'future' : count > 0 ? 'done' : 'missed'
    weeks.push({ days, status })
  }
  return weeks
}

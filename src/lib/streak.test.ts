import { describe, expect, it } from 'vitest'
import { monthCalendar, weekStart, weekStreak } from './streak'
import type { Session } from './types'

const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).getTime()

const session = (ts: number): Session => ({
  id: String(ts),
  programId: 'beginner',
  levelIndex: 0,
  dayId: 'd1',
  dayLabel: 'Dag 1',
  startedAt: ts,
  endedAt: ts + 1000,
  status: 'completed',
  restSeconds: 120,
  skipLegs: false,
  exercises: [],
})

// Monday 12 October 2026
const now = at(2026, 10, 12)

describe('weekStart', () => {
  it('returns the monday of the week', () => {
    expect(new Date(weekStart(at(2026, 10, 18))).getDate()).toBe(12)
    expect(new Date(weekStart(at(2026, 10, 12, 0))).getDate()).toBe(12)
  })
})

describe('weekStreak', () => {
  it('is zero without workouts', () => {
    expect(weekStreak([], now)).toEqual({ weeks: 0, activities: 0, pending: true })
  })

  it('counts consecutive weeks and their workouts', () => {
    const sessions = [session(at(2026, 9, 29)), session(at(2026, 10, 1)), session(at(2026, 10, 7)), session(at(2026, 10, 12))]
    expect(weekStreak(sessions, now)).toEqual({ weeks: 3, activities: 4, pending: false })
  })

  it('keeps the streak alive while the current week is still empty', () => {
    const sessions = [session(at(2026, 9, 29)), session(at(2026, 10, 7))]
    expect(weekStreak(sessions, now)).toEqual({ weeks: 2, activities: 2, pending: true })
  })

  it('breaks on a skipped week', () => {
    const sessions = [session(at(2026, 9, 22)), session(at(2026, 10, 7))]
    expect(weekStreak(sessions, now)).toEqual({ weeks: 1, activities: 1, pending: true })
  })
})

describe('monthCalendar', () => {
  it('covers the month in full weeks with statuses', () => {
    const weeks = monthCalendar([session(at(2026, 10, 1)), session(at(2026, 10, 12))], new Date(2026, 9, 1), now)
    expect(weeks).toHaveLength(5)
    expect(weeks[0].days[0].dayOfMonth).toBe(28)
    expect(weeks[0].days[0].inMonth).toBe(false)
    expect(weeks[0].status).toBe('done')
    expect(weeks[1].status).toBe('missed')
    expect(weeks[2].status).toBe('current')
    expect(weeks[3].status).toBe('future')
    expect(weeks[2].days[0].today).toBe(true)
    expect(weeks[2].days[0].trained).toBe(1)
  })
})

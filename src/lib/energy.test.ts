import { describe, expect, it } from 'vitest'
import { durationWords, energy, formatKg, funFact, loadFactor, tonnage, workSeconds } from './energy'
import type { Session } from './types'

const session: Session = {
  id: 'abc',
  programId: 'beginner',
  levelIndex: 0,
  dayId: 'd1',
  dayLabel: 'Dag 1',
  startedAt: 0,
  endedAt: 30 * 60 * 1000,
  status: 'completed',
  restSeconds: 120,
  skipLegs: false,
  exercises: [
    {
      name: 'Push ups',
      reps: '10',
      sets: 2,
      logs: [
        { target: 10, achieved: 10, full: true, unit: 'reps' },
        { target: 10, achieved: 5, full: false, unit: 'reps' },
      ],
    },
    { name: 'Plank', reps: '30s', sets: 1, logs: [{ target: 30, achieved: 30, full: true, unit: 's' }] },
  ],
}

describe('energy', () => {
  it('splits work and rest and converts with MET values', () => {
    expect(workSeconds(session)).toBe(30 + 15 + 30)
    const e = energy(session, 100)
    expect(e.totalSeconds).toBe(1800)
    expect(e.activeSeconds).toBe(75)
    expect(e.restSeconds).toBe(720) // capped at 3 sets × 240 s
    expect(e.kcal).toBe(Math.round((100 * (8 * 75 + 2.5 * 720)) / 3600))
  })

  it('estimates tonnage from body weight and exercise type', () => {
    expect(loadFactor('Push ups on knees')).toBe(0.5)
    expect(loadFactor('Pull ups')).toBe(1)
    expect(loadFactor('Squats')).toBe(0.85)
    expect(tonnage(session, 100)).toBe(Math.round(15 * 100 * 0.65))
  })

  it('formats helpers in danish', () => {
    expect(formatKg(12400)).toEqual({ value: '12,4', unit: 'ton' })
    expect(formatKg(850)).toEqual({ value: '850', unit: 'kg' })
    expect(durationWords(47 * 60)).toBe('47 minutter')
    expect(durationWords(77 * 60)).toBe('1 t 17 min')
    expect(funFact(385, 106, 'abc')).toBe(funFact(385, 106, 'abc'))
    expect(funFact(385, 106, 'abc').length).toBeGreaterThan(3)
  })
})

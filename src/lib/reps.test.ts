import { describe, expect, it } from 'vitest'
import { isLegs, parseReps } from './reps'
import { doneThisRound, estimateMinutes, sessionScore, suggestNextDay } from './stats'
import { levels } from '../data/programs'
import type { Session } from './types'

describe('parseReps', () => {
  it('plain reps', () => {
    expect(parseReps('10')).toMatchObject({ value: 10, unit: 'reps', isMax: false, hint: null })
  })
  it('seconds', () => {
    expect(parseReps('15s')).toMatchObject({ value: 15, unit: 's' })
    expect(parseReps('15 s')).toMatchObject({ value: 15, unit: 's' })
  })
  it('max', () => {
    expect(parseReps('Max')).toMatchObject({ value: null, isMax: true, unit: 'reps' })
    expect(parseReps('Max s.')).toMatchObject({ value: null, isMax: true, unit: 's' })
  })
  it('per side', () => {
    expect(parseReps('6 each side')).toMatchObject({ value: 6, hint: 'pr. side' })
    expect(parseReps('3 a side')).toMatchObject({ value: 3, hint: 'pr. side' })
    expect(parseReps('6 each leg')).toMatchObject({ value: 6, hint: 'pr. ben' })
  })
  it('per-set lists', () => {
    expect(parseReps('10,10,15', 0).value).toBe(10)
    expect(parseReps('10,10,15', 2).value).toBe(15)
    expect(parseReps('10,10,15', 5).value).toBe(15)
    expect(parseReps('5s,10s,5s', 1)).toMatchObject({ value: 10, unit: 's' })
  })
  it('combos', () => {
    expect(parseReps('5+10')).toMatchObject({ value: 15, hint: '5+10' })
    expect(parseReps('4 + 10s')).toMatchObject({ value: 4, unit: 'reps' })
  })
  it('minutes', () => {
    expect(parseReps('10 min')).toMatchObject({ value: 10, unit: 'min' })
  })
})

describe('isLegs', () => {
  it('flags leg exercises only', () => {
    expect(isLegs('Squats')).toBe(true)
    expect(isLegs('Lunges')).toBe(true)
    expect(isLegs('Oneleg hiptrusts')).toBe(true)
    expect(isLegs('Calf raises')).toBe(true)
    expect(isLegs('Oneleg leg raises')).toBe(false)
    expect(isLegs('Push ups')).toBe(false)
  })
})

const session = (over: Partial<Session>): Session => ({
  id: 'x',
  levelIndex: 0,
  dayId: 'd1',
  dayLabel: 'dag 1',
  startedAt: 0,
  endedAt: 1,
  status: 'completed',
  restSeconds: 120,
  skipLegs: false,
  exercises: [],
  ...over,
})

describe('sessionScore', () => {
  it('weights partial sets', () => {
    const s = session({
      exercises: [
        {
          name: 'a',
          reps: '10',
          sets: 2,
          logs: [
            { target: 10, achieved: 10, full: true, unit: 'reps' },
            { target: 10, achieved: 5, full: false, unit: 'reps' },
          ],
        },
        { name: 'b', reps: '10', sets: 2, logs: [] },
      ],
    })
    expect(sessionScore(s)).toEqual({ setsPlanned: 4, setsDone: 2, reps: 15, pct: 38 })
  })
})

describe('suggestNextDay', () => {
  const level = levels[0]
  it('starts at day 1', () => {
    expect(suggestNextDay(level, [], 0).id).toBe('d1')
  })
  it('skips days already done this round', () => {
    expect(suggestNextDay(level, [session({ dayId: 'd1', endedAt: 1 })], 0).id).toBe('d3')
    expect(suggestNextDay(level, [session({ dayId: 'd3', endedAt: 1 }), session({ id: 'y', dayId: 'd1', endedAt: 2 })], 0).id).toBe('d5')
  })
  it('starts a new round once every day is done', () => {
    const all = [session({ dayId: 'd1', endedAt: 1 }), session({ id: 'b', dayId: 'd3', endedAt: 2 }), session({ id: 'c', dayId: 'd5', endedAt: 3 })]
    expect(doneThisRound(level, all, 0).size).toBe(0)
    expect(suggestNextDay(level, all, 0).id).toBe('d1')
  })
  it('repeats an aborted day', () => {
    expect(suggestNextDay(level, [session({ dayId: 'd3', status: 'aborted' })], 0).id).toBe('d3')
  })
})

describe('estimateMinutes', () => {
  it('rounds to five minutes', () => {
    expect(estimateMinutes(levels[0].days[0].exercises, 120) % 5).toBe(0)
  })
})

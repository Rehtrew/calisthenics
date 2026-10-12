import { describe, expect, it } from 'vitest'
import { niceTicks } from './chart'

describe('niceTicks', () => {
  it('picks round steps that cover the data', () => {
    const t = niceTicks(104.3, 107.9)
    expect(t.lo).toBeLessThanOrEqual(104.3)
    expect(t.hi).toBeGreaterThanOrEqual(107.9)
    expect(t.ticks[0]).toBe(t.lo)
    expect(t.ticks.at(-1)).toBe(t.hi)
    expect(t.ticks.length).toBeGreaterThanOrEqual(3)
    expect(t.ticks.length).toBeLessThanOrEqual(7)
  })
  it('widens a flat series so a single value still gets a band', () => {
    const t = niceTicks(106, 106)
    expect(t.hi - t.lo).toBeGreaterThanOrEqual(1)
  })
})

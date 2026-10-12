import { describe, expect, it } from 'vitest'
import { buildSlides } from './summary'
import type { Session } from './types'

const mk = (id: string, start: number, reps: number): Session => ({
  id,
  programId: 'beginner',
  levelIndex: 0,
  dayId: 'd1',
  dayLabel: 'Dag 1',
  startedAt: start,
  endedAt: start + 40 * 60 * 1000,
  status: 'completed',
  restSeconds: 120,
  skipLegs: true,
  exercises: [
    {
      name: 'Pull ups',
      reps: '10',
      sets: 2,
      logs: [
        { target: 10, achieved: reps, full: reps >= 10, unit: 'reps' },
        { target: 10, achieved: reps, full: reps >= 10, unit: 'reps' },
      ],
    },
  ],
})

describe('buildSlides', () => {
  it('produces percent, kcal, load, time and streak slides', () => {
    const now = new Date(2026, 9, 12, 18).getTime()
    const prev = mk('prev', now - 7 * 86_400_000, 8)
    const current = mk('cur', now, 10)
    const slides = buildSlides(current, [prev, current], 106)
    expect(slides.map((s) => s.unit)).toEqual(['%', 'kcal', 'ton', 'min', 'uger'])
    expect(slides[0].text).toBe('Du gennemførte 2 af 2 sæt på Dag 1.')
    expect(slides[0].sub).toBe('+4 reps og +20 point i forhold til sidst.')
    expect(slides[0].positive).toBe(true)
    expect(slides[1].text).toMatch(/^Du forbrændte cirka \d+ kalorier og var i gang i 40 minutter\.$/)
    expect(slides[2].value).toBe('2,1') // 20 reps × 106 kg × 1.0 = 2120 kg
    expect(slides[4].text).toBe('Din streak er nu 2 uger med 2 træninger.')
  })

  it('words an aborted session differently', () => {
    const now = new Date(2026, 9, 12, 18).getTime()
    const s = { ...mk('a', now, 10), status: 'aborted' as const }
    expect(buildSlides(s, [s], 106)[0].text).toBe('Du afbrød efter 2 af 2 sæt på Dag 1.')
  })
})

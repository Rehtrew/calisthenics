import type { SetTarget, Unit } from './types'

const t = (value: number | null, unit: Unit, label: string, hint: string | null, isMax = false): SetTarget => ({
  value,
  unit,
  label,
  hint,
  isMax,
})

function hintFor(label: string): string | null {
  if (/each side|a side/.test(label)) return 'pr. side'
  if (/each leg|a leg/.test(label)) return 'pr. ben'
  if (/^\d+\s*s?$/.test(label)) return null
  return label
}

/**
 * Turn the program's reps string into a target for a given set index.
 * "10,10,15" gives 10 for sets 1-2 and 15 for the third (and any later) set.
 */
export function parseReps(reps: string, setIndex = 0): SetTarget {
  const raw = reps.trim().toLowerCase().replace(/\s+/g, ' ')

  if (raw.includes(',')) {
    const parts = raw
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean)
    if (parts.length > 1) return parseReps(parts[Math.min(setIndex, parts.length - 1)], 0)
  }

  if (raw.startsWith('max')) {
    const unit: Unit = /\bs\b|s\./.test(raw.slice(3)) ? 's' : 'reps'
    return t(null, unit, 'max', null, true)
  }

  let m: RegExpMatchArray | null
  if ((m = raw.match(/^(\d+) ?min/))) return t(+m[1], 'min', raw, null)
  if ((m = raw.match(/^(\d+) ?\+ ?(\d+) ?s\b/))) return t(+m[1], 'reps', raw, raw)
  if ((m = raw.match(/^(\d+) ?\+ ?(\d+)/))) return t(+m[1] + +m[2], 'reps', raw, raw)
  if ((m = raw.match(/^(\d+) ?s\b/))) return t(+m[1], 's', raw, hintFor(raw))
  if ((m = raw.match(/^(\d+)/))) return t(+m[1], 'reps', raw, hintFor(raw))
  return t(null, 'reps', raw, null, true)
}

export const unitLabel = (unit: Unit): string => (unit === 's' ? 'sek' : unit === 'min' ? 'min' : 'reps')

export const isLegs = (name: string): boolean => /squat|lunge|hiptrust|calf raise/i.test(name)

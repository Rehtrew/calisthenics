import type { Session } from './types'

/**
 * Rough energy estimate using MET values from the Compendium of Physical
 * Activities: vigorous calisthenics ≈ 8 MET while working, and the rest
 * between sets (standing, pacing, elevated heart rate) ≈ 2.5 MET.
 * kcal = MET × kg × hours. Good enough for "about 400 kcal", not for a lab.
 */
export const ACTIVE_MET = 8
export const REST_MET = 2.5
const SECONDS_PER_REP = 3
const MIN_SET_SECONDS = 15
const MAX_REST_PER_SET = 240

export interface Energy {
  kcal: number
  activeSeconds: number
  restSeconds: number
  totalSeconds: number
}

export function workSeconds(session: Pick<Session, 'exercises'>): number {
  let seconds = 0
  for (const ex of session.exercises) {
    for (const log of ex.logs) {
      const n = log.achieved ?? log.target ?? 0
      if (log.unit === 's') seconds += n
      else if (log.unit === 'min') seconds += n * 60
      else seconds += Math.max(MIN_SET_SECONDS, n * SECONDS_PER_REP)
    }
  }
  return seconds
}

export function energy(session: Session, weightKg: number): Energy {
  const totalSeconds = Math.max(0, Math.round((session.endedAt - session.startedAt) / 1000))
  const setsDone = session.exercises.reduce((n, e) => n + e.logs.length, 0)
  const activeSeconds = Math.min(workSeconds(session), totalSeconds)
  const restSeconds = Math.min(totalSeconds - activeSeconds, setsDone * MAX_REST_PER_SET)
  const kcal = Math.round((weightKg * (ACTIVE_MET * activeSeconds + REST_MET * restSeconds)) / 3600)
  return { kcal, activeSeconds, restSeconds, totalSeconds }
}

/** Share of body weight moved per rep, by exercise name. */
export function loadFactor(name: string): number {
  const n = name.toLowerCase()
  if (/on knees|incline/.test(n)) return 0.5
  if (/australian/.test(n)) return 0.6
  if (/muscle up|pull up|chin up|skin the cat|front lever|back ?lever|icecream|hefesto|curl|deadlift/.test(n)) return 1
  if (/dips|calf raise/.test(n)) return 1
  if (/handstand|pike|planche|wall walk|kickout|frog/.test(n)) return 0.75
  if (/push up/.test(n)) return 0.65
  if (/squat|lunge/.test(n)) return 0.85
  if (/hiptrust|superman|lowerback|extension/.test(n)) return 0.5
  if (/leg raise|knees raise|windshield|dragon|l-hang|l-sit|hollow|plank|bear crawl|mountain|flutter|clock|wipers/.test(n)) return 0.3
  return 0.5
}

/** Total kilograms moved, counting rep-based sets only. */
export function tonnage(session: Pick<Session, 'exercises'>, weightKg: number): number {
  let kg = 0
  for (const ex of session.exercises) {
    const factor = loadFactor(ex.name)
    for (const log of ex.logs) {
      if (log.unit === 'reps' && log.achieved) kg += log.achieved * weightKg * factor
    }
  }
  return Math.round(kg)
}

/** Danish decimal formatting with a fixed number of digits. */
const da = (n: number, digits = 1) => String(Math.round(n * 10 ** digits) / 10 ** digits).replace('.', ',')
/** Like da, but whole numbers once the value is 10 or more ("3,5 bananer", "27 bananer"). */
const smart = (n: number, digits = 1) => da(n, n >= 10 ? 0 : digits)

function hash(seed: string): number {
  let h = 0
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return h
}

/** A playful equivalent for a number of kcal, picked deterministically by seed. */
export function funFact(kcal: number, weightKg: number, seed: string): string {
  const facts: (() => string)[] = [
    () => `${smart(kcal / 105)} bananer`,
    () => `en gåtur på ${smart(kcal / (0.7 * weightKg))} km`,
    () => `${smart(kcal / 140)} pilsnere`,
    () => `${smart(kcal / 30, 0)} stykker chokolade`,
    () => `${smart((kcal * 60) / (6 * weightKg), 0)} minutter på cykel`,
    () => `${smart(kcal / 270)} cheeseburgere`,
  ]
  return facts[hash(seed) % facts.length]()
}

export function durationWords(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.round((seconds % 3600) / 60)
  if (h) return `${h} t ${m} min`
  return `${m} minut${m === 1 ? '' : 'ter'}`
}

export function formatKg(kg: number): { value: string; unit: string } {
  if (kg >= 1000) return { value: da(kg / 1000), unit: 'ton' }
  return { value: String(kg), unit: 'kg' }
}

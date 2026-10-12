import { previousSession, sessionScore } from './stats'
import { weekStreak } from './streak'
import { durationWords, energy, formatKg, funFact, tonnage } from './energy'
import type { Session } from './types'

export interface Slide {
  value: string
  unit: string
  text: string
  sub?: string
  /** colour the sub line green when it is good news */
  positive?: boolean
}

const sign = (n: number) => (n > 0 ? '+' : '')
const da = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',')

export function buildSlides(session: Session, all: Session[], weightKg: number): Slide[] {
  const score = sessionScore(session)
  const prev = previousSession(all, session)
  const prevScore = prev ? sessionScore(prev) : null
  const e = energy(session, weightKg)
  const kg = tonnage(session, weightKg)
  const streak = weekStreak(all, session.endedAt)
  const completed = session.status === 'completed'
  const slides: Slide[] = []

  slides.push({
    value: String(score.pct),
    unit: '%',
    text: completed
      ? `Du gennemførte ${score.setsDone} af ${score.setsPlanned} sæt på ${session.dayLabel}.`
      : `Du afbrød efter ${score.setsDone} af ${score.setsPlanned} sæt på ${session.dayLabel}.`,
    sub: prevScore
      ? `${sign(score.reps - prevScore.reps)}${score.reps - prevScore.reps} reps og ${sign(score.pct - prevScore.pct)}${score.pct - prevScore.pct} point i forhold til sidst.`
      : 'Første gang på denne dag.',
    positive: !!prevScore && (score.reps > prevScore.reps || score.pct > prevScore.pct),
  })

  slides.push({
    value: String(e.kcal),
    unit: 'kcal',
    text: `Du forbrændte cirka ${e.kcal} kalorier og var i gang i ${durationWords(e.totalSeconds)}.`,
    sub: `Det svarer til ${funFact(e.kcal, weightKg, session.id)}. Regnet ud fra ${weightKg} kg.`,
  })

  if (kg > 0) {
    const f = formatKg(kg)
    slides.push({
      value: f.value,
      unit: f.unit,
      text: `Du flyttede cirka ${f.value} ${f.unit} med ${score.reps} reps.`,
      sub: `Det er ${da(kg / weightKg)} gange din egen kropsvægt.`,
    })
  }

  if (e.activeSeconds > 0) {
    const work = Math.round(e.activeSeconds / 60)
    const rest = Math.round(e.restSeconds / 60)
    slides.push({
      value: String(work),
      unit: 'min',
      text: `${work} minut${work === 1 ? '' : 'ter'} i arbejde og ${rest} minut${rest === 1 ? '' : 'ter'} pause.`,
      sub: score.setsDone ? `Cirka ${Math.round(e.restSeconds / score.setsDone)} sekunders pause pr. sæt.` : undefined,
    })
  }

  slides.push({
    value: String(streak.weeks),
    unit: streak.weeks === 1 ? 'uge' : 'uger',
    text:
      streak.weeks <= 1
        ? `Første uge i en ny streak. ${streak.activities} træning${streak.activities === 1 ? '' : 'er'} indtil videre.`
        : `Din streak er nu ${streak.weeks} uger med ${streak.activities} træninger.`,
    sub: streak.weeks >= 4 ? 'Stabilt. Bliv ved.' : streak.weeks >= 2 ? 'Godt på vej. En træning om ugen holder den i live.' : 'En træning om ugen holder streaken i live.',
  })

  return slides
}


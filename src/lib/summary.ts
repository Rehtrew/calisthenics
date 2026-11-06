import { previousSession, sessionScore } from './stats'
import { weekStreak } from './streak'
import { durationWords, energy, formatKg, funFact, tonnage } from './energy'
import type { Session } from './types'
import { dayName, decimal, plural, t } from './i18n'

export interface Slide {
  value: string
  unit: string
  text: string
  sub?: string
  /** colour the sub line green when it is good news */
  positive?: boolean
}

const sign = (n: number) => (n > 0 ? '+' : '')

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
    text: t(completed ? 'Du gennemførte {done} af {planned} sæt på {day}.' : 'Du afbrød efter {done} af {planned} sæt på {day}.', {
      done: score.setsDone,
      planned: score.setsPlanned,
      day: dayName(session.dayLabel),
    }),
    sub: prevScore
      ? t('{dr} reps og {dp} point i forhold til sidst.', {
          dr: `${sign(score.reps - prevScore.reps)}${score.reps - prevScore.reps}`,
          dp: `${sign(score.pct - prevScore.pct)}${score.pct - prevScore.pct}`,
        })
      : t('Første gang på denne dag.'),
    positive: !!prevScore && (score.reps > prevScore.reps || score.pct > prevScore.pct),
  })

  slides.push({
    value: String(e.kcal),
    unit: 'kcal',
    text: t('Du forbrændte cirka {kcal} kalorier og var i gang i {dur}.', { kcal: e.kcal, dur: durationWords(e.totalSeconds) }),
    sub: t('Det svarer til {fact}. Regnet ud fra {kg} kg.', { fact: funFact(e.kcal, weightKg, session.id), kg: weightKg }),
  })

  if (kg > 0) {
    const f = formatKg(kg)
    slides.push({
      value: f.value,
      unit: f.unit,
      text: t('Du flyttede cirka {v} {unit} med {reps} reps.', { v: f.value, unit: f.unit, reps: score.reps }),
      sub: t('Det er {x} gange din egen kropsvægt.', { x: decimal(kg / weightKg) }),
    })
  }

  if (e.activeSeconds > 0) {
    const work = Math.round(e.activeSeconds / 60)
    const rest = Math.round(e.restSeconds / 60)
    slides.push({
      value: String(work),
      unit: 'min',
      text: t('{work} i arbejde og {rest} pause.', { work: plural(work, '{n} minut', '{n} minutter'), rest: plural(rest, '{n} minut', '{n} minutter') }),
      sub: score.setsDone ? t('Cirka {n} sekunders pause pr. sæt.', { n: Math.round(e.restSeconds / score.setsDone) }) : undefined,
    })
  }

  slides.push({
    value: String(streak.weeks),
    unit: streak.weeks === 1 ? t('uge') : t('uger'),
    text:
      streak.weeks <= 1
        ? t('Første uge i en ny streak. {n} indtil videre.', { n: plural(streak.activities, '{n} træning', '{n} træninger') })
        : t('Din streak er nu {w} uger med {n} træninger.', { w: streak.weeks, n: streak.activities }),
    sub: streak.weeks >= 4 ? t('Stabilt. Bliv ved.') : streak.weeks >= 2 ? t('Godt på vej. En træning om ugen holder den i live.') : t('En træning om ugen holder streaken i live.'),
  })

  return slides
}


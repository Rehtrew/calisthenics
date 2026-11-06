import { useEffect, useState } from 'react'
import { deleteSession, logWeight, useAppState } from '../lib/store'
import { navigate } from '../lib/router'
import { exerciseScore, previousSession, sessionScore, weightLog } from '../lib/stats'
import { fmtDateLong, fmtDuration, fmtKg, fmtTime } from '../lib/format'
import { energy } from '../lib/energy'
import type { ExerciseLog } from '../lib/types'
import { BackButton, Button, Sheet, Stat, TopBar } from '../components/ui'
import { WeightPicker } from '../components/WeightPicker'
import { dayName, t } from '../lib/i18n'

export function SessionView({ sessionId, mode }: { sessionId: string; mode: 'summary' | 'detail' }) {
  const s = useAppState()
  const session = s.sessions.find((x) => x.id === sessionId)
  const [confirm, setConfirm] = useState(false)
  const [editWeight, setEditWeight] = useState(false)
  const [draftWeight, setDraftWeight] = useState<number | null>(null)

  useEffect(() => {
    if (!session) navigate({ name: 'home' }, { replace: true })
  }, [session])
  if (!session) return null

  const score = sessionScore(session)
  const prev = previousSession(s.sessions, session)
  const prevScore = prev ? sessionScore(prev) : null
  const completed = session.status === 'completed'
  const kcal = energy(session, session.weightKg ?? s.settings.weightKg).kcal
  const earlierWeight = weightLog(s.sessions.filter((x) => x.id !== session.id && x.endedAt <= session.endedAt)).at(-1)
  const weightDelta = session.weightKg != null && earlierWeight ? Math.round((session.weightKg - earlierWeight.kg) * 10) / 10 : null
  const openWeight = () => {
    setDraftWeight(session.weightKg ?? earlierWeight?.kg ?? s.settings.weightKg)
    setEditWeight(true)
  }

  let compare: string
  let compareClass = 'muted'
  if (!prev || !prevScore) compare = t('Første gang på denne dag')
  else {
    const dPct = score.pct - prevScore.pct
    const dReps = score.reps - prevScore.reps
    const sign = (n: number) => (n > 0 ? '+' : '')
    compare = t('{dp} point og {dr} reps i forhold til sidst', { dp: `${sign(dPct)}${dPct}`, dr: `${sign(dReps)}${dReps}` })
    compareClass = dReps > 0 || dPct > 0 ? 'positive' : 'muted'
  }

  return (
    <div className="page">
      <TopBar
        left={mode === 'detail' ? <BackButton /> : <span className="eyebrow">{fmtTime(session.endedAt)}</span>}
        right={
          mode === 'detail' ? (
            <button className="link" onClick={() => setConfirm(true)}>
              {t('Slet')}
            </button>
          ) : null
        }
      />

      <section className="hero">
        <p className="eyebrow">
          {completed ? t('Træning færdig') : t('Træning afbrudt')} · {fmtDateLong(session.endedAt)}
        </p>
        <h1 className="display">
          {score.pct}
          <span className="display-unit">%</span>
        </h1>
        <p className="muted">
          {t('Af programmet · {day} · Level {n}', { day: dayName(session.dayLabel), n: session.levelIndex + 1 })}
        </p>
      </section>

      <section className="stats">
        <Stat index={0} value={fmtDuration(session.endedAt - session.startedAt)} label={t('Varighed')} />
        <Stat index={1} value={`${score.setsDone}/${score.setsPlanned}`} label={t('Sæt')} />
        <Stat index={2} value={score.reps} label={t('Reps i alt')} />
        <Stat index={3} value={kcal} unit="kcal" label={t('Cirka, ved {kg} kg', { kg: s.settings.weightKg })} />
      </section>

      <p className={`compare ${compareClass}`}>{compare}</p>

      <button className="row weight-row" onClick={openWeight}>
        <span className="row-main">
          <span className="row-title">{t('Vægt efter træning')}</span>
          <span className="row-sub">
            {session.weightKg != null
              ? weightDelta != null
                ? t('{delta} kg siden {prev} kg', { delta: `${weightDelta > 0 ? '+' : ''}${fmtKg(weightDelta)}`, prev: fmtKg(earlierWeight!.kg) })
                : t('Første loggede vægt')
              : t('Ikke logget · tryk for at logge')}
          </span>
        </span>
        <span className="row-value">{session.weightKg != null ? `${fmtKg(session.weightKg)} kg` : <span className="muted">Log</span>}</span>
      </button>

      <section className="section">
        <p className="eyebrow">{t('Øvelser')}</p>
        <ul className="result-list">
          {session.exercises.map((ex, i) => (
            <ExerciseResult key={i} ex={ex} prev={prev?.exercises.find((p) => p.name === ex.name)} />
          ))}
        </ul>
      </section>

      {mode === 'summary' && (
        <div className="cta-bar">
          <Button onClick={() => navigate({ name: 'home' }, { replace: true })}>{t('Til forsiden')}</Button>
        </div>
      )}

      {editWeight && draftWeight != null && (
        <Sheet title={session.weightKg != null ? t('Ret vægt') : t('Log vægt')} text={t('Vægt efter {day} · {date}', { day: dayName(session.dayLabel), date: fmtDateLong(session.endedAt) })}>
          <WeightPicker value={draftWeight} onChange={setDraftWeight} />
          <Button
            onClick={() => {
              logWeight(session.id, draftWeight)
              setEditWeight(false)
            }}
          >
            {t('Gem {kg} kg', { kg: fmtKg(draftWeight) })}
          </Button>
          {session.weightKg != null && (
            <Button
              variant="ghost"
              onClick={() => {
                logWeight(session.id, null)
                setEditWeight(false)
              }}
            >
              {t('Fjern vægten')}
            </Button>
          )}
          <Button variant="secondary" onClick={() => setEditWeight(false)}>
            {t('Annuller')}
          </Button>
        </Sheet>
      )}

      {confirm && (
        <Sheet title={t('Slet træningen?')} text={t('Den forsvinder fra historikken og statistikken.')}>
          <Button
            onClick={() => {
              deleteSession(session.id)
              navigate({ name: 'home' }, { replace: true })
            }}
          >
            {t('Ja, slet')}
          </Button>
          <Button variant="secondary" onClick={() => setConfirm(false)}>
            {t('Behold')}
          </Button>
        </Sheet>
      )}
    </div>
  )
}

function ExerciseResult({ ex, prev }: { ex: ExerciseLog; prev: ExerciseLog | undefined }) {
  const score = exerciseScore(ex)
  const prevScore = prev ? exerciseScore(prev) : null
  const delta = prevScore && prevScore.setsDone > 0 && score.setsDone > 0 && ex.logs[0]?.unit === 'reps' ? score.reps - prevScore.reps : null
  const unit = ex.logs[0]?.unit

  return (
    <li className="result">
      <div className="result-head">
        <span className="result-name">{ex.name}</span>
        <span className="result-pct">
          {delta != null && delta !== 0 && (
            <span className={`delta ${delta < 0 ? 'down' : ''}`}>
              {delta > 0 ? '+' : ''}
              {delta}{' '}
            </span>
          )}
          {t('{done}/{n} sæt', { done: score.setsDone, n: ex.sets })}
        </span>
      </div>
      <div className="result-sets">
        {Array.from({ length: ex.sets }, (_, i) => {
          const log = ex.logs[i]
          if (!log) return <span key={i} className="set-pill missing">–</span>
          const value = log.achieved ?? (log.full ? '✓' : '–')
          return (
            <span key={i} className={`set-pill ${log.full ? '' : 'short'}`} title={log.target != null ? t('Mål: {n}', { n: log.target }) : undefined}>
              {value}
              {unit === 's' && typeof value === 'number' ? 's' : ''}
            </span>
          )
        })}
      </div>
    </li>
  )
}

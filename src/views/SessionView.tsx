import { useEffect, useState } from 'react'
import { deleteSession, useAppState } from '../lib/store'
import { navigate } from '../lib/router'
import { exerciseScore, previousSession, sessionScore } from '../lib/stats'
import { fmtDateLong, fmtDuration, fmtTime } from '../lib/format'
import type { ExerciseLog } from '../lib/types'
import { BackButton, Button, Sheet, Stat, TopBar } from '../components/ui'

export function SessionView({ sessionId, mode }: { sessionId: string; mode: 'summary' | 'detail' }) {
  const s = useAppState()
  const session = s.sessions.find((x) => x.id === sessionId)
  const [confirm, setConfirm] = useState(false)

  useEffect(() => {
    if (!session) navigate({ name: 'home' }, { replace: true })
  }, [session])
  if (!session) return null

  const score = sessionScore(session)
  const prev = previousSession(s.sessions, session)
  const prevScore = prev ? sessionScore(prev) : null
  const completed = session.status === 'completed'

  let compare: string
  if (!prev || !prevScore) compare = 'Første gang på denne dag'
  else {
    const dPct = score.pct - prevScore.pct
    const dReps = score.reps - prevScore.reps
    const sign = (n: number) => (n > 0 ? '+' : '')
    compare = `${sign(dPct)}${dPct} point og ${sign(dReps)}${dReps} reps i forhold til sidst`
  }

  return (
    <div className="page">
      <TopBar
        left={mode === 'detail' ? <BackButton /> : <span className="eyebrow">{fmtTime(session.endedAt)}</span>}
        right={
          mode === 'detail' ? (
            <button className="link" onClick={() => setConfirm(true)}>
              Slet
            </button>
          ) : null
        }
      />

      <section className="hero">
        <p className="eyebrow">
          {completed ? 'Træning færdig' : 'Træning afbrudt'} · {fmtDateLong(session.endedAt)}
        </p>
        <h1 className="display">
          {score.pct}
          <span className="display-unit">%</span>
        </h1>
        <p className="muted">
          Af programmet · {session.dayLabel} · Level {session.levelIndex + 1}
        </p>
      </section>

      <section className="stats stats-3">
        <Stat value={fmtDuration(session.endedAt - session.startedAt)} label="Varighed" />
        <Stat value={`${score.setsDone}/${score.setsPlanned}`} label="Sæt" />
        <Stat value={score.reps} label="Reps i alt" />
      </section>

      <p className={`compare ${prev ? 'accent' : 'muted'}`}>{compare}</p>

      <section className="section">
        <p className="eyebrow">Øvelser</p>
        <ul className="result-list">
          {session.exercises.map((ex, i) => (
            <ExerciseResult key={i} ex={ex} prev={prev?.exercises.find((p) => p.name === ex.name)} />
          ))}
        </ul>
      </section>

      {mode === 'summary' && (
        <div className="cta-bar">
          <Button onClick={() => navigate({ name: 'home' }, { replace: true })}>Til forsiden</Button>
        </div>
      )}

      {confirm && (
        <Sheet title="Slet træningen?" text="Den forsvinder fra historikken og statistikken.">
          <Button
            onClick={() => {
              deleteSession(session.id)
              navigate({ name: 'home' }, { replace: true })
            }}
          >
            Ja, slet
          </Button>
          <Button variant="secondary" onClick={() => setConfirm(false)}>
            Behold
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
          {score.setsDone}/{ex.sets} sæt
        </span>
      </div>
      <div className="result-sets">
        {Array.from({ length: ex.sets }, (_, i) => {
          const log = ex.logs[i]
          if (!log) return <span key={i} className="set-pill missing">–</span>
          const value = log.achieved ?? (log.full ? '✓' : '–')
          return (
            <span key={i} className={`set-pill ${log.full ? '' : 'short'}`} title={log.target != null ? `Mål: ${log.target}` : undefined}>
              {value}
              {unit === 's' && typeof value === 'number' ? 's' : ''}
            </span>
          )
        })}
      </div>
    </li>
  )
}

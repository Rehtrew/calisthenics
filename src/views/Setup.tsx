import { useEffect, useState, type CSSProperties } from 'react'
import { startWorkout, useAppState } from '../lib/store'
import { navigate } from '../lib/router'
import { getDay, getLevel, getProgram } from '../data/programs'
import { estimateMinutes, sessionsForDay } from '../lib/stats'
import { fmtClock, relativeDay } from '../lib/format'
import { isLegs } from '../lib/reps'
import { BackButton, Button, Icon, IconButton, Stepper, Toggle, TopBar } from '../components/ui'

/** The program says 2 minutes between sets; the setup screen always starts there. */
const DEFAULT_REST_SECONDS = 120

export function Setup({ dayId }: { dayId: string }) {
  const s = useAppState()
  const { programId, levelIndex } = s.settings
  const program = getProgram(programId)
  const level = getLevel(programId, levelIndex)
  const day = getDay(programId, levelIndex, dayId)

  const [order, setOrder] = useState<number[]>(() => (day ? day.exercises.map((_, i) => i) : []))
  const [skipLegs, setSkipLegs] = useState(s.settings.skipLegs)
  const [rest, setRest] = useState(DEFAULT_REST_SECONDS)

  useEffect(() => {
    if (!day) navigate({ name: 'home' }, { replace: true })
  }, [day])
  if (!day) return null

  const ordered = order.map((i) => day.exercises[i])
  const hasLegs = day.exercises.some((e) => isLegs(e.name))
  const included = ordered.filter((e) => !(skipLegs && isLegs(e.name)))
  const totalSets = included.reduce((n, e) => n + e.sets, 0)
  const minutes = estimateMinutes(included, rest)
  const changed = order.some((v, i) => v !== i)
  const last = sessionsForDay(s.sessions, programId, levelIndex, dayId).at(-1)

  const move = (pos: number, dir: -1 | 1) => {
    const j = pos + dir
    if (j < 0 || j >= order.length) return
    const next = [...order]
    ;[next[pos], next[j]] = [next[j], next[pos]]
    setOrder(next)
  }

  const start = () => {
    startWorkout({ programId, levelIndex, day, exercises: included, restSeconds: rest, skipLegs })
    navigate({ name: 'workout' }, { replace: true })
  }

  return (
    <div className="page">
      <TopBar left={<BackButton />} right={<span className="eyebrow">{program.name}</span>} />

      <section className="hero">
        <p className="eyebrow">
          {level.name}
          {day.focus ? ` · ${day.focus}` : ''}
        </p>
        <h1 className="display day-title">{day.label}</h1>
        <p className="muted">
          {included.length} øvelser · {totalSets} sæt · ca. {minutes} min
          {last ? ` · Sidst ${relativeDay(last.endedAt)}` : ''}
        </p>
      </section>

      <section className="card">
        {hasLegs && <Toggle label="Spring ben over" hint="Squats, lunges, hiptrusts og calf raises" checked={skipLegs} onChange={setSkipLegs} />}
        <div className="field">
          <div>
            <p className="field-label">Pause mellem sæt</p>
            <p className="field-hint">Min : sek</p>
          </div>
          <Stepper value={rest} min={30} max={600} step={15} onChange={setRest} format={fmtClock} />
        </div>
      </section>

      <section className="section">
        <div className="row-head">
          <p className="eyebrow">Rækkefølge</p>
          {changed && (
            <button className="link" onClick={() => setOrder(day.exercises.map((_, i) => i))}>
              Nulstil
            </button>
          )}
        </div>
        <ol className="exercise-list">
          {ordered.map((e, pos) => {
            const skipped = skipLegs && isLegs(e.name)
            return (
              <li key={order[pos]} className={`exercise stagger ${skipped ? 'skipped' : ''}`} style={{ '--i': pos } as CSSProperties}>
                <span className="exercise-main">
                  <span className="exercise-name">{e.name}</span>
                  <span className="exercise-sub">
                    {e.sets} × {e.reps.toLowerCase()}
                    {skipped ? ' · Springes over' : ''}
                  </span>
                </span>
                <span className="exercise-actions">
                  <IconButton label="Flyt op" disabled={pos === 0} onClick={() => move(pos, -1)}>
                    {Icon.up}
                  </IconButton>
                  <IconButton label="Flyt ned" disabled={pos === order.length - 1} onClick={() => move(pos, 1)}>
                    {Icon.down}
                  </IconButton>
                </span>
              </li>
            )
          })}
        </ol>
      </section>

      <div className="cta-bar">
        <Button onClick={start} disabled={included.length === 0}>
          Start træning
        </Button>
        {s.active && (
          <p className="muted small center">Den igangværende træning ({s.active.dayLabel}) gemmes som afbrudt</p>
        )}
      </div>
    </div>
  )
}

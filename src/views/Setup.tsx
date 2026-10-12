import { useEffect, useState, type CSSProperties } from 'react'
import { startWorkout, useAppState } from '../lib/store'
import { navigate } from '../lib/router'
import { getDay, getLevel } from '../data/programs'
import { estimateMinutes, sessionsForDay } from '../lib/stats'
import { fmtClock, relativeDay } from '../lib/format'
import { isLegs } from '../lib/reps'
import { BackButton, Button, Icon, IconButton, Stepper, Toggle, TopBar } from '../components/ui'
import { ExerciseSheet } from '../components/ExerciseSheet'
import { DEFAULT_REST_SECONDS, DEFAULT_SKIP_LEGS } from '../lib/defaults'


export function Setup({ dayId }: { dayId: string }) {
  const s = useAppState()
  const { levelIndex } = s.settings
  const level = getLevel(levelIndex)
  const day = getDay(levelIndex, dayId)

  const [order, setOrder] = useState<number[]>(() => (day ? day.exercises.map((_, i) => i) : []))
  const [skipLegs, setSkipLegs] = useState(DEFAULT_SKIP_LEGS)
  const [rest, setRest] = useState(DEFAULT_REST_SECONDS)
  const [open, setOpen] = useState<{ name: string; detail: string } | null>(null)

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
  const last = sessionsForDay(s.sessions, levelIndex, dayId).at(-1)

  const move = (pos: number, dir: -1 | 1) => {
    const j = pos + dir
    if (j < 0 || j >= order.length) return
    const next = [...order]
    ;[next[pos], next[j]] = [next[j], next[pos]]
    setOrder(next)
  }

  const start = () => {
    startWorkout({ levelIndex, day, exercises: included, restSeconds: rest, skipLegs })
    navigate({ name: 'workout' }, { replace: true })
  }

  return (
    <div className="page">
      <TopBar left={<BackButton />} right={<span className="eyebrow">{level.name}</span>} />

      <section className="hero">
        <p className="eyebrow">
          Opsætning
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
                <button className="exercise-main as-button" onClick={() => setOpen({ name: e.name, detail: `${e.sets} × ${e.reps.toLowerCase()}` })}>
                  <span className="exercise-name">{e.name}</span>
                  <span className="exercise-sub">
                    {e.sets} × {e.reps.toLowerCase()}
                    {skipped ? ' · Springes over' : ''}
                  </span>
                </button>
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

      {open && <ExerciseSheet name={open.name} detail={open.detail} onClose={() => setOpen(null)} />}
    </div>
  )
}

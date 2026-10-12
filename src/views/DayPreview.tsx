import { useEffect, useState, type CSSProperties } from 'react'
import { updateSettings, useAppState } from '../lib/store'
import { navigate } from '../lib/router'
import { getDay, getLevel } from '../data/programs'
import { estimateMinutes, sessionsForDay } from '../lib/stats'
import { relativeDay } from '../lib/format'
import { isLegs } from '../lib/reps'
import { BackButton, Button, TopBar } from '../components/ui'
import { labelList, musclesFor } from '../lib/muscles'
import { ExerciseSheet } from '../components/ExerciseSheet'
import { DEFAULT_REST_SECONDS } from '../lib/defaults'

export function DayPreview({ levelIndex, dayId }: { levelIndex: number; dayId: string }) {
  const s = useAppState()
  const [open, setOpen] = useState<{ name: string; detail: string } | null>(null)
  const level = getLevel(levelIndex)
  const day = getDay(levelIndex, dayId)

  useEffect(() => {
    if (!day) navigate({ name: 'home' }, { replace: true })
  }, [day])
  if (!day) return null

  const isCurrent = s.settings.levelIndex === levelIndex
  const last = sessionsForDay(s.sessions, levelIndex, dayId).at(-1)
  const totalSets = day.exercises.reduce((n, e) => n + e.sets, 0)
  const minutes = estimateMinutes(day.exercises, DEFAULT_REST_SECONDS)
  const legs = day.exercises.filter((e) => isLegs(e.name)).length

  const start = () => {
    if (!isCurrent) updateSettings({ levelIndex })
    navigate({ name: 'setup', dayId })
  }

  return (
    <div className="page">
      <TopBar
        left={<BackButton />}
        right={
          <span className="eyebrow">{level.name}</span>
        }
      />

      <section className="hero">
        <p className="eyebrow">
          {isCurrent ? 'Dit nuværende level' : level.name}
          {day.focus ? ` · ${day.focus}` : ''}
        </p>
        <h1 className="display day-title">{day.label}</h1>
        <p className="muted">
          {day.exercises.length} øvelser · {totalSets} sæt · ca. {minutes} min
          {legs ? ` · ${legs} benøvelse${legs > 1 ? 'r' : ''}` : ''}
          {last ? ` · Sidst ${relativeDay(last.endedAt)}` : ''}
        </p>
      </section>

      <section className="section">
        <p className="eyebrow">Øvelser</p>
        <ol className="exercise-list">
          {day.exercises.map((e, i) => {
            const logs = last?.exercises.find((x) => x.name === e.name)?.logs
            return (
              <li key={i} className="exercise stagger" style={{ '--i': i } as CSSProperties}>
                <button className="exercise-main as-button" onClick={() => setOpen({ name: e.name, detail: `${e.sets} × ${e.reps.toLowerCase()}` })}>
                  <span className="exercise-name">{e.name}</span>
                  <span className="exercise-sub">
                    {e.sets} × {e.reps.toLowerCase()} · {labelList(musclesFor(e.name).primary)}
                    {logs?.length ? ` · Sidst ${logs.map((l) => l.achieved ?? '✓').join(' · ')}` : ''}
                  </span>
                </button>
                <span className="exercise-index">{i + 1}</span>
              </li>
            )
          })}
        </ol>
      </section>

      <div className="cta-bar">
        <Button onClick={start}>{isCurrent ? `Start ${day.label}` : `Skift til ${level.name} og start`}</Button>
      </div>

      {open && <ExerciseSheet name={open.name} detail={open.detail} onClose={() => setOpen(null)} />}
    </div>
  )
}

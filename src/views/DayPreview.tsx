import { useEffect, type CSSProperties } from 'react'
import { updateSettings, useAppState } from '../lib/store'
import { navigate } from '../lib/router'
import { getDay, getLevel, getProgram } from '../data/programs'
import { estimateMinutes, sessionsForDay } from '../lib/stats'
import { relativeDay } from '../lib/format'
import { isLegs } from '../lib/reps'
import type { ProgramId } from '../lib/types'
import { BackButton, Button, TopBar } from '../components/ui'

export function DayPreview({ programId, levelIndex, dayId }: { programId: ProgramId; levelIndex: number; dayId: string }) {
  const s = useAppState()
  const program = getProgram(programId)
  const level = getLevel(programId, levelIndex)
  const day = getDay(programId, levelIndex, dayId)

  useEffect(() => {
    if (!day) navigate({ name: 'home' }, { replace: true })
  }, [day])
  if (!day) return null

  const isCurrent = s.settings.programId === programId && s.settings.levelIndex === levelIndex
  const last = sessionsForDay(s.sessions, programId, levelIndex, dayId).at(-1)
  const totalSets = day.exercises.reduce((n, e) => n + e.sets, 0)
  const minutes = estimateMinutes(day.exercises, s.settings.restSeconds)
  const legs = day.exercises.filter((e) => isLegs(e.name)).length

  const start = () => {
    if (!isCurrent) updateSettings({ programId, levelIndex })
    navigate({ name: 'setup', dayId })
  }

  return (
    <div className="page">
      <TopBar
        left={<BackButton />}
        right={
          <span className="eyebrow">
            {program.name} · {level.name}
          </span>
        }
      />

      <section className="hero">
        <p className="eyebrow">
          {isCurrent ? 'Dit nuværende level' : level.name}
          {day.focus ? ` · ${day.focus}` : ''}
        </p>
        <h1 className="display">{day.label}</h1>
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
                <span className="exercise-main">
                  <span className="exercise-name">{e.name}</span>
                  <span className="exercise-sub">
                    {e.sets} × {e.reps.toLowerCase()}
                    {isLegs(e.name) ? ' · ben' : ''}
                    {logs?.length ? ` · Sidst ${logs.map((l) => l.achieved ?? '✓').join(' · ')}` : ''}
                  </span>
                </span>
                <span className="exercise-index">{i + 1}</span>
              </li>
            )
          })}
        </ol>
      </section>

      <div className="cta-bar">
        <Button onClick={start}>{isCurrent ? `Start ${day.label}` : `Skift til ${level.name} og start`}</Button>
      </div>
    </div>
  )
}

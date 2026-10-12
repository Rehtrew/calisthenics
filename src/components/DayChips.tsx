import type { CSSProperties } from 'react'
import type { ProgramDay, Session } from '../lib/types'
import { sessionsForDay } from '../lib/stats'
import { cap, relativeDay } from '../lib/format'

/**
 * Day picker. Two identical grids are stacked: the dark one takes the taps, the
 * white one on top is clipped to the chosen cell, so the selection slides
 * between days as one shape.
 */
export function DayChips({
  days,
  selectedId,
  nextId,
  selectedIndex,
  cols,
  rows,
  sessions,
  levelIndex,
  onSelect,
}: {
  days: ProgramDay[]
  selectedId: string
  nextId: string
  selectedIndex: number
  cols: number
  rows: number
  sessions: Session[]
  levelIndex: number
  onSelect: (id: string) => void
}) {
  const vars = { '--cols': cols, '--rows': rows, '--col': selectedIndex % cols, '--row': Math.floor(selectedIndex / cols) } as CSSProperties
  const hint = (d: ProgramDay) => {
    const last = sessionsForDay(sessions, levelIndex, d.id).at(-1)
    return last ? cap(relativeDay(last.endedAt)) : 'Ikke trænet'
  }
  const label = (d: ProgramDay) => (
    <>
      <span>
        {d.id === nextId && <i className="dot" aria-label="Foreslået" />}
        {d.label}
      </span>
      <small>{hint(d)}</small>
    </>
  )

  return (
    <div className="day-chips" style={vars}>
      <div className="chips-layer" role="radiogroup" aria-label="Vælg dag">
        {days.map((d, i) => (
          <button key={d.id} role="radio" aria-checked={d.id === selectedId} className="chip stagger" style={{ '--i': i } as CSSProperties} onClick={() => onSelect(d.id)}>
            {label(d)}
          </button>
        ))}
      </div>
      <div className="chips-layer chips-active" aria-hidden="true">
        {days.map((d) => (
          <span key={d.id} className="chip">
            {label(d)}
          </span>
        ))}
      </div>
    </div>
  )
}

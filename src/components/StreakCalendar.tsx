import { useState, type CSSProperties } from 'react'
import type { Session } from '../lib/types'
import { monthCalendar, weekStreak } from '../lib/streak'
import { cap, fmtMonth } from '../lib/format'
import { Icon, IconButton } from './ui'

const DOW = ['M', 'T', 'O', 'T', 'F', 'L', 'S']

const barbell = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <path d="M3 10v4M6.5 7.5v9M17.5 7.5v9M21 10v4M6.5 12h11" />
  </svg>
)

const flame = (
  <svg viewBox="0 0 24 28" fill="currentColor" aria-hidden="true">
    <path d="M12 1.5c.9 4.2 4.3 5.9 6 9.3 1.7 3.4 1 8.1-2 10.9A8.3 8.3 0 0 1 3.6 15c.3-2.2 1.5-3.9 2.9-5.1.1 1.6.8 2.7 2 3.3C8 8.3 9.4 4.5 12 1.5z" />
  </svg>
)

export function StreakCalendar({ sessions }: { sessions: Session[] }) {
  const [offset, setOffset] = useState(0)
  const now = new Date()
  const month = new Date(now.getFullYear(), now.getMonth() + offset, 1)
  const weeks = monthCalendar(sessions, month)
  const streak = weekStreak(sessions)

  return (
    <div className="cal">
      <div className="cal-head">
        <h2 className="cal-title">{cap(fmtMonth(month.getTime()))}</h2>
        <div className="cal-nav">
          <IconButton label="Forrige måned" onClick={() => setOffset((o) => o - 1)}>
            {Icon.back}
          </IconButton>
          <IconButton label="Næste måned" disabled={offset >= 0} onClick={() => setOffset((o) => o + 1)}>
            {Icon.forward}
          </IconButton>
        </div>
      </div>

      <div className="cal-stats">
        <div className="cal-stat">
          <small>Din streak</small>
          <strong>
            {streak.weeks} {streak.weeks === 1 ? 'uge' : 'uger'}
          </strong>
        </div>
        <div className="cal-stat">
          <small>Træninger i streaken</small>
          <strong>{streak.activities}</strong>
        </div>
      </div>

      <div className="cal-grid swap" role="grid" aria-label="Træningskalender" key={`${month.getFullYear()}-${month.getMonth()}`}>
        {DOW.map((d, i) => (
          <span key={i} className="cal-dow">
            {d}
          </span>
        ))}
        <span className="cal-track" style={{ gridRow: `2 / span ${weeks.length}` }} aria-hidden="true" />
        {weeks.map((week, r) => (
          <WeekRow key={r} row={r + 2} week={week} streakWeeks={streak.weeks} pending={streak.pending} offset={weeks.slice(0, r).reduce((n, w) => n + w.days.filter((d) => d.trained).length, 0)} />
        ))}
      </div>
    </div>
  )
}

function WeekRow({
  row,
  week,
  streakWeeks,
  pending,
  offset,
}: {
  row: number
  week: ReturnType<typeof monthCalendar>[number]
  streakWeeks: number
  pending: boolean
  offset: number
}) {
  let trainedSeen = 0
  return (
    <>
      {week.days.map((d) => {
        const i = d.trained ? offset + trainedSeen++ : 0
        return (
          <span
            key={d.key}
            className={`cal-day ${d.inMonth ? '' : 'out'} ${d.trained ? 'on pop' : ''} ${d.future ? 'future' : ''} ${d.today ? 'today' : ''}`}
            title={d.trained ? `${d.trained} træning${d.trained > 1 ? 'er' : ''}` : undefined}
            style={{ gridRow: row, '--i': i } as CSSProperties}
          >
            {d.trained ? barbell : d.dayOfMonth}
          </span>
        )
      })}
      <span
        className={`cal-week pop ${week.status} ${week.status === 'current' && pending ? 'pending' : ''}`}
        style={{ gridRow: row, '--i': row + 4 } as CSSProperties}
      >
        {week.status === 'done' && Icon.check}
        {week.status === 'current' && (
          <>
            {flame}
            <b>{streakWeeks}</b>
          </>
        )}
      </span>
    </>
  )
}

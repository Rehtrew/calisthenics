import type { CSSProperties } from 'react'
import type { Session } from '../lib/types'
import { navigate } from '../lib/router'
import { sessionScore } from '../lib/stats'
import { fmtDateShort, fmtDuration } from '../lib/format'

export function SessionRow({ session, index = 0 }: { session: Session; index?: number }) {
  const score = sessionScore(session)
  const aborted = session.status === 'aborted'
  return (
    <button className="row stagger" style={{ '--i': index } as CSSProperties} onClick={() => navigate({ name: 'session', sessionId: session.id })}>
      <span className="row-main">
        <span className="row-title">
          {session.dayLabel} · Level {session.levelIndex + 1}
        </span>
        <span className="row-sub">
          {fmtDateShort(session.endedAt)} · {fmtDuration(session.endedAt - session.startedAt)}
          {aborted && ' · Afbrudt'}
        </span>
      </span>
      <span className={`row-value ${aborted ? 'muted' : ''}`}>{score.pct}%</span>
    </button>
  )
}

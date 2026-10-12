import { useState, type CSSProperties } from 'react'
import { useAppState } from '../lib/store'
import { navigate } from '../lib/router'
import { getLevel, getProgram } from '../data/programs'
import { byEnded, countThisMonth, estimateMinutes, recentAverage, sessionsForDay, suggestNextDay } from '../lib/stats'
import { cap, fmtTime, relativeDay } from '../lib/format'
import { isLegs } from '../lib/reps'
import { useSyncStatus } from '../lib/sync'
import { Button, Icon, IconButton, Stat, TopBar } from '../components/ui'
import { SessionRow } from '../components/SessionRow'
import { StreakCalendar } from '../components/StreakCalendar'

export function Home() {
  const s = useAppState()
  const { programId, levelIndex, restSeconds, skipLegs } = s.settings
  const program = getProgram(programId)
  const level = getLevel(programId, levelIndex)
  const next = suggestNextDay(level, s.sessions, programId, levelIndex)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = level.days.find((d) => d.id === selectedId) ?? next
  const isNext = selected.id === next.id
  const exercises = selected.exercises.filter((e) => !(skipLegs && isLegs(e.name)))
  const minutes = estimateMinutes(exercises, restSeconds)
  const atLevel = s.sessions.filter((x) => x.programId === programId && x.levelIndex === levelIndex && x.status === 'completed').length
  const avg = recentAverage(s.sessions)
  const sorted = [...s.sessions].sort(byEnded)
  const last = sorted.at(-1)
  const recent = sorted.slice(-4).reverse()
  const cols = level.days.length === 4 ? 2 : Math.min(3, level.days.length)
  const sync = useSyncStatus()
  const syncLine =
    sync.state === 'off'
      ? 'Synkronisering er ikke slået til'
      : sync.state === 'idle' && sync.lastSyncedAt
        ? `Synkroniseret kl. ${fmtTime(sync.lastSyncedAt)}`
        : `Synkronisering: ${sync.message.toLowerCase()}`

  return (
    <div className="page">
      <TopBar
        left={
          <button className="link" onClick={() => navigate({ name: 'program' })}>
            {program.name} · {level.name} →
          </button>
        }
        right={
          <IconButton label="Indstillinger" className="plain" onClick={() => navigate({ name: 'settings' })}>
            {Icon.menu}
          </IconButton>
        }
      />

      {s.active && (
        <button className="banner" onClick={() => navigate({ name: 'workout' })}>
          <span>Træning i gang · {s.active.dayLabel}</span>
          <span>Fortsæt →</span>
        </button>
      )}

      <section className="hero">
        <p className="eyebrow">{isNext ? 'Næste træning' : 'Valgt træning'}</p>
        <h1 className="display swap" key={selected.id}>
          {selected.label}
        </h1>
        <p className="muted">
          {exercises.length} øvelser · ca. {minutes} min{selected.focus ? ` · ${selected.focus}` : ''} ·{' '}
          <button className="link inline" onClick={() => navigate({ name: 'day', programId, levelIndex, dayId: selected.id })}>
            Se øvelser →
          </button>
        </p>
        {last && (
          <p className="muted last-trained">
            Senest trænet: <strong>{last.dayLabel}</strong>
            {last.programId !== programId || last.levelIndex !== levelIndex ? ` (Level ${last.levelIndex + 1})` : ''} ·{' '}
            {relativeDay(last.endedAt)}
            {last.status === 'aborted' ? ' · afbrudt' : ''}
          </p>
        )}
        <div className="day-chips" role="radiogroup" aria-label="Vælg dag" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {level.days.map((d, i) => {
            const lastForDay = sessionsForDay(s.sessions, programId, levelIndex, d.id).at(-1)
            return (
              <button
                key={d.id}
                role="radio"
                aria-checked={d.id === selected.id}
                className={`chip stagger ${d.id === selected.id ? 'active' : ''}`}
                style={{ '--i': i } as CSSProperties}
                onClick={() => setSelectedId(d.id)}
              >
                <span>
                  {d.id === next.id && <i className="dot" aria-label="Foreslået" />}
                  {d.label}
                </span>
                <small>{lastForDay ? cap(relativeDay(lastForDay.endedAt)) : 'Ikke trænet'}</small>
              </button>
            )
          })}
        </div>
        <Button onClick={() => navigate({ name: 'setup', dayId: selected.id })}>Start {selected.label}</Button>
      </section>

      <section className="stats">
        <Stat value={s.sessions.length} label="Træninger i alt" />
        <Stat value={countThisMonth(s.sessions)} label="Denne måned" />
        <Stat value={avg ?? '–'} unit={avg != null ? '%' : undefined} label="Gennemsnit, sidste 5" />
        <Stat value={atLevel} label={`Gennemført på ${level.name.toLowerCase()}`} />
      </section>

      <section className="section">
        <StreakCalendar sessions={s.sessions} />
      </section>

      <section className="section">
        <div className="row-head">
          <p className="eyebrow">Seneste</p>
          {s.sessions.length > 0 && (
            <button className="link" onClick={() => navigate({ name: 'history' })}>
              Se alle
            </button>
          )}
        </div>
        {recent.length === 0 && <p className="muted">Ingen træninger endnu. Start med {next.label}.</p>}
        {recent.map((sess, i) => (
          <SessionRow key={sess.id} session={sess} index={i} />
        ))}
      </section>

      <button className={`link small sync-line ${sync.state === 'error' ? 'accent' : ''}`} onClick={() => navigate({ name: 'settings' })}>
        {syncLine} →
      </button>
    </div>
  )
}

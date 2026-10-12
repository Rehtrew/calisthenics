import { useAppState } from '../lib/store'
import { navigate } from '../lib/router'
import { getLevel, getProgram } from '../data/programs'
import { byEnded, countThisMonth, estimateMinutes, recentAverage, sessionsForDay, suggestNextDay, weeksGrid } from '../lib/stats'
import { cap, fmtTime, relativeDay } from '../lib/format'
import { isLegs } from '../lib/reps'
import { useSyncStatus } from '../lib/sync'
import { Button, Icon, IconButton, Stat, TopBar } from '../components/ui'
import { SessionRow } from '../components/SessionRow'

const WEEKS = 12

export function Home() {
  const s = useAppState()
  const { programId, levelIndex, restSeconds, skipLegs } = s.settings
  const program = getProgram(programId)
  const level = getLevel(programId, levelIndex)
  const next = suggestNextDay(level, s.sessions, programId, levelIndex)
  const nextExercises = next.exercises.filter((e) => !(skipLegs && isLegs(e.name)))
  const minutes = estimateMinutes(nextExercises, restSeconds)
  const atLevel = s.sessions.filter((x) => x.programId === programId && x.levelIndex === levelIndex && x.status === 'completed').length
  const avg = recentAverage(s.sessions)
  const cells = weeksGrid(s.sessions, WEEKS)
  const sorted = [...s.sessions].sort(byEnded)
  const last = sorted.at(-1)
  const recent = sorted.slice(-4).reverse()
  const cols = level.days.length === 4 ? 2 : Math.min(3, level.days.length)
  const sync = useSyncStatus()
  const syncLine =
    sync.state === 'off'
      ? 'Online backup er ikke slået til'
      : sync.state === 'idle' && sync.lastSyncedAt
        ? `Online backup synkroniseret kl. ${fmtTime(sync.lastSyncedAt)}`
        : `Online backup: ${sync.message.toLowerCase()}`

  return (
    <div className="page">
      <TopBar
        left={
          <span className="eyebrow">
            {program.name} · {level.name}
          </span>
        }
        right={
          <IconButton label="Indstillinger" onClick={() => navigate({ name: 'settings' })}>
            {Icon.more}
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
        <p className="eyebrow">Næste træning</p>
        <h1 className="display">{next.label}</h1>
        <p className="muted">
          {nextExercises.length} øvelser · ca. {minutes} min{next.focus ? ` · ${next.focus}` : ''}
        </p>
        {last && (
          <p className="muted last-trained">
            Senest trænet: <strong>{last.dayLabel}</strong>
            {last.programId !== programId || last.levelIndex !== levelIndex ? ` (Level ${last.levelIndex + 1})` : ''} ·{' '}
            {relativeDay(last.endedAt)}
            {last.status === 'aborted' ? ' · afbrudt' : ''}
          </p>
        )}
        <div className="day-chips" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {level.days.map((d) => {
            const lastForDay = sessionsForDay(s.sessions, programId, levelIndex, d.id).at(-1)
            return (
              <button key={d.id} className={`chip ${d.id === next.id ? 'active' : ''}`} onClick={() => navigate({ name: 'setup', dayId: d.id })}>
                {d.label}
                <small>{lastForDay ? cap(relativeDay(lastForDay.endedAt)) : 'Ikke trænet'}</small>
              </button>
            )
          })}
        </div>
        <Button onClick={() => navigate({ name: 'setup', dayId: next.id })}>Start {next.label}</Button>
      </section>

      <section className="stats">
        <Stat value={s.sessions.length} label="Træninger i alt" />
        <Stat value={countThisMonth(s.sessions)} label="Denne måned" />
        <Stat value={avg ?? '–'} unit={avg != null ? '%' : undefined} label="Gennemsnit, sidste 5" />
        <Stat value={atLevel} label={`Gennemført på ${level.name.toLowerCase()}`} />
      </section>

      <section className="section">
        <p className="eyebrow">Sidste {WEEKS} uger</p>
        <div className="grid" aria-label={`Træningsdage de sidste ${WEEKS} uger`}>
          {cells.map((c) => (
            <span key={c.key} className={`cell ${c.trained ? 'on' : ''} ${c.future ? 'future' : ''} ${c.today ? 'today' : ''}`} title={c.key} />
          ))}
        </div>
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
        {recent.map((sess) => (
          <SessionRow key={sess.id} session={sess} />
        ))}
      </section>

      <button className={`link small sync-line ${sync.state === 'error' ? 'accent' : ''}`} onClick={() => navigate({ name: 'settings' })}>
        {syncLine} →
      </button>
    </div>
  )
}

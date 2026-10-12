import { useState } from 'react'
import { useAppState } from '../lib/store'
import { navigate } from '../lib/router'
import { getLevel, LEVEL_COUNT } from '../data/programs'
import { byEnded, countThisMonth, estimateMinutes, recentAverage, suggestNextDay, weightLog } from '../lib/stats'
import { fmtKg, fmtTime, relativeDay } from '../lib/format'
import { isLegs } from '../lib/reps'
import { DEFAULT_REST_SECONDS, DEFAULT_SKIP_LEGS } from '../lib/defaults'
import { useSyncStatus } from '../lib/sync'
import { Button, Icon, IconButton, Stat, TopBar } from '../components/ui'
import { SessionRow } from '../components/SessionRow'
import { DayChips } from '../components/DayChips'
import { StreakCalendar } from '../components/StreakCalendar'

/** Remembered across screens so coming back from a preview keeps the chosen day. */
let rememberedDayId: string | null = null

export function Home() {
  const s = useAppState()
  const { levelIndex } = s.settings
  const level = getLevel(levelIndex)
  const next = suggestNextDay(level, s.sessions, levelIndex)
  const [selectedId, setSelectedIdState] = useState<string | null>(rememberedDayId)
  const setSelectedId = (id: string) => {
    rememberedDayId = id
    setSelectedIdState(id)
  }
  const selected = level.days.find((d) => d.id === selectedId) ?? next
  const exercises = selected.exercises.filter((e) => !(DEFAULT_SKIP_LEGS && isLegs(e.name)))
  const minutes = estimateMinutes(exercises, DEFAULT_REST_SECONDS)
  const atLevel = s.sessions.filter((x) => x.levelIndex === levelIndex && x.status === 'completed').length
  const avg = recentAverage(s.sessions)
  const sorted = [...s.sessions].sort(byEnded)
  const last = sorted.at(-1)
  const recent = sorted.slice(-4).reverse()
  const weights = weightLog(s.sessions)
  const latestWeight = weights.at(-1)
  const previousWeight = weights.at(-2)
  const weightDelta = latestWeight && previousWeight ? Math.round((latestWeight.kg - previousWeight.kg) * 10) / 10 : null
  const cols = level.days.length === 4 ? 2 : Math.min(3, level.days.length)
  const rows = Math.ceil(level.days.length / cols)
  const selectedIndex = Math.max(
    0,
    level.days.findIndex((d) => d.id === selected.id),
  )
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
        left={<span className="greeting">God træning{s.settings.name ? `, ${s.settings.name}` : ''}!</span>}
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
        <button className="display level-title" onClick={() => navigate({ name: 'program' })} aria-label={`${level.name} af ${LEVEL_COUNT}, se hele programmet`}>
          {level.name}
        </button>
        <h1 className="display day-title swap" key={selected.id}>
          {selected.label}
        </h1>
        <p className="muted">
          {exercises.length} øvelser · ca. {minutes} min{selected.focus ? ` · ${selected.focus}` : ''} ·{' '}
          <button className="link inline" onClick={() => navigate({ name: 'day', levelIndex, dayId: selected.id })}>
            Se øvelser →
          </button>
        </p>

        <DayChips days={level.days} selectedId={selected.id} nextId={next.id} selectedIndex={selectedIndex} cols={cols} rows={rows} sessions={s.sessions} levelIndex={levelIndex} onSelect={setSelectedId} />

        <Button onClick={() => navigate({ name: 'setup', dayId: selected.id })}>Start {selected.label}</Button>

        {last && (
          <p className="muted last-trained">
            Senest trænet: <strong>{last.dayLabel}</strong>
            {last.levelIndex !== levelIndex ? ` (Level ${last.levelIndex + 1})` : ''} · {relativeDay(last.endedAt)}
            {last.status === 'aborted' ? ' · afbrudt' : ''}
          </p>
        )}
        {latestWeight && (
          <button className="link inline muted last-trained" onClick={() => navigate({ name: 'session', sessionId: latestWeight.sessionId })}>
            Vægt: <strong>{fmtKg(latestWeight.kg)} kg</strong>
            {weightDelta != null && (
              <span className={weightDelta < 0 ? 'positive' : ''}>
                {' '}
                · {weightDelta > 0 ? '+' : ''}
                {fmtKg(weightDelta)} kg siden sidst
              </span>
            )}
            {' '}· {relativeDay(latestWeight.at)}
          </button>
        )}
      </section>

      <section className="stats">
        <Stat index={0} value={s.sessions.length} label="Træninger i alt" />
        <Stat index={1} value={countThisMonth(s.sessions)} label="Denne måned" />
        <Stat index={2} value={avg ?? '–'} unit={avg != null ? '%' : undefined} label="Gennemsnit, sidste 5" />
        <Stat index={3} value={atLevel} label={`Gennemført på ${level.name.toLowerCase()}`} />
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

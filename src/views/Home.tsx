import { useState } from 'react'
import { useAppState } from '../lib/store'
import { navigate } from '../lib/router'
import { getLevel, LEVEL_COUNT } from '../data/programs'
import { byEnded, countThisMonth, doneThisRound, estimateMinutes, recentAverage, suggestNextDay, weightLog } from '../lib/stats'
import { fmtKg, fmtTime, relativeDay } from '../lib/format'
import { isLegs } from '../lib/reps'
import { DEFAULT_REST_SECONDS, DEFAULT_SKIP_LEGS } from '../lib/defaults'
import { useSyncStatus } from '../lib/sync'
import { Button, Icon, IconButton, Stat, TopBar } from '../components/ui'
import { SessionRow } from '../components/SessionRow'
import { DayChips } from '../components/DayChips'
import { StreakCalendar } from '../components/StreakCalendar'
import { dayName, t } from '../lib/i18n'

/** Remembered across screens so coming back from a preview keeps the chosen day. */
let rememberedDayId: string | null = null

export function Home() {
  const s = useAppState()
  const { levelIndex } = s.settings
  const level = getLevel(levelIndex)
  const next = suggestNextDay(level, s.sessions, levelIndex)
  const done = doneThisRound(level, s.sessions, levelIndex)
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
      ? t('Synkronisering er ikke slået til')
      : sync.state === 'idle' && sync.lastSyncedAt
        ? t('Synkroniseret kl. {time}', { time: fmtTime(sync.lastSyncedAt) })
        : t('Synkronisering: {msg}', { msg: sync.message.toLowerCase() })

  return (
    <div className="page">
      <TopBar
        left={<span className="greeting">{t('God træning{name}!', { name: s.settings.name ? `, ${s.settings.name}` : '' })}</span>}
        right={
          <IconButton label={t('Indstillinger')} className="plain" onClick={() => navigate({ name: 'settings' })}>
            {Icon.menu}
          </IconButton>
        }
      />

      {s.active && (
        <button className="banner" onClick={() => navigate({ name: 'workout' })}>
          <span>{t('Træning i gang · {day}', { day: dayName(s.active.dayLabel) })}</span>
          <span>{t('Fortsæt →')}</span>
        </button>
      )}

      <section className="hero">
        <button className="display level-title" onClick={() => navigate({ name: 'program' })} aria-label={t('{level} af {count}, se hele programmet', { level: level.name, count: LEVEL_COUNT })}>
          {level.name}
        </button>
        <h1 className="display day-title swap" key={selected.id}>
          {dayName(selected.label)}
        </h1>
        <p className="muted">
          {t('{n} øvelser · ca. {min} min', { n: exercises.length, min: minutes })}{selected.focus ? ` · ${selected.focus}` : ''} ·{' '}
          <button className="link inline" onClick={() => navigate({ name: 'day', levelIndex, dayId: selected.id })}>
            {t('Se øvelser →')}
          </button>
        </p>

        <DayChips days={level.days} selectedId={selected.id} nextId={next.id} done={done} selectedIndex={selectedIndex} cols={cols} rows={rows} sessions={s.sessions} levelIndex={levelIndex} onSelect={setSelectedId} />

        <Button onClick={() => navigate({ name: 'setup', dayId: selected.id })}>{t('Start {day}', { day: dayName(selected.label) })}</Button>

        {last && (
          <p className="muted last-trained">
            {t('Senest trænet:')} <strong>{dayName(last.dayLabel)}</strong>
            {last.levelIndex !== levelIndex ? ` (Level ${last.levelIndex + 1})` : ''} · {relativeDay(last.endedAt)}
            {last.status === 'aborted' ? t(' · afbrudt') : ''}
          </p>
        )}
        {latestWeight && (
          <button className="link inline muted last-trained" onClick={() => navigate({ name: 'weight' })}>
            {t('Vægt:')} <strong>{fmtKg(latestWeight.kg)} kg</strong>
            {weightDelta != null && (
              <span className={weightDelta < 0 ? 'positive' : ''}>
                {' '}
                · {t('{delta} kg siden sidst', { delta: (weightDelta > 0 ? '+' : '') + fmtKg(weightDelta) })}
              </span>
            )}
            {' '}· {relativeDay(latestWeight.at)} →
          </button>
        )}
      </section>

      <section className="stats">
        <Stat index={0} value={s.sessions.length} label={t('Træninger i alt')} />
        <Stat index={1} value={countThisMonth(s.sessions)} label={t('Denne måned')} />
        <Stat index={2} value={avg ?? '–'} unit={avg != null ? '%' : undefined} label={t('Af programmet nået, seneste 5 træninger')} />
        <Stat index={3} value={atLevel} label={t('Gennemført på {level}', { level: level.name.toLowerCase() })} />
      </section>

      <section className="section">
        <StreakCalendar sessions={s.sessions} />
      </section>

      <section className="section">
        <div className="row-head">
          <p className="eyebrow">{t('Seneste')}</p>
          {s.sessions.length > 0 && (
            <button className="link" onClick={() => navigate({ name: 'history' })}>
              {t('Se alle')}
            </button>
          )}
        </div>
        {recent.length === 0 && <p className="muted">{t('Ingen træninger endnu. Start med {day}.', { day: dayName(next.label) })}</p>}
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

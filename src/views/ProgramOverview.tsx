import type { CSSProperties } from 'react'
import { updateSettings, useAppState } from '../lib/store'
import { navigate } from '../lib/router'
import { levels } from '../data/programs'
import { BackButton, TopBar } from '../components/ui'
import { LevelGrid } from '../components/LevelGrid'

export function ProgramOverview() {
  const s = useAppState()

  return (
    <div className="page">
      <TopBar left={<BackButton />} />
      <section className="hero">
        <p className="eyebrow">Programmet</p>
        <h1 className="title">Alle {levels.length} levels</h1>
        <p className="muted" style={{ marginTop: 8 }}>
          Vælg dit level her, eller tryk på en dag for at se øvelserne. Du kan også starte en dag fra et andet level.
        </p>
        <div style={{ marginTop: 20 }}>
          <LevelGrid value={s.settings.levelIndex} onChange={(levelIndex) => updateSettings({ levelIndex })} />
        </div>
      </section>

      {levels.map((level, li) => {
        const current = li === s.settings.levelIndex
        const done = s.sessions.filter((x) => x.levelIndex === li && x.status === 'completed').length
        return (
          <section key={level.index} id={`level-${level.index}`} className="section stagger" style={{ '--i': li } as CSSProperties}>
            <div className="row-head">
              <p className={`eyebrow ${current ? 'accent' : ''}`}>
                {level.name}
                {current ? ' · Nuværende' : ''}
              </p>
              <span className="eyebrow">
                {level.days.length} dage{done ? ` · ${done} gennemført` : ''}
              </span>
            </div>
            {level.days.map((d) => (
              <button key={d.id} className="row" onClick={() => navigate({ name: 'day', levelIndex: li, dayId: d.id })}>
                <span className="row-main">
                  <span className="row-title">
                    {d.label}
                    {d.focus ? ` · ${d.focus}` : ''}
                  </span>
                  <span className="row-sub">
                    {d.exercises
                      .slice(0, 3)
                      .map((e) => e.name)
                      .join(', ')}
                    {d.exercises.length > 3 ? ` +${d.exercises.length - 3}` : ''}
                  </span>
                </span>
                <span className="row-value small muted">{d.exercises.length} øvelser</span>
              </button>
            ))}
          </section>
        )
      })}
    </div>
  )
}

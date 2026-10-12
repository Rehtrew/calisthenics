import { useState, type CSSProperties } from 'react'
import { useAppState } from '../lib/store'
import { navigate } from '../lib/router'
import { getProgram, programs } from '../data/programs'
import type { ProgramId } from '../lib/types'
import { BackButton, Segmented, TopBar } from '../components/ui'

export function ProgramOverview() {
  const s = useAppState()
  const [programId, setProgramId] = useState<ProgramId>(s.settings.programId)
  const program = getProgram(programId)

  return (
    <div className="page">
      <TopBar left={<BackButton />} />
      <section className="hero">
        <p className="eyebrow">Programmet</p>
        <h1 className="title">Alle levels og dage</h1>
        <p className="muted" style={{ marginTop: 8 }}>
          Tryk på en dag for at se øvelserne. Du kan starte en dag fra et andet level derfra.
        </p>
        <div style={{ marginTop: 20 }}>
          <Segmented value={programId} options={programs.map((p) => ({ value: p.id as ProgramId, label: p.name }))} onChange={setProgramId} />
        </div>
      </section>

      {program.levels.map((level, li) => {
        const current = programId === s.settings.programId && level.index - 1 === s.settings.levelIndex
        return (
          <section key={`${programId}-${level.index}`} className="section stagger" style={{ '--i': li } as CSSProperties}>
            <div className="row-head">
              <p className="eyebrow">
                {level.name}
                {current ? ' · Nuværende' : ''}
              </p>
              <span className="eyebrow">{level.days.length} dage</span>
            </div>
            {level.days.map((d) => (
              <button key={d.id} className="row" onClick={() => navigate({ name: 'day', programId, levelIndex: level.index - 1, dayId: d.id })}>
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

import { useAppState } from '../lib/store'
import { figureView, labelList, musclesFor, viewsFor } from '../lib/muscles'
import { exerciseHistory } from '../lib/stats'
import { fmtDateShort } from '../lib/format'
import { unitLabel } from '../lib/reps'
import { BodyFigure } from './body/BodyFigure'
import { Button, Sheet } from './ui'

const VIEW_LABEL = { front: 'Forfra', side: 'Fra siden', back: 'Bagfra', frontTorso: 'Forfra', backTorso: 'Bagfra' } as const

/** Which muscles an exercise trains, drawn on the body, plus how it has gone over time. */
export function ExerciseSheet({ name, detail, onClose }: { name: string; detail?: string; onClose: () => void }) {
  const s = useAppState()
  const map = musclesFor(name)
  const views = viewsFor(map)
  const history = exerciseHistory(s.sessions, name)
  const recent = history.slice(-8)
  const best = history.reduce<(typeof history)[number] | null>((b, h) => (b == null || h.total > b.total ? h : b), null)
  const unit = history.at(-1)?.logs[0]?.unit ?? 'reps'

  return (
    <Sheet title={name} text={detail}>
      <div className="figures">
        {views.map((v) => {
          const fv = figureView(v, map)
          return (
            <figure key={v} className="figure">
              <BodyFigure view={fv} primary={map.primary} secondary={map.secondary} height={history.length ? 180 : views.length > 1 ? 230 : 280} />
              <figcaption className="muted small">{VIEW_LABEL[fv]}</figcaption>
            </figure>
          )
        })}
      </div>
      <dl className="muscle-list">
        <div>
          <dt>
            <i className="swatch primary" /> Primært
          </dt>
          <dd>{map.primary.length ? labelList(map.primary) : '–'}</dd>
        </div>
        {map.secondary.length > 0 && (
          <div>
            <dt>
              <i className="swatch secondary" /> Sekundært
            </dt>
            <dd>{labelList(map.secondary)}</dd>
          </div>
        )}
      </dl>

      {history.length > 0 && (
        <section className="history">
          <div className="row-head">
            <p className="eyebrow">Udvikling</p>
            {best && (
              <span className="eyebrow">
                Bedste {best.total} {unitLabel(unit)} · {fmtDateShort(best.at)}
              </span>
            )}
          </div>
          <Sparkline values={recent.map((h) => h.total)} />
          <ul className="history-list">
            {[...recent].reverse().map((h) => (
              <li key={h.sessionId} className="history-row">
                <span className="history-date">{fmtDateShort(h.at)}</span>
                <span className="history-sets">
                  {h.logs.map((l, i) => (
                    <span key={i} className={`set-pill ${l.full ? '' : 'short'}`}>
                      {l.achieved ?? (l.full ? '✓' : '–')}
                    </span>
                  ))}
                </span>
                <span className="history-total">
                  {h.total} {unitLabel(unit)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Button variant="secondary" onClick={onClose}>
        Luk
      </Button>
    </Sheet>
  )
}

/** Totals per session as a small line, latest at the right. */
function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null
  const W = 300
  const H = 48
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const x = (i: number) => 4 + (i / (values.length - 1)) * (W - 8)
  const y = (v: number) => 4 + (1 - (v - lo) / (hi - lo || 1)) * (H - 8)
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="sparkline" aria-hidden="true">
      <path d={d} className="chart-line" />
      {values.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r={i === values.length - 1 ? 4.5 : 3} className="chart-dot" />
      ))}
    </svg>
  )
}

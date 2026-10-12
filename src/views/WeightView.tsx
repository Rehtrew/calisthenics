import { useMemo, useRef, useState, type PointerEvent } from 'react'
import { useAppState } from '../lib/store'
import { navigate } from '../lib/router'
import { weightLog } from '../lib/stats'
import { fmtDateShort, fmtKg } from '../lib/format'
import { niceTicks, RANGES, rangeDays, type RangeKey } from '../lib/chart'
import { BackButton, Icon, IconButton, Segmented, TopBar } from '../components/ui'

const DAY = 86_400_000

function endOfDay(ts: number): number {
  const d = new Date(ts)
  d.setHours(23, 59, 59, 999)
  return d.getTime()
}

export function WeightView() {
  const s = useAppState()
  const all = weightLog(s.sessions)
  const [range, setRange] = useState<RangeKey>('1m')
  const [endAt, setEndAt] = useState(() => endOfDay(Date.now()))
  const days = rangeDays(range)
  const startAt = endAt - days * DAY
  const inRange = all.filter((w) => w.at >= startAt && w.at <= endAt)
  const latest = all.at(-1)
  const first = inRange[0]
  const last = inRange.at(-1)
  const delta = first && last && first !== last ? Math.round((last.kg - first.kg) * 10) / 10 : null
  const atToday = endAt >= endOfDay(Date.now())

  const shift = (dir: -1 | 1) => setEndAt((e) => Math.min(endOfDay(Date.now()), e + dir * days * DAY))

  return (
    <div className="page">
      <TopBar left={<BackButton />} />
      <section className="hero">
        <p className="eyebrow">Vægt</p>
        <h1 className="display">
          {last ? fmtKg(last.kg) : latest ? fmtKg(latest.kg) : '–'}
          <span className="display-unit">kg</span>
        </h1>
        <p className={`muted ${delta != null && delta < 0 ? 'positive' : ''}`}>
          {delta != null
            ? `${delta > 0 ? '+' : ''}${fmtKg(delta)} kg fra ${fmtDateShort(first!.at)} til ${fmtDateShort(last!.at)}`
            : inRange.length === 1
              ? `Én måling i perioden · ${fmtDateShort(inRange[0].at)}`
              : latest
                ? `Ingen målinger i perioden · seneste ${fmtDateShort(latest.at)}`
                : 'Log din vægt efter en træning, så tegnes kurven her.'}
        </p>
      </section>

      <section className="section">
        <div className="chart-controls">
          <Segmented value={range} options={RANGES.map((r) => ({ value: r.key, label: r.label }))} onChange={setRange} />
          <div className="chart-nav">
            <IconButton label="Tidligere periode" onClick={() => shift(-1)}>
              {Icon.back}
            </IconButton>
            <IconButton label="Senere periode" disabled={atToday} onClick={() => shift(1)}>
              {Icon.forward}
            </IconButton>
          </div>
        </div>
        <p className="eyebrow chart-period">
          {fmtDateShort(startAt)} – {fmtDateShort(endAt)}
        </p>
        <WeightChart points={inRange} startAt={startAt} endAt={endAt} />
      </section>

      {inRange.length > 0 && (
        <section className="section">
          <p className="eyebrow">Målinger</p>
          {[...inRange].reverse().map((w, i, arr) => {
            const prev = arr[i + 1]
            const d = prev ? Math.round((w.kg - prev.kg) * 10) / 10 : null
            return (
              <button key={w.sessionId} className="row" onClick={() => navigate({ name: 'session', sessionId: w.sessionId })}>
                <span className="row-main">
                  <span className="row-title">{fmtKg(w.kg)} kg</span>
                  <span className="row-sub">{fmtDateShort(w.at)}</span>
                </span>
                <span className={`row-value small ${d != null && d < 0 ? 'positive' : 'muted'}`}>{d != null ? `${d > 0 ? '+' : ''}${fmtKg(d)}` : ''}</span>
              </button>
            )
          })}
        </section>
      )}
    </div>
  )
}

const W = 340
const H = 200
const PAD = { top: 16, right: 16, bottom: 26, left: 40 }

function WeightChart({ points, startAt, endAt }: { points: { at: number; kg: number }[]; startAt: number; endAt: number }) {
  const [hover, setHover] = useState<number | null>(null)
  const ref = useRef<SVGSVGElement>(null)

  const { ticks, lo, hi } = useMemo(() => {
    const kgs = points.map((p) => p.kg)
    return niceTicks(Math.min(...kgs), Math.max(...kgs))
  }, [points])

  const x = (t: number) => PAD.left + ((t - startAt) / (endAt - startAt)) * (W - PAD.left - PAD.right)
  const y = (kg: number) => PAD.top + (1 - (kg - lo) / (hi - lo || 1)) * (H - PAD.top - PAD.bottom)
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(p.at).toFixed(1)} ${y(p.kg).toFixed(1)}`).join(' ')

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    if (!points.length || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const px = ((e.clientX - rect.left) / rect.width) * W
    let best = 0
    points.forEach((p, i) => {
      if (Math.abs(x(p.at) - px) < Math.abs(x(points[best].at) - px)) best = i
    })
    setHover(best)
  }

  const h = hover != null ? points[hover] : null
  const mid = startAt + (endAt - startAt) / 2

  return (
    <div className="chart">
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className="chart-svg" onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={() => setHover(null)} aria-label="Vægt over tid">
        {points.length > 0 &&
          ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} className="chart-grid" />
              <text x={PAD.left - 8} y={y(t)} className="chart-label" textAnchor="end" dominantBaseline="middle">
                {fmtKg(t)}
              </text>
            </g>
          ))}
        <line x1={PAD.left} x2={W - PAD.right} y1={H - PAD.bottom} y2={H - PAD.bottom} className="chart-axis" />
        {[startAt, mid, endAt].map((t, i) => (
          <text key={i} x={x(t)} y={H - 8} className="chart-label" textAnchor={i === 0 ? 'start' : i === 2 ? 'end' : 'middle'}>
            {fmtDateShort(t)}
          </text>
        ))}
        {points.length === 0 && (
          <text x={W / 2} y={H / 2} className="chart-label" textAnchor="middle" dominantBaseline="middle">
            Ingen målinger i perioden
          </text>
        )}
        {points.length > 1 && <path d={path} className="chart-line" />}
        {points.map((p, i) => (
          <circle key={i} cx={x(p.at)} cy={y(p.kg)} r={hover === i ? 6 : 4} className="chart-dot" />
        ))}
        {h && (
          <g>
            <line x1={x(h.at)} x2={x(h.at)} y1={PAD.top} y2={H - PAD.bottom} className="chart-cross" />
          </g>
        )}
      </svg>
      <div className="chart-tip" aria-live="polite">
        {h ? (
          <>
            <strong>{fmtKg(h.kg)} kg</strong> · {fmtDateShort(h.at)}
          </>
        ) : points.length ? (
          'Tryk på kurven for at se en måling'
        ) : (
          ''
        )}
      </div>
    </div>
  )
}

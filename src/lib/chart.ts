/** Round gridline values for a y-axis: 3–5 ticks on a "nice" step, with a little headroom. */
export function niceTicks(min: number, max: number, target = 4): { ticks: number[]; lo: number; hi: number } {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return { ticks: [], lo: 0, hi: 1 }
  let span = max - min
  if (span < 1) {
    const mid = (min + max) / 2
    min = mid - 0.5
    max = mid + 0.5
    span = 1
  }
  const rough = span / target
  const pow = 10 ** Math.floor(Math.log10(rough))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= rough) ?? pow * 10
  const lo = Math.floor(min / step) * step
  const hi = Math.ceil(max / step) * step
  const ticks: number[] = []
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Math.round(v * 100) / 100)
  return { ticks, lo, hi }
}

export const RANGES = [
  { key: '2u', label: '2 u', days: 14 },
  { key: '1m', label: '1 m', days: 30 },
  { key: '3m', label: '3 m', days: 91 },
  { key: '6m', label: '6 m', days: 182 },
  { key: '1y', label: '1 år', days: 365 },
] as const

export type RangeKey = (typeof RANGES)[number]['key']

export function rangeDays(key: RangeKey): number {
  return RANGES.find((r) => r.key === key)?.days ?? 30
}

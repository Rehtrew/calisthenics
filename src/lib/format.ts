const pad = (n: number) => String(n).padStart(2, '0')

const long = new Intl.DateTimeFormat('da-DK', { weekday: 'long', day: 'numeric', month: 'long' })
const short = new Intl.DateTimeFormat('da-DK', { day: 'numeric', month: 'short' })
const month = new Intl.DateTimeFormat('da-DK', { month: 'long', year: 'numeric' })
const time = new Intl.DateTimeFormat('da-DK', { hour: '2-digit', minute: '2-digit' })

export const fmtDateLong = (ts: number) => long.format(ts)
export const fmtDateShort = (ts: number) => short.format(ts).replace(/\.$/, '')
export const fmtMonth = (ts: number) => month.format(ts)
export const fmtTime = (ts: number) => time.format(ts)

export function fmtDuration(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return h ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`
}

export function fmtClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  return `${Math.floor(s / 60)}:${pad(s % 60)}`
}

export function dayKey(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function startOfDay(ts: number): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function relativeDay(ts: number, now = Date.now()): string {
  const diff = Math.round((startOfDay(now) - startOfDay(ts)) / 86_400_000)
  if (diff <= 0) return 'i dag'
  if (diff === 1) return 'i går'
  if (diff < 7) return `for ${diff} dage siden`
  return fmtDateShort(ts)
}

/** Capitalize the first letter, for labels that start a line. */
export const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s)

import { getLang, locale, t } from './i18n'

const pad = (n: number) => String(n).padStart(2, '0')

const formatters = new Map<string, Intl.DateTimeFormat>()

/** One Intl formatter per locale and shape, made the first time it is needed. */
function fmt(name: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${locale()}:${name}`
  let f = formatters.get(key)
  if (!f) {
    f = new Intl.DateTimeFormat(locale(), options)
    formatters.set(key, f)
  }
  return f
}

export const fmtDateLong = (ts: number) => fmt('long', { weekday: 'long', day: 'numeric', month: 'long' }).format(ts)
export const fmtDateShort = (ts: number) => fmt('short', { day: 'numeric', month: 'short' }).format(ts).replace(/\.$/, '')
export const fmtMonth = (ts: number) => fmt('month', { month: 'long', year: 'numeric' }).format(ts)
export const fmtTime = (ts: number) => fmt('time', { hour: '2-digit', minute: '2-digit' }).format(ts)

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
  if (diff <= 0) return t('i dag')
  if (diff === 1) return t('i går')
  if (diff < 7) return t('{n} dage siden', { n: diff })
  return fmtDateShort(ts)
}

/** Capitalize the first letter, for labels that start a line. */
export const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s)

/** Weight with one decimal and the language's decimal mark: 106,2 or 106.2 */
export const fmtKg = (kg: number) => (Math.round(kg * 10) / 10).toFixed(1).replace('.', getLang() === 'da' ? ',' : '.')

/** Parse "106,2" or "106.2" into a number, or null when it is not a weight. */
export function parseKg(text: string): number | null {
  const n = Number(text.trim().replace(',', '.'))
  if (!Number.isFinite(n) || n < 20 || n > 300) return null
  return Math.round(n * 10) / 10
}

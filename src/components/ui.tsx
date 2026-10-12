import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { back } from '../lib/router'

const svg = (d: string) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
)

export const Icon = {
  back: svg('M15 18l-6-6 6-6'),
  forward: svg('M9 6l6 6-6 6'),
  up: svg('M12 19V5M5 12l7-7 7 7'),
  down: svg('M12 5v14M19 12l-7 7-7-7'),
  plus: svg('M12 5v14M5 12h14'),
  minus: svg('M5 12h14'),
  menu: svg('M4 7h16M4 12h16M4 17h16'),
  check: svg('M20 6L9 17l-5-5'),
  close: svg('M18 6L6 18M6 6l12 12'),
}

type Variant = 'primary' | 'secondary' | 'ghost'

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={`btn btn-${variant} ${className}`} {...props} />
}

export function IconButton({
  label,
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button className={`icon-btn ${className}`} aria-label={label} title={label} {...props}>
      {children}
    </button>
  )
}

export function BackButton({ onClick }: { onClick?: () => void }) {
  return (
    <IconButton label="Tilbage" onClick={onClick ?? (() => back())}>
      {Icon.back}
    </IconButton>
  )
}

export function TopBar({ left, right }: { left?: ReactNode; right?: ReactNode }) {
  return (
    <header className="topbar">
      <div>{left}</div>
      <div>{right}</div>
    </header>
  )
}

export function Stepper({
  value,
  onChange,
  min,
  max,
  step = 1,
  format = String,
}: {
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step?: number
  format?: (v: number) => string
}) {
  return (
    <div className="stepper">
      <IconButton label="Mindre" disabled={value <= min} onClick={() => onChange(Math.max(min, value - step))}>
        {Icon.minus}
      </IconButton>
      <span className="stepper-value">{format(value)}</span>
      <IconButton label="Mere" disabled={value >= max} onClick={() => onChange(Math.min(max, value + step))}>
        {Icon.plus}
      </IconButton>
    </div>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  hint?: string
}) {
  return (
    <div className="field">
      <div>
        <p className="field-label">{label}</p>
        {hint && <p className="field-hint">{hint}</p>}
      </div>
      <button role="switch" aria-checked={checked} aria-label={label} className="toggle" onClick={() => onChange(!checked)} />
    </div>
  )
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="segmented" role="radiogroup">
      {options.map((o) => (
        <button key={o.value} role="radio" aria-checked={o.value === value} className={o.value === value ? 'active' : ''} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Sheet({ title, text, children }: { title: string; text?: string; children: ReactNode }) {
  return (
    <div className="sheet-backdrop" role="dialog" aria-modal="true" aria-label={title}>
      <div className="sheet">
        <h2>{title}</h2>
        {text && <p>{text}</p>}
        {children}
      </div>
    </div>
  )
}

export function Stat({ value, label, unit }: { value: ReactNode; label: string; unit?: string }) {
  return (
    <div className="stat">
      <span className="stat-num">
        {value}
        {unit && <small>{unit}</small>}
      </span>
      <span className="stat-label">{label}</span>
    </div>
  )
}

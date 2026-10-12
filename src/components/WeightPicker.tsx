import { useState } from 'react'
import { fmtKg, parseKg } from '../lib/format'
import { Icon, IconButton } from './ui'

/** Big editable weight with 0,1 kg steps. Typing is allowed too (comma or dot). */
export function WeightPicker({ value, onChange }: { value: number; onChange: (kg: number) => void }) {
  const [text, setText] = useState(fmtKg(value))
  const [editing, setEditing] = useState(false)

  const step = (delta: number) => {
    const next = Math.min(300, Math.max(20, Math.round((value + delta) * 10) / 10))
    onChange(next)
    setText(fmtKg(next))
  }

  const commitText = () => {
    const parsed = parseKg(text)
    if (parsed != null) onChange(parsed)
    setText(fmtKg(parsed ?? value))
    setEditing(false)
  }

  return (
    <div className="weight-picker">
      <IconButton label="0,1 kg mindre" onClick={() => step(-0.1)}>
        {Icon.minus}
      </IconButton>
      <label className="weight-field">
        <input
          className="weight-input"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          aria-label="Vægt i kilo"
          value={editing ? text : fmtKg(value)}
          onFocus={(e) => {
            setEditing(true)
            setText(fmtKg(value))
            e.target.select()
          }}
          onChange={(e) => setText(e.target.value)}
          onBlur={commitText}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
          }}
          size={5}
        />
        <span className="weight-unit">kg</span>
      </label>
      <IconButton label="0,1 kg mere" onClick={() => step(0.1)}>
        {Icon.plus}
      </IconButton>
    </div>
  )
}

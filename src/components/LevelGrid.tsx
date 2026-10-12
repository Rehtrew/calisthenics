import { levels } from '../data/programs'

/** All levels at a glance; the chosen one is filled. */
export function LevelGrid({ value, onChange }: { value: number; onChange: (levelIndex: number) => void }) {
  return (
    <div className="level-grid" role="radiogroup" aria-label="Level">
      {levels.map((level, i) => (
        <button key={level.index} role="radio" aria-checked={i === value} className={`level-cell ${i === value ? 'active' : ''}`} onClick={() => onChange(i)}>
          {level.index}
        </button>
      ))}
    </div>
  )
}

import { bodies, type BodyView } from './data'
import type { Muscle } from '../../lib/muscles'

/** One illustration with the exercise's muscles lit up. Sized by height; width follows the drawing. */
export function BodyFigure({
  view,
  primary,
  secondary = [],
  height = 220,
  className = '',
}: {
  view: BodyView
  primary: Muscle[]
  secondary?: Muscle[]
  height?: number
  className?: string
}) {
  const body = bodies[view]
  const width = Math.round((height * body.width) / body.height)
  return (
    <svg className={`body ${className}`} viewBox={body.viewBox} width={width} height={height} aria-hidden="true">
      {body.paths.map((p, i) => {
        let cls = `body-${p.kind}`
        if (p.kind === 'muscle' && p.muscle) {
          if (primary.includes(p.muscle)) cls = 'body-primary'
          else if (secondary.includes(p.muscle)) cls = 'body-secondary'
        }
        return <path key={i} d={p.d} className={cls} />
      })}
    </svg>
  )
}

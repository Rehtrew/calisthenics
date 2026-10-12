import { labelList, musclesFor, viewsFor } from '../lib/muscles'
import { BodyFigure } from './body/BodyFigure'
import { Button, Sheet } from './ui'

const VIEW_LABEL = { front: 'Forfra', side: 'Fra siden', back: 'Bagfra' } as const

/** Which muscles an exercise trains, drawn on the body from the angle(s) that show them. */
export function ExerciseSheet({ name, detail, onClose }: { name: string; detail?: string; onClose: () => void }) {
  const map = musclesFor(name)
  const views = viewsFor(map)
  return (
    <Sheet title={name} text={detail}>
      <div className="figures">
        {views.map((v) => (
          <figure key={v} className="figure">
            <BodyFigure view={v} primary={map.primary} secondary={map.secondary} height={240} />
            <figcaption className="muted small">{VIEW_LABEL[v]}</figcaption>
          </figure>
        ))}
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
      <Button variant="secondary" onClick={onClose}>
        Luk
      </Button>
    </Sheet>
  )
}

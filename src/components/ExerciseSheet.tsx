import { figureView, labelList, musclesFor, viewsFor } from '../lib/muscles'
import { BodyFigure } from './body/BodyFigure'
import { Button, Sheet } from './ui'

const VIEW_LABEL = { front: 'Forfra', side: 'Fra siden', back: 'Bagfra', frontTorso: 'Forfra', backTorso: 'Bagfra' } as const

/** Which muscles an exercise trains, drawn on the body from the angle(s) that show them. */
export function ExerciseSheet({ name, detail, onClose }: { name: string; detail?: string; onClose: () => void }) {
  const map = musclesFor(name)
  const views = viewsFor(map)
  return (
    <Sheet title={name} text={detail}>
      <div className="figures">
        {views.map((v) => {
          const fv = figureView(v, map)
          return (
            <figure key={v} className="figure">
              <BodyFigure view={fv} primary={map.primary} secondary={map.secondary} height={views.length > 1 ? 230 : 280} />
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
      <Button variant="secondary" onClick={onClose}>
        Luk
      </Button>
    </Sheet>
  )
}

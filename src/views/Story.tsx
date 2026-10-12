import { useEffect, useState } from 'react'
import { logWeight, useAppState } from '../lib/store'
import { navigate } from '../lib/router'
import { buildSlides } from '../lib/summary'
import { weightLog } from '../lib/stats'
import { fmtKg, relativeDay } from '../lib/format'
import { Button, Icon, IconButton } from '../components/ui'
import { WeightPicker } from '../components/WeightPicker'

export function Story({ sessionId }: { sessionId: string }) {
  const s = useAppState()
  const session = s.sessions.find((x) => x.id === sessionId)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (!session) navigate({ name: 'home' }, { replace: true })
  }, [session])

  const slides = session ? buildSlides(session, s.sessions, s.settings.weightKg) : []
  const total = slides.length + 1
  const weightStep = index === slides.length
  const last = index >= total - 1
  const lastLogged = weightLog(s.sessions.filter((x) => x.id !== sessionId)).at(-1)
  const [weight, setWeight] = useState<number>(session?.weightKg ?? lastLogged?.kg ?? s.settings.weightKg)

  const close = () => navigate({ name: 'session', sessionId }, { replace: true })
  const next = () => (last ? close() : setIndex((i) => i + 1))
  const prev = () => setIndex((i) => Math.max(0, i - 1))
  const saveWeight = () => {
    logWeight(sessionId, weight)
    close()
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (weightStep && (e.target as HTMLElement | null)?.tagName === 'INPUT') return
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') next()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!session) return null
  const slide = slides[Math.min(index, slides.length - 1)]

  return (
    <div className="story" role="dialog" aria-label="Opsummering">
      <div className="story-bars" aria-hidden="true">
        {Array.from({ length: total }, (_, k) => (
          <span key={k} className={k <= index ? 'on' : ''} />
        ))}
      </div>
      <header className="story-head">
        <span className="eyebrow">
          {session.status === 'completed' ? 'Træning færdig' : 'Træning afbrudt'} · {relativeDay(session.endedAt)}
        </span>
        <IconButton label="Luk" onClick={close}>
          {Icon.close}
        </IconButton>
      </header>

      {weightStep ? (
        <>
          <div className="story-main">
            <div className="story-copy" key="weight">
              <p className="eyebrow">Vægt efter træning</p>
              <p className="story-text">Hvad viste vægten i dag?</p>
              <p className="story-sub">
                {lastLogged ? `Sidst loggede du ${fmtKg(lastLogged.kg)} kg · ${relativeDay(lastLogged.at)}.` : 'Første gang du logger din vægt.'} Du kan
                altid rette den under træningen i historikken.
              </p>
            </div>
            <WeightPicker value={weight} onChange={setWeight} />
          </div>
          <div className="screen-actions">
            <Button onClick={saveWeight}>Gem {fmtKg(weight)} kg</Button>
            <Button variant="ghost" onClick={close}>
              Spring over
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="story-main">
            <div className="story-number" key={index}>
              {slide.value}
              <span className="story-unit">{slide.unit}</span>
            </div>
            <div className="story-copy" key={`copy-${index}`}>
              <p className="story-text">{slide.text}</p>
              {slide.sub && <p className={`story-sub ${slide.positive ? 'positive' : ''}`}>{slide.sub}</p>}
            </div>
            <button className="story-zone left" onClick={prev} aria-label="Forrige" />
            <button className="story-zone right" onClick={next} aria-label="Næste" />
          </div>

          <div className="story-foot">
            <span className="muted small">
              {index + 1} af {total} · tryk for at gå videre
            </span>
            <Button variant="secondary" className="btn-compact" onClick={close}>
              Spring over
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

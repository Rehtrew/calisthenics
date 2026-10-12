import { useEffect, useState } from 'react'
import { useAppState } from '../lib/store'
import { navigate } from '../lib/router'
import { buildSlides } from '../lib/summary'
import { relativeDay } from '../lib/format'
import { Button, Icon, IconButton } from '../components/ui'

export function Story({ sessionId }: { sessionId: string }) {
  const s = useAppState()
  const session = s.sessions.find((x) => x.id === sessionId)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (!session) navigate({ name: 'home' }, { replace: true })
  }, [session])

  const slides = session ? buildSlides(session, s.sessions, s.settings.weightKg) : []
  const last = index >= slides.length - 1

  const close = () => navigate({ name: 'session', sessionId }, { replace: true })
  const next = () => (last ? close() : setIndex((i) => i + 1))
  const prev = () => setIndex((i) => Math.max(0, i - 1))

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') next()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!session) return null
  const slide = slides[index]

  return (
    <div className="story" role="dialog" aria-label="Opsummering">
      <div className="story-bars" aria-hidden="true">
        {slides.map((_, k) => (
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
          {index + 1} af {slides.length} · tryk for at gå videre
        </span>
        <Button variant="secondary" className="btn-compact" onClick={close}>
          {last ? 'Se øvelserne' : 'Spring over'}
        </Button>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { logWeight, useAppState } from '../lib/store'
import { navigate } from '../lib/router'
import { buildSlides } from '../lib/summary'
import { weightLog } from '../lib/stats'
import { fmtKg, relativeDay } from '../lib/format'
import { Button, Icon, IconButton } from '../components/ui'
import { WeightPicker } from '../components/WeightPicker'
import { t } from '../lib/i18n'

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
    <div className="story" role="dialog" aria-label={t('Opsummering')}>
      <div className="story-bars" aria-hidden="true">
        {Array.from({ length: total }, (_, k) => (
          <span key={k} className={k <= index ? 'on' : ''} />
        ))}
      </div>
      <header className="story-head">
        <span className="eyebrow">
          {session.status === 'completed' ? t('Træning færdig') : t('Træning afbrudt')} · {relativeDay(session.endedAt)}
        </span>
        <IconButton label={t('Luk')} onClick={close}>
          {Icon.close}
        </IconButton>
      </header>

      {weightStep ? (
        <>
          <div className="story-main">
            <div className="story-copy" key="weight">
              <p className="eyebrow">{t('Vægt efter træning')}</p>
              <p className="story-text">{t('Hvad viste vægten i dag?')}</p>
              <p className="story-sub">
                {lastLogged ? t('Sidst loggede du {kg} kg · {when}.', { kg: fmtKg(lastLogged.kg), when: relativeDay(lastLogged.at) }) : t('Første gang du logger din vægt.')}{' '}
                {t('Du kan altid rette den under træningen i historikken.')}
              </p>
            </div>
            <WeightPicker value={weight} onChange={setWeight} />
          </div>
          <div className="screen-actions">
            <Button onClick={saveWeight}>{t('Gem {kg} kg', { kg: fmtKg(weight) })}</Button>
            <Button variant="ghost" onClick={close}>
              {t('Spring over')}
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
            <button className="story-zone left" onClick={prev} aria-label={t('Forrige')} />
            <button className="story-zone right" onClick={next} aria-label={t('Næste')} />
          </div>

          <div className="story-foot">
            <span className="muted small">
              {t('{i} af {n} · tryk for at gå videre', { i: index + 1, n: total })}
            </span>
            <Button variant="secondary" className="btn-compact" onClick={close}>
              {t('Spring over')}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

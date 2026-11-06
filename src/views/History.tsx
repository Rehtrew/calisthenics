import { useAppState } from '../lib/store'
import { byEnded } from '../lib/stats'
import { cap, fmtMonth } from '../lib/format'
import { BackButton, TopBar } from '../components/ui'
import { SessionRow } from '../components/SessionRow'
import { t } from '../lib/i18n'

export function History() {
  const s = useAppState()
  const sorted = [...s.sessions].sort(byEnded).reverse()
  const groups: { key: string; label: string; items: typeof sorted }[] = []
  for (const sess of sorted) {
    const d = new Date(sess.endedAt)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    let g = groups.find((x) => x.key === key)
    if (!g) {
      g = { key, label: cap(fmtMonth(sess.endedAt)), items: [] }
      groups.push(g)
    }
    g.items.push(sess)
  }

  return (
    <div className="page">
      <TopBar left={<BackButton />} />
      <section className="hero">
        <p className="eyebrow">{t('Historik')}</p>
        <h1 className="display">{s.sessions.length}</h1>
        <p className="muted">{t('Træninger i alt')}</p>
      </section>
      {groups.map((g) => (
        <section key={g.key}>
          <p className="eyebrow month-head">
            {g.label} · {g.items.length}
          </p>
          {g.items.map((sess, i) => (
            <SessionRow key={sess.id} session={sess} index={i} />
          ))}
        </section>
      ))}
    </div>
  )
}

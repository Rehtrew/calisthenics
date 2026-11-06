import { useRef, useState } from 'react'
import { replaceState, resetAll, updateSettings, useAppState } from '../lib/store'
import { navigate } from '../lib/router'
import { getLevel } from '../data/programs'
import { LevelGrid } from '../components/LevelGrid'
import { dayKey, fmtTime } from '../lib/format'
import { getSyncSecret, setSyncSecret, syncNow, useSyncStatus } from '../lib/sync'
import { BackButton, Button, Segmented, Sheet, Stepper, TopBar } from '../components/ui'
import { t } from '../lib/i18n'

export function Settings() {
  const s = useAppState()
  const [confirm, setConfirm] = useState<'reset' | 'import' | null>(null)
  const [pending, setPending] = useState<unknown>(null)
  const [message, setMessage] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const level = getLevel(s.settings.levelIndex)
  const sync = useSyncStatus()
  const [secretInput, setSecretInput] = useState(getSyncSecret())
  const syncOn = getSyncSecret() !== ''

  const exportData = () => {
    const blob = new Blob([JSON.stringify(s, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cali-backup-${dayKey(Date.now())}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const onFile = async (file: File | undefined) => {
    if (!file) return
    try {
      const parsed: unknown = JSON.parse(await file.text())
      const ok = parsed && typeof parsed === 'object' && Array.isArray((parsed as { sessions?: unknown }).sessions)
      if (!ok) throw new Error('bad file')
      setPending(parsed)
      setConfirm('import')
    } catch {
      setMessage(t('Filen kunne ikke læses som en backup.'))
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="page">
      <TopBar left={<BackButton />} />
      <section className="hero">
        <p className="eyebrow">Cali</p>
        <h1 className="title">{t('Indstillinger')}</h1>
      </section>

      <section className="section">
        <div className="row-head">
          <p className="eyebrow">Level</p>
          <span className="eyebrow">
            {level.name} · {t('{n} træningsdage', { n: level.days.length })}
          </span>
        </div>
        <LevelGrid value={s.settings.levelIndex} onChange={(levelIndex) => updateSettings({ levelIndex })} />
      </section>

      <section className="card">
        <div className="field">
          <div>
            <p className="field-label">{t('Navn')}</p>
            <p className="field-hint">{t('Til hilsenen på forsiden')}</p>
          </div>
          <input
            className="input input-inline"
            type="text"
            autoComplete="given-name"
            aria-label={t('Navn')}
            placeholder={t('Dit navn')}
            value={s.settings.name}
            onChange={(e) => updateSettings({ name: e.target.value })}
          />
        </div>
        <div className="field">
          <div>
            <p className="field-label">{t('Vægt')}</p>
            <p className="field-hint">{t('Bruges til kalorier og løftet vægt')}</p>
          </div>
          <Stepper value={s.settings.weightKg} min={40} max={200} onChange={(weightKg) => updateSettings({ weightKg })} format={(v) => `${v} kg`} />
        </div>
        <div className="field">
          <div>
            <p className="field-label">{t('Tema')}</p>
          </div>
          <Segmented
            value={s.settings.theme}
            options={[
              { value: 'dark', label: t('Mørk') },
              { value: 'light', label: t('Lys') },
            ]}
            onChange={(theme) => updateSettings({ theme })}
          />
        </div>
        <div className="field">
          <div>
            <p className="field-label">{t('Sprog')}</p>
          </div>
          <Segmented
            value={s.settings.lang}
            options={[
              { value: 'da', label: 'Dansk' },
              { value: 'en', label: 'English' },
            ]}
            onChange={(lang) => updateSettings({ lang })}
          />
        </div>
      </section>

      <button className="row" onClick={() => navigate({ name: 'program' })}>
        <span className="row-main">
          <span className="row-title">{t('Se hele programmet')}</span>
          <span className="row-sub">{t('Alle 16 levels med dage og øvelser')}</span>
        </span>
        <span className="row-value muted">→</span>
      </button>
      <button className="row" onClick={() => navigate({ name: 'weight' })} style={{ marginBottom: 28 }}>
        <span className="row-main">
          <span className="row-title">{t('Vægtkurve')}</span>
          <span className="row-sub">{t('Dine loggede vægte over tid')}</span>
        </span>
        <span className="row-value muted">→</span>
      </button>

      <section className="section">
        <p className="eyebrow">{t('Synkronisering')}</p>
        <p className="muted small" style={{ margin: '6px 0 16px' }}>
          {t('Hold telefon og computer i sync via serveren. Skriv den sync-kode, du har sat som APP_SECRET på Vercel. Appen virker stadig uden net og synkroniserer, når den er online igen.')}
        </p>
        <form
          className="secret-form"
          onSubmit={(e) => {
            e.preventDefault()
            setSyncSecret(secretInput)
          }}
        >
          <input
            className="input"
            type="password"
            autoComplete="off"
            placeholder={t('Sync-kode')}
            aria-label={t('Sync-kode')}
            value={secretInput}
            onChange={(e) => setSecretInput(e.target.value)}
          />
          <Button type="submit" variant="secondary" className="btn-compact" disabled={secretInput.trim() === getSyncSecret()}>
            {t('Gem')}
          </Button>
        </form>
        <p className={`small sync-status ${sync.state === 'error' ? 'accent' : 'muted'}`} aria-live="polite">
          {sync.state === 'idle' && sync.lastSyncedAt ? t('Synkroniseret kl. {time}', { time: fmtTime(sync.lastSyncedAt) }) : sync.message}
        </p>
        {syncOn && (
          <div className="screen-actions">
            <Button variant="secondary" onClick={() => void syncNow()} disabled={sync.state === 'syncing'}>
              {t('Synkronisér nu')}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setSyncSecret('')
                setSecretInput('')
              }}
            >
              {t('Slå synkronisering fra på denne enhed')}
            </Button>
          </div>
        )}
      </section>

      <section className="section">
        <p className="eyebrow">Data</p>
        <p className="muted small" style={{ margin: '6px 0 16px' }}>
          {t('Alt gemmes lokalt i denne browser og, når synkronisering er slået til, også på serveren. Eksportér en fil, hvis du vil have en kopi selv.')}
        </p>
        <div className="screen-actions">
          <Button variant="secondary" onClick={exportData}>
            {t('Eksportér backup')}
          </Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>
            {t('Importér backup')}
          </Button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => void onFile(e.target.files?.[0])} />
          <Button variant="ghost" onClick={() => setConfirm('reset')}>
            {t('Slet alle data')}
          </Button>
        </div>
        {message && <p className="muted small center" style={{ marginTop: 12 }}>{message}</p>}
      </section>

      <p className="muted small">
        {t('{n} træninger gemt · Programmet er Caliathletics, 16 levels', { n: s.sessions.length })}
      </p>

      {confirm === 'reset' && (
        <Sheet
          title={t('Slet alle data?')}
          text={t('Historik, statistik og indstillinger nulstilles{server}. Det kan ikke fortrydes.', { server: syncOn ? t(', også på serveren') : '' })}
        >
          <Button
            onClick={() => {
              resetAll()
              setConfirm(null)
              navigate({ name: 'home' }, { replace: true })
            }}
          >
            {t('Ja, slet alt')}
          </Button>
          <Button variant="secondary" onClick={() => setConfirm(null)}>
            {t('Behold')}
          </Button>
        </Sheet>
      )}

      {confirm === 'import' && (
        <Sheet
          title={t('Importér backup?')}
          text={t('Backuppen indeholder {n} træninger og erstatter det, der er gemt nu.', { n: (pending as { sessions: unknown[] }).sessions.length })}
        >
          <Button
            onClick={() => {
              replaceState(pending)
              setPending(null)
              setConfirm(null)
              setMessage(t('Backup importeret.'))
            }}
          >
            {t('Ja, importér')}
          </Button>
          <Button variant="secondary" onClick={() => setConfirm(null)}>
            {t('Annuller')}
          </Button>
        </Sheet>
      )}
    </div>
  )
}

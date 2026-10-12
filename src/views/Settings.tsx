import { useRef, useState } from 'react'
import { replaceState, resetAll, updateSettings, useAppState } from '../lib/store'
import { navigate } from '../lib/router'
import { programs } from '../data/programs'
import { dayKey, fmtTime } from '../lib/format'
import { getSyncSecret, setSyncSecret, syncNow, useSyncStatus } from '../lib/sync'
import type { ProgramId } from '../lib/types'
import { BackButton, Button, Segmented, Sheet, Stepper, TopBar } from '../components/ui'

export function Settings() {
  const s = useAppState()
  const [confirm, setConfirm] = useState<'reset' | 'import' | null>(null)
  const [pending, setPending] = useState<unknown>(null)
  const [message, setMessage] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const program = programs.find((p) => p.id === s.settings.programId) ?? programs[0]
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
      setMessage('Filen kunne ikke læses som en backup.')
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="page">
      <TopBar left={<BackButton />} />
      <section className="hero">
        <p className="eyebrow">Indstillinger</p>
        <h1 className="title">Program og level</h1>
      </section>

      <section className="card">
        <div className="field">
          <div>
            <p className="field-label">Program</p>
          </div>
          <Segmented
            value={s.settings.programId}
            options={programs.map((p) => ({ value: p.id as ProgramId, label: p.name }))}
            onChange={(programId) => updateSettings({ programId, levelIndex: 0 })}
          />
        </div>
        <div className="field">
          <div>
            <p className="field-label">Level</p>
            <p className="field-hint">{program.levels[s.settings.levelIndex]?.days.length ?? 0} træningsdage</p>
          </div>
          <Stepper
            value={s.settings.levelIndex + 1}
            min={1}
            max={program.levels.length}
            onChange={(v) => updateSettings({ levelIndex: v - 1 })}
          />
        </div>
        <div className="field">
          <div>
            <p className="field-label">Vægt</p>
            <p className="field-hint">Bruges til kalorier og løftet vægt</p>
          </div>
          <Stepper value={s.settings.weightKg} min={40} max={200} onChange={(weightKg) => updateSettings({ weightKg })} format={(v) => `${v} kg`} />
        </div>
        <div className="field">
          <div>
            <p className="field-label">Tema</p>
          </div>
          <Segmented
            value={s.settings.theme}
            options={[
              { value: 'dark', label: 'Mørk' },
              { value: 'light', label: 'Lys' },
            ]}
            onChange={(theme) => updateSettings({ theme })}
          />
        </div>
      </section>

      <section className="section">
        <p className="eyebrow">Synkronisering</p>
        <p className="muted small" style={{ margin: '6px 0 16px' }}>
          Hold telefon og computer i sync via serveren. Skriv den sync-kode, du har sat som APP_SECRET på Vercel. Appen virker
          stadig uden net og synkroniserer, når den er online igen.
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
            placeholder="Sync-kode"
            aria-label="Sync-kode"
            value={secretInput}
            onChange={(e) => setSecretInput(e.target.value)}
          />
          <Button type="submit" variant="secondary" className="btn-compact" disabled={secretInput.trim() === getSyncSecret()}>
            Gem
          </Button>
        </form>
        <p className={`small sync-status ${sync.state === 'error' ? 'accent' : 'muted'}`} aria-live="polite">
          {sync.state === 'idle' && sync.lastSyncedAt ? `Synkroniseret kl. ${fmtTime(sync.lastSyncedAt)}` : sync.message}
        </p>
        {syncOn && (
          <div className="screen-actions">
            <Button variant="secondary" onClick={() => void syncNow()} disabled={sync.state === 'syncing'}>
              Synkronisér nu
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setSyncSecret('')
                setSecretInput('')
              }}
            >
              Slå synkronisering fra på denne enhed
            </Button>
          </div>
        )}
      </section>

      <section className="section">
        <p className="eyebrow">Data</p>
        <p className="muted small" style={{ margin: '6px 0 16px' }}>
          Alt gemmes lokalt i denne browser og, når synkronisering er slået til, også på serveren. Eksportér en fil, hvis du vil
          have en kopi selv.
        </p>
        <div className="screen-actions">
          <Button variant="secondary" onClick={exportData}>
            Eksportér backup
          </Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>
            Importér backup
          </Button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => void onFile(e.target.files?.[0])} />
          <Button variant="ghost" onClick={() => setConfirm('reset')}>
            Slet alle data
          </Button>
        </div>
        {message && <p className="muted small center" style={{ marginTop: 12 }}>{message}</p>}
      </section>

      <p className="muted small">
        {s.sessions.length} træninger gemt · Programmet er Caliathletics Beginner og Intermediate
      </p>

      {confirm === 'reset' && (
        <Sheet
          title="Slet alle data?"
          text={`Historik, statistik og indstillinger nulstilles${syncOn ? ', også på serveren' : ''}. Det kan ikke fortrydes.`}
        >
          <Button
            onClick={() => {
              resetAll()
              setConfirm(null)
              navigate({ name: 'home' }, { replace: true })
            }}
          >
            Ja, slet alt
          </Button>
          <Button variant="secondary" onClick={() => setConfirm(null)}>
            Behold
          </Button>
        </Sheet>
      )}

      {confirm === 'import' && (
        <Sheet
          title="Importér backup?"
          text={`Backuppen indeholder ${(pending as { sessions: unknown[] }).sessions.length} træninger og erstatter det, der er gemt nu.`}
        >
          <Button
            onClick={() => {
              replaceState(pending)
              setPending(null)
              setConfirm(null)
              setMessage('Backup importeret.')
            }}
          >
            Ja, importér
          </Button>
          <Button variant="secondary" onClick={() => setConfirm(null)}>
            Annuller
          </Button>
        </Sheet>
      )}
    </div>
  )
}

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { abortWorkout, discardWorkout, extendRest, finishRest, logSet, undoLastSet, useAppState } from '../lib/store'
import { navigate } from '../lib/router'
import { parseReps, unitLabel } from '../lib/reps'
import { lastSetResult, sessionsForDay } from '../lib/stats'
import { fmtClock, fmtDuration } from '../lib/format'
import { beep, buzz, primeAudio, useNow, useWakeLock, useWindowHeight } from '../lib/device'
import type { ActiveWorkout, SetLog, SetTarget } from '../lib/types'
import { Button, Icon, IconButton, Sheet } from '../components/ui'
import { figureView, labelList, musclesFor, viewsFor, MUSCLE_LABEL } from '../lib/muscles'
import { BodyFigure } from '../components/body/BodyFigure'
import { ExerciseSheet } from '../components/ExerciseSheet'

export function Workout() {
  const s = useAppState()
  const a = s.active
  useEffect(() => {
    if (!a) navigate({ name: 'home' }, { replace: true })
  }, [a])
  useWakeLock(!!a)
  const now = useNow(1000)
  const [abort, setAbort] = useState(false)
  const [showMuscles, setShowMuscles] = useState(false)
  if (!a) return null

  const ex = a.exercises[a.exerciseIndex]
  const totalSets = a.exercises.reduce((n, e) => n + e.sets, 0)
  const doneSets = a.exercises.reduce((n, e) => n + e.logs.length, 0)
  const nextEx = a.exercises[a.exerciseIndex + 1]
  const lastSetOfExercise = a.setIndex + 1 >= ex.sets
  // During rest the upcoming set is the current position; during a set it is the one after.
  const upNext: UpNext =
    a.phase === 'rest'
      ? { name: ex.name, detail: `sæt ${a.setIndex + 1} af ${ex.sets}` }
      : !lastSetOfExercise
        ? { name: ex.name, detail: `sæt ${a.setIndex + 2} af ${ex.sets}` }
        : nextEx
          ? { name: nextEx.name, detail: `${nextEx.sets} × ${nextEx.reps.toLowerCase()}` }
          : { name: 'Sidste sæt', detail: 'så er du færdig' }

  const previous = sessionsForDay(s.sessions, a.levelIndex, a.dayId).at(-1)
  const lastTime = lastSetResult(previous, ex.name, a.setIndex)

  const done = (sessionId: string | null) => {
    if (sessionId) navigate({ name: 'summary', sessionId }, { replace: true })
  }

  const onAbort = () => {
    if (doneSets === 0) {
      discardWorkout()
      navigate({ name: 'home' }, { replace: true })
      return
    }
    done(abortWorkout())
  }

  return (
    <div className="screen">
      <header className="topbar workout-bar">
        <div className="workout-bar-left">
          <IconButton
            label={doneSets === 0 ? 'Afbryd træningen' : 'Tilbage til forrige sæt'}
            className="plain back-set"
            onClick={() => (doneSets === 0 ? setAbort(true) : undoLastSet())}
          >
            {Icon.back}
          </IconButton>
          <div>
            <span className="eyebrow">
              Øvelse {a.exerciseIndex + 1} af {a.exercises.length}
            </span>
            <div className="elapsed" aria-label="Tid i gang">
              {fmtDuration(now - a.startedAt)}
            </div>
          </div>
        </div>
        <button className="link eyebrow" onClick={() => setAbort(true)}>
          Afbryd
        </button>
      </header>
      <div className="progress" aria-label={`${doneSets} af ${totalSets} sæt`}>
        <span style={{ width: `${(100 * doneSets) / totalSets}%` }} />
      </div>

      {a.phase === 'rest' ? (
        <RestPanel key={a.restEndsAt ?? 0} active={a} upNext={upNext} />
      ) : (
        <SetPanel
          key={`${a.exerciseIndex}-${a.setIndex}`}
          active={a}
          target={parseReps(ex.reps, a.setIndex)}
          lastTime={lastTime}
          onLog={(achieved, full) => done(logSet(achieved, full))}
          onShowMuscles={() => setShowMuscles(true)}
        />
      )}

      {showMuscles && <ExerciseSheet name={ex.name} detail={`${ex.sets} × ${ex.reps.toLowerCase()}`} onClose={() => setShowMuscles(false)} />}

      {abort && (
        <Sheet
          title="Afbryd træningen?"
          text={doneSets === 0 ? 'Du har ikke logget noget endnu, så intet bliver gemt.' : `De ${doneSets} sæt du har lavet bliver gemt som en afbrudt træning.`}
        >
          <Button onClick={onAbort}>Ja, afbryd</Button>
          <Button variant="secondary" onClick={() => setAbort(false)}>
            Fortsæt træningen
          </Button>
        </Sheet>
      )}
    </div>
  )
}

interface UpNext {
  name: string
  detail: string
}

function SetPanel({
  active: a,
  target,
  lastTime,
  onLog,
  onShowMuscles,
}: {
  active: ActiveWorkout
  target: SetTarget
  lastTime: SetLog | undefined
  onLog: (achieved: number | null, full: boolean) => void
  onShowMuscles: () => void
}) {
  const ex = a.exercises[a.exerciseIndex]
  const muscles = musclesFor(ex.name)
  const view = figureView(viewsFor(muscles)[0], muscles)
  const [mode, setMode] = useState<'ask' | 'count'>(target.isMax ? 'count' : 'ask')
  const [count, setCount] = useState(() => {
    if (target.isMax) return lastTime?.achieved ?? 0
    return Math.max(0, (target.value ?? 1) - 1)
  })
  const windowHeight = useWindowHeight()
  const figureHeight = view.endsWith('Torso') ? Math.min(280, Math.round(windowHeight * 0.34)) : Math.min(300, Math.round(windowHeight * 0.38))

  return (
    <>
      <div className="screen-main">
        <p className="eyebrow rise" style={{ '--i': 0 } as CSSProperties}>
          Sæt {a.setIndex + 1} af {ex.sets}
        </p>
        <button className="exercise-title-btn rise" style={{ '--i': 1 } as CSSProperties} onClick={onShowMuscles} aria-label={`${ex.name}, vis muskler`}>
          <h1 className="exercise-title">{ex.name}</h1>
        </button>

        {mode === 'ask' ? (
          <div className="target-row">
            <div>
              <div className="target rise" style={{ '--i': 2 } as CSSProperties}>
                {target.value}
              </div>
              <p className="target-unit rise" style={{ '--i': 3 } as CSSProperties}>
                {unitLabel(target.unit)}
                {target.hint ? ` · ${target.hint}` : ''}
              </p>
            </div>
            <button className="figure-btn rise" style={{ '--i': 3 } as CSSProperties} onClick={onShowMuscles} aria-label="Vis muskelgrupper">
              <BodyFigure view={view} primary={muscles.primary} secondary={muscles.secondary} height={figureHeight} />
            </button>
          </div>
        ) : (
          <>
            <p className="eyebrow">{target.isMax ? 'Max – hvor mange nåede du?' : `Hvor mange nåede du af ${target.value}?`}</p>
            <div className="big-stepper">
              <IconButton label="Færre" disabled={count <= 0} onClick={() => setCount((c) => Math.max(0, c - 1))}>
                {Icon.minus}
              </IconButton>
              <span className="value">{count}</span>
              <IconButton label="Flere" onClick={() => setCount((c) => c + 1)}>
                {Icon.plus}
              </IconButton>
            </div>
            <p className="target-unit center">{unitLabel(target.unit)}</p>
          </>
        )}
        <ul className="tags rise" style={{ '--i': 4 } as CSSProperties} aria-label={`Muskler: ${labelList(muscles.primary)}`}>
          {muscles.primary.map((m) => (
            <li key={m} className="tag">
              {MUSCLE_LABEL[m]}
            </li>
          ))}
          {muscles.secondary.map((m) => (
            <li key={m} className="tag secondary">
              {MUSCLE_LABEL[m]}
            </li>
          ))}
        </ul>
      </div>

      <div className="screen-actions">
        {mode === 'ask' ? (
          <>
            <Button
              onClick={() => {
                primeAudio()
                onLog(null, true)
              }}
            >
              Nåede alle {target.value} {unitLabel(target.unit)}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                primeAudio()
                setMode('count')
              }}
            >
              Færre
            </Button>
          </>
        ) : (
          <>
            <Button
              onClick={() => {
                primeAudio()
                onLog(count, target.isMax)
              }}
            >
              Log {count} {unitLabel(target.unit)}
            </Button>
            {!target.isMax && (
              <Button variant="ghost" onClick={() => setMode('ask')}>
                Annuller
              </Button>
            )}
          </>
        )}
      </div>
    </>
  )
}

function RestPanel({ active: a, upNext }: { active: ActiveWorkout; upNext: UpNext }) {
  const now = useNow(200)
  const remainingMs = Math.max(0, (a.restEndsAt ?? 0) - now)
  const fired = useRef(false)

  useEffect(() => {
    if (remainingMs > 0 || fired.current) return
    fired.current = true
    beep()
    buzz()
    finishRest()
  }, [remainingMs])

  const total = a.restSeconds * 1000

  return (
    <>
      <div className="screen-main">
        <p className="eyebrow rise" style={{ '--i': 0 } as CSSProperties}>
          Pause
        </p>
        <div className="target rest-clock rise" style={{ '--i': 1 } as CSSProperties}>
          {fmtClock(Math.ceil(remainingMs / 1000))}
        </div>
        <div className="progress rest-progress">
          <span style={{ width: `${Math.min(100, (100 * remainingMs) / total)}%` }} />
        </div>
        <p className="next">
          Næste: <strong>{upNext.name}</strong> · {upNext.detail}
        </p>
      </div>
      <div className="screen-actions">
        <div className="actions-row">
          <Button variant="secondary" onClick={() => extendRest(30)}>
            +30 sek
          </Button>
          <Button onClick={finishRest}>Spring over</Button>
        </div>
      </div>
    </>
  )
}

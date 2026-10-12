export interface Exercise {
  name: string
  /** raw reps string from the program, e.g. "10", "15s", "6 each side", "Max", "10,10,15", "5+10" */
  reps: string
  sets: number
  kind?: 'skills'
}

export interface ProgramDay {
  id: string
  label: string
  focus?: string
  exercises: Exercise[]
}

export interface Level {
  index: number
  name: string
  days: ProgramDay[]
}

export type Unit = 'reps' | 's' | 'min'

export interface SetTarget {
  /** numeric target for this set, null when the program says "max" */
  value: number | null
  unit: Unit
  /** raw label for this set, lowercased */
  label: string
  /** extra hint when the label carries more than the number, e.g. "pr. side" */
  hint: string | null
  isMax: boolean
}

export interface SetLog {
  target: number | null
  achieved: number | null
  full: boolean
  unit: Unit
}

export interface ExerciseLog {
  name: string
  reps: string
  sets: number
  logs: SetLog[]
}

export type SessionStatus = 'completed' | 'aborted'

export interface Session {
  id: string
  /** 0-based index into the 16 levels */
  levelIndex: number
  dayId: string
  dayLabel: string
  startedAt: number
  endedAt: number
  status: SessionStatus
  restSeconds: number
  skipLegs: boolean
  exercises: ExerciseLog[]
  /** body weight logged after this workout, one decimal */
  weightKg?: number
}

export interface ActiveWorkout {
  levelIndex: number
  dayId: string
  dayLabel: string
  startedAt: number
  restSeconds: number
  skipLegs: boolean
  exercises: ExerciseLog[]
  exerciseIndex: number
  setIndex: number
  phase: 'set' | 'rest'
  restEndsAt: number | null
}

export interface Settings {
  levelIndex: number
  restSeconds: number
  skipLegs: boolean
  theme: 'dark' | 'light'
  /** body weight used for calorie and load estimates */
  weightKg: number
}

export interface AppState {
  version: 1
  settings: Settings
  sessions: Session[]
  active: ActiveWorkout | null
  /** ms timestamp of the last local change, used to pick a winner when syncing */
  updatedAt: number
  /** ids of deleted sessions, kept so a sync from another device does not bring them back */
  deleted: string[]
}

import { viewMuscles, type BodyView } from '../components/body/data'

export type Muscle =
  | 'chest'
  | 'shoulders'
  | 'traps'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'abs'
  | 'obliques'
  | 'serratus'
  | 'lats'
  | 'upper_back'
  | 'lower_back'
  | 'glutes'
  | 'quads'
  | 'hamstrings'
  | 'calves'

/** Everyday names, not anatomy class. */
export const MUSCLE_LABEL: Record<Muscle, string> = {
  chest: 'Bryst',
  shoulders: 'Skuldre',
  traps: 'Nakke',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Underarme',
  abs: 'Mave',
  obliques: 'Sidemave',
  serratus: 'Ribben',
  lats: 'Ryg',
  upper_back: 'Øvre ryg',
  lower_back: 'Lænd',
  glutes: 'Baller',
  quads: 'Forlår',
  hamstrings: 'Baglår',
  calves: 'Lægge',
}

export interface MuscleMap {
  primary: Muscle[]
  secondary: Muscle[]
}

type Rule = [pattern: RegExp, primary: Muscle[], secondary: Muscle[]]

/**
 * First matching rule wins, so specific variants come before the generic ones.
 * Names are matched lowercased.
 */
const RULES: Rule[] = [
  // skills blocks
  [/skills progressions/, ['shoulders', 'abs'], ['lats', 'triceps', 'forearms']],

  // handstand family
  [/handstand push up/, ['shoulders', 'triceps'], ['traps', 'upper_back', 'abs']],
  [/handstand|wall walk|kickout|frog ?stand/, ['shoulders', 'traps'], ['abs', 'triceps', 'forearms']],

  // planche family
  [/planche lean|planche hold|tuck hold|planche push up|straddle planche|elbow lever/, ['shoulders', 'serratus'], ['abs', 'triceps', 'chest']],
  [/pseudo/, ['shoulders', 'chest'], ['triceps', 'serratus', 'abs']],
  [/scapula/, ['serratus'], ['chest', 'shoulders']],

  // push ups
  [/pike/, ['shoulders', 'triceps'], ['upper_back', 'serratus']],
  [/diamond/, ['triceps', 'chest'], ['shoulders']],
  [/decline/, ['chest', 'shoulders'], ['triceps', 'serratus']],
  [/hindu/, ['chest', 'shoulders', 'triceps'], ['abs', 'hamstrings']],
  [/superman push up|back clap|clap push up|jump push up|explosive push up/, ['chest', 'triceps'], ['shoulders', 'abs']],
  [/push up/, ['chest', 'triceps'], ['shoulders', 'serratus', 'abs']],

  // dips
  [/bench dip/, ['triceps'], ['chest', 'shoulders']],
  [/impossible/, ['triceps', 'chest'], ['shoulders', 'forearms']],
  [/dip/, ['triceps', 'chest'], ['shoulders']],
  [/triceps extension/, ['triceps'], ['abs']],

  // bar pulls
  [/muscle up/, ['lats', 'chest', 'triceps'], ['biceps', 'shoulders', 'abs']],
  [/izometric|izometrics/, ['biceps', 'lats'], ['forearms']],
  [/icecream/, ['lats', 'abs'], ['upper_back', 'biceps']],
  [/front lever/, ['lats', 'abs'], ['upper_back', 'biceps', 'forearms']],
  [/back ?lever/, ['lats', 'chest'], ['lower_back', 'biceps']],
  [/german hang/, ['lats', 'chest'], ['shoulders']],
  [/skin the cat/, ['lats', 'abs'], ['shoulders', 'biceps']],
  [/victorian/, ['lats', 'chest'], ['abs']],
  [/hefesto/, ['biceps'], ['lats', 'forearms']],
  [/biceps curl/, ['biceps'], ['forearms']],
  [/archery walk/, ['lats', 'forearms'], ['biceps']],
  [/australian/, ['upper_back', 'lats'], ['biceps', 'forearms']],
  [/chin up/, ['biceps', 'lats'], ['upper_back', 'forearms']],
  [/pull up|typewriter/, ['lats', 'biceps'], ['upper_back', 'forearms', 'shoulders']],

  // posterior chain
  [/inverted deadlift/, ['lower_back', 'hamstrings'], ['glutes', 'lats']],
  [/lowerback extension|superman/, ['lower_back', 'glutes'], ['upper_back']],
  [/hiptrust/, ['glutes'], ['hamstrings', 'lower_back']],

  // core
  [/windshield|clock|side knee|side plank/, ['obliques', 'abs'], ['shoulders']],
  [/dragon/, ['abs', 'obliques'], ['lats', 'lower_back']],
  [/leg raise|knee raise|flutter|l-hang|l-sit/, ['abs'], ['quads', 'forearms']],
  [/hollow/, ['abs'], ['quads']],
  [/plank/, ['abs'], ['shoulders', 'glutes']],
  [/mountain climber/, ['abs', 'shoulders'], ['quads']],
  [/bear crawl/, ['shoulders', 'abs'], ['quads', 'triceps']],

  // legs
  [/squat/, ['quads', 'glutes'], ['hamstrings', 'calves']],
  [/lunge/, ['quads', 'glutes'], ['hamstrings']],
  [/calf raise/, ['calves'], []],
]

const cache = new Map<string, MuscleMap>()

export function musclesFor(name: string): MuscleMap {
  const key = name.toLowerCase()
  const hit = cache.get(key)
  if (hit) return hit
  const rule = RULES.find(([re]) => re.test(key))
  const map: MuscleMap = rule ? { primary: rule[1], secondary: rule[2] } : { primary: [], secondary: [] }
  cache.set(key, map)
  return map
}

/**
 * Muscles a view shows clearly enough to pick it for. The front also draws a
 * sliver of lats and the back a sliver of obliques; they still light up but
 * do not decide which view is chosen.
 */
const FRONT_STRONG = new Set<Muscle>(['chest', 'shoulders', 'traps', 'biceps', 'triceps', 'forearms', 'abs', 'obliques', 'serratus', 'quads', 'calves'])
const BACK_STRONG = new Set<Muscle>(['lats', 'upper_back', 'lower_back', 'traps', 'shoulders', 'triceps', 'forearms', 'glutes', 'hamstrings', 'calves'])

const STRONG: Record<BodyView, Set<Muscle>> = {
  front: FRONT_STRONG,
  back: BACK_STRONG,
  side: viewMuscles.side,
  frontTorso: FRONT_STRONG,
  backTorso: BACK_STRONG,
}

const LEGS = new Set<Muscle>(['quads', 'glutes', 'hamstrings', 'calves'])

/** Upper-body work is drawn on the cropped torso so the muscles are larger. */
export function figureView(view: BodyView, map: MuscleMap): BodyView {
  const legs = [...map.primary, ...map.secondary].some((m) => LEGS.has(m))
  if (legs) return view
  if (view === 'front') return 'frontTorso'
  if (view === 'back') return 'backTorso'
  return view
}

function viewScore(v: BodyView, map: MuscleMap): number {
  const strong = STRONG[v]
  let score = 0
  map.primary.forEach((m, i) => {
    if (strong.has(m)) score += i === 0 ? 3 : 2
  })
  map.secondary.forEach((m) => {
    if (strong.has(m)) score += 1
  })
  return score
}

/**
 * Pick the illustration(s) that show what the exercise trains. Leg work that
 * hits both the front and the back of the leg gets the profile, which shows
 * the whole chain at once. Everything else starts with the better of front and
 * back, plus the other one only when it shows a primary muscle the first cannot.
 */
export function viewsFor(map: MuscleMap): BodyView[] {
  if (map.primary.length >= 2 && map.primary.every((m) => LEGS.has(m))) return ['side']
  const [first, other]: BodyView[] = viewScore('back', map) > viewScore('front', map) ? ['back', 'front'] : ['front', 'back']
  const best = viewScore(first, map)
  if (best === 0) return ['front']
  const uncovered = map.primary.filter((m) => !STRONG[first].has(m))
  const addOther = uncovered.some((m) => STRONG[other].has(m)) && viewScore(other, map) >= best * 0.5
  return addOther ? [first, other] : [first]
}

export const labelList = (muscles: Muscle[]) => muscles.map((m) => MUSCLE_LABEL[m]).join(', ')

import { useSyncExternalStore } from 'react'

export type Lang = 'da' | 'en'

/**
 * The app is written in Danish; English is a dictionary keyed by the Danish
 * source strings, so a missing entry falls back to Danish instead of a key.
 */
let lang: Lang = 'da'
const listeners = new Set<() => void>()

export const getLang = () => lang

export function setLang(next: Lang) {
  if (next === lang) return
  lang = next
  listeners.forEach((l) => l())
}

export function useLang(): Lang {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => {
        listeners.delete(l)
      }
    },
    getLang,
    getLang,
  )
}

/** Danish for Danish browsers, English for everyone else; only used for a fresh install. */
export function detectLang(): Lang {
  if (typeof navigator === 'undefined') return 'da'
  const tags = [...(navigator.languages ?? []), navigator.language]
  return tags.some((x) => x?.toLowerCase().startsWith('da')) ? 'da' : 'en'
}

export const locale = () => (lang === 'da' ? 'da-DK' : 'en-GB')

/** 80.7 → "80,7" in Danish and "80.7" in English, with a fixed number of digits. */
export const decimal = (n: number, digits = 1) =>
  String(Math.round(n * 10 ** digits) / 10 ** digits).replace('.', lang === 'da' ? ',' : '.')

export function t(key: string, vars?: Record<string, string | number>): string {
  let s = lang === 'en' ? (EN[key] ?? key) : key
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v))
  return s
}

/** Pick the singular or plural key by count and fill in {n}. */
export const plural = (n: number, one: string, many: string) => t(n === 1 ? one : many, { n })

/** Program day labels come from the data as "Dag N". */
export const dayName = (label: string) => (lang === 'en' ? label.replace(/^Dag /, 'Day ') : label)

const EN: Record<string, string> = {
  // Home
  'God træning{name}!': 'Have a good workout{name}!',
  Indstillinger: 'Settings',
  'Træning i gang · {day}': 'Workout in progress · {day}',
  'Fortsæt →': 'Continue →',
  '{level} af {count}, se hele programmet': '{level} of {count}, see the whole program',
  '{n} øvelser · ca. {min} min': '{n} exercises · about {min} min',
  'Se øvelser →': 'See exercises →',
  'Start {day}': 'Start {day}',
  'Senest trænet:': 'Last trained:',
  ' · afbrudt': ' · aborted',
  'Vægt:': 'Weight:',
  '{delta} kg siden sidst': '{delta} kg since last time',
  'Træninger i alt': 'Workouts in total',
  'Denne måned': 'This month',
  'Af programmet nået, seneste 5 træninger': 'Of the program reached, last 5 workouts',
  'Gennemført på {level}': 'Completed at {level}',
  Seneste: 'Recent',
  'Se alle': 'See all',
  'Ingen træninger endnu. Start med {day}.': 'No workouts yet. Start with {day}.',
  'Synkronisering er ikke slået til': 'Sync is not turned on',
  'Synkroniseret kl. {time}': 'Synced at {time}',
  'Synkronisering: {msg}': 'Sync: {msg}',
  // Day chips and calendar
  'Ikke trænet': 'Not trained',
  Gennemført: 'Completed',
  Foreslået: 'Suggested',
  'Vælg dag': 'Choose a day',
  'Forrige måned': 'Previous month',
  'Næste måned': 'Next month',
  'Din streak': 'Your streak',
  uge: 'week',
  uger: 'weeks',
  'Træninger i streaken': 'Workouts in the streak',
  Træningskalender: 'Training calendar',
  'M,T,O,T,F,L,S': 'M,T,W,T,F,S,S',
  '{n} træning': '{n} workout',
  '{n} træninger': '{n} workouts',
  // Setup and day preview
  Opsætning: 'Setup',
  '{n} øvelser · {sets} sæt · ca. {min} min': '{n} exercises · {sets} sets · about {min} min',
  ' · Sidst {when}': ' · Last {when}',
  'Spring ben over': 'Skip legs',
  'Squats, lunges, hiptrusts og calf raises': 'Squats, lunges, hip thrusts and calf raises',
  'Pause mellem sæt': 'Rest between sets',
  'Min : sek': 'Min : sec',
  Rækkefølge: 'Order',
  Nulstil: 'Reset',
  ' · Springes over': ' · Skipped',
  'Flyt op': 'Move up',
  'Flyt ned': 'Move down',
  'Start træning': 'Start workout',
  'Den igangværende træning ({day}) gemmes som afbrudt': 'The workout in progress ({day}) is saved as aborted',
  'Dit nuværende level': 'Your current level',
  ' · {n} benøvelse': ' · {n} leg exercise',
  ' · {n} benøvelser': ' · {n} leg exercises',
  Øvelser: 'Exercises',
  'Skift til {level} og start': 'Switch to {level} and start',
  // Program overview
  Programmet: 'The program',
  'Alle {n} levels': 'All {n} levels',
  'Vælg dit level her, eller tryk på en dag for at se øvelserne. Du kan også starte en dag fra et andet level.':
    'Choose your level here, or tap a day to see its exercises. You can also start a day from another level.',
  ' · Nuværende': ' · Current',
  '{n} dage': '{n} days',
  ' · {n} gennemført': ' · {n} completed',
  '{n} øvelser': '{n} exercises',
  // Workout
  'sæt {i} af {n}': 'set {i} of {n}',
  'Sidste sæt': 'Last set',
  'så er du færdig': 'then you are done',
  'Afbryd træningen': 'Abort the workout',
  'Tilbage til forrige sæt': 'Back to the previous set',
  'Øvelse {i} af {n}': 'Exercise {i} of {n}',
  'Tid i gang': 'Time elapsed',
  Afbryd: 'Abort',
  '{done} af {total} sæt': '{done} of {total} sets',
  'Afbryd træningen?': 'Abort the workout?',
  'Du har ikke logget noget endnu, så intet bliver gemt.': 'You have not logged anything yet, so nothing will be saved.',
  'De {n} sæt du har lavet bliver gemt som en afbrudt træning.': 'The {n} sets you did will be saved as an aborted workout.',
  'Ja, afbryd': 'Yes, abort',
  'Fortsæt træningen': 'Continue the workout',
  'Sæt {i} af {n}': 'Set {i} of {n}',
  '{name}, vis muskler': '{name}, show muscles',
  'Vis muskelgrupper': 'Show muscle groups',
  'Max – hvor mange nåede du?': 'Max. How many did you get?',
  'Hvor mange nåede du af {n}?': 'How many of {n} did you get?',
  Færre: 'Fewer',
  Flere: 'More',
  'Sidste gang:': 'Last time:',
  'Muskler: {list}': 'Muscles: {list}',
  'Nåede alle {n} {unit}': 'Got all {n} {unit}',
  'Log {n} {unit}': 'Log {n} {unit}',
  Annuller: 'Cancel',
  Pause: 'Rest',
  'Start sæt {i} af {n}': 'Start set {i} of {n}',
  'Start næste øvelse': 'Start the next exercise',
  'Næste: {name} · {detail}': 'Next: {name} · {detail}',
  '+30 sekunders pause': '+30 seconds of rest',
  Næste: 'Next',
  sek: 'sec',
  // Summary story
  Opsummering: 'Summary',
  Luk: 'Close',
  'Træning færdig': 'Workout done',
  'Træning afbrudt': 'Workout aborted',
  'Vægt efter træning': 'Weight after the workout',
  'Hvad viste vægten i dag?': 'What did the scale say today?',
  'Sidst loggede du {kg} kg · {when}.': 'Last time you logged {kg} kg · {when}.',
  'Første gang du logger din vægt.': 'The first time you log your weight.',
  'Du kan altid rette den under træningen i historikken.': 'You can always change it on the workout in the history.',
  'Gem {kg} kg': 'Save {kg} kg',
  'Spring over': 'Skip',
  Forrige: 'Previous',
  '{i} af {n} · tryk for at gå videre': '{i} of {n} · tap to continue',
  'Du gennemførte {done} af {planned} sæt på {day}.': 'You completed {done} of {planned} sets on {day}.',
  'Du afbrød efter {done} af {planned} sæt på {day}.': 'You stopped after {done} of {planned} sets on {day}.',
  '{dr} reps og {dp} point i forhold til sidst.': '{dr} reps and {dp} points compared with last time.',
  'Første gang på denne dag.': 'First time on this day.',
  'Du forbrændte cirka {kcal} kalorier og var i gang i {dur}.': 'You burned roughly {kcal} calories and were at it for {dur}.',
  'Det svarer til {fact}. Regnet ud fra {kg} kg.': 'That is about {fact}. Based on {kg} kg.',
  'Du flyttede cirka {v} {unit} med {reps} reps.': 'You moved roughly {v} {unit} with {reps} reps.',
  'Det er {x} gange din egen kropsvægt.': 'That is {x} times your own body weight.',
  '{work} i arbejde og {rest} pause.': '{work} of work and {rest} of rest.',
  '{n} minut': '{n} minute',
  '{n} minutter': '{n} minutes',
  'Cirka {n} sekunders pause pr. sæt.': 'Roughly {n} seconds of rest per set.',
  'Første uge i en ny streak. {n} indtil videre.': 'First week of a new streak. {n} so far.',
  'Din streak er nu {w} uger med {n} træninger.': 'Your streak is now {w} weeks with {n} workouts.',
  'Stabilt. Bliv ved.': 'Steady. Keep going.',
  'Godt på vej. En træning om ugen holder den i live.': 'Well on the way. One workout a week keeps it alive.',
  'En træning om ugen holder streaken i live.': 'One workout a week keeps the streak alive.',
  '{n} bananer': '{n} bananas',
  'en gåtur på {n} km': 'a {n} km walk',
  '{n} pilsnere': '{n} beers',
  '{n} stykker chokolade': '{n} pieces of chocolate',
  '{n} minutter på cykel': '{n} minutes on a bike',
  '{n} cheeseburgere': '{n} cheeseburgers',
  '{h} t {m} min': '{h} h {m} min',
  ton: 'tonnes',
  // Session detail
  'Første gang på denne dag': 'First time on this day',
  '{dp} point og {dr} reps i forhold til sidst': '{dp} points and {dr} reps compared with last time',
  Slet: 'Delete',
  'Af programmet · {day} · Level {n}': 'Of the program · {day} · Level {n}',
  Varighed: 'Duration',
  Sæt: 'Sets',
  'Reps i alt': 'Reps in total',
  'Cirka, ved {kg} kg': 'Roughly, at {kg} kg',
  '{delta} kg siden {prev} kg': '{delta} kg since {prev} kg',
  'Første loggede vægt': 'First logged weight',
  'Ikke logget · tryk for at logge': 'Not logged · tap to log',
  'Til forsiden': 'To the home screen',
  'Ret vægt': 'Edit weight',
  'Log vægt': 'Log weight',
  'Vægt efter {day} · {date}': 'Weight after {day} · {date}',
  'Fjern vægten': 'Remove the weight',
  'Slet træningen?': 'Delete the workout?',
  'Den forsvinder fra historikken og statistikken.': 'It disappears from the history and the statistics.',
  'Ja, slet': 'Yes, delete',
  Behold: 'Keep',
  '{done}/{n} sæt': '{done}/{n} sets',
  'Mål: {n}': 'Target: {n}',
  ' · Afbrudt': ' · Aborted',
  // History and weight
  Historik: 'History',
  Vægt: 'Weight',
  '{delta} kg fra {from} til {to}': '{delta} kg from {from} to {to}',
  'Én måling i perioden · {date}': 'One measurement in the period · {date}',
  'Ingen målinger i perioden · seneste {date}': 'No measurements in the period · latest {date}',
  'Log din vægt efter en træning, så tegnes kurven her.': 'Log your weight after a workout and the curve is drawn here.',
  'Tidligere periode': 'Earlier period',
  'Senere periode': 'Later period',
  Målinger: 'Measurements',
  'Vægt over tid': 'Weight over time',
  'Ingen målinger i perioden': 'No measurements in the period',
  'Tryk på kurven for at se en måling': 'Tap the curve to see a measurement',
  '2 u': '2 w',
  '1 år': '1 y',
  '0,1 kg mindre': '0.1 kg less',
  '0,1 kg mere': '0.1 kg more',
  'Vægt i kilo': 'Weight in kilos',
  // Exercise sheet
  Forfra: 'Front',
  'Fra siden': 'Side',
  Bagfra: 'Back',
  Primært: 'Primary',
  Sekundært: 'Secondary',
  Udvikling: 'Progress',
  'Bedste {n} {unit} · {date}': 'Best {n} {unit} · {date}',
  // Settings
  'Filen kunne ikke læses som en backup.': 'The file could not be read as a backup.',
  '{n} træningsdage': '{n} training days',
  Navn: 'Name',
  'Til hilsenen på forsiden': 'For the greeting on the home screen',
  'Dit navn': 'Your name',
  'Bruges til kalorier og løftet vægt': 'Used for calories and weight moved',
  Tema: 'Theme',
  Mørk: 'Dark',
  Lys: 'Light',
  Sprog: 'Language',
  'Se hele programmet': 'See the whole program',
  'Alle 16 levels med dage og øvelser': 'All 16 levels with days and exercises',
  Vægtkurve: 'Weight curve',
  'Dine loggede vægte over tid': 'Your logged weights over time',
  Synkronisering: 'Sync',
  'Hold telefon og computer i sync via serveren. Skriv den sync-kode, du har sat som APP_SECRET på Vercel. Appen virker stadig uden net og synkroniserer, når den er online igen.':
    'Keep your phone and computer in sync through the server. Enter the sync code you set as APP_SECRET on Vercel. The app still works offline and syncs when it is online again.',
  'Sync-kode': 'Sync code',
  Gem: 'Save',
  'Synkronisér nu': 'Sync now',
  'Slå synkronisering fra på denne enhed': 'Turn off sync on this device',
  'Alt gemmes lokalt i denne browser og, når synkronisering er slået til, også på serveren. Eksportér en fil, hvis du vil have en kopi selv.':
    'Everything is stored locally in this browser and, when sync is on, on the server too. Export a file if you want your own copy.',
  'Eksportér backup': 'Export backup',
  'Importér backup': 'Import backup',
  'Slet alle data': 'Delete all data',
  '{n} træninger gemt · Programmet er Caliathletics, 16 levels': '{n} workouts saved · The program is Caliathletics, 16 levels',
  'Slet alle data?': 'Delete all data?',
  'Historik, statistik og indstillinger nulstilles{server}. Det kan ikke fortrydes.': 'History, statistics and settings are reset{server}. This cannot be undone.',
  ', også på serveren': ', on the server too',
  'Ja, slet alt': 'Yes, delete everything',
  'Importér backup?': 'Import backup?',
  'Backuppen indeholder {n} træninger og erstatter det, der er gemt nu.': 'The backup holds {n} workouts and replaces what is saved now.',
  'Backup importeret.': 'Backup imported.',
  'Ja, importér': 'Yes, import',
  // Sync status
  'Ikke synkroniseret endnu': 'Not synced yet',
  'Ikke slået til': 'Not turned on',
  'Offline, gemmer lokalt indtil videre': 'Offline, saving locally for now',
  'Synkroniserer…': 'Syncing…',
  'Forkert sync-kode': 'Wrong sync code',
  'Serveren mangler opsætning (database eller APP_SECRET)': 'The server is missing its setup (database or APP_SECRET)',
  'Serverfejl {n}': 'Server error {n}',
  'Kunne ikke gemme ({n})': 'Could not save ({n})',
  Synkroniseret: 'Synced',
  'Kunne ikke nå serveren': 'Could not reach the server',
  // Shared
  Tilbage: 'Back',
  Mindre: 'Less',
  Mere: 'More',
  'i dag': 'today',
  'i går': 'yesterday',
  '{n} dage siden': '{n} days ago',
}

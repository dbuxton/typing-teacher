/**
 * The save file shape, versioned from day one so a future change to the data
 * model doesn't wipe a kid's garden. Bump `SAVE_VERSION`, add a case to
 * `migrate`, and old saves keep working.
 */

export const SAVE_VERSION = 1
export const STORAGE_KEY = 'typing-teacher.save.v1'

/** How much help the on-screen keyboard is giving. Fades as the kid improves. */
export type AssistLevel = 'full' | 'letters-off' | 'on-miss' | 'off'

export const ASSIST_ORDER: AssistLevel[] = ['full', 'letters-off', 'on-miss', 'off']

/** A word in the spelling review queue. Leitner box 0 = brand new / just wrong. */
export type SpellingProgress = {
  word: string
  box: number
  /** Lesson number at which this word next becomes due. */
  dueAt: number
  timesCorrect: number
  timesWrong: number
}

export type Plant = {
  kindId: string
  /** Growth stages accumulated; advanced once per completed lesson. */
  stage: number
}

export type LessonResult = {
  levelId: number
  /** 0..1 */
  accuracy: number
  wpm: number
  stars: number
  coinsEarned: number
  sneakyStarsCaught: number
  sneakyStarsTotal: number
  spellingCorrect: number
  spellingTotal: number
  assistLevel: AssistLevel
  /** ISO date (yyyy-mm-dd) the lesson was completed. */
  date: string
}

export type Profile = {
  id: string
  name: string
  avatar: string
  locale: 'en-GB' | 'en-US'
  createdAt: string

  currentLevel: number
  highestLevelUnlocked: number
  assistLevel: AssistLevel
  /** Sneaky Stars can be switched off if they turn out to annoy this kid. */
  sneakyStars: boolean

  coins: number
  streak: number
  /** ISO date of the last day a lesson was completed. */
  lastPlayedDate: string | null
  badges: string[]
  garden: Plant[]

  lessonsCompleted: number
  totalWordsTyped: number
  totalCharsTyped: number
  spellingWordsCorrect: number
  /** Per-key error counts, used to weight future practice toward weak keys. */
  keyErrors: Record<string, number>
  spelling: SpellingProgress[]
  /** Most recent lessons, newest last. Capped to keep the save small. */
  history: LessonResult[]
}

export type SaveFile = {
  version: number
  profiles: Profile[]
  activeProfileId: string | null
}

export const HISTORY_LIMIT = 60

export function makeProfile(name: string, avatar: string): Profile {
  return {
    id: `p_${name.toLowerCase().replace(/[^a-z0-9]/g, '')}_${randomSuffix()}`,
    name,
    avatar,
    locale: 'en-GB',
    createdAt: today(),

    currentLevel: 1,
    highestLevelUnlocked: 1,
    assistLevel: 'full',
    sneakyStars: true,

    coins: 0,
    streak: 0,
    lastPlayedDate: null,
    badges: [],
    garden: [],

    lessonsCompleted: 0,
    totalWordsTyped: 0,
    totalCharsTyped: 0,
    spellingWordsCorrect: 0,
    keyErrors: {},
    spelling: [],
    history: [],
  }
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 8)
}

/** Local date as yyyy-mm-dd. Local, not UTC — "today" means the kid's today. */
export function today(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Whole days between two yyyy-mm-dd strings. */
export function daysBetween(from: string, to: string): number {
  const a = new Date(`${from}T00:00:00`)
  const b = new Date(`${to}T00:00:00`)
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

/**
 * Migrate an unknown persisted blob up to the current version. Unknown or
 * corrupt saves fall back to an empty save rather than throwing — a kid should
 * never see a white screen because of a bad localStorage entry.
 */
export function migrate(persisted: unknown, version: number): SaveFile {
  const empty: SaveFile = { version: SAVE_VERSION, profiles: [], activeProfileId: null }
  if (!persisted || typeof persisted !== 'object') return empty

  const save = persisted as Partial<SaveFile>
  if (!Array.isArray(save.profiles)) return empty

  // v0 -> v1: no shipped versions before 1, so nothing to do yet. Future
  // migrations chain here, each one bumping `working.version`.
  const working: SaveFile = {
    version: SAVE_VERSION,
    profiles: save.profiles.map(fillProfileDefaults),
    activeProfileId: save.activeProfileId ?? null,
  }
  if (version > SAVE_VERSION) return empty // save from a newer build: start fresh
  return working
}

/** Defensive: fill in any field a hand-edited or older save is missing. */
function fillProfileDefaults(p: Partial<Profile>): Profile {
  const base = makeProfile(p.name ?? 'Player', p.avatar ?? '🦊')
  return {
    ...base,
    ...p,
    id: p.id ?? base.id,
    keyErrors: p.keyErrors ?? {},
    spelling: p.spelling ?? [],
    badges: p.badges ?? [],
    garden: p.garden ?? [],
    history: p.history ?? [],
  }
}

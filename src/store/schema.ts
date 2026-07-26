/**
 * The save file shape, versioned from day one so a future change to the data
 * model doesn't wipe a kid's garden. Bump `SAVE_VERSION`, add a case to
 * `migrate`, and old saves keep working.
 */

export const SAVE_VERSION = 2
// The storage key is deliberately NOT versioned alongside SAVE_VERSION — the key
// is where the save lives, the version is what shape it's in. Changing the key
// would orphan every existing save instead of migrating it.
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

/**
 * Attempts *and* errors per key. The denominator matters: counting errors alone
 * makes common letters look like weak keys simply because they come up more
 * often, which had practice targeting `e` and `a` instead of the keys the kid
 * actually struggles with.
 */
export type KeyStat = { attempts: number; errors: number }

/** Rolling per-level ability, used to decide when to move up or ease back. */
export type LevelStat = {
  lessons: number
  /** Exponential moving average of overall accuracy at this level. */
  accuracyEma: number
  /**
   * Accuracy on the keys this level introduces, which is what actually gates
   * progression — filler words from earlier levels must not carry a kid upward.
   */
  newKeyAccuracy: number
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
  /** Spelling Stars are spoken aloud so the kid spells from sound, not sight. */
  readAloud: boolean

  /**
   * 0..1 ability signal driving lesson composition — length, word difficulty,
   * how many Spelling Stars. Moves as an EMA of recent accuracy so one bad
   * lesson doesn't tank it and one lucky lesson doesn't spike it.
   */
  difficulty: number
  /**
   * The kid's own speed target, in wpm. Speed is scored against this rather
   * than an absolute, so "three stars" stays reachable at any age and always
   * means "better than you were".
   */
  personalWpm: number

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
  /** Attempts and errors per key, used to weight practice toward weak keys. */
  perKeyStats: Record<string, KeyStat>
  /** Per-level ability, keyed by level id. */
  levelStats: Record<number, LevelStat>
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

/** Where a brand-new kid starts: middle of the range, so it can move either way. */
export const STARTING_DIFFICULTY = 0.5
/** A gentle opening speed target. Rises with the kid, never with the calendar. */
export const STARTING_WPM = 8

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
    readAloud: true,
    difficulty: STARTING_DIFFICULTY,
    personalWpm: STARTING_WPM,

    coins: 0,
    streak: 0,
    lastPlayedDate: null,
    badges: [],
    garden: [],

    lessonsCompleted: 0,
    totalWordsTyped: 0,
    totalCharsTyped: 0,
    spellingWordsCorrect: 0,
    perKeyStats: {},
    levelStats: {},
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
  if (version > SAVE_VERSION) return empty // save from a newer build: start fresh

  const save = persisted as Partial<SaveFile>
  if (!Array.isArray(save.profiles)) return empty

  return {
    version: SAVE_VERSION,
    profiles: save.profiles.map((p) => fillProfileDefaults(migrateProfile(p, version))),
    activeProfileId: save.activeProfileId ?? null,
  }
}

/** A v1 profile, as it was shaped before the adaptive signals existed. */
type V1Profile = Partial<Profile> & { keyErrors?: Record<string, number> }

/**
 * Chain of per-profile migrations. Each step takes the shape from one version to
 * the next, so a save from any older build climbs to current.
 */
function migrateProfile(profile: Partial<Profile>, version: number): Partial<Profile> {
  let working = profile
  if (version < 2) working = v1ToV2(working as V1Profile)
  return working
}

/**
 * Roughly how often each letter turns up in English text. Used only to estimate
 * denominators for a v1 save — see `v1ToV2`.
 */
const LETTER_FREQUENCY: Record<string, number> = {
  e: 0.127, t: 0.091, a: 0.082, o: 0.075, i: 0.07, n: 0.067, s: 0.063, h: 0.061,
  r: 0.06, d: 0.043, l: 0.04, c: 0.028, u: 0.028, m: 0.024, w: 0.024, f: 0.022,
  g: 0.02, y: 0.02, p: 0.019, b: 0.015, v: 0.0098, k: 0.0077, j: 0.0015,
  x: 0.0015, q: 0.00095, z: 0.00074,
}

/**
 * v1 -> v2: the adaptive signals arrive.
 *
 * v1 recorded `keyErrors` — errors with no denominator, which is exactly the
 * flaw v2 fixes. Those counts are still worth keeping, but turning them into a
 * *rate* needs an attempts estimate, and the estimate has to account for letter
 * frequency: 20 errors on `e` across thousands of appearances is a kid doing
 * fine, while 9 errors on `z` is a kid who cannot find the key. Spreading
 * attempts evenly would flatten that distinction and preserve v1's bias into v2.
 *
 * It's an estimate, and it's replaced by real counts within a lesson or two of
 * play — but it starts them off pointing the right way.
 */
function v1ToV2(profile: V1Profile): Partial<Profile> {
  const { keyErrors, ...rest } = profile
  const errorKeys = Object.keys(keyErrors ?? {})
  const totalChars = profile.totalCharsTyped ?? 0

  const perKeyStats: Record<string, KeyStat> = {}
  for (const key of errorKeys) {
    const errors = keyErrors![key]
    const expectedShare = LETTER_FREQUENCY[key] ?? 0.01
    const attempts = Math.max(
      Math.round(totalChars * expectedShare),
      // Never fewer attempts than errors — that would imply an error rate above
      // 100% and poison every weighting decision downstream.
      errors,
    )
    perKeyStats[key] = { attempts, errors }
  }

  // Seed per-level ability from whatever history survived the 60-lesson cap.
  const levelStats: Record<number, LevelStat> = {}
  for (const lesson of profile.history ?? []) {
    const existing = levelStats[lesson.levelId]
    levelStats[lesson.levelId] = existing
      ? {
          lessons: existing.lessons + 1,
          accuracyEma: existing.accuracyEma * 0.6 + lesson.accuracy * 0.4,
          newKeyAccuracy: existing.newKeyAccuracy * 0.6 + lesson.accuracy * 0.4,
        }
      : { lessons: 1, accuracyEma: lesson.accuracy, newKeyAccuracy: lesson.accuracy }
  }

  const bestWpm = Math.max(0, ...(profile.history ?? []).map((h) => h.wpm))

  return {
    ...rest,
    perKeyStats,
    levelStats,
    readAloud: true,
    difficulty: STARTING_DIFFICULTY,
    personalWpm: Math.max(STARTING_WPM, Math.round(bestWpm)),
  }
}

/** Defensive: fill in any field a hand-edited or older save is missing. */
function fillProfileDefaults(p: Partial<Profile>): Profile {
  const base = makeProfile(p.name ?? 'Player', p.avatar ?? '🦊')
  return {
    ...base,
    ...p,
    id: p.id ?? base.id,
    perKeyStats: p.perKeyStats ?? {},
    levelStats: p.levelStats ?? {},
    spelling: p.spelling ?? [],
    badges: p.badges ?? [],
    garden: p.garden ?? [],
    history: p.history ?? [],
    difficulty: clamp01(p.difficulty ?? STARTING_DIFFICULTY),
    personalWpm: p.personalWpm ?? STARTING_WPM,
  }
}

export function clamp01(value: number): number {
  if (!Number.isFinite(value)) return STARTING_DIFFICULTY
  return Math.min(Math.max(value, 0), 1)
}

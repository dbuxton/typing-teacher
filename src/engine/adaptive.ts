import { MAX_LEVEL, getLevel } from '../data/curriculum'
import {
  type KeyStat,
  type LevelStat,
  type Profile,
  STARTING_WPM,
  clamp01,
} from '../store/schema'

/**
 * The adaptive model. Every decision about how hard things should be lives here,
 * as pure functions, so the whole progression can be simulated in tests rather
 * than guessed at.
 *
 * Two goals, pulling in opposite directions:
 *
 *   1. A kid should reach their real level FAST. Grinding through six lessons of
 *      "fjf jfj" when you already know the home row is how you lose a child in
 *      the first session.
 *   2. A kid should NEVER be pushed past what they can manage. Advancing on a
 *      lucky lesson just relocates the failure one level up.
 *
 * These are reconciled by gating on accuracy over the keys a level actually
 * *teaches*, not overall accuracy. Overall accuracy is easy to inflate with
 * filler words from levels you already know; new-key accuracy is not.
 */

// --- tunables, all in one place -------------------------------------------

/** How much a new lesson moves a running average. Low = slow, stable, forgiving. */
export const EMA_WEIGHT = 0.4

/** Accuracy on a level's new keys required to move up by 1 / 2 / 3 levels. */
export const JUMP_THRESHOLDS = [
  { newKey: 0.97, overall: 0.95, jump: 3 },
  { newKey: 0.92, overall: 0.9, jump: 2 },
  { newKey: 0.85, overall: 0.85, jump: 1 },
] as const

/** Below this rolling accuracy, offer an easier level. */
export const BACK_OFF_ACCURACY = 0.6
/** ...but only after this many lessons, so one bad day doesn't demote anyone. */
export const BACK_OFF_LESSONS = 2

/** A key needs this many attempts before its error rate is worth acting on. */
export const MIN_ATTEMPTS_FOR_RATE = 5

export const MIN_PERSONAL_WPM = 6
export const MAX_PERSONAL_WPM = 45

// --- running averages ------------------------------------------------------

export function ema(previous: number | undefined, sample: number, weight = EMA_WEIGHT): number {
  if (previous === undefined || !Number.isFinite(previous)) return sample
  return previous * (1 - weight) + sample * weight
}

// --- per-key ability -------------------------------------------------------

/**
 * Error rate for a key, or null when we haven't seen it enough to judge.
 *
 * Returning null rather than 0 matters: an unseen key is *unknown*, not *good*,
 * and callers should treat those differently.
 */
export function keyErrorRate(stat: KeyStat | undefined): number | null {
  if (!stat || stat.attempts < MIN_ATTEMPTS_FOR_RATE) return null
  return stat.errors / stat.attempts
}

/** Keys this kid genuinely struggles with, worst first. */
export function weakKeys(perKeyStats: Record<string, KeyStat>, limit = 8): string[] {
  return Object.entries(perKeyStats)
    .map(([key, stat]) => ({ key, rate: keyErrorRate(stat) }))
    .filter((entry): entry is { key: string; rate: number } => entry.rate !== null && entry.rate > 0)
    .sort((a, b) => b.rate - a.rate)
    .slice(0, limit)
    .map((entry) => entry.key)
}

/** Merge a lesson's attempts and errors into the profile's running per-key stats. */
export function mergeKeyStats(
  existing: Record<string, KeyStat>,
  lessonAttempts: Record<string, number>,
  lessonErrors: Record<string, number>,
): Record<string, KeyStat> {
  const merged: Record<string, KeyStat> = { ...existing }
  const keys = new Set([...Object.keys(lessonAttempts), ...Object.keys(lessonErrors)])
  for (const key of keys) {
    const prior = merged[key] ?? { attempts: 0, errors: 0 }
    merged[key] = {
      attempts: prior.attempts + (lessonAttempts[key] ?? 0),
      errors: prior.errors + (lessonErrors[key] ?? 0),
    }
  }
  return merged
}

// --- how a lesson went -----------------------------------------------------

export type LessonAbility = {
  levelId: number
  /** 0..1 overall accuracy for the lesson. */
  accuracy: number
  /** 0..1 accuracy restricted to the keys this level introduces. */
  newKeyAccuracy: number
  wpm: number
}

/**
 * Accuracy over just the keys a level teaches. Falls back to overall accuracy
 * when the level introduces no new keys (level 12) or when none of them came up.
 */
export function newKeyAccuracyFor(
  levelId: number,
  attempts: Record<string, number>,
  errors: Record<string, number>,
  fallback: number,
): number {
  const { newKeys } = getLevel(levelId)
  const relevant = newKeys.filter((k) => k !== 'Shift')
  if (relevant.length === 0) return fallback

  let total = 0
  let wrong = 0
  for (const key of relevant) {
    total += attempts[key] ?? 0
    wrong += errors[key] ?? 0
  }
  if (total === 0) return fallback
  return Math.max(0, (total - wrong) / total)
}

export function updateLevelStat(existing: LevelStat | undefined, lesson: LessonAbility): LevelStat {
  return {
    lessons: (existing?.lessons ?? 0) + 1,
    accuracyEma: ema(existing?.accuracyEma, lesson.accuracy),
    newKeyAccuracy: ema(existing?.newKeyAccuracy, lesson.newKeyAccuracy),
  }
}

// --- moving up -------------------------------------------------------------

/**
 * How many levels to advance after this lesson. Zero to three.
 *
 * Uses the freshly-updated running average rather than the single lesson, so a
 * kid has to be *consistently* good to accelerate — but a first lesson has an
 * EMA equal to itself, which is what lets a capable child leap immediately
 * instead of serving time.
 */
export function levelJump(stat: LevelStat): number {
  for (const rule of JUMP_THRESHOLDS) {
    if (stat.newKeyAccuracy >= rule.newKey && stat.accuracyEma >= rule.overall) return rule.jump
  }
  return 0
}

/** The level to unlock up to, never past the end of the curriculum. */
export function nextUnlockedLevel(current: number, jump: number): number {
  return Math.min(current + jump, MAX_LEVEL)
}

// --- easing off ------------------------------------------------------------

/**
 * Should we offer an easier level? Deliberately an *offer*: the results screen
 * suggests it with the easy option as the default button, and the kid can
 * decline. Being moved down against your will is the thing that stings.
 */
export function shouldOfferEasierLevel(stat: LevelStat | undefined, currentLevel: number): boolean {
  if (!stat || currentLevel <= 1) return false
  return stat.lessons >= BACK_OFF_LESSONS && stat.accuracyEma < BACK_OFF_ACCURACY
}

// --- difficulty inside a level ---------------------------------------------

/**
 * The 0..1 knob driving lesson composition. Tracks accuracy, but asymmetrically:
 * it falls faster than it rises, so a struggling kid gets relief quickly while a
 * good run has to be sustained before lessons get longer and harder.
 */
export function nextDifficulty(current: number, accuracy: number): number {
  const target = clamp01((accuracy - 0.5) / 0.45)
  const weight = target < current ? 0.5 : 0.25
  return clamp01(current * (1 - weight) + target * weight)
}

export type LessonShape = {
  itemCount: number
  spellingItems: number
  includeSentence: boolean
  /** Prefer words no longer than this. Infinity = the whole bank. */
  maxWordLength: number
  /** Sneaky Stars offered — fewer when struggling, to stop splitting attention. */
  sneakyStars: number
}

/**
 * Turn the difficulty knob into an actual lesson shape.
 *
 * A struggling kid gets a genuinely shorter, gentler lesson rather than the same
 * one again — the v1 behaviour, where every lesson was identical and they simply
 * failed to unlock, is demoralising in a way that's easy to miss from the code.
 */
export const MIN_LESSON_ITEMS = 6

export function lessonShapeFor(difficulty: number, baseItemCount: number): LessonShape {
  const d = clamp01(difficulty)
  // Scale down from the level's own length, never up past it. Levels 1-2 are
  // deliberately short (there are no words in "f j"), and stretching them would
  // undo that.
  const floor = Math.min(MIN_LESSON_ITEMS, baseItemCount)
  const itemCount = Math.round(floor + d * (baseItemCount - floor))
  return {
    itemCount,
    spellingItems: d < 0.35 ? 1 : d < 0.75 ? 2 : 3,
    includeSentence: d >= 0.45,
    maxWordLength: d < 0.3 ? 4 : d < 0.6 ? 6 : Infinity,
    sneakyStars: d < 0.35 ? 2 : d < 0.7 ? 3 : 4,
  }
}

// --- personal speed --------------------------------------------------------

/**
 * The kid's own speed target, drifting up as they get quicker and never down
 * far. Scoring speed against this instead of a fixed 20 wpm means three stars is
 * reachable for a 7-year-old and still worth something for a 9-year-old.
 */
export function nextPersonalWpm(current: number, lessonWpm: number): number {
  const base = Number.isFinite(current) && current > 0 ? current : STARTING_WPM
  // Only genuinely faster lessons pull the target up, and only part of the way,
  // so one fluke doesn't set a bar the kid then can't clear.
  const target = lessonWpm > base ? base + (lessonWpm - base) * 0.3 : base
  return Math.min(Math.max(target, MIN_PERSONAL_WPM), MAX_PERSONAL_WPM)
}

// --- what to tell the kid --------------------------------------------------

export function jumpMessage(jump: number): string | null {
  if (jump >= 3) return "Wow — you flew through that! Jumping you ahead three whole levels. 🚀"
  if (jump === 2) return 'That was easy for you! Skipping you ahead two levels. ⚡'
  if (jump === 1) return 'Level complete — next one unlocked!'
  return null
}

export function easierLevelMessage(level: number): string {
  return `That one was tricky. Shall we have another go at Level ${level} first?`
}

/** Everything the store needs to update a profile after a lesson. */
export type AdaptiveOutcome = {
  levelStat: LevelStat
  jump: number
  unlockedTo: number
  difficulty: number
  personalWpm: number
  offerEasierLevel: boolean
}

export function applyLesson(profile: Profile, lesson: LessonAbility): AdaptiveOutcome {
  const levelStat = updateLevelStat(profile.levelStats[lesson.levelId], lesson)

  // Only accelerate from the frontier. Replaying an old level for fun shouldn't
  // unlock anything new, but it also shouldn't be blocked or discouraged.
  const atFrontier = lesson.levelId >= profile.highestLevelUnlocked
  const jump = atFrontier ? levelJump(levelStat) : 0

  return {
    levelStat,
    jump,
    unlockedTo: nextUnlockedLevel(profile.highestLevelUnlocked, jump),
    difficulty: nextDifficulty(profile.difficulty, lesson.accuracy),
    personalWpm: nextPersonalWpm(profile.personalWpm, lesson.wpm),
    offerEasierLevel: jump === 0 && shouldOfferEasierLevel(levelStat, lesson.levelId),
  }
}

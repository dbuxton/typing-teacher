import type { AssistLevel } from '../store/schema'

/**
 * The scoring formula IS the pedagogy, so it lives in one place and is weighted
 * deliberately:
 *
 *   50% accuracy  — typing the right thing matters most
 *   30% eyes up   — measured by Sneaky Stars caught
 *   20% speed     — measured last, and capped low, so chasing it never pays
 *
 * A careful, screen-watching, slow kid can get three stars. A fast hunt-and-peck
 * kid cannot. If you retune anything here, `scoring.test.ts` asserts that
 * property directly.
 */

export const WEIGHT_ACCURACY = 0.5
export const WEIGHT_EYES_UP = 0.3
export const WEIGHT_SPEED = 0.2

/** WPM that counts as full marks for the speed component. Deliberately gentle. */
export const TARGET_WPM = 20

export type LessonStats = {
  /** Characters typed correctly on the first attempt. */
  correctChars: number
  /** Keystrokes that were wrong. */
  errorChars: number
  /** Milliseconds spent typing. */
  elapsedMs: number
  sneakyStarsCaught: number
  sneakyStarsTotal: number
}

export function accuracyOf(stats: LessonStats): number {
  const total = stats.correctChars + stats.errorChars
  if (total === 0) return 1
  return stats.correctChars / total
}

/** Standard WPM: five characters per "word". */
export function wpmOf(stats: LessonStats): number {
  const minutes = stats.elapsedMs / 60_000
  if (minutes <= 0) return 0
  return stats.correctChars / 5 / minutes
}

/** Fraction of Sneaky Stars caught. A lesson with none offered scores full marks. */
export function eyesUpScore(stats: LessonStats): number {
  if (stats.sneakyStarsTotal === 0) return 1
  return stats.sneakyStarsCaught / stats.sneakyStarsTotal
}

/** The weighted 0..1 score behind the star rating. */
export function overallScore(stats: LessonStats): number {
  const speed = Math.min(wpmOf(stats) / TARGET_WPM, 1)
  return (
    accuracyOf(stats) * WEIGHT_ACCURACY +
    eyesUpScore(stats) * WEIGHT_EYES_UP +
    speed * WEIGHT_SPEED
  )
}

/** 1-3 stars. Never zero: finishing a lesson always earns something. */
export function starsFor(stats: LessonStats): number {
  const score = overallScore(stats)
  if (score >= 0.85) return 3
  if (score >= 0.65) return 2
  return 1
}

export function coinsFor(stats: LessonStats, spellingCorrect: number, stars: number): number {
  const base = 5
  const starBonus = stars * 3
  const spellingBonus = spellingCorrect * 2
  const eyesUpBonus = stats.sneakyStarsCaught * 2
  return base + starBonus + spellingBonus + eyesUpBonus
}

/**
 * Kid-facing praise. Leads with eyes-up, then accuracy — speed is never the
 * headline, because whatever we congratulate is what they'll optimise for.
 *
 * Takes the finished numbers rather than a LessonStats so the results screen can
 * call it from a saved result without reconstructing keystroke counts.
 */
export function praiseFor(summary: {
  accuracy: number
  stars: number
  sneakyStarsCaught: number
  sneakyStarsTotal: number
}): string {
  if (summary.sneakyStarsTotal > 0 && summary.sneakyStarsCaught === summary.sneakyStarsTotal) {
    return 'You spotted every Sneaky Star — your eyes were right where they should be!'
  }
  if (summary.accuracy >= 0.95) return 'Wow, almost every letter perfect!'
  if (summary.stars === 3) return 'Three stars! Brilliant work.'
  if (summary.accuracy >= 0.85) return 'Really careful typing. Nice one.'
  return 'Good effort — every go makes it easier.'
}

/** Shown under the WPM number so speed stays in perspective. */
export function speedComment(wpm: number): string {
  if (wpm >= TARGET_WPM) return 'Speedy! But accuracy matters more.'
  if (wpm >= 10) return 'A nice steady pace.'
  return 'Slow and careful is exactly right for now.'
}

export const ASSIST_LABELS: Record<AssistLevel, string> = {
  full: 'Keyboard with letters',
  'letters-off': 'Keyboard, no letters',
  'on-miss': 'Keyboard only when you slip',
  off: 'No keyboard at all',
}

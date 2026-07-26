import { getLevel } from '../data/curriculum'
import { type Rng } from './rng'

/**
 * Sneaky Stars: the eyes-up check.
 *
 * A star drifts across the typing area for a moment. Catch it by pressing the
 * catch key and you bank bonus coins; miss it and nothing at all happens — no
 * penalty, no interruption. A kid watching their fingers misses every one; a kid
 * watching the screen catches most. That makes "look up" a game with a score
 * instead of a grown-up nagging.
 */

/** How long a star stays catchable. Long enough to react, short enough to matter. */
export const CATCH_WINDOW_MS = 1200

/** Stars offered per lesson. */
export const STARS_PER_LESSON = 4

/**
 * The key that catches a star. It must never be a key the kid is being asked to
 * type, or catching a star would inject an error. Arrow Up is safe at every
 * level — no level ever teaches it — but we check the level's key set anyway so
 * this stays true if the curriculum grows.
 */
export function catchKeyFor(levelId: number): string {
  const { allKeys } = getLevel(levelId)
  const candidates = ['ArrowUp', 'ArrowDown', 'Tab']
  const safe = candidates.find((key) => !allKeys.includes(key))
  if (!safe) throw new Error(`No safe catch key for level ${levelId}`)
  return safe
}

export const CATCH_KEY_LABEL: Record<string, string> = {
  ArrowUp: '↑',
  ArrowDown: '↓',
  Tab: 'Tab',
}

/**
 * Which lesson items get a star, and how far into each one it appears.
 * Seeded, so a replayed lesson offers the same stars and tests are deterministic.
 *
 * `atFraction` is a fraction of the item's characters — the star shows once the
 * kid has typed that far, which keeps it tied to progress rather than to a timer
 * that could fire while they're still reading.
 */
export type StarSchedule = { itemIndex: number; atFraction: number }[]

export function scheduleStars(itemCount: number, rng: Rng, count = STARS_PER_LESSON): StarSchedule {
  if (itemCount <= 0) return []
  const howMany = Math.min(count, itemCount)

  // One star per item at most, spread across the lesson rather than clustered.
  const indices = Array.from({ length: itemCount }, (_, i) => i)
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[indices[i], indices[j]] = [indices[j], indices[i]]
  }

  return indices
    .slice(0, howMany)
    .sort((a, b) => a - b)
    .map((itemIndex) => ({
      itemIndex,
      // Between 20% and 80% in: never on the first keystroke, never after the last.
      atFraction: 0.2 + rng() * 0.6,
    }))
}

/** Should a star appear now, given progress through the current item? */
export function starDueAt(
  schedule: StarSchedule,
  itemIndex: number,
  charsTyped: number,
  itemLength: number,
): boolean {
  const entry = schedule.find((s) => s.itemIndex === itemIndex)
  if (!entry || itemLength === 0) return false
  return charsTyped / itemLength >= entry.atFraction
}

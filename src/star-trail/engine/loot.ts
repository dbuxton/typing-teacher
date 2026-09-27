import type { Rng } from '../../engine/rng'
import { MAX_SPARKLES, MIN_SPARKLES, ROBOT_LEVELS, SPARKLE_FROM, SPARKLE_TO } from './balance'

/**
 * Where stardust sparkles drift past on a trail. Press ↑ while one is showing
 * and the robot grabs it — Typing Teacher's Sneaky Stars trick: a kid watching
 * their fingers misses every one, a kid watching the screen catches most.
 *
 * A sparkle appears when the ship reaches a letter (never on a timer), so a slow
 * typist gets exactly the same chances as a fast one. Positions stay away from
 * the very start and end of the trail.
 *
 * Before the robot is bought, a single uncatchable sparkle drifts by — a nudge
 * that there's stardust out there for a pilot with a robot.
 */
export function scheduleSparkles(length: number, robotLevel: number, rng: Rng, nudge: boolean): number[] {
  if (robotLevel === 0 && !nudge) return []
  const count =
    robotLevel === 0
      ? 1
      : Math.min(MAX_SPARKLES, Math.max(MIN_SPARKLES, Math.floor(length / ROBOT_LEVELS[robotLevel - 1].sparkleEvery)))
  const from = Math.ceil(length * SPARKLE_FROM)
  const to = Math.floor(length * SPARKLE_TO)
  if (to <= from) return []
  const slice = (to - from) / count
  const positions = Array.from({ length: count }, (_, i) => from + Math.floor(slice * i + rng() * slice))
  return [...new Set(positions)].sort((a, b) => a - b)
}

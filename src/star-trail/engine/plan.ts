import { makeRng } from '../../engine/rng'
import type { Pilot } from '../store/schema'
import { FUEL_TANK, NUDGE_SPARKLE_MS, PIECES_PER_PLANET, ROBOT_LEVELS } from './balance'
import { darknessFor, maxShields, trailTarget, visibleLetters, type TrailTarget } from './difficulty'
import { lootPerCatch, stardustPerLetter } from './economy'
import type { HelpLevel } from './help'
import { scheduleSparkles } from './loot'
import type { TrailSetup } from './trail'
import { pickTrail } from './trailGen'

/**
 * Everything decided before a hunt starts. Pure and seeded: the same pilot and
 * seed always plan the same hunt, which is what lets the journey simulation run
 * the real game rather than a model of it.
 */
export type HuntPlan = TrailSetup & {
  seed: number
  planetId: number
  /** All three pieces here are already found: this hunt is for stardust and practice. */
  practice: boolean
  /** The length the trail aimed for. */
  target: number
  /** Letters visible on the trail, including the one to type. */
  visible: number
  darkness: number
  reason: TrailTarget['reason']
  help: HelpLevel
  robotLevel: number
  /** How long a sparkle stays on screen. */
  catchMs: number
  /** Letters at which a sparkle drifts past. */
  sparkles: number[]
  /** No robot yet: sparkles are only a hint of what one could catch. */
  nudgeOnly: boolean
}

export function planHunt(pilot: Pilot, seed: number): HuntPlan {
  const rng = makeRng(seed)
  const planetId = pilot.planet
  const upgrades = pilot.upgrades
  const piecesHere = pilot.pieces[planetId] ?? 0

  const target = trailTarget({
    planetId,
    piecesHere,
    upgrades,
    slipRate: pilot.slipRate,
    failStreak: pilot.failStreak,
    huntsOnPlanet: pilot.huntsOnPlanet[planetId] ?? 0,
    huntsFlown: pilot.huntsFlown,
  })
  const text = pickTrail({
    planetId,
    target: target.length,
    keyStats: pilot.keyStats,
    recent: pilot.recent[planetId] ?? [],
    rng,
  })

  const robotLevel = upgrades.robot
  const nudgeOnly = robotLevel === 0 && pilot.highestPlanet >= ROBOT_LEVELS[0].stockAt
  const shields = maxShields(upgrades)

  return {
    text,
    tank: FUEL_TANK,
    spare: target.spare,
    shields,
    maxShields: shields,
    training: target.training,
    stardustPerLetter: stardustPerLetter(planetId, upgrades),
    lootPerCatch: lootPerCatch(planetId, upgrades),

    seed,
    planetId,
    practice: piecesHere >= PIECES_PER_PLANET,
    target: target.length,
    visible: visibleLetters(planetId, upgrades),
    darkness: darknessFor(planetId, upgrades),
    reason: target.reason,
    help: pilot.help,
    robotLevel,
    catchMs: robotLevel > 0 ? ROBOT_LEVELS[robotLevel - 1].catchMs : NUDGE_SPARKLE_MS,
    sparkles: scheduleSparkles(text.length, robotLevel, rng, nudgeOnly),
    nudgeOnly,
  }
}

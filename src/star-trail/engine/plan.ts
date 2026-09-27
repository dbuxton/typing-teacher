import { makeRng, type Rng } from '../../engine/rng'
import { petFor } from '../data/pets'
import type { Pilot } from '../store/schema'
import {
  CLOVER_MULTIPLIER,
  FLARE_LETTERS,
  GADGETS,
  GADGET_MAX,
  NUDGE_SPARKLE_MS,
  PET_BONUS,
  PIECES_PER_PLANET,
  PUPPY_FROM,
  PUPPY_TO,
  ROBOT_LEVELS,
  type GadgetId,
} from './balance'
import { darknessFor, maxShields, tankCans, trailTarget, visibleLetters, type TrailTarget } from './difficulty'
import { lootPerCatch, stardustPerLetter } from './economy'
import type { HelpLevel } from './help'
import { scheduleSparkles } from './loot'
import type { PetSetup, TrailSetup } from './trail'
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
  /** Gadgets this hunt uses up from the pilot's cargo. */
  gadgets: Record<GadgetId, number>
  /** Star map level: 1 counts the words left, 2 also shows their shape. */
  mapLevel: number
}

/**
 * Which loaded gadgets this hunt uses. Extra fuel and shields wait while the
 * pilot is on training flights — the tank can't run dry then anyway — so they
 * aren't wasted.
 */
function gadgetsFor(pilot: Pilot, training: boolean): Record<GadgetId, number> {
  const used = {} as Record<GadgetId, number>
  for (const gadget of GADGETS) {
    const waits = training && (gadget === 'fuel' || gadget === 'shield')
    used[gadget] = waits ? 0 : Math.min(pilot.cargo[gadget], GADGET_MAX[gadget])
  }
  return used
}

function petSetup(pilot: Pilot, perLetter: number, length: number, rng: Rng): PetSetup | null {
  const pet = petFor(pilot.look.pet)
  if (!pet) return null
  const from = Math.ceil(length * PUPPY_FROM)
  const to = Math.max(from, Math.floor(length * PUPPY_TO))
  return {
    id: pet.pet,
    bonus: Math.max(1, Math.round(PET_BONUS[pet.pet] * perLetter)),
    fetchAt: pet.pet === 'puppy' ? from + Math.floor(rng() * (to - from + 1)) : null,
  }
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
  const gadgets = gadgetsFor(pilot, target.training)
  const shields = maxShields(upgrades) + gadgets.shield
  const luck = gadgets.clover > 0 ? CLOVER_MULTIPLIER : 1
  const perLetter = stardustPerLetter(planetId, upgrades) * luck
  const loot = lootPerCatch(planetId, upgrades)
  const sparkles = scheduleSparkles(text.length, robotLevel, rng, nudgeOnly)

  return {
    text,
    tank: tankCans(upgrades),
    spare: target.spare + gadgets.fuel,
    shields,
    maxShields: shields,
    training: target.training,
    stardustPerLetter: perLetter,
    lootPerCatch: loot === null ? null : loot * luck,
    pet: petSetup(pilot, perLetter, text.length, rng),

    seed,
    planetId,
    practice: piecesHere >= PIECES_PER_PLANET,
    target: target.length,
    visible: visibleLetters(planetId, upgrades) + gadgets.flare * FLARE_LETTERS,
    darkness: darknessFor(planetId, upgrades),
    reason: target.reason,
    help: pilot.help,
    robotLevel,
    catchMs: robotLevel > 0 ? ROBOT_LEVELS[robotLevel - 1].catchMs : NUDGE_SPARKLE_MS,
    sparkles,
    nudgeOnly,
    gadgets,
    mapLevel: upgrades.map,
  }
}

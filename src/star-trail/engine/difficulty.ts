import {
  FUEL_TANK,
  HELPER_LEVELS_PER_DEEP_STEP,
  LETTERS_PER_HELPER_LEVEL,
  MAX_TOP_UP,
  MIN_LETTERS_TO_LEARN_FROM,
  MIN_SLIP_RATE,
  NEW_PLANET_CAUTION,
  NEW_PLANET_CAUTION_HUNTS,
  SAFETY_FACTOR,
  SCANNER_VISIBLE,
  SHIELD_PIPS,
  SLIP_RATE_FALL,
  SLIP_RATE_RISE,
  TOW_STREAK_SHRINK,
  TOW_STREAK_SPARES,
  TRAINING_FLIGHTS,
  planetBalance,
  type Upgrades,
} from './balance'

/**
 * How hard the next hunt is. Two separate things decide it, and they never mix:
 *
 *  - WHICH KEYS: only ever the planet's. Nothing bought can add a key the kid
 *    hasn't been taught.
 *  - HOW LONG AND HOW DARK: this file. Trails grow with every piece found and
 *    every planet flown to, and — Max's rule — with every helper bought: better
 *    kit lets you go deeper, where it's darker and the trail is longer, but the
 *    stardust is richer.
 *
 * What keeps that from becoming unfair is the cap: a trail is never longer than
 * the pilot's recent slip rate and their fuel plus shields can safely cover.
 */

/** Scanner, shield and robot levels together. Engines don't count: they only change where you are. */
export function helperLevels(upgrades: Upgrades): number {
  return upgrades.scanner + upgrades.shields + upgrades.robot
}

/** How much deeper than the planet's own darkness the pilot's kit takes them. */
export function deepSteps(upgrades: Upgrades): number {
  return Math.floor(helperLevels(upgrades) / HELPER_LEVELS_PER_DEEP_STEP)
}

export function darknessFor(planetId: number, upgrades: Upgrades): number {
  return planetBalance(planetId).darkness + deepSteps(upgrades)
}

/** Letters visible on the trail, including the one to type. Never less than one. */
export function visibleLetters(planetId: number, upgrades: Upgrades): number {
  return Math.max(1, SCANNER_VISIBLE[upgrades.scanner] - darknessFor(planetId, upgrades))
}

export function maxShields(upgrades: Upgrades): number {
  return SHIELD_PIPS[upgrades.shields]
}

/** Slips a pilot can make and still finish (the next one is a tow). */
export function slack(upgrades: Upgrades): number {
  return FUEL_TANK + maxShields(upgrades) - 1
}

/**
 * Update the running slip rate after a hunt. It rises fast and falls slowly, so
 * a rough hunt shortens the next trail at once while longer trails are earned
 * over several good ones.
 */
export function nextSlipRate(previous: number, slips: number, letters: number): number {
  if (letters < MIN_LETTERS_TO_LEARN_FROM) return previous
  const sample = slips / letters
  const weight = sample > previous ? SLIP_RATE_RISE : SLIP_RATE_FALL
  return previous + weight * (sample - previous)
}

/** The slip rate to plan with: a little more cautious on a newly reached planet. */
export function plannedSlipRate(slipRate: number, huntsOnPlanet: number): number {
  const caution = huntsOnPlanet < NEW_PLANET_CAUTION_HUNTS ? NEW_PLANET_CAUTION : 0
  return Math.max(MIN_SLIP_RATE, slipRate + caution)
}

/** How long the trail WANTS to be: longer per piece found, and per helper bought. */
export function desiredLength(planetId: number, piecesHere: number, upgrades: Upgrades): number {
  const balance = planetBalance(planetId)
  return balance.trailBase + balance.trailPerPiece * piecesHere + LETTERS_PER_HELPER_LEVEL * helperLevels(upgrades)
}

/** The longest trail this pilot can be expected to finish with fuel to spare. */
export function safeLength(slipRate: number, slackCans: number): number {
  return slackCans / (SAFETY_FACTOR * Math.max(slipRate, MIN_SLIP_RATE))
}

export type TrailTarget = {
  length: number
  /** Spare fuel cans Mission Control adds for this hunt. */
  spare: number
  training: boolean
  /** Why the trail is the length it is — handy for tests and for the curious. */
  reason: 'normal' | 'capped' | 'safety-net' | 'top-up' | 'training'
}

export function trailTarget(input: {
  planetId: number
  piecesHere: number
  upgrades: Upgrades
  slipRate: number
  failStreak: number
  huntsOnPlanet: number
  huntsFlown: number
}): TrailTarget {
  const balance = planetBalance(input.planetId)
  const rate = plannedSlipRate(input.slipRate, input.huntsOnPlanet)
  const cans = slack(input.upgrades)

  const desired = desiredLength(input.planetId, input.piecesHere, input.upgrades)
  const cap = safeLength(rate, cans)
  let length = Math.min(desired, cap)
  let reason: TrailTarget['reason'] = desired > cap ? 'capped' : 'normal'

  // Safety nets after tows in a row: shorter, then shorter still, then the shortest.
  const streak = Math.max(0, input.failStreak)
  if (streak >= TOW_STREAK_SHRINK.length) {
    length = balance.trailMin
    reason = 'safety-net'
  } else if (streak > 0) {
    length *= TOW_STREAK_SHRINK[streak]
    reason = 'safety-net'
  }
  length = Math.min(Math.max(Math.round(length), balance.trailMin), balance.trailMax)

  let spare = TOW_STREAK_SPARES[Math.min(streak, TOW_STREAK_SPARES.length - 1)]
  // Even the shortest trail can be risky for a very shaky pilot: top the tank up.
  const topUp = Math.min(Math.max(Math.ceil(SAFETY_FACTOR * rate * length - cans - 1), 0), MAX_TOP_UP)
  if (topUp > 0) {
    spare += topUp
    if (reason !== 'safety-net') reason = 'top-up'
  }

  const training = input.huntsFlown < TRAINING_FLIGHTS
  if (training) reason = 'training'
  return { length, spare, training, reason }
}

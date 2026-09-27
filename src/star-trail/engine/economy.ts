import { PLANET_COUNT } from '../data/planets'
import { maxLevel, type Pilot } from '../store/schema'
import {
  DUST_BONUS_PER_DEEP_STEP,
  ENGINE_PRICE_SCALE,
  MAGNET_BONUS,
  MAGNET_LEVELS,
  MAP_LEVELS,
  NAV_ACCURACY,
  NAV_FLOOR,
  NAV_MIN_TRIES,
  NAV_RELAX_AFTER_HUNTS,
  NAV_RELAX_PER_HUNT,
  NAV_WINDOW_TRIES,
  PIECES_PER_PLANET,
  PLANET_BALANCE,
  ROBOT_LEVELS,
  SCANNER_LEVELS,
  SHAKY_SLIP_RATE,
  SHIELD_LEVELS,
  TANK_LEVELS,
  planetBalance,
  type StockLevel,
  type TrackId,
  type Upgrades,
} from './balance'
import { deepSteps } from './difficulty'
import type { HuntOutcome } from './trail'

/**
 * Stardust in, helpers out. Finding a piece pays; the space station sells the
 * helpers; engines take you to the next planet.
 *
 * Higher helper levels only come into stock once you've flown further. Without
 * that, a kid who bought everything on sight could spend twenty hunts on the
 * first planet saving up — practice, yes, but on the same eight keys.
 */

/** Deeper space pays more, and so does a stardust magnet. */
export function stardustPerLetter(planetId: number, upgrades: Upgrades): number {
  const bonus = DUST_BONUS_PER_DEEP_STEP * deepSteps(upgrades) + MAGNET_BONUS[upgrades.magnet]
  return planetBalance(planetId).stardustPerLetter * (1 + bonus)
}

/** What one robot catch is worth, or null with no robot. */
export function lootPerCatch(planetId: number, upgrades: Upgrades): number | null {
  if (upgrades.robot === 0) return null
  return Math.round(ROBOT_LEVELS[upgrades.robot - 1].lootPerCatch * stardustPerLetter(planetId, upgrades))
}

export type Payout = {
  /** Banked word by word along the trail. */
  trail: number
  /** For finding a piece (practice hunts have none left to find). */
  piece: number
  /** For fuel still in the tank at the end. */
  fuel: number
  /** Caught by the robot. */
  loot: number
  /** Brought by the pet. */
  pet: number
  total: number
}

export function payoutFor(planetId: number, practice: boolean, outcome: HuntOutcome): Payout {
  const balance = planetBalance(planetId)
  const found = outcome.result === 'found'
  const piece = found && !practice ? balance.pieceBonus : 0
  const fuel = found ? balance.fuelBonus * outcome.tankLeft : 0
  const { banked: trail, loot, petBonus: pet } = outcome
  // A tow or a trip back to base keeps what was already banked: nothing earned is taken away.
  return { trail, piece, fuel, loot, pet, total: trail + piece + fuel + loot + pet }
}

// ─── The space station ─────────────────────────────────────────────────────

export type NextLevel = StockLevel & { level: number }

function stockFor(track: TrackId): readonly StockLevel[] {
  switch (track) {
    case 'scanner':
      return SCANNER_LEVELS
    case 'shields':
      return SHIELD_LEVELS
    case 'robot':
      return ROBOT_LEVELS
    case 'tank':
      return TANK_LEVELS
    case 'map':
      return MAP_LEVELS
    case 'magnet':
      return MAGNET_LEVELS
    case 'engines':
      // Engine level n reaches planet n + 1, and is sold once you're on planet n.
      return PLANET_BALANCE.slice(0, PLANET_COUNT - 1).map((balance, index) => ({
        price: Math.round((balance.enginePrice ?? 0) * ENGINE_PRICE_SCALE),
        stockAt: index + 1,
      }))
  }
}

/** The next level on a track, or null when it's maxed out. */
export function nextLevel(track: TrackId, upgrades: Upgrades): NextLevel | null {
  const level = upgrades[track] + 1
  if (level > maxLevel(track)) return null
  return { ...stockFor(track)[level - 1], level }
}

export type Stock =
  | { status: 'buy'; next: NextLevel }
  | { status: 'too-dear'; next: NextLevel }
  | { status: 'not-yet'; next: NextLevel }
  | { status: 'maxed' }

export function stockStatus(pilot: Pilot, track: TrackId): Stock {
  const next = nextLevel(track, pilot.upgrades)
  if (!next) return { status: 'maxed' }
  if (next.stockAt > pilot.highestPlanet) return { status: 'not-yet', next }
  if (next.price > pilot.stardust) return { status: 'too-dear', next }
  return { status: 'buy', next }
}

/** The pilot after buying, or null if they can't (stock, money, or maxed out). */
export function buyUpgrade(pilot: Pilot, track: TrackId): Pilot | null {
  const stock = stockStatus(pilot, track)
  if (stock.status !== 'buy') return null
  return {
    ...pilot,
    stardust: pilot.stardust - stock.next.price,
    upgrades: { ...pilot.upgrades, [track]: stock.next.level },
  }
}

/**
 * Mission Control's tip: the helper worth saving up for next. A pilot who is
 * slipping a lot, or was just towed, needs room for slips (shields, a bigger
 * tank); a steady pilot does best reading further ahead. Only helpers that make
 * a hunt easier are ever suggested, and only ones in stock.
 */
export function suggestHelper(pilot: Pilot): TrackId | null {
  const shaky = pilot.slipRate >= SHAKY_SLIP_RATE || pilot.failStreak > 0
  const order: TrackId[] = shaky ? ['shields', 'tank', 'scanner', 'robot'] : ['scanner', 'shields', 'tank', 'robot']
  return (
    order.find((track) => {
      const status = stockStatus(pilot, track).status
      return status === 'buy' || status === 'too-dear'
    }) ?? null
  )
}

// ─── Launching to the next planet ──────────────────────────────────────────

export type NavCheck = {
  passed: boolean
  /** First-try accuracy on the frontier planet's new keys, over recent hunts. */
  accuracy: number
  tries: number
  required: number
  minTries: number
}

/**
 * The navigator's check before a jump to new keys: have THIS planet's new keys
 * stuck? Reads the most recent hunts on the frontier planet. The bar eases
 * gently for a pilot who has been here a long time, so nobody is stuck forever.
 */
export function navCheck(pilot: Pilot): NavCheck {
  const frontier = pilot.highestPlanet
  let tries = 0
  let slips = 0
  for (let i = pilot.history.length - 1; i >= 0 && tries < NAV_WINDOW_TRIES; i--) {
    const hunt = pilot.history[i]
    if (hunt.planet !== frontier) continue
    tries += hunt.newKeyTries
    slips += hunt.newKeySlips
  }
  const huntsHere = pilot.huntsOnPlanet[frontier] ?? 0
  const required = Math.max(NAV_FLOOR, NAV_ACCURACY - NAV_RELAX_PER_HUNT * Math.max(0, huntsHere - NAV_RELAX_AFTER_HUNTS))
  const accuracy = tries === 0 ? 0 : 1 - slips / tries
  return { passed: tries >= NAV_MIN_TRIES && accuracy >= required, accuracy, tries, required, minTries: NAV_MIN_TRIES }
}

export type LaunchCheck = {
  /** The planet a launch would reach, or null from the last one. */
  next: number | null
  piecesFound: number
  piecesNeeded: number
  hasEngine: boolean
  enginePrice: number | null
  nav: NavCheck
  ok: boolean
}

export function launchCheck(pilot: Pilot): LaunchCheck {
  const frontier = pilot.highestPlanet
  const next = frontier < PLANET_COUNT ? frontier + 1 : null
  const piecesFound = pilot.pieces[frontier] ?? 0
  const hasEngine = pilot.upgrades.engines >= frontier
  const nav = navCheck(pilot)
  return {
    next,
    piecesFound,
    piecesNeeded: PIECES_PER_PLANET,
    hasEngine,
    enginePrice: nextLevel('engines', pilot.upgrades)?.price ?? null,
    nav,
    ok: next !== null && piecesFound >= PIECES_PER_PLANET && hasEngine && nav.passed,
  }
}

/** The pilot after launching to the next planet, or null if it isn't allowed yet. */
export function launch(pilot: Pilot): Pilot | null {
  const check = launchCheck(pilot)
  if (!check.ok || check.next === null) return null
  return { ...pilot, planet: check.next, highestPlanet: check.next }
}

/** Travel back to a planet already visited, for practice. Free. */
export function travelTo(pilot: Pilot, planetId: number): Pilot | null {
  if (!Number.isInteger(planetId) || planetId < 1 || planetId > pilot.highestPlanet) return null
  return planetId === pilot.planet ? pilot : { ...pilot, planet: planetId }
}

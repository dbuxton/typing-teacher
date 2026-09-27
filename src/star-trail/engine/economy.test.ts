import { describe, expect, it } from 'vitest'
import { makePilot, maxLevel, type HuntRecord, type Pilot } from '../store/schema'
import {
  MAGNET_LEVELS,
  MAP_LEVELS,
  NAV_ACCURACY,
  NAV_FLOOR,
  NAV_MIN_TRIES,
  NO_UPGRADES,
  PLANET_BALANCE,
  ROBOT_LEVELS,
  SCANNER_LEVELS,
  SHIELD_LEVELS,
  TANK_LEVELS,
  TRACKS,
  planetBalance,
  type Upgrades,
} from './balance'
import {
  buyUpgrade,
  launch,
  launchCheck,
  lootPerCatch,
  navCheck,
  nextLevel,
  payoutFor,
  stardustPerLetter,
  stockStatus,
  suggestHelper,
  travelTo,
} from './economy'
import type { HuntOutcome } from './trail'

function outcome(result: HuntOutcome['result'], extra: Partial<HuntOutcome> = {}): HuntOutcome {
  return {
    result,
    letters: 20,
    slips: 2,
    skipped: 0,
    wrongPresses: 2,
    accuracy: 0.9,
    keyAttempts: {},
    keyErrors: {},
    banked: 20,
    loot: 6,
    petBonus: 0,
    petTricks: 0,
    tankLeft: 4,
    sparklesShown: 2,
    sparklesCaught: 2,
    elapsedMs: 30_000,
    ...extra,
  }
}

function pilotWith(extra: Partial<Pilot>): Pilot {
  return { ...makePilot('Nova', '🧑‍🚀'), ...extra }
}

function hunt(planet: number, newKeyTries: number, newKeySlips: number): HuntRecord {
  return {
    planet,
    result: 'found',
    practice: false,
    letters: newKeyTries,
    slips: newKeySlips,
    accuracy: 1 - newKeySlips / newKeyTries,
    newKeyTries,
    newKeySlips,
    stardust: 10,
    help: 'letters',
    date: '2026-09-27',
  }
}

describe('payouts', () => {
  const balance = planetBalance(2)

  it('pays for the trail, the piece, the fuel left, the robot’s catches and the pet’s tricks', () => {
    expect(payoutFor(2, false, outcome('found', { petBonus: 4, petTricks: 2 }))).toEqual({
      trail: 20,
      piece: balance.pieceBonus,
      fuel: balance.fuelBonus * 4,
      loot: 6,
      pet: 4,
      total: 20 + balance.pieceBonus + balance.fuelBonus * 4 + 6 + 4,
    })
  })

  it('has no piece bonus on a practice hunt — all three pieces are already found', () => {
    expect(payoutFor(2, true, outcome('found')).piece).toBe(0)
  })

  it('keeps what was banked after a tow or a trip back to base, and nothing more', () => {
    for (const result of ['towed', 'aborted'] as const) {
      expect(payoutFor(2, false, outcome(result, { petBonus: 3 }))).toEqual({
        trail: 20,
        piece: 0,
        fuel: 0,
        loot: 6,
        pet: 3,
        total: 29,
      })
    }
  })

  it('pays more per letter deeper in space', () => {
    const shallow = stardustPerLetter(4, { ...NO_UPGRADES, scanner: 1, shields: 1, robot: 0, engines: 3 })
    const deep = stardustPerLetter(4, { ...NO_UPGRADES, scanner: 1, shields: 1, robot: 1, engines: 3 })
    expect(deep).toBeGreaterThan(shallow)
  })

  it('pays a tenth more per letter for every level of stardust magnet', () => {
    const plain = stardustPerLetter(1, NO_UPGRADES)
    expect(stardustPerLetter(1, { ...NO_UPGRADES, magnet: 1 })).toBeCloseTo(plain * 1.1)
    expect(stardustPerLetter(1, { ...NO_UPGRADES, magnet: 2 })).toBeCloseTo(plain * 1.2)
  })

  it('only lets a robot catch anything', () => {
    expect(lootPerCatch(3, { ...NO_UPGRADES, scanner: 0, shields: 0, robot: 0, engines: 2 })).toBeNull()
    expect(lootPerCatch(3, { ...NO_UPGRADES, scanner: 0, shields: 0, robot: 1, engines: 2 })).toBeGreaterThan(0)
  })
})

describe('the space station', () => {
  it('charges more for every level, on every track', () => {
    for (const levels of [SCANNER_LEVELS, SHIELD_LEVELS, ROBOT_LEVELS, TANK_LEVELS, MAP_LEVELS, MAGNET_LEVELS]) {
      for (let i = 1; i < levels.length; i++) expect(levels[i].price).toBeGreaterThan(levels[i - 1].price)
    }
    const engines = PLANET_BALANCE.slice(0, -1).map((b) => b.enginePrice ?? 0)
    for (let i = 1; i < engines.length; i++) expect(engines[i]).toBeGreaterThan(engines[i - 1])
  })

  it('stocks higher levels only once the pilot has flown far enough', () => {
    const rich = pilotWith({ stardust: 10_000, upgrades: { ...NO_UPGRADES, scanner: 1, shields: 0, robot: 0, engines: 0 } })
    expect(stockStatus(rich, 'scanner').status).toBe('not-yet')
    expect(stockStatus({ ...rich, highestPlanet: 3, upgrades: { ...rich.upgrades, engines: 2 } }, 'scanner').status).toBe(
      'buy',
    )
    // The robot, the bigger tank and the magnet aren't sold on the first planet
    // at all; the star map is, so there's something new to buy straight away.
    for (const track of ['robot', 'tank', 'magnet'] as const) expect(stockStatus(rich, track).status, track).toBe('not-yet')
    expect(stockStatus(rich, 'map').status).toBe('buy')
  })

  it('sells the engine for the next planet only', () => {
    const pilot = pilotWith({ stardust: 10_000 })
    expect(nextLevel('engines', pilot.upgrades)).toMatchObject({ level: 1, price: PLANET_BALANCE[0].enginePrice })
    const bought = buyUpgrade(pilot, 'engines')!
    expect(bought.upgrades.engines).toBe(1)
    expect(stockStatus(bought, 'engines').status).toBe('not-yet')
  })

  it('takes the price, and refuses what the pilot can’t afford', () => {
    const pilot = pilotWith({ stardust: 30 })
    const bought = buyUpgrade(pilot, 'scanner')!
    expect(bought.stardust).toBe(0)
    expect(bought.upgrades.scanner).toBe(1)
    expect(buyUpgrade(bought, 'shields')).toBeNull()
  })

  it('stops at the top of every track', () => {
    const top = Object.fromEntries(TRACKS.map((track) => [track, maxLevel(track)])) as Upgrades
    const maxed = pilotWith({ stardust: 100_000, highestPlanet: 10, upgrades: top })
    for (const track of TRACKS) {
      expect(stockStatus(maxed, track).status).toBe('maxed')
      expect(buyUpgrade(maxed, track)).toBeNull()
    }
  })
})

describe('Mission Control’s tip', () => {
  it('points a shaky pilot at room for slips, and a steady one at reading ahead', () => {
    const shaky = pilotWith({ stardust: 0, slipRate: 0.25 })
    expect(suggestHelper(shaky)).toBe('shields')
    const steady = pilotWith({ stardust: 0, slipRate: 0.05 })
    expect(suggestHelper(steady)).toBe('scanner')
    // Just towed: fuel matters most, whatever the average says.
    expect(suggestHelper({ ...steady, failStreak: 1 })).toBe('shields')
  })

  it('only ever suggests a helper that makes hunts easier, and one in stock', () => {
    const far = pilotWith({ highestPlanet: 8, slipRate: 0.25, upgrades: { ...NO_UPGRADES, shields: 4, engines: 7 } })
    expect(suggestHelper(far)).toBe('tank')
    const everything = Object.fromEntries(TRACKS.map((track) => [track, maxLevel(track)])) as Upgrades
    expect(suggestHelper(pilotWith({ highestPlanet: 10, upgrades: { ...everything, map: 0, magnet: 0 } }))).toBeNull()
  })
})

describe('the navigator check', () => {
  it('wants enough recent tries on this planet’s new keys', () => {
    expect(navCheck(pilotWith({})).passed).toBe(false)
    const few = pilotWith({ history: [hunt(1, NAV_MIN_TRIES - 1, 0)] })
    expect(navCheck(few).passed).toBe(false)
  })

  it('passes a pilot whose new keys have stuck, and not one still slipping', () => {
    expect(navCheck(pilotWith({ history: [hunt(1, 20, 2), hunt(1, 20, 2)] })).passed).toBe(true)
    const slipping = navCheck(pilotWith({ history: [hunt(1, 20, 6), hunt(1, 20, 6)] }))
    expect(slipping.passed).toBe(false)
    expect(slipping.accuracy).toBeCloseTo(0.7)
  })

  it('only counts hunts on the planet being left, and only recent ones', () => {
    const elsewhere = pilotWith({ history: [hunt(1, 40, 0)], highestPlanet: 2, upgrades: { ...NO_UPGRADES, scanner: 0, shields: 0, robot: 0, engines: 1 } })
    expect(navCheck(elsewhere).tries).toBe(0)
    // A shaky start long ago shouldn't count against a pilot who has since improved.
    const improved = pilotWith({ history: [hunt(1, 40, 20), hunt(1, 20, 1), hunt(1, 20, 1)] })
    expect(navCheck(improved).passed).toBe(true)
  })

  it('eases the bar for a pilot who has been on a planet a long time, down to a floor', () => {
    expect(navCheck(pilotWith({ huntsOnPlanet: { 1: 3 } })).required).toBe(NAV_ACCURACY)
    expect(navCheck(pilotWith({ huntsOnPlanet: { 1: 12 } })).required).toBeLessThan(NAV_ACCURACY)
    expect(navCheck(pilotWith({ huntsOnPlanet: { 1: 500 } })).required).toBe(NAV_FLOOR)
  })
})

describe('launching', () => {
  const ready = pilotWith({
    pieces: { 1: 3 },
    upgrades: { ...NO_UPGRADES, scanner: 0, shields: 0, robot: 0, engines: 1 },
    history: [hunt(1, 30, 1)],
  })

  it('launches once the pieces, the engine and the navigator are all ready', () => {
    expect(launchCheck(ready).ok).toBe(true)
    expect(launch(ready)).toMatchObject({ planet: 2, highestPlanet: 2 })
  })

  it('waits for every piece, the engine, and the navigator', () => {
    expect(launch({ ...ready, pieces: { 1: 2 } })).toBeNull()
    expect(launch({ ...ready, upgrades: { ...ready.upgrades, engines: 0 } })).toBeNull()
    expect(launch({ ...ready, history: [hunt(1, 30, 15)] })).toBeNull()
  })

  it('has nowhere further to go from the last planet', () => {
    const last = pilotWith({ planet: 10, highestPlanet: 10, pieces: { 10: 3 }, upgrades: { ...NO_UPGRADES, scanner: 0, shields: 0, robot: 0, engines: 9 } })
    expect(launchCheck(last).next).toBeNull()
    expect(launch(last)).toBeNull()
  })

  it('lets a pilot fly back to any planet already visited, and no further', () => {
    const far = pilotWith({ planet: 4, highestPlanet: 4, upgrades: { ...NO_UPGRADES, scanner: 0, shields: 0, robot: 0, engines: 3 } })
    expect(travelTo(far, 2)?.planet).toBe(2)
    expect(travelTo(far, 5)).toBeNull()
    expect(travelTo(far, 0)).toBeNull()
  })
})

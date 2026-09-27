import { describe, expect, it } from 'vitest'
import { PLANETS } from '../data/planets'
import {
  MAX_TOP_UP,
  NEW_PLANET_CAUTION,
  NO_UPGRADES,
  SLIP_RATE_FALL,
  SLIP_RATE_RISE,
  TOW_STREAK_SPARES,
  planetBalance,
  type Upgrades,
} from './balance'
import {
  darknessFor,
  desiredLength,
  nextSlipRate,
  plannedSlipRate,
  slack,
  trailTarget,
  visibleLetters,
} from './difficulty'

const steady = {
  planetId: 1,
  piecesHere: 0,
  upgrades: NO_UPGRADES,
  slipRate: 0.05,
  failStreak: 0,
  huntsOnPlanet: 5,
  huntsFlown: 10,
}

describe('the skill estimate', () => {
  it('rises fast after a rough hunt and falls slowly after a good one', () => {
    expect(nextSlipRate(0.1, 6, 20)).toBeCloseTo(0.1 + SLIP_RATE_RISE * 0.2)
    expect(nextSlipRate(0.3, 2, 20)).toBeCloseTo(0.3 - SLIP_RATE_FALL * 0.2)
  })

  it('learns nothing from a hunt of only a letter or two', () => {
    expect(nextSlipRate(0.2, 2, 3)).toBe(0.2)
  })

  it('plans more carefully for the first hunts on a newly reached planet', () => {
    expect(plannedSlipRate(0.1, 0)).toBeCloseTo(0.1 + NEW_PLANET_CAUTION)
    expect(plannedSlipRate(0.1, 5)).toBeCloseTo(0.1)
  })
})

describe('trail length', () => {
  it('grows with each piece found', () => {
    const lengths = [0, 1, 2, 3].map((piecesHere) => trailTarget({ ...steady, planetId: 4, piecesHere }).length)
    for (let i = 1; i < lengths.length; i++) expect(lengths[i]).toBeGreaterThan(lengths[i - 1])
  })

  it('grows from planet to planet for a steady pilot', () => {
    const first = trailTarget({ ...steady, planetId: 1 }).length
    const last = trailTarget({ ...steady, planetId: 10 }).length
    expect(last).toBeGreaterThan(first * 1.5)
  })

  it('never goes outside the planet’s limits, whatever the pilot', () => {
    for (const planet of PLANETS) {
      const { trailMin, trailMax } = planetBalance(planet.id)
      for (const slipRate of [0, 0.03, 0.1, 0.3, 0.6, 1]) {
        for (const failStreak of [0, 1, 2, 5]) {
          for (const piecesHere of [0, 3]) {
            const { length } = trailTarget({ ...steady, planetId: planet.id, slipRate, failStreak, piecesHere })
            expect(length).toBeGreaterThanOrEqual(trailMin)
            expect(length).toBeLessThanOrEqual(trailMax)
          }
        }
      }
    }
  })

  it('keeps a shaky pilot’s trails within what their fuel can cover', () => {
    const shaky = trailTarget({ ...steady, planetId: 6, slipRate: 0.25 })
    const sure = trailTarget({ ...steady, planetId: 6, slipRate: 0.05 })
    expect(shaky.length).toBeLessThan(sure.length)
    expect(['capped', 'top-up']).toContain(shaky.reason)
  })

  it('shortens the trail after tows in a row and hands over spare fuel', () => {
    const planet = { ...steady, planetId: 8, slipRate: 0.05 }
    const none = trailTarget(planet)
    const one = trailTarget({ ...planet, failStreak: 1 })
    const two = trailTarget({ ...planet, failStreak: 2 })
    const three = trailTarget({ ...planet, failStreak: 3 })
    expect(one.length).toBeLessThan(none.length)
    expect(two.length).toBeLessThan(one.length)
    expect(three.length).toBe(planetBalance(8).trailMin)
    expect(two.spare).toBeGreaterThanOrEqual(TOW_STREAK_SPARES[2])
    expect(three.spare).toBeGreaterThanOrEqual(TOW_STREAK_SPARES[3])
    expect(three.reason).toBe('safety-net')
  })

  it('tops the tank up when even the shortest trail is risky', () => {
    const wobbly = trailTarget({ ...steady, planetId: 9, slipRate: 0.6 })
    expect(wobbly.spare).toBeGreaterThan(0)
    expect(wobbly.spare).toBeLessThanOrEqual(MAX_TOP_UP)
    expect(trailTarget({ ...steady, planetId: 9 }).spare).toBe(0)
  })

  it('makes a new pilot’s first hunts training flights', () => {
    expect(trailTarget({ ...steady, huntsFlown: 0 }).training).toBe(true)
    expect(trailTarget({ ...steady, huntsFlown: 2 }).training).toBe(true)
    expect(trailTarget({ ...steady, huntsFlown: 3 }).training).toBe(false)
  })
})

describe('The notebook’s rule: helpers make the next hunt harder, but it pays more', () => {
  const kit = (scanner: number, shields: number, robot: number, engines = 0): Upgrades => ({
    ...NO_UPGRADES,
    scanner,
    shields,
    robot,
    engines,
  })

  it('makes the trail want to be longer for every helper bought — but not for engines', () => {
    expect(desiredLength(3, 0, kit(1, 0, 0))).toBeGreaterThan(desiredLength(3, 0, NO_UPGRADES))
    expect(desiredLength(3, 0, kit(1, 1, 0))).toBeGreaterThan(desiredLength(3, 0, kit(1, 0, 0)))
    expect(desiredLength(3, 0, kit(0, 0, 0, 5))).toBe(desiredLength(3, 0, NO_UPGRADES))
  })

  it('takes the pilot one step deeper, and darker, every few helper levels', () => {
    expect(darknessFor(1, kit(1, 1, 0))).toBe(0)
    expect(darknessFor(1, kit(1, 1, 1))).toBe(1)
    expect(darknessFor(9, kit(4, 4, 3))).toBe(planetBalance(9).darkness + 3)
    // A bigger fuel tank helps too, so it counts.
    expect(darknessFor(1, { ...kit(1, 1, 0), tank: 1 })).toBe(1)
  })

  it('doesn’t count the star map or the magnet: one only shows where you are, the other only brings stardust', () => {
    const extras = { ...NO_UPGRADES, map: 2, magnet: 3 }
    expect(darknessFor(1, extras)).toBe(0)
    expect(desiredLength(3, 0, extras)).toBe(desiredLength(3, 0, NO_UPGRADES))
  })

  it('gives a bigger fuel tank room for more slips, and so a longer trail for a shaky pilot', () => {
    expect(slack({ ...NO_UPGRADES, tank: 1 })).toBe(slack(NO_UPGRADES) + 1)
    const shaky = { ...steady, planetId: 5, slipRate: 0.3 }
    expect(trailTarget({ ...shaky, upgrades: { ...NO_UPGRADES, tank: 3 } }).length).toBeGreaterThan(
      trailTarget({ ...shaky, upgrades: NO_UPGRADES }).length,
    )
  })

  it('never lets a scanner upgrade show fewer letters, even when it takes you deeper', () => {
    for (const planet of PLANETS) {
      for (let shields = 0; shields <= 4; shields++) {
        for (let robot = 0; robot <= 3; robot++) {
          for (let scanner = 0; scanner < 4; scanner++) {
            const before = visibleLetters(planet.id, kit(scanner, shields, robot))
            const after = visibleLetters(planet.id, kit(scanner + 1, shields, robot))
            expect(after, `planet ${planet.id}, scanner ${scanner}→${scanner + 1}`).toBeGreaterThanOrEqual(before)
          }
        }
      }
    }
  })

  it('always shows at least the next letter, however dark it gets', () => {
    for (const planet of PLANETS) expect(visibleLetters(planet.id, kit(0, 4, 3))).toBe(1)
  })

  it('lets a good scanner see further than no scanner at all', () => {
    expect(visibleLetters(1, kit(0, 0, 0))).toBe(1)
    expect(visibleLetters(1, kit(1, 0, 0))).toBe(3)
    expect(visibleLetters(8, kit(4, 0, 0))).toBeGreaterThan(visibleLetters(8, kit(2, 0, 0)))
  })
})

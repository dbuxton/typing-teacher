import { describe, expect, it } from 'vitest'
import { DEFAULT_LOOK } from '../data/makeovers'
import { PLANETS } from '../data/planets'
import { makePilot, type Pilot } from '../store/schema'
import {
  CLOVER_MULTIPLIER,
  FLARE_LETTERS,
  HISTORY_LIMIT,
  NO_UPGRADES,
  PET_BONUS,
  PIECES_PER_PLANET,
  PUPPY_FROM,
  PUPPY_TO,
  TANK_CANS,
  planetBalance,
} from './balance'
import { planHunt, type HuntPlan } from './plan'
import { settleHunt, totalPieces, TOTAL_PIECES } from './settle'
import type { HuntOutcome } from './trail'

function outcome(result: HuntOutcome['result'], extra: Partial<HuntOutcome> = {}): HuntOutcome {
  return {
    result,
    letters: 20,
    slips: 2,
    skipped: 0,
    wrongPresses: 3,
    accuracy: 0.9,
    keyAttempts: { a: 10, s: 10 },
    keyErrors: { a: 2 },
    banked: 20,
    loot: 0,
    petBonus: 0,
    petTricks: 0,
    tankLeft: 5,
    sparklesShown: 0,
    sparklesCaught: 0,
    elapsedMs: 20_000,
    ...extra,
  }
}

const pilotWith = (extra: Partial<Pilot> = {}): Pilot => ({ ...makePilot('Nova', '🧑‍🚀'), huntsFlown: 5, ...extra })
const planFor = (pilot: Pilot): HuntPlan => planHunt(pilot, 1)

describe('after a hunt', () => {
  it('adds the piece and the stardust when a piece is found', () => {
    const pilot = pilotWith({ failStreak: 2 })
    const { pilot: after, summary } = settleHunt(pilot, planFor(pilot), outcome('found'))
    expect(after.pieces[1]).toBe(1)
    expect(summary).toMatchObject({ pieceFound: true, piecesHere: 1, partComplete: false })
    expect(after.stardust).toBe(20 + planetBalance(1).pieceBonus + planetBalance(1).fuelBonus * 5)
    expect(after.stardustEarned).toBe(after.stardust)
    expect(after.failStreak).toBe(0)
    expect(after.huntsFlown).toBe(6)
    expect(after.huntsOnPlanet[1]).toBe(1)
  })

  it('pays but finds no piece on a planet already finished', () => {
    const pilot = pilotWith({ pieces: { 1: 3 } })
    const { pilot: after, summary } = settleHunt(pilot, planFor(pilot), outcome('found'))
    expect(after.pieces[1]).toBe(3)
    expect(summary.pieceFound).toBe(false)
    expect(summary.payout.piece).toBe(0)
    expect(after.stardust).toBeGreaterThan(0)
  })

  it('keeps banked stardust after a tow, and counts the tow towards the safety nets', () => {
    const pilot = pilotWith({ failStreak: 1 })
    const { pilot: after } = settleHunt(pilot, planFor(pilot), outcome('towed', { tankLeft: 0, loot: 6 }))
    expect(after.pieces[1]).toBeUndefined()
    expect(after.stardust).toBe(26)
    expect(after.failStreak).toBe(2)
    expect(after.timesTowed).toBe(1)
  })

  it('changes nothing at all for a hunt abandoned before a single letter', () => {
    const pilot = pilotWith()
    expect(settleHunt(pilot, planFor(pilot), outcome('aborted', { letters: 0, banked: 0 })).pilot).toBe(pilot)
  })

  it('keeps what was banked when a pilot heads back to base, without calling it a failure', () => {
    const pilot = pilotWith({ failStreak: 1 })
    const { pilot: after } = settleHunt(pilot, planFor(pilot), outcome('aborted', { letters: 12, banked: 9 }))
    expect(after.stardust).toBe(9)
    expect(after.failStreak).toBe(1)
    expect(after.history.at(-1)?.result).toBe('aborted')
  })

  it('completes a part with its third piece, and the ship with its last part', () => {
    const nearly = pilotWith({ pieces: { 1: PIECES_PER_PLANET - 1 } })
    expect(settleHunt(nearly, planFor(nearly), outcome('found')).summary).toMatchObject({
      partComplete: true,
      shipComplete: false,
    })

    const allButOne: Record<number, number> = {}
    for (const planet of PLANETS) allButOne[planet.id] = PIECES_PER_PLANET
    allButOne[10] = PIECES_PER_PLANET - 1
    const lastPiece = pilotWith({ planet: 10, highestPlanet: 10, pieces: allButOne })
    const { pilot: done, summary } = settleHunt(lastPiece, planFor(lastPiece), outcome('found', { keyAttempts: { Shift: 3 } }))
    expect(summary).toMatchObject({ partComplete: true, shipComplete: true })
    expect(totalPieces(done)).toBe(TOTAL_PIECES)
  })

  it('remembers how the planet’s new keys went, for the navigator', () => {
    const pilot = pilotWith()
    const { pilot: after } = settleHunt(pilot, planFor(pilot), outcome('found'))
    expect(after.history.at(-1)).toMatchObject({ planet: 1, newKeyTries: 20, newKeySlips: 2, result: 'found' })
  })

  it('learns which keys slip, and how shaky the pilot is', () => {
    const pilot = pilotWith({ keyStats: { a: { attempts: 5, errors: 0 } }, slipRate: 0.05 })
    const { pilot: after } = settleHunt(pilot, planFor(pilot), outcome('found', { slips: 6 }))
    expect(after.keyStats.a).toEqual({ attempts: 15, errors: 2 })
    expect(after.slipRate).toBeGreaterThan(0.05)
  })

  it('keeps only the most recent hunts', () => {
    let pilot = pilotWith()
    for (let i = 0; i < HISTORY_LIMIT + 5; i++) pilot = settleHunt(pilot, planFor(pilot), outcome('found')).pilot
    expect(pilot.history).toHaveLength(HISTORY_LIMIT)
  })
})

describe('gadgets, a bigger tank and pets', () => {
  const loaded = { fuel: 2, shield: 1, flare: 1, clover: 1 }

  it('fills the tank the fuel-tank level buys', () => {
    expect(planFor(pilotWith()).tank).toBe(TANK_CANS[0])
    expect(planFor(pilotWith({ upgrades: { ...NO_UPGRADES, tank: 2 } })).tank).toBe(TANK_CANS[2])
  })

  it('uses every loaded gadget on the next hunt, and only that one', () => {
    const plain = planFor(pilotWith())
    const pilot = pilotWith({ cargo: loaded })
    const plan = planFor(pilot)
    expect(plan.gadgets).toEqual(loaded)
    expect(plan.spare).toBe(plain.spare + 2)
    expect(plan).toMatchObject({ shields: plain.shields + 1, maxShields: plain.maxShields + 1 })
    expect(plan.visible).toBe(plain.visible + FLARE_LETTERS)
    expect(plan.stardustPerLetter).toBe(plain.stardustPerLetter * CLOVER_MULTIPLIER)
    // The trail doesn't grow to swallow them: they're a head start, not a harder hunt.
    expect(plan.text).toBe(plain.text)

    const { pilot: after, summary } = settleHunt(pilot, plan, outcome('found'))
    expect(after.cargo).toEqual({ fuel: 0, shield: 0, flare: 0, clover: 0 })
    expect(summary.gadgets).toEqual(loaded)
  })

  it('saves extra fuel and shields for after the training flights, when they can matter', () => {
    const pilot = pilotWith({ huntsFlown: 0, cargo: loaded })
    const plan = planFor(pilot)
    expect(plan.training).toBe(true)
    expect(plan.gadgets).toEqual({ fuel: 0, shield: 0, flare: 1, clover: 1 })
    expect(settleHunt(pilot, plan, outcome('found')).pilot.cargo).toEqual({ fuel: 2, shield: 1, flare: 0, clover: 0 })
  })

  it('keeps the gadgets when a pilot backs out before typing a letter', () => {
    const pilot = pilotWith({ cargo: loaded })
    const { pilot: after } = settleHunt(pilot, planFor(pilot), outcome('aborted', { letters: 0, banked: 0 }))
    expect(after.cargo).toEqual(loaded)
  })

  it('takes the chosen pet along, and pays for its tricks', () => {
    expect(planFor(pilotWith()).pet).toBeNull()
    const pilot = pilotWith({ owned: ['pet:puppy'], look: { ...DEFAULT_LOOK, pet: 'pet:puppy' } })
    const plan = planFor(pilot)
    expect(plan.pet).toMatchObject({ id: 'puppy', bonus: Math.round(PET_BONUS.puppy * plan.stardustPerLetter) })
    expect(plan.pet!.fetchAt).toBeGreaterThanOrEqual(Math.ceil(plan.text.length * PUPPY_FROM))
    expect(plan.pet!.fetchAt).toBeLessThanOrEqual(Math.floor(plan.text.length * PUPPY_TO))

    const { pilot: after, summary } = settleHunt(pilot, plan, outcome('found', { petBonus: 3, petTricks: 1 }))
    expect(summary).toMatchObject({ pet: 'pet:puppy', petTricks: 1, payout: { pet: 3 } })
    expect(after.stardust).toBe(summary.payout.total)
  })
})

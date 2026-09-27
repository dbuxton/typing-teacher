import { describe, expect, it } from 'vitest'
import process from 'node:process'
import { makeRng, type Rng } from '../../engine/rng'
import { PLANET_COUNT, getPlanet } from '../data/planets'
import { makePilot, type Pilot } from '../store/schema'
import { TRAINING_FLIGHTS, type TrackId } from './balance'
import { buyUpgrade, launch, stockStatus } from './economy'
import { planHunt } from './plan'
import { settleHunt, TOTAL_PIECES, totalPieces } from './settle'
import { initTrail, makeTrailReducer, outcomeOf } from './trail'

/**
 * Whole journeys through the galaxy, flown by simulated kids.
 *
 * This runs the REAL game — planHunt, the trail reducer keystroke by keystroke,
 * settleHunt, the shop and the launch rules — so the balance numbers are tested
 * as they are actually used, not as a model of them. It's how the design
 * promises are kept honest:
 *
 *  - every kid can finish, however shaky;
 *  - running out of fuel is real but occasional, and never happens in a row
 *    more than a few times;
 *  - trails grow as the kid does, and a shaky kid gets shorter ones;
 *  - buying helpers pays off.
 *
 * Kids are modelled simply: a chance of slipping on each letter that is higher
 * on keys new to them (and eases as they practise), eases a little overall as
 * they type more, wobbles from hunt to hunt, and drops a bit when the scanner
 * lets them read ahead. Set JOURNEY_REPORT=1 to print the numbers.
 */

type Shopping = 'mixed' | 'never' | 'everything'
type Kid = { name: string; slip: number; shopping: Shopping }

type Journey = {
  hunts: number
  finished: boolean
  tows: number
  towedInTraining: boolean
  longestTowStreak: number
  huntsPerPlanet: number[]
  lengthsPerPlanet: number[][]
}

const HELPERS: TrackId[] = ['scanner', 'shields', 'robot']
const MAX_HUNTS = 600

function flyHunt(pilot: Pilot, kid: Kid, rng: Rng, seed: number, lettersSoFar: number) {
  const plan = planHunt(pilot, seed)
  const reducer = makeTrailReducer(plan)
  const planet = getPlanet(plan.planetId)
  let state = initTrail(plan)

  const wobble = 0.6 + 0.9 * rng()
  const readingAhead = 1 - Math.min(0.24, 0.06 * (plan.visible - 1))
  const practice = 0.55 + 0.45 * Math.exp(-lettersSoFar / 4000)
  const shown = new Set<number>()
  let now = 0

  while (state.status === 'flying') {
    if (plan.sparkles.includes(state.cursor) && !shown.has(state.cursor)) {
      shown.add(state.cursor)
      state = reducer(state, { type: 'sparkle-show', id: state.cursor })
      if (rng() < 0.6) state = reducer(state, { type: 'catch' })
      state = reducer(state, { type: 'sparkle-hide', id: state.cursor })
    }
    const expected = plan.text[state.cursor]
    const key = expected.toLowerCase()
    const isNew = planet.newKeys.includes(key) || (expected !== key && planet.newKeys.includes('Shift'))
    const newness = isNew ? 1 + Math.exp(-(pilot.keyStats[key]?.attempts ?? 0) / 60) : 1
    const chance = Math.min(0.9, kid.slip * practice * wobble * readingAhead * newness)

    if (rng() < chance) {
      state = reducer(state, { type: 'key', char: '~', capsLock: false, now })
      // Some kids hammer away at a key they can't find. Repeats are free.
      while (state.status === 'flying' && rng() < 0.3) state = reducer(state, { type: 'key', char: '~', capsLock: false, now })
      if (state.status !== 'flying') break
      if (state.offerSkip) {
        state = reducer(state, { type: 'skip', now })
        continue
      }
    }
    now += 300
    state = reducer(state, { type: 'key', char: expected, capsLock: false, now })
  }
  const outcome = outcomeOf(state, now)
  return { plan, outcome, settled: settleHunt(pilot, plan, outcome, '2026-09-27') }
}

function shop(pilot: Pilot, kid: Kid, boughtHere: Set<number>): Pilot {
  let current = pilot
  const tryBuy = (track: TrackId) => {
    const bought = buyUpgrade(current, track)
    if (bought) current = bought
    return bought !== null
  }
  // Everyone buys the engine once this planet is done.
  if ((current.pieces[current.highestPlanet] ?? 0) >= 3) tryBuy('engines')
  if (kid.shopping === 'never') return current

  const cheapest = () =>
    HELPERS.map((track) => ({ track, stock: stockStatus(current, track) }))
      .filter((option) => option.stock.status === 'buy')
      .sort((a, b) => (a.stock.status === 'buy' && b.stock.status === 'buy' ? a.stock.next.price - b.stock.next.price : 0))[0]

  if (kid.shopping === 'everything') {
    for (let option = cheapest(); option; option = cheapest()) tryBuy(option.track)
    tryBuy('engines')
    return current
  }
  // Mixed: one helper per planet, then save up for the engine.
  if (!boughtHere.has(current.highestPlanet)) {
    const option = cheapest()
    if (option && tryBuy(option.track)) boughtHere.add(current.highestPlanet)
  }
  return current
}

function journey(kid: Kid, seed: number): Journey {
  const rng = makeRng(seed)
  let pilot = makePilot('Sim', '🤖')
  const boughtHere = new Set<number>()
  const result: Journey = {
    hunts: 0,
    finished: false,
    tows: 0,
    towedInTraining: false,
    longestTowStreak: 0,
    huntsPerPlanet: Array(PLANET_COUNT).fill(0),
    lengthsPerPlanet: Array.from({ length: PLANET_COUNT }, () => []),
  }
  let letters = 0
  let streak = 0

  while (result.hunts < MAX_HUNTS && totalPieces(pilot) < TOTAL_PIECES) {
    const { plan, outcome, settled } = flyHunt(pilot, kid, rng, seed * 1000 + result.hunts, letters)
    if (outcome.result === 'towed') {
      result.tows++
      streak++
      result.longestTowStreak = Math.max(result.longestTowStreak, streak)
      if (result.hunts < TRAINING_FLIGHTS) result.towedInTraining = true
    } else {
      streak = 0
    }
    letters += outcome.letters
    result.hunts++
    result.huntsPerPlanet[plan.planetId - 1]++
    result.lengthsPerPlanet[plan.planetId - 1].push(plan.text.length)

    pilot = shop(settled.pilot, kid, boughtHere)
    pilot = launch(pilot) ?? pilot
  }
  result.finished = totalPieces(pilot) === TOTAL_PIECES
  return result
}

const SEEDS = 20
const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / Math.max(values.length, 1)

function fly(kid: Kid) {
  const journeys = Array.from({ length: SEEDS }, (_, i) => journey(kid, i + 1))
  const hunts = journeys.map((j) => j.hunts)
  const summary = {
    kid,
    journeys,
    finishedAll: journeys.every((j) => j.finished),
    meanHunts: mean(hunts),
    maxHunts: Math.max(...hunts),
    towRate: mean(journeys.map((j) => j.tows)) / mean(hunts),
    longestTowStreak: Math.max(...journeys.map((j) => j.longestTowStreak)),
    towedInTraining: journeys.some((j) => j.towedInTraining),
    worstPlanet: Math.max(...journeys.flatMap((j) => j.huntsPerPlanet)),
    lengthOn: (planet: number) => mean(journeys.flatMap((j) => j.lengthsPerPlanet[planet - 1])),
    huntsOn: (planet: number) => mean(journeys.map((j) => j.huntsPerPlanet[planet - 1])),
  }
  if (process.env.JOURNEY_REPORT) {
    const lengths = Array.from({ length: PLANET_COUNT }, (_, i) => summary.lengthOn(i + 1).toFixed(0)).join(' ')
    const perPlanet = Array.from({ length: PLANET_COUNT }, (_, i) => summary.huntsOn(i + 1).toFixed(1)).join(' ')
    console.log(
      `${kid.name.padEnd(22)} hunts ${summary.meanHunts.toFixed(0)} (max ${summary.maxHunts}) · tows ${(summary.towRate * 100).toFixed(1)}% · ` +
        `streak ${summary.longestTowStreak} · worst planet ${summary.worstPlanet}\n` +
        `${' '.repeat(22)} hunts/planet ${perPlanet}\n${' '.repeat(22)} trail length ${lengths}`,
    )
  }
  return summary
}

const expert = fly({ name: 'expert (97%)', slip: 0.03, shopping: 'mixed' })
const steady = fly({ name: 'steady (90%)', slip: 0.1, shopping: 'mixed' })
const wobbly = fly({ name: 'wobbly (83%)', slip: 0.17, shopping: 'mixed' })
const struggling = fly({ name: 'struggling (75%)', slip: 0.25, shopping: 'mixed' })
const veryWeak = fly({ name: 'very weak (60%)', slip: 0.4, shopping: 'mixed' })
const steadyMiser = fly({ name: 'steady, never buys', slip: 0.1, shopping: 'never' })
const steadySpender = fly({ name: 'steady, buys it all', slip: 0.1, shopping: 'everything' })

describe('simulated journeys through the galaxy', () => {
  const everyone = [expert, steady, wobbly, struggling, veryWeak, steadyMiser, steadySpender]

  it('lets every kid rebuild the Lost Ship, however shaky', () => {
    for (const run of everyone) expect(run.finishedAll, run.kid.name).toBe(true)
  })

  it('takes a steady kid a good few sessions — long enough to learn the keys, short enough to finish', () => {
    expect(steady.meanHunts).toBeGreaterThan(40)
    expect(steady.meanHunts).toBeLessThan(80)
    expect(expert.meanHunts).toBeLessThan(steady.meanHunts)
    // No planet drags on for a steady kid, even with bad luck.
    expect(steady.worstPlanet).toBeLessThanOrEqual(20)
  })

  it('gives a shaky kid more practice, but never strands them on a planet for ever', () => {
    expect(struggling.meanHunts).toBeLessThan(230)
    expect(veryWeak.worstPlanet).toBeLessThan(160)
  })

  it('makes running out of fuel real but occasional', () => {
    expect(steady.towRate).toBeLessThan(0.05)
    expect(struggling.towRate).toBeLessThan(0.12)
    expect(veryWeak.towRate).toBeLessThan(0.15)
    // …and genuinely possible: a shaky pilot does get towed now and then.
    expect(wobbly.towRate).toBeGreaterThan(0.02)
  })

  it('never tows a pilot on a training flight, or more than three times running', () => {
    for (const run of everyone) {
      expect(run.towedInTraining, run.kid.name).toBe(false)
      expect(run.longestTowStreak, run.kid.name).toBeLessThanOrEqual(3)
    }
  })

  it('makes trails longer as the kid travels, and shorter for a shakier kid', () => {
    expect(steady.lengthOn(PLANET_COUNT)).toBeGreaterThan(steady.lengthOn(1) * 2)
    for (let planet = 1; planet <= PLANET_COUNT; planet++) {
      expect(struggling.lengthOn(planet), `planet ${planet}`).toBeLessThan(steady.lengthOn(planet))
    }
  })

  it('makes helpers worth buying', () => {
    expect(steady.meanHunts).toBeLessThan(steadyMiser.meanHunts)
    expect(steady.towRate).toBeLessThan(steadyMiser.towRate)
  })

  it('stops a kid who buys everything on sight from grinding one planet to save up', () => {
    expect(steadySpender.worstPlanet).toBeLessThanOrEqual(16)
  })
})

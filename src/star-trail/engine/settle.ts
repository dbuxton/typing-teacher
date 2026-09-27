import { PLANET_COUNT, getPlanet } from '../data/planets'
import { today, type HuntRecord, type KeyStat, type Pilot } from '../store/schema'
import { HISTORY_LIMIT, MIN_LETTERS_TO_LEARN_FROM, PIECES_PER_PLANET } from './balance'
import { nextSlipRate } from './difficulty'
import { payoutFor, type Payout } from './economy'
import { helpAfterHunt, type HelpLevel } from './help'
import type { HuntPlan } from './plan'
import type { HuntOutcome, HuntResult } from './trail'

/**
 * What a hunt changes once it's over: pieces, stardust, the skill estimate, the
 * keyboard help, the memory of which keys slip. Pure, and shared by the store
 * and the journey simulation.
 */

export const TOTAL_PIECES = PLANET_COUNT * PIECES_PER_PLANET

export function totalPieces(pilot: Pilot): number {
  return Object.values(pilot.pieces).reduce((sum, n) => sum + n, 0)
}

export type HuntSummary = {
  result: HuntResult
  planetId: number
  practice: boolean
  text: string
  payout: Payout
  accuracy: number
  letters: number
  slips: number
  sparklesCaught: number
  pieceFound: boolean
  /** Pieces now found on this planet. */
  piecesHere: number
  /** This piece finished a whole part of the Lost Ship. */
  partComplete: boolean
  /** …and that part was the last one. */
  shipComplete: boolean
  helpBefore: HelpLevel
  helpAfter: HelpLevel
}

export function mergeKeyStats(
  stats: Record<string, KeyStat>,
  attempts: Record<string, number>,
  errors: Record<string, number>,
): Record<string, KeyStat> {
  const merged = { ...stats }
  for (const [key, tries] of Object.entries(attempts)) {
    const before = merged[key] ?? { attempts: 0, errors: 0 }
    merged[key] = { attempts: before.attempts + tries, errors: before.errors + (errors[key] ?? 0) }
  }
  return merged
}

export function settleHunt(
  pilot: Pilot,
  plan: HuntPlan,
  outcome: HuntOutcome,
  date = today(),
): { pilot: Pilot; summary: HuntSummary } {
  const planet = getPlanet(plan.planetId)
  const payout = payoutFor(plan.planetId, plan.practice, outcome)
  const found = outcome.result === 'found'
  const pieceFound = found && !plan.practice
  const piecesBefore = pilot.pieces[planet.id] ?? 0
  const piecesHere = pieceFound ? Math.min(PIECES_PER_PLANET, piecesBefore + 1) : piecesBefore
  const partComplete = pieceFound && piecesHere === PIECES_PER_PLANET

  const summary = (next: Pilot): HuntSummary => ({
    result: outcome.result,
    planetId: planet.id,
    practice: plan.practice,
    text: plan.text,
    payout,
    accuracy: outcome.accuracy,
    letters: outcome.letters,
    slips: outcome.slips,
    sparklesCaught: outcome.sparklesCaught,
    pieceFound,
    piecesHere,
    partComplete,
    shipComplete: partComplete && totalPieces(next) === TOTAL_PIECES,
    helpBefore: pilot.help,
    helpAfter: next.help,
  })

  // Backing out before typing anything changes nothing at all.
  if (outcome.result === 'aborted' && outcome.letters === 0) return { pilot, summary: summary(pilot) }

  // A hunt abandoned after a couple of letters is too short to learn from.
  const counts = outcome.result !== 'aborted' || outcome.letters >= MIN_LETTERS_TO_LEARN_FROM

  let newKeyTries = 0
  let newKeySlips = 0
  for (const key of planet.newKeys) {
    newKeyTries += outcome.keyAttempts[key] ?? 0
    newKeySlips += outcome.keyErrors[key] ?? 0
  }
  const record: HuntRecord = {
    planet: planet.id,
    result: outcome.result,
    practice: plan.practice,
    letters: outcome.letters,
    slips: outcome.slips,
    accuracy: outcome.accuracy,
    newKeyTries,
    newKeySlips,
    stardust: payout.total,
    help: plan.help,
    date,
  }
  const history = [...pilot.history, record].slice(-HISTORY_LIMIT)

  const next: Pilot = {
    ...pilot,
    pieces: pieceFound ? { ...pilot.pieces, [planet.id]: piecesHere } : pilot.pieces,
    stardust: pilot.stardust + payout.total,
    stardustEarned: pilot.stardustEarned + payout.total,
    slipRate: counts ? nextSlipRate(pilot.slipRate, outcome.slips, outcome.letters) : pilot.slipRate,
    // Safety nets count tows in a row; finding a piece resets them, backing out doesn't.
    failStreak: outcome.result === 'towed' ? pilot.failStreak + 1 : found ? 0 : pilot.failStreak,
    keyStats: mergeKeyStats(pilot.keyStats, outcome.keyAttempts, outcome.keyErrors),
    huntsFlown: counts ? pilot.huntsFlown + 1 : pilot.huntsFlown,
    huntsOnPlanet: counts
      ? { ...pilot.huntsOnPlanet, [planet.id]: (pilot.huntsOnPlanet[planet.id] ?? 0) + 1 }
      : pilot.huntsOnPlanet,
    timesTowed: outcome.result === 'towed' ? pilot.timesTowed + 1 : pilot.timesTowed,
    help: counts ? helpAfterHunt(history, pilot.help) : pilot.help,
    history,
  }
  return { pilot: next, summary: summary(next) }
}

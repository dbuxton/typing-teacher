import { weightedSample, type Rng } from '../../engine/rng'
import { PLANETS, getPlanet, keysFor } from '../data/planets'
import { SENTENCES } from '../data/sentences'
import type { KeyStat } from '../store/schema'

/**
 * Choosing the message a trail spells out.
 *
 * Messages near the target length are favoured, and so are messages that
 * practise the planet's new keys and the keys this pilot keeps slipping on.
 * Earlier planets' messages turn up now and then as familiar ground. The last
 * few messages flown here are left out, so the kid reads rather than remembers.
 *
 * Every planet's bank has messages right up to its longest trail (data.test.ts
 * checks that), so one message always gets close to the length wanted.
 */

/** Earlier planets' messages join the mix, less often: familiar ground between new keys. */
export const EARLIER_WEIGHT = 0.3
/** A key needs this many tries before its slip rate means anything. */
const MIN_TRIES_FOR_WEAKNESS = 5
/** Keys slipping at least this often count as weak. */
const WEAK_RATE = 0.15

/** Keys this pilot often slips on, with how often. */
export function weakKeyRates(keyStats: Record<string, KeyStat>): Map<string, number> {
  const weak = new Map<string, number>()
  for (const [key, stat] of Object.entries(keyStats)) {
    if (stat.attempts < MIN_TRIES_FOR_WEAKNESS) continue
    const rate = stat.errors / stat.attempts
    if (rate >= WEAK_RATE) weak.set(key, rate)
  }
  return weak
}

/** Every key a message uses, worked out once per message rather than once per hunt. */
const keysOfMessage = new Map<string, Set<string>>()
function keysIn(text: string): Set<string> {
  let keys = keysOfMessage.get(text)
  if (!keys) {
    keys = new Set([...text].flatMap(keysFor))
    keysOfMessage.set(text, keys)
  }
  return keys
}

function closeness(length: number, target: number): number {
  const spread = Math.max(3, target * 0.3)
  return Math.exp(-(((length - target) / spread) ** 2))
}

export function pickTrail(input: {
  planetId: number
  target: number
  keyStats: Record<string, KeyStat>
  recent: readonly string[]
  rng: Rng
}): string {
  const planet = getPlanet(input.planetId)
  const weak = weakKeyRates(input.keyStats)
  const recent = new Set(input.recent)

  const pool = PLANETS.filter((p) => p.id <= planet.id).flatMap((p) =>
    (SENTENCES[p.id] ?? []).map((text) => ({ text, base: p.id === planet.id ? 1 : EARLIER_WEIGHT })),
  )
  const fresh = pool.filter((candidate) => !recent.has(candidate.text))
  const candidates = fresh.length >= 3 ? fresh : pool

  function usefulness(text: string): number {
    const keys = keysIn(text)
    let weakness = 0
    for (const [key, rate] of weak) if (keys.has(key)) weakness += rate
    const newKeys = planet.newKeys.filter((key) => keys.has(key)).length
    return (1 + 2 * newKeys) * (1 + 3 * weakness)
  }

  const [chosen] = weightedSample(
    input.rng,
    candidates,
    1,
    (c) => c.base * usefulness(c.text) * closeness(c.text.length, input.target),
  )
  return chosen.text
}

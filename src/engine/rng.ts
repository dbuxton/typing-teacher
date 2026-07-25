/**
 * A tiny seeded PRNG (mulberry32). Everything that picks something at random in
 * the engine takes one of these, so lessons are reproducible in tests and a
 * lesson replayed offers the same Sneaky Stars.
 */
export type Rng = () => number

export function makeRng(seed: number): Rng {
  let a = seed >>> 0
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)]
}

/** Fisher-Yates, non-mutating. */
export function shuffle<T>(rng: Rng, items: readonly T[]): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * Weighted pick without replacement. `weight` must return a positive number;
 * heavier items are more likely to come out early.
 */
export function weightedSample<T>(
  rng: Rng,
  items: readonly T[],
  count: number,
  weight: (item: T) => number,
): T[] {
  const pool = items.map((item) => ({ item, w: Math.max(weight(item), 0.0001) }))
  const out: T[] = []
  while (out.length < count && pool.length > 0) {
    const total = pool.reduce((sum, entry) => sum + entry.w, 0)
    let target = rng() * total
    let index = 0
    while (index < pool.length - 1 && target > pool[index].w) {
      target -= pool[index].w
      index++
    }
    out.push(pool[index].item)
    pool.splice(index, 1)
  }
  return out
}

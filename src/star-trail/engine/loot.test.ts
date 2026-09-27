import { describe, expect, it } from 'vitest'
import { makeRng } from '../../engine/rng'
import { MAX_SPARKLES, SPARKLE_FROM, SPARKLE_TO } from './balance'
import { scheduleSparkles } from './loot'

describe('stardust sparkles', () => {
  it('drift past only when there is a robot, or as a single nudge before one is bought', () => {
    expect(scheduleSparkles(40, 0, makeRng(1), false)).toEqual([])
    expect(scheduleSparkles(40, 0, makeRng(1), true)).toHaveLength(1)
  })

  it('are the same for the same seed', () => {
    expect(scheduleSparkles(50, 2, makeRng(9), false)).toEqual(scheduleSparkles(50, 2, makeRng(9), false))
  })

  it('stay away from the very start and end of the trail', () => {
    for (let seed = 0; seed < 50; seed++) {
      for (const length of [10, 25, 60]) {
        for (const level of [1, 2, 3]) {
          const at = scheduleSparkles(length, level, makeRng(seed), false)
          expect(at.length).toBeGreaterThanOrEqual(1)
          expect(at.length).toBeLessThanOrEqual(MAX_SPARKLES)
          expect([...at].sort((a, b) => a - b)).toEqual(at)
          expect(new Set(at).size).toBe(at.length)
          for (const position of at) {
            expect(position).toBeGreaterThanOrEqual(Math.ceil(length * SPARKLE_FROM))
            expect(position).toBeLessThan(Math.floor(length * SPARKLE_TO))
          }
        }
      }
    }
  })

  it('come more often with a better robot', () => {
    const basic = scheduleSparkles(60, 1, makeRng(3), false).length
    const best = scheduleSparkles(60, 3, makeRng(3), false).length
    expect(best).toBeGreaterThan(basic)
  })
})

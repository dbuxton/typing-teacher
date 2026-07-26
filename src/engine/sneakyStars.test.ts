import { describe, expect, it } from 'vitest'
import { catchKeyFor, scheduleStars, starDueAt, STARS_PER_LESSON } from './sneakyStars'
import { makeRng } from './rng'
import { LEVELS, isTypeable } from '../data/curriculum'

describe('the catch key', () => {
  // If the catch key were a key the kid has to type, catching a star would
  // inject a typo — the reward and the task would fight each other.
  it('is never a key the level asks the kid to type', () => {
    for (const level of LEVELS) {
      const key = catchKeyFor(level.id)
      expect(level.allKeys).not.toContain(key)
      expect(isTypeable(key, level.allKeys)).toBe(false)
    }
  })
})

describe('scheduling', () => {
  it('is deterministic for a seed', () => {
    const a = scheduleStars(10, makeRng(5))
    const b = scheduleStars(10, makeRng(5))
    expect(a).toEqual(b)
  })

  it('offers at most one star per item', () => {
    const schedule = scheduleStars(10, makeRng(3))
    const indices = schedule.map((s) => s.itemIndex)
    expect(new Set(indices).size).toBe(indices.length)
  })

  it('never schedules more stars than there are items', () => {
    expect(scheduleStars(2, makeRng(1)).length).toBe(2)
    expect(scheduleStars(20, makeRng(1)).length).toBe(STARS_PER_LESSON)
  })

  it('copes with an empty lesson', () => {
    expect(scheduleStars(0, makeRng(1))).toEqual([])
  })

  it('never fires on the very first or very last keystroke of an item', () => {
    for (let seed = 0; seed < 50; seed++) {
      for (const entry of scheduleStars(10, makeRng(seed))) {
        expect(entry.atFraction).toBeGreaterThan(0.1)
        expect(entry.atFraction).toBeLessThan(0.9)
      }
    }
  })
})

describe('firing', () => {
  it('fires once the kid has typed far enough into the item', () => {
    const schedule = [{ itemIndex: 2, atFraction: 0.5 }]
    expect(starDueAt(schedule, 2, 2, 10)).toBe(false)
    expect(starDueAt(schedule, 2, 5, 10)).toBe(true)
  })

  it('does not fire on items with no star scheduled', () => {
    const schedule = [{ itemIndex: 2, atFraction: 0.5 }]
    expect(starDueAt(schedule, 3, 10, 10)).toBe(false)
  })

  it('does not divide by zero on an empty item', () => {
    expect(starDueAt([{ itemIndex: 0, atFraction: 0.5 }], 0, 0, 0)).toBe(false)
  })
})

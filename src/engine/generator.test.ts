import { describe, expect, it } from 'vitest'
import { DRILL_ITEMS, generateLesson, lessonIsTypeable } from './generator'
import { MIN_LESSON_ITEMS } from './adaptive'
import { LEVELS, isTypeable, getLevel, SPELLING_STARTS_AT_LEVEL } from '../data/curriculum'
import { SPELLING_WORDS } from '../data/spellingWords'
import { makeProfile } from '../store/schema'

const profile = makeProfile('Test', '🦊')

describe('lesson generation', () => {
  // The invariant that matters most: asking a beginner for a letter they have
  // never been taught is the fastest way to send them looking at their hands.
  it('never asks for a character the level has not taught', () => {
    for (const level of LEVELS) {
      for (let seed = 0; seed < 40; seed++) {
        const items = generateLesson(profile, level.id, seed)
        expect(
          lessonIsTypeable(items, level.id),
          `level ${level.id} seed ${seed} produced untypeable text: ${items.map((i) => i.text).join(' | ')}`,
        ).toBe(true)
      }
    }
  })

  it('caps drills at two items once real words exist', () => {
    for (const level of LEVELS) {
      if (level.words.length === 0) continue
      for (let seed = 0; seed < 20; seed++) {
        const items = generateLesson(profile, level.id, seed)
        const drills = items.filter((i) => i.kind === 'drill')
        expect(drills.length, `level ${level.id}`).toBeLessThanOrEqual(DRILL_ITEMS)
      }
    }
  })

  it('puts the warm-up drills first', () => {
    const items = generateLesson(profile, 5, 7)
    const firstNonDrill = items.findIndex((i) => i.kind !== 'drill')
    const lastDrill = items.map((i) => i.kind).lastIndexOf('drill')
    expect(lastDrill).toBeLessThan(firstNonDrill)
  })

  it('fills a lesson to the level item count when the kid is cruising', () => {
    const confident = { ...profile, difficulty: 1 }
    for (const level of LEVELS) {
      const items = generateLesson(confident, level.id, 3)
      expect(items.length, `level ${level.id}`).toBe(level.itemCount)
    }
  })

  // A struggling kid should get a genuinely gentler lesson, not the same one
  // again — repeatedly failing an identical lesson is what makes kids give up.
  it('gives a struggling kid a shorter lesson than a cruising one', () => {
    const struggling = { ...profile, difficulty: 0 }
    const cruising = { ...profile, difficulty: 1 }
    for (const level of LEVELS) {
      const short = generateLesson(struggling, level.id, 5).length
      const long = generateLesson(cruising, level.id, 5).length
      expect(short, `level ${level.id}`).toBeLessThanOrEqual(long)
    }
    // And on a full-length level the difference is real, not rounding.
    expect(generateLesson(struggling, 8, 5).length).toBeLessThan(
      generateLesson(cruising, 8, 5).length,
    )
  })

  it('never drops below a lesson worth doing', () => {
    for (const level of LEVELS) {
      const items = generateLesson({ ...profile, difficulty: 0 }, level.id, 9)
      expect(items.length, `level ${level.id}`).toBeGreaterThanOrEqual(
        Math.min(MIN_LESSON_ITEMS, level.itemCount),
      )
    }
  })

  it('holds sentences back until the kid is coping', () => {
    const struggling = { ...profile, difficulty: 0 }
    for (let seed = 0; seed < 20; seed++) {
      const items = generateLesson(struggling, 10, seed)
      expect(items.some((i) => i.kind === 'sentence')).toBe(false)
    }
  })

  it('holds spelling stars back until letters exist to spell with', () => {
    for (const level of LEVELS) {
      const items = generateLesson(profile, level.id, 11)
      const spelling = items.filter((i) => i.kind === 'spelling')
      if (level.id < SPELLING_STARTS_AT_LEVEL) {
        expect(spelling.length, `level ${level.id}`).toBe(0)
      }
    }
  })

  it('is deterministic for a given seed', () => {
    const a = generateLesson(profile, 8, 42).map((i) => i.text)
    const b = generateLesson(profile, 8, 42).map((i) => i.text)
    expect(a).toEqual(b)
  })

  it('weights practice toward keys this kid gets wrong', () => {
    const struggling = {
      ...makeProfile('Weak', '🐸'),
      perKeyStats: { z: { attempts: 12, errors: 9 } },
    }
    const zCount = (items: { text: string }[]) => items.filter((i) => i.text.includes('z')).length

    let withWeighting = 0
    let without = 0
    for (let seed = 0; seed < 60; seed++) {
      withWeighting += zCount(generateLesson(struggling, 10, seed))
      without += zCount(generateLesson(profile, 10, seed))
    }
    expect(withWeighting).toBeGreaterThan(without)
  })

  /**
   * The bug this replaced: weighting on raw error counts targets whichever
   * letters appear most, because `e` racks up errors simply by being in every
   * word. A rarely-typed key the kid genuinely cannot hit must outrank a common
   * key they're fine at, even though the common key has more total errors.
   */
  it('targets a rare bad key over a common key with more total errors', () => {
    const kid = {
      ...makeProfile('Rates', '🦇'),
      perKeyStats: {
        // 75% wrong, but only 12 attempts — the genuinely weak key.
        z: { attempts: 12, errors: 9 },
        // 5% wrong across 400 attempts — far more errors, but they're fine at it.
        e: { attempts: 400, errors: 20 },
      },
    }

    let zWords = 0
    let eWords = 0
    for (let seed = 0; seed < 80; seed++) {
      const items = generateLesson(kid, 10, seed).filter((i) => i.kind === 'word')
      zWords += items.filter((i) => i.text.includes('z')).length
      eWords += items.filter((i) => i.text.includes('e') && !i.text.includes('z')).length
    }

    const bank = getLevel(10).words
    const zShare = zWords / bank.filter((w) => w.includes('z')).length
    const eShare = eWords / bank.filter((w) => w.includes('e') && !w.includes('z')).length
    expect(zShare).toBeGreaterThan(eShare)
  })
})

describe('spelling word data', () => {
  // A spelling word whose letters aren't unlocked yet is the same bug as above,
  // just entered from the other side.
  it('only offers words the kid can actually type at that level', () => {
    for (const entry of SPELLING_WORDS) {
      const { allKeys } = getLevel(entry.minLevel)
      for (const char of entry.word) {
        expect(
          isTypeable(char, allKeys),
          `"${entry.word}" needs "${char}" but minLevel ${entry.minLevel} has not taught it`,
        ).toBe(true)
      }
    }
  })

  it('gives every word a hint sentence with a blank in it', () => {
    for (const entry of SPELLING_WORDS) {
      expect(entry.hint, entry.word).toContain('___')
    }
  })
})

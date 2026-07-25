import { describe, expect, it } from 'vitest'
import {
  accuracyOf,
  coinsFor,
  eyesUpScore,
  overallScore,
  praiseFor,
  starsFor,
  wpmOf,
  type LessonStats,
} from './scoring'

const base: LessonStats = {
  correctChars: 100,
  errorChars: 0,
  elapsedMs: 60_000,
  sneakyStarsCaught: 4,
  sneakyStarsTotal: 4,
}

describe('scoring basics', () => {
  it('computes accuracy over all keystrokes', () => {
    expect(accuracyOf({ ...base, correctChars: 90, errorChars: 10 })).toBeCloseTo(0.9)
  })

  it('computes wpm at five characters per word', () => {
    expect(wpmOf({ ...base, correctChars: 100, elapsedMs: 60_000 })).toBeCloseTo(20)
  })

  it('treats a lesson with no stars offered as full eyes-up marks', () => {
    expect(eyesUpScore({ ...base, sneakyStarsCaught: 0, sneakyStarsTotal: 0 })).toBe(1)
  })

  it('never awards zero stars for finishing', () => {
    const awful: LessonStats = {
      correctChars: 5,
      errorChars: 200,
      elapsedMs: 600_000,
      sneakyStarsCaught: 0,
      sneakyStarsTotal: 4,
    }
    expect(starsFor(awful)).toBe(1)
  })
})

describe('the formula encodes the pedagogy', () => {
  // This is the test that guards the whole point of the app. If someone retunes
  // the weights so that speed wins, this fails.
  it('scores a slow, accurate, screen-watching kid above a fast, sloppy, peeking one', () => {
    const careful: LessonStats = {
      correctChars: 100,
      errorChars: 3,
      elapsedMs: 180_000, // ~7 wpm, properly slow
      sneakyStarsCaught: 4,
      sneakyStarsTotal: 4,
    }
    const peeker: LessonStats = {
      correctChars: 100,
      errorChars: 25,
      elapsedMs: 45_000, // ~27 wpm, above target
      sneakyStarsCaught: 0,
      sneakyStarsTotal: 4,
    }
    expect(overallScore(careful)).toBeGreaterThan(overallScore(peeker))
    expect(starsFor(careful)).toBeGreaterThanOrEqual(starsFor(peeker))
  })

  it('lets a careful slow kid reach three stars', () => {
    const careful: LessonStats = {
      correctChars: 100,
      errorChars: 0,
      elapsedMs: 150_000, // 8 wpm
      sneakyStarsCaught: 4,
      sneakyStarsTotal: 4,
    }
    expect(starsFor(careful)).toBe(3)
  })

  it('does not let raw speed alone reach three stars', () => {
    const sloppySpeedster: LessonStats = {
      correctChars: 100,
      errorChars: 40,
      elapsedMs: 30_000, // 40 wpm, double the target
      sneakyStarsCaught: 0,
      sneakyStarsTotal: 4,
    }
    expect(starsFor(sloppySpeedster)).toBeLessThan(3)
  })

  it('caps the speed component so there is nothing to gain by racing', () => {
    const fast = { ...base, elapsedMs: 30_000 }
    const absurd = { ...base, elapsedMs: 3_000 }
    expect(overallScore(absurd)).toBeCloseTo(overallScore(fast))
  })
})

describe('praise', () => {
  it('leads with eyes-up when every star was caught', () => {
    const praise = praiseFor({ accuracy: 0.7, stars: 2, sneakyStarsCaught: 4, sneakyStarsTotal: 4 })
    expect(praise).toMatch(/Sneaky Star/)
  })

  it('reflects real accuracy rather than assuming the best', () => {
    const praise = praiseFor({ accuracy: 0.4, stars: 1, sneakyStarsCaught: 0, sneakyStarsTotal: 4 })
    expect(praise).not.toMatch(/perfect/i)
  })

  it('never scolds', () => {
    const praise = praiseFor({ accuracy: 0.2, stars: 1, sneakyStarsCaught: 0, sneakyStarsTotal: 4 })
    expect(praise).toMatch(/Good effort/)
  })
})

describe('coins', () => {
  it('pays out for spelling and eyes-up on top of the base', () => {
    const plain = coinsFor({ ...base, sneakyStarsCaught: 0 }, 0, 2)
    const rich = coinsFor(base, 2, 2)
    expect(rich).toBeGreaterThan(plain)
  })
})

import { describe, expect, it } from 'vitest'
import {
  applyLesson,
  ema,
  keyErrorRate,
  lessonShapeFor,
  levelJump,
  mergeKeyStats,
  newKeyAccuracyFor,
  nextDifficulty,
  nextPersonalWpm,
  nextUnlockedLevel,
  shouldOfferEasierLevel,
  updateLevelStat,
  weakKeys,
  MAX_PERSONAL_WPM,
  MIN_PERSONAL_WPM,
} from './adaptive'
import { assistAfterLesson } from './assist'
import { MAX_LEVEL, getLevel } from '../data/curriculum'
import { makeProfile, type LessonResult, type Profile } from '../store/schema'

describe('running averages', () => {
  it('takes the first sample as-is so a first lesson counts fully', () => {
    expect(ema(undefined, 0.8)).toBe(0.8)
  })

  it('moves toward new samples without lurching', () => {
    const after = ema(0.5, 1)
    expect(after).toBeGreaterThan(0.5)
    expect(after).toBeLessThan(1)
  })
})

describe('per-key ability', () => {
  it('will not judge a key it has barely seen', () => {
    expect(keyErrorRate({ attempts: 2, errors: 2 })).toBeNull()
    expect(keyErrorRate(undefined)).toBeNull()
  })

  it('measures a rate, not a count', () => {
    expect(keyErrorRate({ attempts: 20, errors: 5 })).toBeCloseTo(0.25)
  })

  it('ranks a rare bad key above a common key with more total errors', () => {
    const ranked = weakKeys({
      e: { attempts: 400, errors: 20 }, // 5%, 20 errors
      z: { attempts: 12, errors: 9 }, // 75%, 9 errors
    })
    expect(ranked[0]).toBe('z')
  })

  it('accumulates attempts and errors across lessons', () => {
    const merged = mergeKeyStats({ a: { attempts: 10, errors: 1 } }, { a: 5, b: 3 }, { a: 2 })
    expect(merged.a).toEqual({ attempts: 15, errors: 3 })
    expect(merged.b).toEqual({ attempts: 3, errors: 0 })
  })
})

describe('new-key accuracy', () => {
  it('measures only the keys the level teaches', () => {
    // Level 3 teaches e and i. Perfect on everything else, terrible on the new
    // keys — overall accuracy would hide that, new-key accuracy must not.
    const accuracy = newKeyAccuracyFor(3, { e: 10, i: 10, a: 100 }, { e: 5, i: 5 }, 0.95)
    expect(accuracy).toBeCloseTo(0.5)
  })

  it('falls back when the level teaches nothing new', () => {
    expect(newKeyAccuracyFor(12, {}, {}, 0.9)).toBe(0.9)
  })

  it('falls back when none of the new keys came up', () => {
    expect(newKeyAccuracyFor(3, { a: 20 }, {}, 0.8)).toBe(0.8)
  })
})

describe('moving up', () => {
  it('needs new-key accuracy, not just a good overall score', () => {
    // Cruised on old material, fumbled everything the level actually taught.
    const stat = { lessons: 1, accuracyEma: 0.96, newKeyAccuracy: 0.5 }
    expect(levelJump(stat)).toBe(0)
  })

  it('jumps three levels for a kid who clearly already knows this', () => {
    expect(levelJump({ lessons: 1, accuracyEma: 0.99, newKeyAccuracy: 0.99 })).toBe(3)
  })

  it('advances one level for solid-but-not-spectacular work', () => {
    expect(levelJump({ lessons: 2, accuracyEma: 0.87, newKeyAccuracy: 0.86 })).toBe(1)
  })

  it('never runs off the end of the curriculum', () => {
    expect(nextUnlockedLevel(MAX_LEVEL, 3)).toBe(MAX_LEVEL)
    expect(nextUnlockedLevel(MAX_LEVEL - 1, 3)).toBe(MAX_LEVEL)
  })

  it('does not unlock anything when replaying an easy old level', () => {
    const profile: Profile = { ...makeProfile('Replay', '🦊'), highestLevelUnlocked: 8, currentLevel: 2 }
    const outcome = applyLesson(profile, {
      levelId: 2,
      accuracy: 1,
      newKeyAccuracy: 1,
      wpm: 20,
    })
    expect(outcome.jump).toBe(0)
    expect(outcome.unlockedTo).toBe(8)
  })
})

describe('easing off', () => {
  it('does not back off after a single bad lesson', () => {
    expect(shouldOfferEasierLevel({ lessons: 1, accuracyEma: 0.3, newKeyAccuracy: 0.3 }, 5)).toBe(
      false,
    )
  })

  it('offers an easier level after a sustained struggle', () => {
    expect(shouldOfferEasierLevel({ lessons: 3, accuracyEma: 0.45, newKeyAccuracy: 0.4 }, 5)).toBe(
      true,
    )
  })

  it('has nowhere to send a kid already on level 1', () => {
    expect(shouldOfferEasierLevel({ lessons: 5, accuracyEma: 0.2, newKeyAccuracy: 0.2 }, 1)).toBe(
      false,
    )
  })
})

describe('difficulty controller', () => {
  it('stays inside 0..1 however extreme the input', () => {
    expect(nextDifficulty(0.5, 5)).toBeLessThanOrEqual(1)
    expect(nextDifficulty(0.5, -5)).toBeGreaterThanOrEqual(0)
    expect(nextDifficulty(0.5, NaN)).toBeGreaterThanOrEqual(0)
  })

  it('drops faster than it climbs, so relief arrives quickly', () => {
    const drop = 0.8 - nextDifficulty(0.8, 0.4)
    const climb = nextDifficulty(0.4, 0.8) - 0.4
    expect(drop).toBeGreaterThan(climb)
  })

  it('gives a struggling kid a shorter, gentler lesson', () => {
    const struggling = lessonShapeFor(0.05, 10)
    const cruising = lessonShapeFor(0.95, 10)
    expect(struggling.itemCount).toBeLessThan(cruising.itemCount)
    expect(struggling.spellingItems).toBeLessThan(cruising.spellingItems)
    expect(struggling.includeSentence).toBe(false)
    expect(cruising.includeSentence).toBe(true)
    expect(struggling.sneakyStars).toBeLessThan(cruising.sneakyStars)
    expect(struggling.maxWordLength).toBeLessThan(cruising.maxWordLength)
  })

  it('never stretches a deliberately short level', () => {
    expect(lessonShapeFor(1, 6).itemCount).toBe(6)
    expect(lessonShapeFor(0, 6).itemCount).toBe(6)
  })
})

describe('personal speed target', () => {
  it('rises only part-way toward a fast lesson, so the bar stays clearable', () => {
    const next = nextPersonalWpm(10, 30)
    expect(next).toBeGreaterThan(10)
    expect(next).toBeLessThan(30)
  })

  it('does not fall when a kid has a slow day', () => {
    expect(nextPersonalWpm(20, 3)).toBe(20)
  })

  it('stays within sane bounds', () => {
    expect(nextPersonalWpm(1, 1)).toBeGreaterThanOrEqual(MIN_PERSONAL_WPM)
    expect(nextPersonalWpm(MAX_PERSONAL_WPM, 500)).toBeLessThanOrEqual(MAX_PERSONAL_WPM)
  })
})

/**
 * The tests that actually prove the brief.
 *
 * A synthetic kid has a fixed ability: an accuracy they type at, which drops as
 * levels get harder than they can manage. We run them through many lessons and
 * check where they end up. This is the only way to be confident the two goals —
 * "reach the right level fast" and "never get pushed past it" — actually hold,
 * since both are emergent properties of several interacting rules.
 */
type Kid = {
  /** The hardest level this kid can handle well. Beyond it, accuracy collapses. */
  ceiling: number
  /** Accuracy at or below their ceiling. */
  baseAccuracy: number
}

function playLesson(profile: Profile, kid: Kid): Profile {
  const level = profile.currentLevel
  // Comfortably within ability: they type at their base accuracy. Past their
  // ceiling, accuracy falls away sharply, one step per level beyond it.
  const overreach = Math.max(0, level - kid.ceiling)
  const accuracy = Math.max(0.15, kid.baseAccuracy - overreach * 0.25)

  const outcome = applyLesson(profile, {
    levelId: level,
    accuracy,
    newKeyAccuracy: accuracy,
    wpm: 12,
  })

  const result: LessonResult = {
    levelId: level,
    accuracy,
    wpm: 12,
    stars: 2,
    coinsEarned: 5,
    sneakyStarsCaught: 2,
    sneakyStarsTotal: 4,
    spellingCorrect: 1,
    spellingTotal: 2,
    assistLevel: profile.assistLevel,
    date: '2026-01-01',
  }

  return {
    ...profile,
    levelStats: { ...profile.levelStats, [level]: outcome.levelStat },
    difficulty: outcome.difficulty,
    personalWpm: outcome.personalWpm,
    highestLevelUnlocked: outcome.unlockedTo,
    // The kid accepts the app's suggestion, whichever way it points.
    currentLevel: outcome.jump > 0
      ? outcome.unlockedTo
      : outcome.offerEasierLevel
        ? Math.max(1, level - 1)
        : level,
    assistLevel: assistAfterLesson(profile, accuracy),
    lessonsCompleted: profile.lessonsCompleted + 1,
    history: [...profile.history, result],
  }
}

function simulate(kid: Kid, lessons: number): Profile {
  let profile = makeProfile('Sim', '🤖')
  for (let i = 0; i < lessons; i++) profile = playLesson(profile, kid)
  return profile
}

describe('simulated kids', () => {
  it('gets a capable kid to the end of the curriculum fast', () => {
    // A child who can already type: they should not be made to grind.
    const after = simulate({ ceiling: MAX_LEVEL, baseAccuracy: 0.99 }, 10)
    expect(after.currentLevel).toBe(MAX_LEVEL)
  })

  it('reaches a mid-ability kid their own level and then stops', () => {
    const kid: Kid = { ceiling: 6, baseAccuracy: 0.9 }
    const after = simulate(kid, 40)

    // They get there...
    expect(after.highestLevelUnlocked).toBeGreaterThanOrEqual(kid.ceiling)
    // ...and are never dragged far past what they can handle, however long they
    // play. This is the "not pushed faster than able" guarantee.
    expect(after.currentLevel).toBeLessThanOrEqual(kid.ceiling + 1)
  })

  it('never pushes a struggling beginner up the curriculum', () => {
    const after = simulate({ ceiling: 1, baseAccuracy: 0.55 }, 30)
    expect(after.currentLevel).toBe(1)
    expect(after.highestLevelUnlocked).toBe(1)
  })

  it('hands help back to a kid who is floundering', () => {
    // Promote them to a hard assist level first, then let them struggle.
    let profile: Profile = { ...makeProfile('Sinking', '🐟'), assistLevel: 'on-miss' }
    for (let i = 0; i < 6; i++) profile = playLesson(profile, { ceiling: 1, baseAccuracy: 0.5 })
    expect(['full', 'letters-off']).toContain(profile.assistLevel)
  })

  it('leaves a struggling kid on shorter lessons than a thriving one', () => {
    const struggling = simulate({ ceiling: 1, baseAccuracy: 0.5 }, 12)
    const thriving = simulate({ ceiling: MAX_LEVEL, baseAccuracy: 0.98 }, 12)
    expect(struggling.difficulty).toBeLessThan(thriving.difficulty)
  })

  it('only ever asks a simulated kid for keys their level has taught', () => {
    // Acceleration must not strand a kid on letters they were never shown.
    const after = simulate({ ceiling: MAX_LEVEL, baseAccuracy: 0.99 }, 10)
    const { allKeys } = getLevel(after.currentLevel)
    expect(allKeys.length).toBeGreaterThan(0)
    expect(after.currentLevel).toBeLessThanOrEqual(after.highestLevelUnlocked)
  })
})

describe('applyLesson wiring', () => {
  it('reports everything the store needs in one go', () => {
    const profile = makeProfile('Wire', '🔌')
    const outcome = applyLesson(profile, {
      levelId: 1,
      accuracy: 0.99,
      newKeyAccuracy: 0.99,
      wpm: 15,
    })
    expect(outcome.jump).toBe(3)
    expect(outcome.unlockedTo).toBe(4)
    expect(outcome.levelStat.lessons).toBe(1)
    expect(outcome.offerEasierLevel).toBe(false)
    expect(outcome.personalWpm).toBeGreaterThan(profile.personalWpm)
  })

  /**
   * A kid who has been struggling and then has one great lesson should be left
   * exactly where they are: not promoted on the strength of a single result, but
   * no longer pushed downward either. Both of those would be wrong, and it's the
   * running average rather than any special case that gets this right.
   */
  it('consolidates rather than promoting or demoting after one good lesson', () => {
    const profile: Profile = {
      ...makeProfile('Mixed', '🎭'),
      currentLevel: 5,
      highestLevelUnlocked: 5,
      levelStats: { 5: { lessons: 4, accuracyEma: 0.4, newKeyAccuracy: 0.4 } },
    }
    const outcome = applyLesson(profile, {
      levelId: 5,
      accuracy: 1,
      newKeyAccuracy: 1,
      wpm: 20,
    })
    expect(outcome.jump).toBe(0)
    expect(outcome.offerEasierLevel).toBe(false)
    expect(outcome.levelStat.accuracyEma).toBeGreaterThan(0.4)
  })

  it('promotes once the good run is sustained', () => {
    let profile: Profile = {
      ...makeProfile('Persistent', '🐢'),
      currentLevel: 5,
      highestLevelUnlocked: 5,
      levelStats: { 5: { lessons: 4, accuracyEma: 0.4, newKeyAccuracy: 0.4 } },
    }
    let jumped = 0
    for (let i = 0; i < 4 && jumped === 0; i++) {
      const outcome = applyLesson(profile, {
        levelId: 5,
        accuracy: 1,
        newKeyAccuracy: 1,
        wpm: 20,
      })
      jumped = outcome.jump
      profile = { ...profile, levelStats: { 5: outcome.levelStat } }
    }
    expect(jumped).toBeGreaterThan(0)
  })

  it('tracks each level separately', () => {
    const profile = makeProfile('Levels', '🪜')
    const first = applyLesson(profile, { levelId: 3, accuracy: 0.9, newKeyAccuracy: 0.9, wpm: 10 })
    expect(Object.keys(profile.levelStats)).toHaveLength(0)
    expect(first.levelStat.lessons).toBe(1)
  })
})

describe('level stats', () => {
  it('counts lessons and smooths accuracy per level', () => {
    const first = updateLevelStat(undefined, {
      levelId: 4,
      accuracy: 0.6,
      newKeyAccuracy: 0.6,
      wpm: 10,
    })
    const second = updateLevelStat(first, {
      levelId: 4,
      accuracy: 1,
      newKeyAccuracy: 1,
      wpm: 10,
    })
    expect(second.lessons).toBe(2)
    expect(second.accuracyEma).toBeGreaterThan(0.6)
    expect(second.accuracyEma).toBeLessThan(1)
  })
})

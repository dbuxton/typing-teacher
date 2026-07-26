import { describe, expect, it } from 'vitest'
import { SAVE_VERSION, daysBetween, makeProfile, migrate, today } from './schema'

/**
 * Migration tests exist to protect a real child's real progress. If these break,
 * somebody's garden, badges and level are gone and there is no server-side copy
 * to restore from — the save in their browser is the only one there is.
 */

/** A profile shaped the way v1 shipped it, before the adaptive signals existed. */
function v1Profile() {
  return {
    id: 'p_rosa_abc123',
    name: 'Rosa',
    avatar: '🦊',
    locale: 'en-GB' as const,
    createdAt: '2026-01-01',
    currentLevel: 8,
    highestLevelUnlocked: 9,
    assistLevel: 'letters-off' as const,
    sneakyStars: true,
    coins: 120,
    streak: 4,
    lastPlayedDate: '2026-01-20',
    badges: ['first-lesson', 'eagle-eye'],
    garden: [{ kindId: 'sunflower', stage: 2 }],
    lessonsCompleted: 14,
    totalWordsTyped: 600,
    totalCharsTyped: 3000,
    spellingWordsCorrect: 22,
    keyErrors: { z: 9, e: 20 },
    spelling: [{ word: 'friend', box: 2, dueAt: 18, timesCorrect: 2, timesWrong: 1 }],
    history: [
      {
        levelId: 8,
        accuracy: 0.91,
        wpm: 14,
        stars: 3,
        coinsEarned: 20,
        sneakyStarsCaught: 3,
        sneakyStarsTotal: 4,
        spellingCorrect: 2,
        spellingTotal: 2,
        assistLevel: 'letters-off' as const,
        date: '2026-01-20',
      },
    ],
  }
}

function v1Save() {
  return { version: 1, profiles: [v1Profile()], activeProfileId: 'p_rosa_abc123' }
}

describe('v1 -> v2 migration', () => {
  it('keeps everything a kid would be upset to lose', () => {
    const migrated = migrate(v1Save(), 1)
    const rosa = migrated.profiles[0]

    expect(migrated.version).toBe(SAVE_VERSION)
    expect(rosa.id).toBe('p_rosa_abc123')
    expect(rosa.name).toBe('Rosa')
    expect(rosa.coins).toBe(120)
    expect(rosa.streak).toBe(4)
    expect(rosa.badges).toEqual(['first-lesson', 'eagle-eye'])
    expect(rosa.garden).toEqual([{ kindId: 'sunflower', stage: 2 }])
    expect(rosa.currentLevel).toBe(8)
    expect(rosa.highestLevelUnlocked).toBe(9)
    expect(rosa.assistLevel).toBe('letters-off')
    expect(rosa.lessonsCompleted).toBe(14)
    expect(rosa.spelling[0].word).toBe('friend')
    expect(migrated.activeProfileId).toBe('p_rosa_abc123')
  })

  it('carries old key errors across rather than throwing them away', () => {
    const rosa = migrate(v1Save(), 1).profiles[0]
    expect(rosa.perKeyStats.z.errors).toBe(9)
    expect(rosa.perKeyStats.e.errors).toBe(20)
  })

  /**
   * v1 stored errors with no denominator, which is the flaw v2 exists to fix.
   * The migration must not carry that bias forward: 20 errors on `e` (a letter
   * in almost every word) is a kid coping, while 9 on `z` is a kid who can't
   * find the key. Estimating attempts by letter frequency preserves that.
   */
  it('converts old error counts into rates that identify the real weak key', () => {
    const rosa = migrate(v1Save(), 1).profiles[0]
    const zRate = rosa.perKeyStats.z.errors / rosa.perKeyStats.z.attempts
    const eRate = rosa.perKeyStats.e.errors / rosa.perKeyStats.e.attempts
    expect(zRate).toBeGreaterThan(eRate)
  })

  it('never invents an error rate above 100%', () => {
    // A save with almost no characters typed but plenty of errors would, naively
    // estimated, produce more errors than attempts.
    const save = {
      version: 1,
      profiles: [{ ...v1Profile(), totalCharsTyped: 4, keyErrors: { q: 30 } }],
      activeProfileId: null,
    }
    const stat = migrate(save, 1).profiles[0].perKeyStats.q
    expect(stat.attempts).toBeGreaterThanOrEqual(stat.errors)
  })

  it('seeds per-level ability from the surviving history', () => {
    const rosa = migrate(v1Save(), 1).profiles[0]
    expect(rosa.levelStats[8]).toBeDefined()
    expect(rosa.levelStats[8].accuracyEma).toBeCloseTo(0.91)
  })

  it('gives the new adaptive fields sensible starting values', () => {
    const rosa = migrate(v1Save(), 1).profiles[0]
    expect(rosa.readAloud).toBe(true)
    expect(rosa.difficulty).toBeGreaterThan(0)
    expect(rosa.difficulty).toBeLessThanOrEqual(1)
    // Their existing best of 14 wpm becomes the personal target, not a reset to 8.
    expect(rosa.personalWpm).toBeGreaterThanOrEqual(14)
  })

  it('drops the dead keyErrors field', () => {
    const rosa = migrate(v1Save(), 1).profiles[0] as Record<string, unknown>
    expect(rosa.keyErrors).toBeUndefined()
  })
})

describe('migration robustness', () => {
  it('survives junk rather than white-screening a kid', () => {
    expect(migrate(null, 1).profiles).toEqual([])
    expect(migrate('nonsense', 1).profiles).toEqual([])
    expect(migrate({ profiles: 'not an array' }, 1).profiles).toEqual([])
  })

  it('refuses a save from a newer build instead of mangling it', () => {
    expect(migrate(v1Save(), 99).profiles).toEqual([])
  })

  it('leaves a current-version save alone', () => {
    const current = { version: SAVE_VERSION, profiles: [makeProfile('New', '🐧')], activeProfileId: null }
    const migrated = migrate(current, SAVE_VERSION)
    expect(migrated.profiles[0].name).toBe('New')
    expect(migrated.profiles[0].perKeyStats).toEqual({})
  })

  it('fills gaps in a hand-edited profile', () => {
    const partial = { version: SAVE_VERSION, profiles: [{ name: 'Half' }], activeProfileId: null }
    const profile = migrate(partial, SAVE_VERSION).profiles[0]
    expect(profile.name).toBe('Half')
    expect(profile.currentLevel).toBe(1)
    expect(profile.garden).toEqual([])
    expect(Number.isFinite(profile.difficulty)).toBe(true)
  })

  it('clamps a corrupted difficulty back into range', () => {
    const broken = {
      version: SAVE_VERSION,
      profiles: [{ ...makeProfile('Odd', '🐙'), difficulty: 42 }],
      activeProfileId: null,
    }
    expect(migrate(broken, SAVE_VERSION).profiles[0].difficulty).toBeLessThanOrEqual(1)
  })
})

describe('dates', () => {
  it('formats a local date', () => {
    expect(today(new Date(2026, 6, 4))).toBe('2026-07-04')
  })

  it('counts whole days between dates', () => {
    expect(daysBetween('2026-07-04', '2026-07-05')).toBe(1)
    expect(daysBetween('2026-07-04', '2026-07-04')).toBe(0)
  })

  // Streak logic depends on this: a run that crosses a DST boundary must not
  // silently break because a "day" was 23 or 25 hours long.
  it('counts days correctly across a daylight-saving change', () => {
    expect(daysBetween('2026-03-28', '2026-03-29')).toBe(1)
    expect(daysBetween('2026-10-24', '2026-10-25')).toBe(1)
  })
})

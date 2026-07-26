import { describe, expect, it } from 'vitest'
import {
  assistAfterLesson,
  effectiveAssist,
  nextAssistLevel,
  showsKeyboard,
  showsLetters,
  shouldPromote,
} from './assist'
import { makeProfile, type LessonResult, type Profile } from '../store/schema'

function withHistory(profile: Profile, count: number): Profile {
  const lesson: LessonResult = {
    levelId: 3,
    accuracy: 0.95,
    wpm: 12,
    stars: 3,
    coinsEarned: 10,
    sneakyStarsCaught: 3,
    sneakyStarsTotal: 4,
    spellingCorrect: 2,
    spellingTotal: 2,
    assistLevel: profile.assistLevel,
    date: '2026-01-01',
  }
  return { ...profile, history: Array.from({ length: count }, () => lesson) }
}

describe('assist progression', () => {
  it('does not fade the keyboard on a single good lesson', () => {
    const profile = makeProfile('Ada', '🐱')
    expect(shouldPromote(profile, 0.99)).toBe(false)
  })

  it('fades the keyboard after a run of accurate lessons', () => {
    const profile = withHistory(makeProfile('Ada', '🐱'), 2)
    expect(shouldPromote(profile, 0.95)).toBe(true)
    expect(assistAfterLesson(profile, 0.95)).toBe('letters-off')
  })

  it('holds steady when accuracy is not there yet', () => {
    const profile = withHistory(makeProfile('Ada', '🐱'), 5)
    expect(assistAfterLesson(profile, 0.7)).toBe('full')
  })

  it('never demotes across lessons, however badly it went', () => {
    const profile = { ...withHistory(makeProfile('Ada', '🐱'), 5), assistLevel: 'on-miss' as const }
    expect(assistAfterLesson(profile, 0.1)).toBe('on-miss')
  })

  it('stops at no-keyboard', () => {
    expect(nextAssistLevel('off')).toBe('off')
  })
})

describe('in-lesson help', () => {
  it('leaves a kid alone while they are doing fine', () => {
    expect(effectiveAssist('on-miss', 0)).toBe('on-miss')
  })

  it('gives more help after three misses in a row', () => {
    expect(effectiveAssist('on-miss', 3)).toBe('letters-off')
  })

  it('shows the keyboard on a miss at on-miss, and not otherwise', () => {
    expect(showsKeyboard('on-miss', true)).toBe(true)
    expect(showsKeyboard('on-miss', false)).toBe(false)
    expect(showsKeyboard('off', true)).toBe(false)
    expect(showsKeyboard('full', false)).toBe(true)
  })

  it('hides the letters at letters-off but keeps the colours', () => {
    expect(showsKeyboard('letters-off', false)).toBe(true)
    expect(showsLetters('letters-off')).toBe(false)
    expect(showsLetters('full')).toBe(true)
  })
})

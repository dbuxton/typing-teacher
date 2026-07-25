import { describe, expect, it } from 'vitest'
import { applyResults, intervalForBox, newProgress, review, selectSpellingWords, MAX_BOX } from './srs'
import { makeRng } from './rng'
import type { SpellingProgress } from '../store/schema'

const rng = () => makeRng(1)

describe('leitner review', () => {
  it('sends a wrong word straight back to box 0', () => {
    const mastered: SpellingProgress = { word: 'friend', box: 3, dueAt: 20, timesCorrect: 3, timesWrong: 0 }
    const after = review(mastered, false, 10)
    expect(after.box).toBe(0)
    expect(after.dueAt).toBe(10 + intervalForBox(0))
    expect(after.timesWrong).toBe(1)
  })

  it('promotes a correct word and pushes it further out', () => {
    const fresh = newProgress('because', 1)
    const once = review(fresh, true, 1)
    const twice = review(once, true, once.dueAt)
    expect(twice.box).toBe(2)
    expect(twice.dueAt - once.dueAt).toBeGreaterThan(once.dueAt - 1)
  })

  it('stops promoting past the last box', () => {
    let progress = newProgress('weird', 1)
    for (let i = 0; i < 10; i++) progress = review(progress, true, progress.dueAt)
    expect(progress.box).toBe(MAX_BOX)
  })
})

describe('selecting words for a lesson', () => {
  it('brings a word the kid got wrong back within a lesson or two', () => {
    const spelling = applyResults([], [{ word: 'friend', correct: false }], 5)
    const next = selectSpellingWords(spelling, 10, 6, 2, rng())
    expect(next).toContain('friend')
  })

  it('does not resurface a word that has been right three times', () => {
    let spelling: SpellingProgress[] = []
    for (let lesson = 1; lesson <= 3; lesson++) {
      spelling = applyResults(spelling, [{ word: 'friend', correct: true }], lesson)
    }
    const dueAt = spelling[0].dueAt
    const next = selectSpellingWords(spelling, 10, dueAt - 1, 2, rng())
    expect(next).not.toContain('friend')
  })

  it('prioritises the words in the lowest boxes', () => {
    const spelling: SpellingProgress[] = [
      { word: 'friend', box: 0, dueAt: 1, timesCorrect: 0, timesWrong: 4 },
      { word: 'because', box: 3, dueAt: 1, timesCorrect: 3, timesWrong: 0 },
    ]
    const next = selectSpellingWords(spelling, 10, 5, 1, rng())
    expect(next).toEqual(['friend'])
  })

  it('only offers words unlocked at the current level', () => {
    const chosen = selectSpellingWords([], 6, 1, 8, rng())
    // 'because' needs c, which arrives at level 8.
    expect(chosen).not.toContain('because')
  })

  it('always fills the requested number of words when it can', () => {
    const chosen = selectSpellingWords([], 10, 1, 2, rng())
    expect(chosen).toHaveLength(2)
    expect(new Set(chosen).size).toBe(2)
  })
})

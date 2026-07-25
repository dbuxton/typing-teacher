import type { SpellingProgress } from '../store/schema'
import { wordsForLevel } from '../data/spellingWords'
import { type Rng, shuffle } from './rng'

/**
 * Leitner spaced repetition for spelling words.
 *
 * Box 0 is "new or just got it wrong" and comes back next lesson. Each correct
 * answer promotes a word one box and pushes it further out; a wrong answer
 * drops it straight back to box 0. Intervals are measured in lessons, not days,
 * because a kid might do six lessons on Saturday and none until Wednesday.
 */

/** Lessons to wait before showing a word again, indexed by box. */
export const BOX_INTERVALS = [1, 2, 4, 8, 16]
export const MAX_BOX = BOX_INTERVALS.length - 1

export function intervalForBox(box: number): number {
  return BOX_INTERVALS[Math.min(Math.max(box, 0), MAX_BOX)]
}

/** A word the kid has never seen, due immediately. */
export function newProgress(word: string, lessonNumber: number): SpellingProgress {
  return { word, box: 0, dueAt: lessonNumber, timesCorrect: 0, timesWrong: 0 }
}

/** Apply an answer to a word's progress. Pure — returns a new object. */
export function review(
  progress: SpellingProgress,
  correct: boolean,
  lessonNumber: number,
): SpellingProgress {
  if (correct) {
    const box = Math.min(progress.box + 1, MAX_BOX)
    return {
      ...progress,
      box,
      dueAt: lessonNumber + intervalForBox(box),
      timesCorrect: progress.timesCorrect + 1,
    }
  }
  return {
    ...progress,
    box: 0,
    dueAt: lessonNumber + intervalForBox(0),
    timesWrong: progress.timesWrong + 1,
  }
}

/**
 * Choose which spelling words to put in the next lesson.
 *
 * Priority: words that are due (lowest box first — the ones they keep getting
 * wrong), then brand-new words the level has unlocked. Never returns the same
 * word twice.
 */
export function selectSpellingWords(
  spelling: SpellingProgress[],
  level: number,
  lessonNumber: number,
  count: number,
  rng: Rng,
): string[] {
  const available = wordsForLevel(level)
  const availableWords = new Set(available.map((w) => w.word))
  const known = new Map(spelling.map((s) => [s.word, s]))

  const due = spelling
    .filter((s) => availableWords.has(s.word) && s.dueAt <= lessonNumber)
    .sort((a, b) => a.box - b.box || a.dueAt - b.dueAt)
    .map((s) => s.word)

  const unseen = shuffle(
    rng,
    available.filter((w) => !known.has(w.word)).map((w) => w.word),
  )

  const out: string[] = []
  for (const word of [...due, ...unseen]) {
    if (out.length >= count) break
    if (!out.includes(word)) out.push(word)
  }

  // Still short (a new profile on a low level, or everything scheduled far out)?
  // Top up with the least recently mastered words rather than returning fewer.
  if (out.length < count) {
    const filler = spelling
      .filter((s) => availableWords.has(s.word) && !out.includes(s.word))
      .sort((a, b) => a.dueAt - b.dueAt)
      .map((s) => s.word)
    for (const word of filler) {
      if (out.length >= count) break
      out.push(word)
    }
  }
  return out
}

/** Merge a lesson's spelling answers back into the profile's queue. */
export function applyResults(
  spelling: SpellingProgress[],
  answers: { word: string; correct: boolean }[],
  lessonNumber: number,
): SpellingProgress[] {
  const byWord = new Map(spelling.map((s) => [s.word, s]))
  for (const answer of answers) {
    const existing = byWord.get(answer.word) ?? newProgress(answer.word, lessonNumber)
    byWord.set(answer.word, review(existing, answer.correct, lessonNumber))
  }
  return [...byWord.values()]
}

import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import type { LessonItem } from './generator'
import { CATCH_WINDOW_MS, catchKeyFor, scheduleStars, starDueAt, type StarSchedule } from './sneakyStars'
import { makeRng } from './rng'

/**
 * The keystroke hot path.
 *
 * One window-level keydown listener drives a reducer. Nothing here re-renders
 * the whole tree per keystroke: components subscribe to the slice they need, and
 * the character spans are memoised on (char, state) so only the two that change
 * actually repaint.
 */

export type CharState = 'pending' | 'correct' | 'wrong' | 'current'

export type SessionState = {
  itemIndex: number
  /** How much of the current item is typed. */
  cursor: number
  /** Per-character correctness for the current item; null = not yet typed. */
  marks: (boolean | null)[]
  /** Consecutive wrong keystrokes, for summoning temporary help. */
  consecutiveMisses: number
  /** True briefly after a miss, to flash the keyboard at 'on-miss' assist. */
  recentlyMissed: boolean

  correctChars: number
  errorChars: number
  startedAt: number | null
  finishedAt: number | null

  /** Spelling item currently hidden behind the reveal card. */
  revealing: boolean

  starVisible: boolean
  starCaughtThisItem: boolean
  sneakyStarsCaught: number
  sneakyStarsShown: number

  spellingAnswers: { word: string; correct: boolean }[]
  /** Whether the current item has been typed with no mistakes so far. */
  itemClean: boolean
  /**
   * Which keys the kid failed to hit, counted across the whole lesson. Keyed by
   * the character they *should* have typed — that's the one needing practice.
   */
  keyErrors: Record<string, number>
  done: boolean
}

type Action =
  | { type: 'key'; char: string; now: number }
  | { type: 'backspace' }
  | { type: 'advance'; now: number }
  | { type: 'reveal-done' }
  | { type: 'show-star' }
  | { type: 'hide-star' }
  | { type: 'catch-star' }
  | { type: 'clear-miss' }

function initialState(items: LessonItem[]): SessionState {
  const first = items[0]
  return {
    itemIndex: 0,
    cursor: 0,
    marks: new Array(first ? first.text.length : 0).fill(null),
    consecutiveMisses: 0,
    recentlyMissed: false,
    correctChars: 0,
    errorChars: 0,
    startedAt: null,
    finishedAt: null,
    revealing: first?.kind === 'spelling',
    starVisible: false,
    starCaughtThisItem: false,
    sneakyStarsCaught: 0,
    sneakyStarsShown: 0,
    spellingAnswers: [],
    itemClean: true,
    keyErrors: {},
    done: false,
  }
}

function makeReducer(items: LessonItem[]) {
  return function reducer(state: SessionState, action: Action): SessionState {
    const item = items[state.itemIndex]
    if (!item) return state

    switch (action.type) {
      case 'key': {
        if (state.revealing || state.done) return state
        const expected = item.text[state.cursor]
        if (expected === undefined) return state
        const correct = action.char === expected

        const marks = [...state.marks]
        // Only record the first attempt at a character — retries after a
        // backspace shouldn't compound the error count.
        marks[state.cursor] = correct

        const keyErrors = correct
          ? state.keyErrors
          : {
              ...state.keyErrors,
              [expected.toLowerCase()]: (state.keyErrors[expected.toLowerCase()] ?? 0) + 1,
            }

        const next: SessionState = {
          ...state,
          marks,
          cursor: correct ? state.cursor + 1 : state.cursor,
          startedAt: state.startedAt ?? action.now,
          correctChars: correct ? state.correctChars + 1 : state.correctChars,
          errorChars: correct ? state.errorChars : state.errorChars + 1,
          consecutiveMisses: correct ? 0 : state.consecutiveMisses + 1,
          recentlyMissed: correct ? state.recentlyMissed : true,
          itemClean: correct ? state.itemClean : false,
          keyErrors,
        }
        return next
      }

      case 'backspace': {
        if (state.cursor === 0 || state.revealing || state.done) return state
        const marks = [...state.marks]
        marks[state.cursor - 1] = null
        return { ...state, cursor: state.cursor - 1, marks, consecutiveMisses: 0 }
      }

      case 'advance': {
        const isSpelling = item.kind === 'spelling'
        const spellingAnswers = isSpelling
          ? [...state.spellingAnswers, { word: item.text, correct: state.itemClean }]
          : state.spellingAnswers

        // A star still on screen when the item ends was cut short by finishing
        // the word, not missed. Don't count it against them — the catch rate has
        // to mean "were you looking?", not "did you type slowly enough?".
        const sneakyStarsShown = state.starVisible
          ? state.sneakyStarsShown - 1
          : state.sneakyStarsShown

        const nextIndex = state.itemIndex + 1
        const nextItem = items[nextIndex]
        if (!nextItem) {
          return {
            ...state,
            spellingAnswers,
            sneakyStarsShown,
            done: true,
            finishedAt: action.now,
            starVisible: false,
          }
        }
        return {
          ...state,
          itemIndex: nextIndex,
          cursor: 0,
          marks: new Array(nextItem.text.length).fill(null),
          consecutiveMisses: 0,
          recentlyMissed: false,
          revealing: nextItem.kind === 'spelling',
          starVisible: false,
          starCaughtThisItem: false,
          sneakyStarsShown,
          spellingAnswers,
          itemClean: true,
        }
      }

      case 'reveal-done':
        return { ...state, revealing: false }

      case 'show-star':
        if (state.starVisible || state.starCaughtThisItem) return state
        return { ...state, starVisible: true, sneakyStarsShown: state.sneakyStarsShown + 1 }

      case 'hide-star':
        return { ...state, starVisible: false }

      case 'catch-star':
        if (!state.starVisible) return state
        return {
          ...state,
          starVisible: false,
          starCaughtThisItem: true,
          sneakyStarsCaught: state.sneakyStarsCaught + 1,
        }

      case 'clear-miss':
        return { ...state, recentlyMissed: false }

      default:
        return state
    }
  }
}

export type UseTypingSessionOptions = {
  items: LessonItem[]
  levelId: number
  sneakyStarsEnabled: boolean
  seed: number
  onFinish: (state: SessionState) => void
}

export function useTypingSession({
  items,
  levelId,
  sneakyStarsEnabled,
  seed,
  onFinish,
}: UseTypingSessionOptions) {
  const reducer = useMemo(() => makeReducer(items), [items])
  const [state, dispatch] = useReducer(reducer, items, initialState)

  const schedule: StarSchedule = useMemo(
    () => (sneakyStarsEnabled ? scheduleStars(items.length, makeRng(seed)) : []),
    [items.length, sneakyStarsEnabled, seed],
  )
  const catchKey = useMemo(() => catchKeyFor(levelId), [levelId])

  const item = items[state.itemIndex]
  const finishedRef = useRef(false)

  // Advance when the current item is fully typed. A short pause lets the kid see
  // the last character land before the next item slides in.
  useEffect(() => {
    if (state.done || state.revealing || !item) return
    if (state.cursor < item.text.length) return
    const timer = setTimeout(() => dispatch({ type: 'advance', now: Date.now() }), 350)
    return () => clearTimeout(timer)
  }, [state.cursor, state.done, state.revealing, item])

  // Report completion exactly once.
  useEffect(() => {
    if (state.done && !finishedRef.current) {
      finishedRef.current = true
      onFinish(state)
    }
  }, [state, onFinish])

  // Sneaky Star scheduling: appear at a fraction through the item, vanish after
  // the catch window.
  useEffect(() => {
    if (!item || state.revealing || state.done || state.starCaughtThisItem) return
    if (state.starVisible) return
    if (starDueAt(schedule, state.itemIndex, state.cursor, item.text.length)) {
      dispatch({ type: 'show-star' })
    }
  }, [schedule, state.itemIndex, state.cursor, state.revealing, state.done, state.starVisible, state.starCaughtThisItem, item])

  useEffect(() => {
    if (!state.starVisible) return
    const timer = setTimeout(() => dispatch({ type: 'hide-star' }), CATCH_WINDOW_MS)
    return () => clearTimeout(timer)
  }, [state.starVisible])

  // Clear the post-miss keyboard flash.
  useEffect(() => {
    if (!state.recentlyMissed) return
    const timer = setTimeout(() => dispatch({ type: 'clear-miss' }), 3000)
    return () => clearTimeout(timer)
  }, [state.recentlyMissed])

  // The reveal card for spelling words.
  useEffect(() => {
    if (!state.revealing) return
    const timer = setTimeout(() => dispatch({ type: 'reveal-done' }), 2500)
    return () => clearTimeout(timer)
  }, [state.revealing, state.itemIndex])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return

      if (event.key === catchKey) {
        event.preventDefault()
        dispatch({ type: 'catch-star' })
        return
      }
      if (event.key === 'Backspace') {
        event.preventDefault()
        dispatch({ type: 'backspace' })
        return
      }
      // Space would scroll the page; every other single character is a keystroke.
      if (event.key === ' ') event.preventDefault()
      if (event.key.length !== 1) return
      dispatch({ type: 'key', char: event.key, now: Date.now() })
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [catchKey])

  const nextChar = item && !state.revealing ? item.text[state.cursor] : undefined

  const charStates: CharState[] = useMemo(() => {
    if (!item) return []
    return item.text.split('').map((_, index) => {
      const mark = state.marks[index]
      if (index === state.cursor) {
        // A wrong key doesn't move the cursor, so the character the kid is stuck
        // on must show as wrong rather than staying highlighted as current —
        // otherwise a mistyped key produces no visible feedback at all.
        return mark === false ? 'wrong' : 'current'
      }
      if (mark === null || mark === undefined) return 'pending'
      return mark ? 'correct' : 'wrong'
    })
  }, [item, state.cursor, state.marks])

  const skipReveal = useCallback(() => dispatch({ type: 'reveal-done' }), [])

  return { state, item, nextChar, charStates, catchKey, skipReveal, totalItems: items.length }
}

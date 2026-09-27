import { keysFor } from '../data/planets'
import { MISSES_BEFORE_SKIP, SHIELD_REGEN_STREAK } from './balance'

/**
 * One hunt, keystroke by keystroke: the pure heart of Star Trail.
 *
 * The ship follows a trail of letters. A right key moves it on one letter; a
 * wrong key never does. What a wrong key COSTS is the game:
 *
 *  - Only the first wrong key on a letter costs anything. Missing the same
 *    letter again is free, so one key a kid can't find can't empty the tank.
 *  - A slip is paid for with a shield first, then a spare fuel can, then fuel
 *    from the tank. An empty tank means a tow home — unless it's a training
 *    flight, where the last can never runs out.
 *  - Stardust is banked each time a word is finished, so a tow never takes
 *    back what was already earned.
 *
 * Time is passed in with each action rather than read here, so the reducer is
 * pure: React's StrictMode can run it twice, and tests can replay a whole hunt.
 */

/** What the reducer needs to know about the hunt it's running. */
export type TrailSetup = {
  text: string
  tank: number
  spare: number
  shields: number
  maxShields: number
  /** A training flight: the tank stops at one can instead of running dry. */
  training: boolean
  stardustPerLetter: number
  /** Stardust one robot catch is worth, or null when there's no robot to catch with. */
  lootPerCatch: number | null
}

/** How each letter of the trail was typed. */
export type Mark = 'clean' | 'slipped' | 'skipped'
export type TrailStatus = 'flying' | 'found' | 'towed'

/**
 * Something that just happened, for sounds and little flashes. `seq` changes
 * every time, so the same kind twice in a row still registers.
 */
export type TrailEventKind =
  | 'hit'
  | 'word'
  | 'shield'
  | 'spare'
  | 'fuel'
  | 'rescued'
  | 'miss'
  | 'regen'
  | 'skip'
  | 'catch'
  | 'found'
  | 'towed'
  | 'caps'

export type TrailState = {
  /** Index of the letter to type next. */
  cursor: number
  marks: (Mark | null)[]
  /** Wrong keys pressed on the current letter. */
  missesHere: number
  /** Has the current letter already cost something? Only its first miss does. */
  chargedHere: boolean
  tank: number
  spare: number
  shields: number
  /** Letters typed right first time, in a row. */
  cleanStreak: number
  /** A shield can be won back once per hunt. */
  shieldRegained: boolean
  /** First misses — the ones that cost. */
  slips: number
  /** Every wrong key, including the free repeats. */
  wrongPresses: number
  skipped: number
  /** First tries per key, and how many of those slipped. Capitals count towards Shift too. */
  keyAttempts: Record<string, number>
  keyErrors: Record<string, number>
  wordsDone: number
  /** Stardust banked from finished words. */
  banked: number
  /** Stardust the robot has caught. */
  loot: number
  sparkle: { id: number } | null
  sparklesShown: number
  sparklesCaught: number
  /** Caps Lock seems to be on: the kid typed the right letter in the wrong case. */
  capsHint: boolean
  /** True for a moment after a wrong key, so help can pop up. */
  recentlyMissed: boolean
  offerSkip: boolean
  paused: boolean
  status: TrailStatus
  startedAt: number | null
  finishedAt: number | null
  event: { kind: TrailEventKind; seq: number } | null
}

export type TrailAction =
  | { type: 'key'; char: string; capsLock: boolean; now: number }
  | { type: 'skip'; now: number }
  | { type: 'sparkle-show'; id: number }
  | { type: 'sparkle-hide'; id: number }
  | { type: 'catch' }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'clear-miss' }

export function initTrail(setup: TrailSetup): TrailState {
  return {
    cursor: 0,
    marks: new Array(setup.text.length).fill(null),
    missesHere: 0,
    chargedHere: false,
    tank: setup.tank,
    spare: setup.spare,
    shields: setup.shields,
    cleanStreak: 0,
    shieldRegained: false,
    slips: 0,
    wrongPresses: 0,
    skipped: 0,
    keyAttempts: {},
    keyErrors: {},
    wordsDone: 0,
    banked: 0,
    loot: 0,
    sparkle: null,
    sparklesShown: 0,
    sparklesCaught: 0,
    capsHint: false,
    recentlyMissed: false,
    offerSkip: false,
    paused: false,
    status: 'flying',
    startedAt: null,
    finishedAt: null,
    event: null,
  }
}

/** Does typing the character at `index` finish a word? */
export function finishesWord(text: string, index: number): boolean {
  return text[index] !== ' ' && (index === text.length - 1 || text[index + 1] === ' ')
}

/** What a finished word is worth in letters: the word plus the space after it. */
function wordLetters(text: string, index: number): number {
  const start = text.lastIndexOf(' ', index) + 1
  return index - start + 1 + (text[index + 1] === ' ' ? 1 : 0)
}

function bump(counts: Record<string, number>, keys: string[]): Record<string, number> {
  const next = { ...counts }
  for (const key of keys) next[key] = (next[key] ?? 0) + 1
  return next
}

function emit(state: TrailState, kind: TrailEventKind): TrailState['event'] {
  return { kind, seq: (state.event?.seq ?? 0) + 1 }
}

/** A sparkle cut short by the hunt ending wasn't missed, so it isn't counted. */
function withoutSparkle(state: TrailState): Pick<TrailState, 'sparkle' | 'sparklesShown'> {
  return {
    sparkle: null,
    sparklesShown: state.sparkle ? state.sparklesShown - 1 : state.sparklesShown,
  }
}

export function makeTrailReducer(setup: TrailSetup) {
  const { text } = setup
  // Sparkles only count as "shown" when there's a robot that could have caught them.
  const countsSparkles = setup.lootPerCatch !== null

  /** Move on past the current letter, banking a word if it's the end of one. */
  function advance(state: TrailState, mark: Mark, now: number, kind: TrailEventKind): TrailState {
    const index = state.cursor
    const marks = [...state.marks]
    marks[index] = mark
    const endsWord = finishesWord(text, index)
    const moved: TrailState = {
      ...state,
      marks,
      cursor: index + 1,
      missesHere: 0,
      chargedHere: false,
      offerSkip: false,
      capsHint: false,
      banked: endsWord ? state.banked + Math.round(setup.stardustPerLetter * wordLetters(text, index)) : state.banked,
      wordsDone: endsWord ? state.wordsDone + 1 : state.wordsDone,
    }
    if (moved.cursor >= text.length) {
      return { ...moved, ...withoutSparkle(state), status: 'found', finishedAt: now, event: emit(state, 'found') }
    }
    return { ...moved, event: emit(state, kind === 'hit' && endsWord ? 'word' : kind) }
  }

  function typeKey(state: TrailState, char: string, capsLock: boolean, now: number): TrailState {
    const expected = text[state.cursor]
    const startedAt = state.startedAt ?? now
    const keys = keysFor(expected)

    if (char === expected) {
      const firstTry = !state.chargedHere
      const cleanStreak = firstTry ? state.cleanStreak + 1 : 0
      const regain =
        cleanStreak >= SHIELD_REGEN_STREAK && !state.shieldRegained && state.shields < setup.maxShields
      const next = advance(
        {
          ...state,
          startedAt,
          cleanStreak,
          keyAttempts: firstTry ? bump(state.keyAttempts, keys) : state.keyAttempts,
          shields: regain ? state.shields + 1 : state.shields,
          shieldRegained: state.shieldRegained || regain,
        },
        firstTry ? 'clean' : 'slipped',
        now,
        'hit',
      )
      return regain && next.status === 'flying' ? { ...next, event: emit(state, 'regen') } : next
    }

    // The right letter in the wrong case with Caps Lock on: a stuck key, not a
    // slip. Charging it would drain the tank a letter at a time.
    if (capsLock && char.toLowerCase() === expected.toLowerCase()) {
      return { ...state, startedAt, capsHint: true, event: emit(state, 'caps') }
    }

    const missesHere = state.missesHere + 1
    const missed: TrailState = {
      ...state,
      startedAt,
      missesHere,
      wrongPresses: state.wrongPresses + 1,
      offerSkip: missesHere >= MISSES_BEFORE_SKIP,
      recentlyMissed: true,
      cleanStreak: 0,
    }
    if (state.chargedHere) return { ...missed, event: emit(state, 'miss') }

    // The first miss on this letter: it costs.
    let { shields, spare, tank } = state
    let kind: TrailEventKind
    if (shields > 0) {
      shields -= 1
      kind = 'shield'
    } else if (spare > 0) {
      spare -= 1
      kind = 'spare'
    } else {
      tank -= 1
      kind = 'fuel'
    }
    const marks = [...state.marks]
    marks[state.cursor] = 'slipped'
    const charged: TrailState = {
      ...missed,
      marks,
      shields,
      spare,
      tank,
      chargedHere: true,
      slips: state.slips + 1,
      keyAttempts: bump(state.keyAttempts, keys),
      keyErrors: bump(state.keyErrors, keys),
    }
    if (tank > 0) return { ...charged, event: emit(state, kind) }
    if (setup.training) return { ...charged, tank: 1, event: emit(state, 'rescued') }
    return { ...charged, ...withoutSparkle(state), status: 'towed', finishedAt: now, event: emit(state, 'towed') }
  }

  return function trailReducer(state: TrailState, action: TrailAction): TrailState {
    if (state.status !== 'flying') return state

    switch (action.type) {
      case 'key':
        if (state.paused || action.char.length !== 1) return state
        return typeKey(state, action.char, action.capsLock, action.now)

      case 'skip':
        if (state.paused || !state.offerSkip) return state
        // The letter was already charged for its first miss; stepping over it
        // costs nothing more, and it stays marked so the key gets practice.
        return advance({ ...state, skipped: state.skipped + 1 }, 'skipped', action.now, 'skip')

      case 'sparkle-show':
        if (state.paused || state.sparkle) return state
        return {
          ...state,
          sparkle: { id: action.id },
          sparklesShown: countsSparkles ? state.sparklesShown + 1 : state.sparklesShown,
        }

      case 'sparkle-hide':
        if (state.sparkle?.id !== action.id) return state
        return { ...state, sparkle: null }

      case 'catch':
        if (state.paused || !state.sparkle || setup.lootPerCatch === null) return state
        return {
          ...state,
          sparkle: null,
          sparklesCaught: state.sparklesCaught + 1,
          loot: state.loot + setup.lootPerCatch,
          event: emit(state, 'catch'),
        }

      case 'pause':
        if (state.paused) return state
        // A sparkle can't be caught while paused, so it doesn't count as missed either.
        return { ...state, ...(countsSparkles ? withoutSparkle(state) : { sparkle: null }), paused: true }

      case 'resume':
        return state.paused ? { ...state, paused: false } : state

      case 'clear-miss':
        return state.recentlyMissed ? { ...state, recentlyMissed: false } : state

      default:
        return state
    }
  }
}

// ─── Reading the state ─────────────────────────────────────────────────────

export function nextChar(state: TrailState, setup: TrailSetup): string | undefined {
  return state.status === 'flying' ? setup.text[state.cursor] : undefined
}

export type VisibleLetter = { index: number; char: string; glow: number }

/**
 * The letters the scanner can see: the one to type, then up to `visible - 1`
 * more, fading with distance. Nothing beyond is returned at all — in the dark,
 * there is nothing to read.
 */
export function visibleAhead(state: TrailState, setup: TrailSetup, visible: number): VisibleLetter[] {
  if (state.status !== 'flying') return []
  const count = Math.max(1, Math.min(visible, setup.text.length - state.cursor))
  return Array.from({ length: count }, (_, offset) => ({
    index: state.cursor + offset,
    char: setup.text[state.cursor + offset],
    glow: offset === 0 ? 1 : 0.85 - (0.5 * offset) / Math.max(visible - 1, 1),
  }))
}

/** The finished words so far — the message building up, word by word. */
export function messageSoFar(state: TrailState, setup: TrailSetup): string {
  const typed = setup.text.slice(0, state.cursor)
  // Sitting on a space (or at the end) means the last word is complete.
  if (state.cursor >= setup.text.length || setup.text[state.cursor] === ' ') return typed.trimEnd()
  const lastSpace = typed.lastIndexOf(' ')
  return lastSpace < 0 ? '' : typed.slice(0, lastSpace)
}

export function lettersLeft(state: TrailState, setup: TrailSetup): number {
  return setup.text.length - state.cursor
}

/** Close enough to the piece for the robot to start beeping. */
export function isNearEnd(state: TrailState, setup: TrailSetup): boolean {
  return lettersLeft(state, setup) <= Math.max(4, Math.ceil(setup.text.length * 0.2))
}

/** Letters the pilot has had a first try at. */
export function lettersAttempted(state: TrailState): number {
  return state.cursor + (state.chargedHere ? 1 : 0)
}

/** Share of letters typed right first time. */
export function firstTryAccuracy(state: TrailState): number {
  const attempted = lettersAttempted(state)
  return attempted === 0 ? 1 : 1 - state.slips / attempted
}

export type HuntResult = 'found' | 'towed' | 'aborted'

/** Everything a finished (or abandoned) hunt reports back. */
export type HuntOutcome = {
  result: HuntResult
  /** Letters the pilot had a first try at. */
  letters: number
  slips: number
  skipped: number
  wrongPresses: number
  accuracy: number
  keyAttempts: Record<string, number>
  keyErrors: Record<string, number>
  banked: number
  loot: number
  /** Fuel cans left in the tank (spares don't count). */
  tankLeft: number
  sparklesShown: number
  sparklesCaught: number
  elapsedMs: number
}

export function outcomeOf(state: TrailState, now: number): HuntOutcome {
  const result: HuntResult = state.status === 'flying' ? 'aborted' : state.status
  const end = state.finishedAt ?? now
  return {
    result,
    letters: lettersAttempted(state),
    slips: state.slips,
    skipped: state.skipped,
    wrongPresses: state.wrongPresses,
    accuracy: firstTryAccuracy(state),
    keyAttempts: state.keyAttempts,
    keyErrors: state.keyErrors,
    banked: state.banked,
    loot: state.loot,
    tankLeft: state.tank,
    sparklesShown: state.sparklesShown,
    sparklesCaught: state.sparklesCaught,
    elapsedMs: state.startedAt === null ? 0 : Math.max(0, end - state.startedAt),
  }
}

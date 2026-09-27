import { describe, expect, it } from 'vitest'
import { MISSES_BEFORE_SKIP, SHIELD_REGEN_STREAK } from './balance'
import {
  initTrail,
  isNearEnd,
  makeTrailReducer,
  messageSoFar,
  nextChar,
  outcomeOf,
  visibleAhead,
  type TrailAction,
  type TrailSetup,
  type TrailState,
} from './trail'

function setupFor(text: string, overrides: Partial<TrailSetup> = {}): TrailSetup {
  return {
    text,
    tank: 5,
    spare: 0,
    shields: 1,
    maxShields: 1,
    training: false,
    stardustPerLetter: 1,
    lootPerCatch: null,
    ...overrides,
  }
}

function run(setup: TrailSetup, actions: TrailAction[], from?: TrailState): TrailState {
  return actions.reduce(makeTrailReducer(setup), from ?? initTrail(setup))
}

const key = (char: string, now = 0, capsLock = false): TrailAction => ({ type: 'key', char, capsLock, now })
const typed = (text: string) => [...text].map((char, i) => key(char, i * 100))
const miss = (times = 1) => Array.from({ length: times }, () => key('9'))

describe('flying the trail', () => {
  it('moves on one letter per right key, and never on a wrong one', () => {
    const setup = setupFor('as dad')
    const state = run(setup, [key('a'), ...miss(2)])
    expect(state.cursor).toBe(1)
    expect(nextChar(state, setup)).toBe('s')
    expect(run(setup, [key('s')], state).cursor).toBe(2)
  })

  it('finds the piece when the last letter is typed', () => {
    const setup = setupFor('as dad')
    const state = run(setup, typed('as dad'))
    expect(state.status).toBe('found')
    expect(state.event?.kind).toBe('found')
    expect(state.finishedAt).toBe(500)
    expect(nextChar(state, setup)).toBeUndefined()
  })
})

describe('what a slip costs', () => {
  it('takes a shield first, then a spare fuel can, then fuel from the tank', () => {
    const setup = setupFor('aaaa', { shields: 1, spare: 1, tank: 5 })
    let state = run(setup, [...miss()])
    expect(state).toMatchObject({ shields: 0, spare: 1, tank: 5 })
    expect(state.event?.kind).toBe('shield')

    state = run(setup, [key('a'), ...miss()], state)
    expect(state).toMatchObject({ shields: 0, spare: 0, tank: 5 })
    expect(state.event?.kind).toBe('spare')

    state = run(setup, [key('a'), ...miss()], state)
    expect(state).toMatchObject({ shields: 0, spare: 0, tank: 4 })
    expect(state.event?.kind).toBe('fuel')
  })

  it('lets a kid keep missing the same letter for free', () => {
    // One key they can't find must never drain the whole tank.
    const setup = setupFor('as', { shields: 0 })
    const state = run(setup, miss(8))
    expect(state.tank).toBe(4)
    expect(state.slips).toBe(1)
    expect(state.wrongPresses).toBe(8)
    expect(state.event?.kind).toBe('miss')
    expect(state.status).toBe('flying')
  })

  it('marks the letter amber once it has slipped, even after it is typed', () => {
    const state = run(setupFor('as'), [...miss(), key('a')])
    expect(state.marks).toEqual(['slipped', null])
  })

  it('tows the ship home when the tank runs dry, and then nothing changes', () => {
    const setup = setupFor('aaa', { shields: 0, tank: 2 })
    const state = run(setup, [...miss(), key('a'), ...miss()])
    expect(state.status).toBe('towed')
    expect(state.tank).toBe(0)
    expect(state.event?.kind).toBe('towed')
    expect(run(setup, [key('a'), { type: 'skip', now: 0 }], state)).toBe(state)
  })

  it('never runs dry on a training flight', () => {
    const setup = setupFor('aaaaaa', { shields: 0, tank: 1, training: true })
    const actions = [...'aaaaaa'].flatMap((char) => [...miss(), key(char)])
    let state = initTrail(setup)
    const reducer = makeTrailReducer(setup)
    for (const action of actions) {
      state = reducer(state, action)
      if (state.status === 'flying') expect(state.tank).toBe(1)
    }
    expect(state.status).toBe('found')
    expect(state.slips).toBe(6)
  })

  it('treats the right letter in the wrong case as Caps Lock, not a slip', () => {
    const setup = setupFor('as')
    const state = run(setup, [key('A', 0, true)])
    expect(state).toMatchObject({ cursor: 0, slips: 0, capsHint: true, tank: 5, shields: 1 })
    // Without Caps Lock on, a wrong case is a real slip (Shift is being taught).
    expect(run(setup, [key('A', 0, false)]).slips).toBe(1)
    // The hint goes once they type on.
    expect(run(setup, [key('a')], state).capsHint).toBe(false)
  })
})

describe('shields', () => {
  const long = 'a'.repeat(40)

  it('wins one shield back after a clean run, once per hunt', () => {
    const setup = setupFor(long, { shields: 1, maxShields: 1 })
    let state = run(setup, [...miss(), key('a')])
    expect(state.shields).toBe(0)

    state = run(setup, typed('a'.repeat(SHIELD_REGEN_STREAK)), state)
    expect(state.shields).toBe(1)
    expect(state.event?.kind).toBe('regen')

    state = run(setup, [...miss(), key('a'), ...typed('a'.repeat(SHIELD_REGEN_STREAK + 5))], state)
    expect(state.shields).toBe(0)
  })

  it('never regains a shield above the ship’s maximum', () => {
    const setup = setupFor(long, { shields: 2, maxShields: 2 })
    const state = run(setup, typed('a'.repeat(SHIELD_REGEN_STREAK + 1)))
    expect(state.shields).toBe(2)
    expect(state.shieldRegained).toBe(false)
  })
})

describe('stardust', () => {
  it('banks each word as it is finished, worth about a letter each', () => {
    const setup = setupFor('as dad falls')
    let state = run(setup, typed('as'))
    expect(state.banked).toBe(3) // "as" plus its space
    expect(state.event?.kind).toBe('word')
    state = run(setup, typed(' dad falls'), state)
    expect(state.banked).toBe('as dad falls'.length)
    expect(state.wordsDone).toBe(3)
  })

  it('rounds each word on richer planets', () => {
    const state = run(setupFor('as dad', { stardustPerLetter: 1.25 }), typed('as dad'))
    expect(state.banked).toBe(Math.round(3 * 1.25) + Math.round(3 * 1.25))
  })
})

describe('skipping a letter nobody can find', () => {
  it('only offers a skip after several misses, and the skip moves on for free', () => {
    const setup = setupFor('asd', { shields: 0 })
    let state = run(setup, miss(MISSES_BEFORE_SKIP - 1))
    expect(state.offerSkip).toBe(false)
    expect(run(setup, [{ type: 'skip', now: 0 }], state)).toBe(state)

    state = run(setup, miss(), state)
    expect(state.offerSkip).toBe(true)
    state = run(setup, [{ type: 'skip', now: 0 }], state)
    expect(state).toMatchObject({ cursor: 1, skipped: 1, tank: 4, offerSkip: false })
    expect(state.marks[0]).toBe('skipped')
    expect(state.event?.kind).toBe('skip')
  })

  it('still finds the piece when the last letter is skipped', () => {
    const setup = setupFor('as', { shields: 0 })
    const state = run(setup, [key('a'), ...miss(MISSES_BEFORE_SKIP), { type: 'skip', now: 0 }])
    expect(state.status).toBe('found')
    expect(state.banked).toBe(2)
  })
})

describe('sparkles and the robot', () => {
  it('only lets a robot catch sparkles', () => {
    const setup = setupFor('as dad')
    const state = run(setup, [{ type: 'sparkle-show', id: 1 }, { type: 'catch' }])
    expect(state.loot).toBe(0)
    // Without a robot, a sparkle drifting past wasn't a chance missed.
    expect(state.sparklesShown).toBe(0)
  })

  it('pays for a caught sparkle', () => {
    const setup = setupFor('as dad', { lootPerCatch: 3 })
    const state = run(setup, [{ type: 'sparkle-show', id: 1 }, { type: 'catch' }])
    expect(state).toMatchObject({ loot: 3, sparklesShown: 1, sparklesCaught: 1, sparkle: null })
    expect(state.event?.kind).toBe('catch')
  })

  it('does not count a sparkle cut short by finding the piece', () => {
    const setup = setupFor('as', { lootPerCatch: 3 })
    const state = run(setup, [key('a'), { type: 'sparkle-show', id: 1 }, key('s')])
    expect(state.status).toBe('found')
    expect(state.sparklesShown).toBe(0)
  })

  it('lets a sparkle expire without a catch', () => {
    const setup = setupFor('as', { lootPerCatch: 3 })
    const state = run(setup, [{ type: 'sparkle-show', id: 7 }, { type: 'sparkle-hide', id: 7 }, { type: 'catch' }])
    expect(state).toMatchObject({ sparkle: null, sparklesShown: 1, sparklesCaught: 0, loot: 0 })
  })
})

describe('bookkeeping', () => {
  it('counts one try per letter, and capitals towards Shift as well', () => {
    const setup = setupFor('Ab')
    let state = run(setup, [...miss(3), key('A')])
    expect(state.keyAttempts).toEqual({ a: 1, Shift: 1 })
    expect(state.keyErrors).toEqual({ a: 1, Shift: 1 })
    state = run(setup, [key('b')], state)
    expect(state.keyAttempts).toEqual({ a: 1, Shift: 1, b: 1 })
  })

  it('ignores the keyboard while paused', () => {
    const setup = setupFor('as')
    let state = run(setup, [{ type: 'pause' }, key('a')])
    expect(state.cursor).toBe(0)
    state = run(setup, [{ type: 'resume' }, key('a')], state)
    expect(state.cursor).toBe(1)
  })

  it('reports how a found, towed or abandoned hunt went', () => {
    const found = run(setupFor('as'), [key('a', 1000), ...miss(), key('s', 4000)])
    expect(outcomeOf(found, 9999)).toMatchObject({
      result: 'found',
      letters: 2,
      slips: 1,
      accuracy: 0.5,
      tankLeft: 5,
      elapsedMs: 3000,
    })

    const towed = run(setupFor('aaa', { shields: 0, tank: 1 }), [...miss()])
    expect(outcomeOf(towed, 0)).toMatchObject({ result: 'towed', letters: 1, accuracy: 0, tankLeft: 0 })

    const abandoned = run(setupFor('as dad'), typed('as'))
    expect(outcomeOf(abandoned, 0)).toMatchObject({ result: 'aborted', letters: 2, banked: 3, accuracy: 1 })
  })
})

describe('what the pilot can see', () => {
  const setup = setupFor('as dad falls')

  it('shows only as many letters as the scanner reaches, fading with distance', () => {
    const state = initTrail(setup)
    expect(visibleAhead(state, setup, 1).map((l) => l.char)).toEqual(['a'])
    const four = visibleAhead(state, setup, 4)
    expect(four.map((l) => l.char).join('')).toBe('as d')
    expect(four[0].glow).toBe(1)
    for (let i = 1; i < four.length; i++) expect(four[i].glow).toBeLessThan(four[i - 1].glow)
  })

  it('never reads past the end of the trail, and shows nothing once found', () => {
    const almost = run(setup, typed('as dad fal'))
    expect(visibleAhead(almost, setup, 12).map((l) => l.char).join('')).toBe('ls')
    expect(visibleAhead(run(setup, typed('ls'), almost), setup, 12)).toEqual([])
  })

  it('builds the message a whole word at a time', () => {
    expect(messageSoFar(run(setup, typed('as d')), setup)).toBe('as')
    expect(messageSoFar(run(setup, typed('as dad')), setup)).toBe('as dad')
    expect(messageSoFar(run(setup, typed('as dad f')), setup)).toBe('as dad')
    expect(messageSoFar(run(setup, typed('as dad falls')), setup)).toBe('as dad falls')
  })

  it('knows when the piece is close', () => {
    const twenty = setupFor('asdf asdf asdf asdf ')
    expect(isNearEnd(run(twenty, typed('asdf asdf asdf a')), twenty)).toBe(true)
    expect(isNearEnd(run(twenty, typed('asdf asdf as')), twenty)).toBe(false)
  })
})

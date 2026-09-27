import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { HuntOutcome } from '../engine/trail'
import { makePilot, SAVE_VERSION, STORAGE_KEY, type Pilot } from './schema'

const storage = new Map<string, string>()
const localStorage = {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
}
vi.stubGlobal('window', { localStorage })
const { activePilot, useStarTrail } = await import('./pilotStore')

function outcome(result: HuntOutcome['result'], extra: Partial<HuntOutcome> = {}): HuntOutcome {
  return {
    result,
    letters: 14,
    slips: 1,
    skipped: 0,
    wrongPresses: 1,
    accuracy: 13 / 14,
    keyAttempts: { a: 7, d: 7 },
    keyErrors: { a: 1 },
    banked: 14,
    loot: 0,
    tankLeft: result === 'towed' ? 0 : 5,
    sparklesShown: 0,
    sparklesCaught: 0,
    elapsedMs: 15_000,
    ...extra,
  }
}

function seed(extra: Partial<Pilot> = {}) {
  const pilot = { ...makePilot('Nova', '🧑‍🚀'), ...extra }
  useStarTrail.setState({
    save: { version: SAVE_VERSION, pilots: [pilot], activePilotId: pilot.id },
    screen: 'galaxy',
    plan: null,
    lastHunt: null,
    justLaunched: false,
  })
  return pilot
}

const pilot = () => activePilot(useStarTrail.getState())!

beforeEach(() => storage.clear())

describe('the Star Trail store', () => {
  it('keeps its own save, and never touches Typing Teacher’s', () => {
    storage.set('typing-teacher.save.v1', '{"untouched":true}')
    useStarTrail.getState().addPilot('Ada', '👩‍🚀')
    expect(storage.has(STORAGE_KEY)).toBe(true)
    expect(storage.get('typing-teacher.save.v1')).toBe('{"untouched":true}')
    expect(useStarTrail.getState().screen).toBe('galaxy')
  })

  it('shows a planet’s intro before its first hunt, then goes straight to hunting', () => {
    seed()
    useStarTrail.getState().startHunt(1)
    expect(useStarTrail.getState().screen).toBe('arrival')
    useStarTrail.getState().finishIntro()
    expect(useStarTrail.getState().screen).toBe('hunt')
    expect(pilot().introsSeen).toContain(1)

    useStarTrail.getState().startHunt(2)
    expect(useStarTrail.getState().screen).toBe('hunt')
  })

  it('remembers the message as soon as the hunt starts, so backing out can’t re-roll it', () => {
    seed({ introsSeen: [1] })
    useStarTrail.getState().startHunt(5)
    const { plan } = useStarTrail.getState()
    expect(pilot().recent[1]).toEqual([plan!.text])
  })

  it('shows the Found screen after a piece, and the tow after running dry', () => {
    seed({ introsSeen: [1], huntsFlown: 5 })
    useStarTrail.getState().startHunt(3)
    useStarTrail.getState().recordHunt(outcome('found'))
    expect(useStarTrail.getState().screen).toBe('found')
    expect(pilot().pieces[1]).toBe(1)
    expect(useStarTrail.getState().lastHunt?.pieceFound).toBe(true)

    useStarTrail.getState().startHunt(4)
    useStarTrail.getState().recordHunt(outcome('towed'))
    expect(useStarTrail.getState().screen).toBe('towed')
    expect(pilot().pieces[1]).toBe(1)
    expect(pilot().failStreak).toBe(1)
  })

  it('goes back to the galaxy when a pilot heads back to base', () => {
    seed({ introsSeen: [1] })
    useStarTrail.getState().startHunt(3)
    useStarTrail.getState().recordHunt(outcome('aborted', { letters: 0, banked: 0 }))
    expect(useStarTrail.getState().screen).toBe('galaxy')
    expect(useStarTrail.getState().lastHunt).toBeNull()
  })

  it('sells helpers the pilot can afford, and refuses the rest', () => {
    seed({ stardust: 40 })
    useStarTrail.getState().buyUpgrade('scanner')
    expect(pilot()).toMatchObject({ stardust: 10, upgrades: { scanner: 1 } })
    useStarTrail.getState().buyUpgrade('shields')
    expect(pilot()).toMatchObject({ stardust: 10, upgrades: { shields: 0 } })
  })

  it('launches only when the pieces, engine and navigator are all ready', () => {
    const history = [
      { planet: 1, result: 'found' as const, practice: false, letters: 30, slips: 1, accuracy: 0.97, newKeyTries: 30, newKeySlips: 1, stardust: 30, help: 'letters' as const, date: '2026-09-27' },
    ]
    seed({ pieces: { 1: 3 }, history })
    useStarTrail.getState().launch()
    expect(pilot().highestPlanet).toBe(1)

    seed({ pieces: { 1: 3 }, history, upgrades: { scanner: 0, shields: 0, robot: 0, engines: 1 } })
    useStarTrail.getState().launch()
    expect(pilot()).toMatchObject({ planet: 2, highestPlanet: 2 })
    expect(useStarTrail.getState()).toMatchObject({ screen: 'arrival', justLaunched: true })
  })

  it('comes back exactly as it was after a reload', async () => {
    seed({ stardust: 12, stardustEarned: 30, pieces: { 1: 2 } })
    useStarTrail.getState().toggleSound()
    const before = useStarTrail.getState().save
    await useStarTrail.persist.rehydrate()
    expect(useStarTrail.getState().save).toEqual(before)
  })

  it('backs up a save it can’t read instead of throwing it away', async () => {
    storage.set(STORAGE_KEY, '{ this is not json')
    await expect(useStarTrail.persist.rehydrate()).resolves.not.toThrow()
    expect(storage.get(`${STORAGE_KEY}.corrupt`)).toBe('{ this is not json')
  })

  it('cleans up a hand-edited save on the way in', async () => {
    storage.set(
      STORAGE_KEY,
      JSON.stringify({ state: { save: { pilots: [{ name: 'Hacker', stardust: -99, planet: 42 }] } }, version: SAVE_VERSION }),
    )
    await useStarTrail.persist.rehydrate()
    const [loaded] = useStarTrail.getState().save.pilots
    expect(loaded).toMatchObject({ name: 'Hacker', stardust: 0, planet: 1 })
  })
})

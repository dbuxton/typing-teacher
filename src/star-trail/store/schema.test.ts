import { describe, expect, it } from 'vitest'
import { PLANET_COUNT } from '../data/planets'
import { DEFAULT_LOOK } from '../data/makeovers'
import { GADGET_MAX, NO_UPGRADES, STAR_NAME_LENGTH, START_SLIP_RATE } from '../engine/balance'
import { SAVE_VERSION, emptyCargo, makePilot, maxLevel, migrate, sanitizeSave, type Pilot } from './schema'

describe('reading a save', () => {
  it('turns anything unreadable into an empty save rather than a crash', () => {
    for (const junk of [null, undefined, 'x', 42, [], { pilots: 'no' }, { pilots: [null, 7, 'x'] }]) {
      expect(sanitizeSave(junk)).toMatchObject({ version: SAVE_VERSION, pilots: [], activePilotId: null })
    }
  })

  it('keeps a fresh pilot exactly as it was', () => {
    const pilot = makePilot('Nova', '🧑‍🚀')
    const save = { version: SAVE_VERSION, pilots: [pilot], activePilotId: pilot.id }
    expect(sanitizeSave(save)).toEqual(save)
  })

  it('keeps pilots — and fields it doesn’t know — from a save written by a newer build', () => {
    // Typing Teacher starts fresh when it meets a newer save; a rollback would
    // wipe every kid. Star Trail carries the save forward instead.
    const pilot = { ...makePilot('Nova', '🧑‍🚀'), stardust: 77, hoverboard: 'gold' }
    const loaded = migrate({ version: 99, pilots: [pilot], activePilotId: pilot.id, galaxyMode: 'x' }, 99)
    expect(loaded.pilots).toHaveLength(1)
    expect(loaded.pilots[0].stardust).toBe(77)
    expect((loaded.pilots[0] as Pilot & { hoverboard: string }).hoverboard).toBe('gold')
    expect((loaded as typeof loaded & { galaxyMode: string }).galaxyMode).toBe('x')
    expect(loaded.activePilotId).toBe(pilot.id)
  })

  it('clamps nonsense numbers to something playable', () => {
    const save = sanitizeSave({
      pilots: [
        {
          id: 'p1',
          name: 'Zed',
          stardust: -50,
          planet: 99,
          highestPlanet: 4,
          pieces: { 1: 7, 2: -1, 99: 3 },
          upgrades: { scanner: 99, shields: -2, robot: 'lots' },
          slipRate: Number.NaN,
          help: 'telepathy',
          keyStats: { a: { attempts: 5, errors: 9 }, b: 'x' },
          sound: 'maybe',
          history: [{ planet: 2, result: 'weird', letters: 10, slips: 50, accuracy: 3 }, 'junk'],
        },
      ],
    })
    const [pilot] = save.pilots
    expect(pilot.stardust).toBe(0)
    expect(pilot.planet).toBe(4)
    expect(pilot.pieces).toEqual({ 1: 3 })
    expect(pilot.upgrades).toEqual({ ...NO_UPGRADES, scanner: maxLevel('scanner'), engines: 3 })
    expect(pilot.slipRate).toBe(START_SLIP_RATE)
    expect(pilot.help).toBe('letters')
    expect(pilot.keyStats).toEqual({ a: { attempts: 5, errors: 5 } })
    expect(pilot.sound).toBe(true)
    expect(pilot.history).toHaveLength(1)
    expect(pilot.history[0]).toMatchObject({ result: 'aborted', slips: 10, accuracy: 1 })
  })

  it('makes sure the engines could have reached the furthest planet', () => {
    const [pilot] = sanitizeSave({ pilots: [{ name: 'Ada', highestPlanet: PLANET_COUNT, upgrades: {} }] }).pilots
    expect(pilot.upgrades.engines).toBe(PLANET_COUNT - 1)
  })

  it('gives twins with the same id a ship each, and forgets a pilot who has gone', () => {
    const pilot = makePilot('Twin', '👯')
    const save = sanitizeSave({ pilots: [pilot, pilot], activePilotId: 'someone-deleted' })
    expect(new Set(save.pilots.map((p) => p.id)).size).toBe(2)
    expect(save.activePilotId).toBeNull()
  })

  it('gives an old save’s pilots an empty cargo hold, a plain ship and no stars', () => {
    const [pilot] = sanitizeSave({ pilots: [{ name: 'Old', stardust: 5 }] }).pilots
    expect(pilot).toMatchObject({ cargo: emptyCargo(), owned: [], look: DEFAULT_LOOK, stars: [] })
  })

  it('only lets a ship wear what the pilot owns, but never forgets a purchase', () => {
    const [pilot] = sanitizeSave({
      pilots: [
        {
          name: 'Zed',
          // 'paint:plaid' might come from a newer build: kept, but not worn.
          owned: ['paint:pink', 'pet:cat', 'paint:plaid', 'paint:pink', 7],
          look: { paint: 'paint:plaid', ship: 'ship:saucer', trail: 'trail:cyan', horn: 42, pet: 'pet:cat' },
          cargo: { fuel: 99, clover: -1, flare: 'yes' },
          stars: ['  Mum  ', '', 'A name far too long to fit on the galaxy map', 3],
        },
      ],
    }).pilots
    expect(pilot.owned).toEqual(['paint:pink', 'pet:cat', 'paint:plaid'])
    expect(pilot.look).toEqual({ ...DEFAULT_LOOK, pet: 'pet:cat' })
    expect(pilot.cargo).toEqual({ ...emptyCargo(), fuel: GADGET_MAX.fuel })
    expect(pilot.stars).toEqual(['Mum', 'A name far too lo'.slice(0, STAR_NAME_LENGTH).trim()])
  })

  it('gives the same answer when run twice', () => {
    const messy = { pilots: [{ name: 'Mo', stardust: 3.7, pieces: { 2: 2 }, extra: [1, 2] }], activePilotId: 'nope' }
    const once = sanitizeSave(messy)
    expect(sanitizeSave(once)).toEqual(once)
  })
})

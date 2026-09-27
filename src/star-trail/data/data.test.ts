import { describe, expect, it } from 'vitest'
import { PLANET_BALANCE } from '../engine/balance'
import { CATCH_KEY, PAUSE_KEY, SKIP_KEY } from '../engine/keys'
import { PLANETS, isTypeableOn, keysFor, newKeysIn } from './planets'
import { SENTENCES } from './sentences'
import { SHIP_PARTS } from './ship'
import { ENDING } from './ending'
import { CREW, STORY } from './story'
import { SHIP_SHAPES } from '../components/shipShapes'

describe('planets', () => {
  it('teaches keys in a pinned order, so a change to Typing Teacher’s curriculum fails loudly', () => {
    expect(PLANETS.map((planet) => planet.newKeys.join(' '))).toEqual([
      'a s d f j k l ;',
      'e i',
      'r u',
      't y',
      'g h',
      'o n',
      'c v m',
      'w q p',
      'b x z , .',
      'Shift',
    ])
  })

  it('never teaches ? ! or an apostrophe, which have no finger on the key map', () => {
    for (const planet of PLANETS) {
      for (const key of ['?', '!', "'"]) expect(planet.allKeys, planet.name).not.toContain(key)
    }
  })

  it('never asks for the keys that catch sparkles, skip a letter or pause', () => {
    for (const planet of PLANETS) {
      for (const key of [CATCH_KEY, SKIP_KEY, PAUSE_KEY]) expect(planet.allKeys, planet.name).not.toContain(key)
    }
  })

  it('names each planet so it hides the letters it teaches', () => {
    // Seal Isle teaches E and I, Yeti Tundra Y and T… The home row and the
    // Shift planet are named for what they teach instead.
    for (const planet of PLANETS.filter((p) => p.id !== 1)) {
      for (const letter of planet.newKeys.filter((key) => /^[a-z]$/.test(key))) {
        expect(planet.name.toLowerCase(), `${planet.name} should hide ${letter}`).toContain(letter)
      }
    }
  })

  it('hides a different part of the Lost Ship on every planet', () => {
    expect(PLANETS.map((planet) => planet.partId).sort()).toEqual(SHIP_PARTS.map((part) => part.id).sort())
  })

  it('has sensible balance numbers for every planet', () => {
    expect(PLANET_BALANCE).toHaveLength(PLANETS.length)
    for (const balance of PLANET_BALANCE) {
      expect(balance.trailMin).toBeLessThanOrEqual(balance.trailBase)
      expect(balance.trailBase).toBeLessThanOrEqual(balance.trailMax)
    }
    // Only the last planet has nowhere further to fly.
    expect(PLANET_BALANCE.map((balance) => balance.enginePrice === null)).toEqual([
      ...Array(PLANETS.length - 1).fill(false),
      true,
    ])
  })
})

describe.each(PLANETS)('trail messages on $name', (planet) => {
  const messages = SENTENCES[planet.id] ?? []
  const { trailMin, trailMax } = PLANET_BALANCE[planet.id - 1]

  it('only uses keys this planet has taught', () => {
    for (const message of messages) expect(isTypeableOn(message, planet), message).toBe(true)
  })

  it('practises at least one of this planet’s new keys in every message', () => {
    for (const message of messages) expect(newKeysIn(message, planet).length, message).toBeGreaterThan(0)
  })

  it('practises every one of the new keys somewhere', () => {
    const used = new Set(messages.flatMap((message) => [...message].flatMap(keysFor)))
    for (const key of planet.newKeys) expect(used.has(key), `nothing practises ${key}`).toBe(true)
  })

  it('has short, middling and long messages that fit the trail', () => {
    expect(messages.length).toBeGreaterThanOrEqual(15)
    for (const message of messages) {
      expect(message.length, message).toBeGreaterThanOrEqual(trailMin)
      expect(message.length, message).toBeLessThanOrEqual(trailMax)
    }
    const short = messages.filter((m) => m.length < trailMax * 0.5)
    const long = messages.filter((m) => m.length >= trailMax * 0.75)
    const middling = messages.length - short.length - long.length
    expect(short.length, 'short messages').toBeGreaterThanOrEqual(5)
    expect(middling, 'middling messages').toBeGreaterThanOrEqual(5)
    expect(long.length, 'long messages').toBeGreaterThanOrEqual(5)
  })

  it('is tidily spaced', () => {
    for (const message of messages) {
      expect(message, message).toBe(message.trim())
      expect(message.includes('  '), message).toBe(false)
    }
  })
})

describe('the whole galaxy of messages', () => {
  it('never repeats a message', () => {
    const all = PLANETS.flatMap((planet) => SENTENCES[planet.id] ?? [])
    expect(new Set(all).size).toBe(all.length)
  })

  it('ends every message with a full stop once full stops are taught', () => {
    for (const planet of PLANETS.filter((p) => p.allKeys.includes('.'))) {
      for (const message of SENTENCES[planet.id]) expect(message.endsWith('.'), message).toBe(true)
    }
  })

  it('starts every message with a capital on the planet that teaches Shift', () => {
    for (const planet of PLANETS.filter((p) => p.newKeys.includes('Shift'))) {
      for (const message of SENTENCES[planet.id]) expect(message[0], message).toMatch(/[A-Z]/)
    }
  })
})

describe('the Lost Ship', () => {
  it('draws every part in three pieces', () => {
    for (const part of SHIP_PARTS) {
      expect(SHIP_SHAPES[part.id], part.name).toHaveLength(3)
      for (const path of SHIP_SHAPES[part.id]) expect(path.trim().startsWith('M'), part.name).toBe(true)
    }
  })

  it('has an ending that finds the crew from the story', () => {
    expect(ENDING.title.length).toBeGreaterThan(0)
    expect(ENDING.lines.length).toBeGreaterThan(0)
    for (const member of CREW) {
      expect(STORY.premise, member).toContain(member)
      expect(ENDING.lines.join(' '), member).toContain(member)
    }
  })
})

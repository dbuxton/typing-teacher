import { getLevel, isTypeable } from '../../data/curriculum'
import type { ShipPartId } from './ship'

/**
 * Planets are Star Trail's lessons. Each one teaches a few new keys and hides
 * the three pieces of one part of the Lost Ship.
 *
 * The key order comes straight from Typing Teacher's curriculum, so there is one
 * source of truth for "which keys, in which order". Planet 1 is the whole home
 * row (Typing Teacher splits F and J into a level of their own; here the arrival
 * intro powers them up first instead). `? ! '` never appear: the key map has no
 * finger for them.
 *
 * Names and colours are placeholders — rename away.
 */

export type Planet = {
  id: number
  /** Typing Teacher level whose key set this planet uses. */
  levelId: number
  name: string
  /** The planet's neon colour. */
  hue: string
  partId: ShipPartId
  /** Every key a trail here may use. */
  allKeys: string[]
  /** Keys this planet introduces: its keys minus the previous planet's. */
  newKeys: string[]
}

const PLANET_INFO: { levelId: number; name: string; hue: string; partId: ShipPartId }[] = [
  { levelId: 2, name: 'Home Moon', hue: '#5ef2ff', partId: 'hull' },
  { levelId: 3, name: 'Echo', hue: '#a6ff6a', partId: 'cockpit' },
  { levelId: 4, name: 'Rusty Rock', hue: '#ff8f70', partId: 'nose-cone' },
  { levelId: 5, name: 'Twinkle Twins', hue: '#ff6fd8', partId: 'wings' },
  { levelId: 6, name: 'Glow Giant', hue: '#ffe36e', partId: 'fuel-tanks' },
  { levelId: 7, name: 'Orbit Nine', hue: '#a98bff', partId: 'landing-legs' },
  { levelId: 8, name: 'Comet Valley', hue: '#4dffc3', partId: 'tail-fin' },
  { levelId: 9, name: 'Quasar Point', hue: '#6aa8ff', partId: 'radar-dish' },
  { levelId: 10, name: 'Buzz Nebula', hue: '#ff5c8a', partId: 'main-engine' },
  { levelId: 11, name: 'Capital Star', hue: '#fff4c2', partId: 'star-drive' },
]

export const PLANETS: readonly Planet[] = PLANET_INFO.map((info, index) => {
  const allKeys = [...getLevel(info.levelId).allKeys]
  const previous = index === 0 ? [] : getLevel(PLANET_INFO[index - 1].levelId).allKeys
  return {
    id: index + 1,
    ...info,
    allKeys,
    newKeys: allKeys.filter((key) => !previous.includes(key)),
  }
})

export const PLANET_COUNT = PLANETS.length

export function getPlanet(id: number): Planet {
  const planet = PLANETS.find((p) => p.id === id)
  if (!planet) throw new Error(`No planet ${id}`)
  return planet
}

/** Can every character of `text` be typed with this planet's keys? */
export function isTypeableOn(text: string, planet: Planet): boolean {
  return [...text].every((char) => isTypeable(char, planet.allKeys))
}

/**
 * The key-stat buckets one character counts towards: its letter, plus Shift
 * for a capital (Shift is what the last planet teaches).
 */
export function keysFor(char: string): string[] {
  const lower = char.toLowerCase()
  return char !== lower ? [lower, 'Shift'] : [lower]
}

/** Which of this planet's new keys does `text` exercise? */
export function newKeysIn(text: string, planet: Planet): string[] {
  const used = new Set([...text].flatMap(keysFor))
  return planet.newKeys.filter((key) => used.has(key))
}

/** How a key is written on screen: capital letters, and names for the rest. */
export function keyLabel(key: string): string {
  if (key === ' ') return 'Space'
  if (key === 'Shift') return 'Shift'
  return key.toUpperCase()
}

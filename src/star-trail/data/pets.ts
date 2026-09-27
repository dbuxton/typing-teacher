import type { PetId } from '../engine/balance'

/**
 * Crew pets. One rides along on each hunt, cheers you on, and brings a little
 * stardust with its own trick. What each trick is worth lives in balance.ts.
 */
export type Pet = {
  id: string
  pet: PetId
  name: string
  price: number
  /** What it does, for the space station. */
  blurb: string
  /** What it did on a hunt, for the Found screen. */
  did: (times: number) => string
}

const times = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

export const PETS: readonly Pet[] = [
  {
    id: 'pet:cat',
    pet: 'cat',
    name: 'Space cat',
    price: 60,
    blurb: 'Purrs every time you get 10 letters in a row right first time.',
    did: (n) => `purred ${n === 1 ? 'once' : times(n, 'time')}`,
  },
  {
    id: 'pet:puppy',
    pet: 'puppy',
    name: 'Moon puppy',
    price: 80,
    blurb: 'Fetches a sparkle of stardust on every trail.',
    did: () => 'fetched a sparkle',
  },
  {
    id: 'pet:alien',
    pet: 'alien',
    name: 'Baby alien',
    price: 100,
    blurb: 'Waves at every word you finish — and every wave brings a speck of stardust.',
    did: (n) => `waved at ${times(n, 'word')}`,
  },
  {
    id: 'pet:dragon',
    pet: 'dragon',
    name: 'Baby star dragon',
    price: 200,
    blurb: 'Puffs a big stardust ring when you find a piece without using any fuel from the tank.',
    did: () => 'puffed a stardust ring',
  },
]

export function petFor(id: string | null): Pet | undefined {
  return id === null ? undefined : PETS.find((pet) => pet.id === id)
}

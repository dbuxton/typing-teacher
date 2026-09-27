/**
 * The Lost Ship: the big mystery the pieces add up to. Every planet hides the
 * three pieces of one part; find all thirty and the ship flies again (see
 * ending.ts for where it takes you).
 */

export type ShipPartId =
  | 'hull'
  | 'cockpit'
  | 'nose-cone'
  | 'wings'
  | 'fuel-tanks'
  | 'landing-legs'
  | 'tail-fin'
  | 'radar-dish'
  | 'main-engine'
  | 'star-drive'

export type ShipPart = {
  id: ShipPartId
  name: string
  /** One kid-facing line for the Found screen and the blueprint. */
  blurb: string
}

export const PIECES_PER_PART = 3

export const SHIP_PARTS: readonly ShipPart[] = [
  { id: 'hull', name: 'Hull', blurb: 'The strong body that holds the whole ship together.' },
  { id: 'cockpit', name: 'Cockpit', blurb: 'Where the pilot sits, with a big window onto the stars.' },
  { id: 'nose-cone', name: 'Nose cone', blurb: 'The pointy front that pushes through space dust.' },
  { id: 'wings', name: 'Wings', blurb: 'For swooping through glittery nebula clouds.' },
  { id: 'fuel-tanks', name: 'Fuel tanks', blurb: 'Full to the brim with glowing star fuel.' },
  { id: 'landing-legs', name: 'Landing legs', blurb: 'For soft landings on bumpy moons.' },
  { id: 'tail-fin', name: 'Tail fin', blurb: 'Keeps the ship flying straight and true.' },
  { id: 'radar-dish', name: 'Radar dish', blurb: 'Listens for messages from very far away.' },
  { id: 'main-engine', name: 'Main engine', blurb: 'The big rumbling rocket at the back.' },
  { id: 'star-drive', name: 'Star drive', blurb: 'The secret engine that jumps between the stars.' },
]

export function shipPart(id: ShipPartId): ShipPart {
  const part = SHIP_PARTS.find((p) => p.id === id)
  if (!part) throw new Error(`No ship part ${id}`)
  return part
}

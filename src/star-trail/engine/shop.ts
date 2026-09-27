import { makeover, type MakeoverKind } from '../data/makeovers'
import { petFor } from '../data/pets'
import { cleanStarName, type Pilot } from '../store/schema'
import {
  GADGET_MAX,
  GADGET_PRICE,
  MAX_NAMED_STARS,
  STAR_PRICE,
  planetBalance,
  type GadgetId,
} from './balance'

/**
 * Everything at the space station that isn't a helper: gadgets used up on the
 * next hunt, makeovers, pets and named stars. Helpers, engines and launching
 * live in economy.ts.
 *
 * None of these are ever out of stock, so there's always something to save
 * up for, and none of them touch the notebook's rule: a makeover doesn't help
 * you find anything, and a gadget helps with one hunt only.
 */

// ─── Gadgets ───────────────────────────────────────────────────────────────

/** How much bigger a trail's stardust is on this planet than on the first. */
function planetScale(planetId: number): number {
  const first = planetBalance(1)
  const here = planetBalance(planetId)
  return (here.stardustPerLetter * here.trailMax) / (first.stardustPerLetter * first.trailMax)
}

/** Gadget prices rise the further out the pilot has flown, rounded to a friendly 5. */
export function gadgetPrice(gadget: GadgetId, highestPlanet: number): number {
  return Math.max(5, Math.round((GADGET_PRICE[gadget] * planetScale(highestPlanet)) / 5) * 5)
}

export type GadgetStock = {
  status: 'buy' | 'too-dear' | 'full'
  price: number
  loaded: number
  max: number
}

export function gadgetStock(pilot: Pilot, gadget: GadgetId): GadgetStock {
  const price = gadgetPrice(gadget, pilot.highestPlanet)
  const loaded = pilot.cargo[gadget]
  const max = GADGET_MAX[gadget]
  const status = loaded >= max ? 'full' : price > pilot.stardust ? 'too-dear' : 'buy'
  return { status, price, loaded, max }
}

/** Load one more of a gadget for the next hunt, or null if it's full or too dear. */
export function buyGadget(pilot: Pilot, gadget: GadgetId): Pilot | null {
  const stock = gadgetStock(pilot, gadget)
  if (stock.status !== 'buy') return null
  return { ...pilot, stardust: pilot.stardust - stock.price, cargo: { ...pilot.cargo, [gadget]: stock.loaded + 1 } }
}

// ─── Makeovers and pets ────────────────────────────────────────────────────

type Item = { id: string; kind: MakeoverKind | 'pet'; price: number }

function item(id: string): Item | undefined {
  const look = makeover(id)
  if (look) return look
  const pet = petFor(id)
  return pet && { id: pet.id, kind: 'pet', price: pet.price }
}

/** Free makeovers belong to every ship. */
export function owns(pilot: Pilot, id: string): boolean {
  const found = item(id)
  return found !== undefined && (found.price === 0 || pilot.owned.includes(id))
}

export type ItemStock = 'wearing' | 'owned' | 'buy' | 'too-dear'

export function itemStock(pilot: Pilot, id: string): ItemStock {
  const found = item(id)
  if (!found) return 'too-dear'
  const wearing = found.kind === 'pet' ? pilot.look.pet === id : pilot.look[found.kind] === id
  if (wearing) return 'wearing'
  if (owns(pilot, id)) return 'owned'
  return found.price > pilot.stardust ? 'too-dear' : 'buy'
}

/** Put on a makeover, or take a pet along. Only what the pilot owns. */
export function wear(pilot: Pilot, id: string): Pilot | null {
  const found = item(id)
  if (!found || !owns(pilot, id)) return null
  const key = found.kind
  if (pilot.look[key] === id) return pilot
  return { ...pilot, look: { ...pilot.look, [key]: id } }
}

/** Leave the pet at home for a while. It stays the pilot's. */
export function leavePetHome(pilot: Pilot): Pilot {
  return pilot.look.pet === null ? pilot : { ...pilot, look: { ...pilot.look, pet: null } }
}

/** Buy a makeover or a pet and put it straight on. Null if owned already or too dear. */
export function buyItem(pilot: Pilot, id: string): Pilot | null {
  const found = item(id)
  if (!found || owns(pilot, id) || found.price > pilot.stardust) return null
  const bought = { ...pilot, stardust: pilot.stardust - found.price, owned: [...pilot.owned, id] }
  return wear(bought, id)
}

// ─── Named stars ───────────────────────────────────────────────────────────

export type StarStock = 'buy' | 'too-dear' | 'full'

export function starStock(pilot: Pilot): StarStock {
  if (pilot.stars.length >= MAX_NAMED_STARS) return 'full'
  return STAR_PRICE > pilot.stardust ? 'too-dear' : 'buy'
}

/** Name a star after anyone or anything. Null without a name, room or the stardust. */
export function nameStar(pilot: Pilot, name: string): Pilot | null {
  const clean = cleanStarName(name)
  if (clean.length === 0 || starStock(pilot) !== 'buy') return null
  return { ...pilot, stardust: pilot.stardust - STAR_PRICE, stars: [...pilot.stars, clean] }
}

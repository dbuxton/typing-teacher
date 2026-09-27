import { describe, expect, it } from 'vitest'
import { DEFAULT_LOOK, makeoversOf } from '../data/makeovers'
import { PETS } from '../data/pets'
import { makePilot, type Pilot } from '../store/schema'
import { GADGETS, GADGET_MAX, GADGET_PRICE, MAX_NAMED_STARS, STAR_PRICE } from './balance'
import {
  buyGadget,
  buyItem,
  gadgetPrice,
  gadgetStock,
  itemStock,
  leavePetHome,
  nameStar,
  owns,
  starStock,
  wear,
} from './shop'

const pilotWith = (extra: Partial<Pilot> = {}): Pilot => ({ ...makePilot('Nova', '🧑‍🚀'), ...extra })

describe('gadgets', () => {
  it('cost their list price on the first planet, and more the further out a pilot has flown', () => {
    for (const gadget of GADGETS) {
      expect(gadgetPrice(gadget, 1)).toBe(GADGET_PRICE[gadget])
      for (let planet = 2; planet <= 10; planet++) {
        expect(gadgetPrice(gadget, planet), `${gadget} on planet ${planet}`).toBeGreaterThanOrEqual(gadgetPrice(gadget, planet - 1))
        expect(gadgetPrice(gadget, planet) % 5).toBe(0)
      }
      expect(gadgetPrice(gadget, 10)).toBeGreaterThan(gadgetPrice(gadget, 1))
    }
  })

  it('load onto the ship for the next hunt, up to a limit', () => {
    let pilot = pilotWith({ stardust: 1000 })
    for (let i = 0; i < GADGET_MAX.fuel; i++) pilot = buyGadget(pilot, 'fuel')!
    expect(pilot.cargo.fuel).toBe(GADGET_MAX.fuel)
    expect(pilot.stardust).toBe(1000 - GADGET_MAX.fuel * GADGET_PRICE.fuel)
    expect(gadgetStock(pilot, 'fuel').status).toBe('full')
    expect(buyGadget(pilot, 'fuel')).toBeNull()
  })

  it('can’t be bought without the stardust', () => {
    const pilot = pilotWith({ stardust: GADGET_PRICE.clover - 1 })
    expect(gadgetStock(pilot, 'clover').status).toBe('too-dear')
    expect(buyGadget(pilot, 'clover')).toBeNull()
  })
})

describe('makeovers and pets', () => {
  const pink = 'paint:pink'
  const price = makeoversOf('paint').find((item) => item.id === pink)!.price

  it('come with the free ones already on every ship', () => {
    const pilot = pilotWith()
    expect(pilot.look).toEqual(DEFAULT_LOOK)
    for (const id of Object.values(DEFAULT_LOOK)) if (id) expect(owns(pilot, id), id).toBe(true)
    expect(itemStock(pilot, DEFAULT_LOOK.paint)).toBe('wearing')
  })

  it('take the price, and go straight on', () => {
    const bought = buyItem(pilotWith({ stardust: 100 }), pink)!
    expect(bought.stardust).toBe(100 - price)
    expect(bought.owned).toEqual([pink])
    expect(bought.look.paint).toBe(pink)
    expect(itemStock(bought, pink)).toBe('wearing')
  })

  it('are never sold twice, and never to a pilot who can’t afford them', () => {
    const bought = buyItem(pilotWith({ stardust: 100 }), pink)!
    expect(buyItem(bought, pink)).toBeNull()
    expect(buyItem(pilotWith({ stardust: price - 1 }), pink)).toBeNull()
    expect(itemStock(pilotWith({ stardust: price - 1 }), pink)).toBe('too-dear')
    expect(buyItem(pilotWith({ stardust: 10_000 }), 'paint:tartan')).toBeNull()
  })

  it('can be swapped back and forth once owned, but not worn before they’re bought', () => {
    const pilot = pilotWith({ stardust: 100 })
    expect(wear(pilot, pink)).toBeNull()
    const bought = buyItem(pilot, pink)!
    const plain = wear(bought, DEFAULT_LOOK.paint)!
    expect(plain.look.paint).toBe(DEFAULT_LOOK.paint)
    expect(itemStock(plain, pink)).toBe('owned')
    expect(wear(plain, pink)!.look.paint).toBe(pink)
  })

  it('lets one pet ride along at a time, and leave it at home without losing it', () => {
    const [cat, puppy] = PETS
    let pilot = buyItem(pilotWith({ stardust: 1000 }), cat.id)!
    expect(pilot.look.pet).toBe(cat.id)
    pilot = buyItem(pilot, puppy.id)!
    expect(pilot.look.pet).toBe(puppy.id)
    expect(itemStock(pilot, cat.id)).toBe('owned')
    pilot = leavePetHome(pilot)
    expect(pilot.look.pet).toBeNull()
    expect(owns(pilot, puppy.id)).toBe(true)
    expect(wear(pilot, cat.id)!.look.pet).toBe(cat.id)
  })
})

describe('named stars', () => {
  it('take the price and a tidy name', () => {
    const named = nameStar(pilotWith({ stardust: 100 }), '  Captain   Biscuit  ')!
    expect(named.stars).toEqual(['Captain Biscuit'])
    expect(named.stardust).toBe(100 - STAR_PRICE)
  })

  it('need a name, the stardust and room in the sky', () => {
    expect(nameStar(pilotWith({ stardust: 100 }), '   ')).toBeNull()
    expect(nameStar(pilotWith({ stardust: STAR_PRICE - 1 }), 'Mum')).toBeNull()
    const full = pilotWith({ stardust: 1000, stars: Array.from({ length: MAX_NAMED_STARS }, (_, i) => `Star ${i}`) })
    expect(starStock(full)).toBe('full')
    expect(nameStar(full, 'One more')).toBeNull()
  })
})

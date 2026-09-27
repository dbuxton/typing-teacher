import { describe, expect, it } from 'vitest'
import { makeRng } from '../../engine/rng'
import { PLANETS, getPlanet, isTypeableOn, newKeysIn } from '../data/planets'
import { SENTENCES } from '../data/sentences'
import { planetBalance } from './balance'
import { EARLIER_WEIGHT, pickTrail } from './trailGen'

const pick = (planetId: number, target: number, seed: number, extra: Partial<Parameters<typeof pickTrail>[0]> = {}) =>
  pickTrail({ planetId, target, keyStats: {}, recent: [], rng: makeRng(seed), ...extra })

describe('choosing the message for a trail', () => {
  it('only ever spells out keys the planet has taught', () => {
    for (const planet of PLANETS) {
      const { trailMin, trailMax } = planetBalance(planet.id)
      for (let seed = 0; seed < 50; seed++) {
        for (const target of [trailMin, trailMax]) {
          const text = pick(planet.id, target, seed)
          expect(isTypeableOn(text, planet), `${planet.name}: ${text}`).toBe(true)
        }
      }
    }
  })

  it('picks the same message for the same seed', () => {
    expect(pick(5, 26, 123)).toEqual(pick(5, 26, 123))
  })

  it('lands near the length asked for', () => {
    for (const planet of PLANETS) {
      const { trailBase, trailMax } = planetBalance(planet.id)
      for (const target of [trailBase, Math.round((trailBase + trailMax) / 2)]) {
        let total = 0
        for (let seed = 0; seed < 60; seed++) total += pick(planet.id, target, seed).length
        const average = total / 60
        expect(Math.abs(average - target) / target, `${planet.name} at ${target}: averaged ${average}`).toBeLessThan(0.25)
      }
    }
  })

  it('leaves out the messages flown most recently', () => {
    const recent = SENTENCES[3].slice(0, 8)
    for (let seed = 0; seed < 40; seed++) {
      expect(recent).not.toContain(pick(3, 20, seed, { recent }))
    }
  })

  it('mostly practises the planet’s new keys, with some familiar ground mixed in', () => {
    const planet = getPlanet(4)
    let withNew = 0
    for (let seed = 0; seed < 400; seed++) {
      if (newKeysIn(pick(4, 24, seed), planet).length > 0) withNew++
    }
    // Typing Teacher's rule: most material targets the new keys, with familiar
    // ground mixed in for confidence.
    expect(EARLIER_WEIGHT).toBeLessThan(1)
    expect(withNew / 400).toBeGreaterThan(0.7)
    expect(withNew / 400).toBeLessThan(0.97)
  })

  it('leans towards the keys this pilot keeps slipping on', () => {
    const count = (keyStats: Record<string, { attempts: number; errors: number }>) => {
      let hits = 0
      for (let seed = 0; seed < 300; seed++) if (pick(3, 20, seed, { keyStats }).includes('u')) hits++
      return hits
    }
    const calm = count({ u: { attempts: 40, errors: 0 } })
    const shaky = count({ u: { attempts: 40, errors: 20 } })
    expect(shaky).toBeGreaterThan(calm)
  })

  it('gets as close as it can when every long message was flown recently', () => {
    const longest = [...SENTENCES[2]].sort((a, b) => b.length - a.length).slice(0, 8)
    for (let seed = 0; seed < 30; seed++) {
      const text = pick(2, planetBalance(2).trailMax, seed, { recent: longest })
      expect(longest).not.toContain(text)
      expect(text.length).toBeGreaterThanOrEqual(planetBalance(2).trailMin)
    }
  })
})

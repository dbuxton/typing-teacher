import { describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { POKEMON_IMAGES } from '../../art/assets'
import { THEMES, collectionIsFull, collectionSlots, isFullyGrown, rewardKind, rewardStage, shopPreviewStage, themeById } from '.'
import { ANIMAL_SPECIES } from './animals'
import { EGG_PREFIX, eggColour } from './pokemon'
import { PLAYERS, TIERS } from './football'
import { DINOSAUR_SPECIES } from './dinosaurs'

describe.each(THEMES)('$name growth stages', (theme) => {
  /**
   * The bug this catches: Cherry Blossom used to pass through 🌳 on its way to
   * blooming — which is exactly what a fully-grown Big Tree looks like. A kid
   * with both in their garden couldn't tell the finished 80-coin plant from the
   * half-grown 100-coin one.
   */
  it('never shows a growing thing as another thing’s finished one', () => {
    const finished = new Map(theme.kinds.map((kind) => [kind.stages[kind.stages.length - 1].id, kind.id]))

    for (const kind of theme.kinds) {
      for (const stage of kind.stages.slice(0, -1)) {
        const clash = finished.get(stage.id)
        expect(
          clash === undefined || clash === kind.id,
          `${kind.name} grows through ${stage.id}, which is what a finished ${clash} looks like`,
        ).toBe(true)
      }
    }
  })

  it('gives every kind a distinct finished form', () => {
    const finals = theme.kinds.map((k) => k.stages[k.stages.length - 1].id)
    expect(new Set(finals).size).toBe(finals.length)
  })

  it('has at least two stages for everything, so a lesson always shows progress', () => {
    for (const kind of theme.kinds) {
      expect(kind.stages.length, kind.name).toBeGreaterThanOrEqual(2)
    }
  })

  it('offers distinct prices from cheapest to most expensive', () => {
    const costs = theme.kinds.map((k) => k.cost)
    expect(new Set(costs).size).toBe(costs.length)
    expect(costs).toEqual([...costs].sort((a, b) => a - b))
  })

  it('has unique kind ids', () => {
    const ids = theme.kinds.map((k) => k.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has enough to fill every slot when each kind can only be bought once', () => {
    if (theme.unique) expect(theme.kinds.length).toBeGreaterThanOrEqual(theme.slots)
  })

  it('shows a real stage in the shop and on the picker', () => {
    for (const kind of theme.kinds) {
      expect(kind.stages[shopPreviewStage(theme, kind)], kind.name).toBeDefined()
    }
    expect(rewardStage(theme.id, theme.showcase.kindId, theme.showcase.stage)).toBeDefined()
  })

  it('clamps past the last stage rather than going blank', () => {
    const kind = theme.kinds[theme.kinds.length - 1]
    expect(rewardStage(theme.id, kind.id, 99)).toBe(kind.stages[kind.stages.length - 1])
    expect(isFullyGrown(theme.id, kind.id, 99)).toBe(true)
    expect(isFullyGrown(theme.id, kind.id, 0)).toBe(false)
  })

  it('survives an unknown kind id from an old save', () => {
    expect(rewardStage(theme.id, 'nonexistent', 2)).toBeUndefined()
    expect(isFullyGrown(theme.id, 'nonexistent', 5)).toBe(false)
  })
})

describe('the garden', () => {
  const garden = themeById('garden')

  it('starts every plant from a seedling', () => {
    for (const kind of garden.kinds) expect(kind.stages[0].id, kind.name).toBe('🌱')
  })

  it('never uses a wilting or dead plant in a growth sequence', () => {
    // The garden is a reward that only ever accumulates. 🥀 reads as "I killed it".
    const unhappy = ['🥀', '🍂', '🪦']
    for (const kind of garden.kinds) {
      for (const stage of kind.stages) {
        expect(unhappy, `${kind.name} uses ${stage.id}`).not.toContain(stage.id)
      }
    }
  })
})

describe('Pokémon', () => {
  const pokemon = themeById('pokemon')

  it('starts every line as a speckled egg', () => {
    for (const kind of pokemon.kinds) {
      expect(kind.stages[0].id.startsWith(EGG_PREFIX), kind.name).toBe(true)
      expect(eggColour(kind.stages[0].id), kind.name).toBeDefined()
    }
  })

  it('has an image file for every form a kid can reach', () => {
    // A missing drawing would show an egg forever — worse than a blank, since it
    // looks like the lesson didn't count.
    for (const kind of pokemon.kinds) {
      for (const stage of kind.stages.slice(1)) {
        expect(POKEMON_IMAGES.has(stage.id), `no image mapping for ${stage.name}`).toBe(true)
        expect(
          existsSync(new URL(`../../../public/art/rewards/pokemon/${stage.id}.webp`, import.meta.url)),
          `missing image file for ${stage.name}`,
        ).toBe(true)
      }
    }
  })

  it('has no mapped character images nothing uses', () => {
    const used = new Set(pokemon.kinds.flatMap((k) => k.stages.map((s) => s.id)))
    for (const id of POKEMON_IMAGES) expect(used, id).toContain(id)
  })
})

describe('football', () => {
  const football = themeById('football')

  it('starts every player at Academy and tops out at Legend', () => {
    for (const kind of football.kinds) {
      expect(kind.stages.map((s) => s.id)).toEqual(TIERS.map((t) => `${kind.id}:${t}`))
    }
  })

  it('fields an eighteen-player squad with two keepers', () => {
    expect(PLAYERS).toHaveLength(18)
    expect(PLAYERS.filter((p) => p.position === 'GK')).toHaveLength(2)
    expect(PLAYERS.slice(0, 11).filter(player => player.position === 'GK')).toHaveLength(1)
  })

  it('has an individual portrait for every footballer', () => {
    for (const player of PLAYERS) {
      expect(existsSync(new URL(`../../../public/art/rewards/football/${player.id}.webp`, import.meta.url)), player.fullName).toBe(true)
    }
  })

  it('maps every kind back to a player', () => {
    for (const kind of football.kinds) expect(rewardKind('football', kind.id)).toBeDefined()
  })
})

describe('themeById', () => {
  it('falls back to the garden for anything it does not recognise', () => {
    expect(themeById('unknown-theme').id).toBe('garden')
    expect(themeById(undefined).id).toBe('garden')
  })
})

describe('animal friends', () => {
  it('offers six birds, six mammals and six other animals with three distinct illustrated ages', () => {
    const animals = themeById('animals')
    expect(animals.id).toBe('animals')
    expect(animals.kinds).toHaveLength(18)
    for (const group of ['Birds', 'Mammals', 'More animals']) {
      expect(ANIMAL_SPECIES.filter(animal => animal.group === group)).toHaveLength(6)
    }
    for (const kind of animals.kinds) {
      expect(kind.stages).toHaveLength(3)
      expect(new Set(kind.stages.map(stage => stage.id)).size).toBe(3)
      for (const stage of kind.stages) {
        expect(existsSync(new URL(`../../../public/art/rewards/animals/${stage.id}.webp`, import.meta.url)), stage.name).toBe(true)
      }
    }
  })

  it('uses natural life stages for frogs and butterflies', () => {
    expect(rewardKind('animals', 'robin')?.stages.map(stage => stage.name)).toEqual(['Robin · Baby', 'Robin · Juvenile', 'Robin · Adult'])
    expect(rewardKind('animals', 'tree-frog')?.stages.map(stage => stage.name)).toEqual(['Tree frog · Tadpole', 'Tree frog · Froglet', 'Tree frog · Adult'])
    expect(rewardKind('animals', 'butterfly')?.stages.map(stage => stage.name)).toEqual(['Butterfly · Caterpillar', 'Butterfly · Chrysalis', 'Butterfly · Adult'])
  })
})

describe('collection space', () => {
  it.each(['garden', 'pokemon', 'animals', 'dinosaurs'])('%s starts at 18 and always has room for another reward', id => {
    const theme = themeById(id)
    for (const [owned, expected] of [[0, 18], [12, 18], [17, 18], [18, 24], [23, 24], [24, 30], [90, 96]]) {
      expect(collectionSlots(theme, owned)).toBe(expected)
      expect(collectionIsFull(theme, owned)).toBe(false)
    }
  })

  it('fills an eighteen-player squad, without hiding extra items from an old save', () => {
    const theme = themeById('football')
    expect(collectionSlots(theme, 0)).toBe(18)
    expect(collectionSlots(theme, 11)).toBe(18)
    expect(collectionIsFull(theme, 17)).toBe(false)
    expect(collectionIsFull(theme, 18)).toBe(true)
    expect(collectionSlots(theme, 24)).toBe(24)
  })
})

describe('dinosaurs', () => {
  it('has eighteen dinosaurs whose eggs hatch and grow through three illustrated ages', () => {
    const theme = themeById('dinosaurs')
    expect(theme.id).toBe('dinosaurs')
    expect(theme.kinds).toHaveLength(18)
    for (const group of ['Crests & armour', 'Long necks', 'Two-legged']) {
      expect(DINOSAUR_SPECIES.filter(dinosaur => dinosaur.group === group)).toHaveLength(6)
    }
    for (const kind of theme.kinds) {
      expect(kind.stages.map(stage => stage.name.split(' · ')[1])).toEqual(['Egg', 'Hatchling', 'Juvenile', 'Adult'])
      for (const stage of kind.stages) {
        expect(existsSync(new URL(`../../../public/art/rewards/dinosaurs/${stage.id}.webp`, import.meta.url)), stage.name).toBe(true)
      }
    }
    expect(new Set(theme.kinds.flatMap(kind => kind.stages.map(stage => stage.id))).size).toBe(55)
  })
})

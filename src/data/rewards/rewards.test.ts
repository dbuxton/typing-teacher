import { describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { POKEMON_IMAGES } from '../../art/assets'
import { THEMES, isFullyGrown, rewardKind, rewardStage, shopPreviewStage, themeById } from '.'
import { EGG_PREFIX, eggColour } from './pokemon'
import { PLAYERS, TIERS } from './football'

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

  it('never charges less for something further down the shop', () => {
    const costs = theme.kinds.map((k) => k.cost)
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

  it('charges the same for every player, so nobody’s favourite is "the cheap one"', () => {
    expect(new Set(football.kinds.map((k) => k.cost)).size).toBe(1)
  })

  it('fields a proper eleven: one keeper and ten outfield players', () => {
    expect(PLAYERS).toHaveLength(11)
    expect(PLAYERS.filter((p) => p.position === 'GK')).toHaveLength(1)
  })

  it('maps every kind back to a player', () => {
    for (const kind of football.kinds) expect(rewardKind('football', kind.id)).toBeDefined()
  })
})

describe('themeById', () => {
  it('falls back to the garden for anything it does not recognise', () => {
    expect(themeById('dinosaurs').id).toBe('garden')
    expect(themeById(undefined).id).toBe('garden')
  })
})

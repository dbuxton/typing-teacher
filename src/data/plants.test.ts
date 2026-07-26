import { describe, expect, it } from 'vitest'
import { PLANT_KINDS, isFullyGrown, plantEmoji, plantKindById } from './plants'

describe('plant growth stages', () => {
  /**
   * The bug this catches: Cherry Blossom used to pass through 🌳 on its way to
   * blooming — which is exactly what a fully-grown Big Tree looks like. A kid
   * with both in their garden couldn't tell the finished 80-coin plant from the
   * half-grown 100-coin one.
   */
  it('never shows a growing plant as another plant’s finished one', () => {
    const finished = new Map(
      PLANT_KINDS.map((kind) => [kind.stages[kind.stages.length - 1], kind.id]),
    )

    for (const kind of PLANT_KINDS) {
      const growing = kind.stages.slice(0, -1)
      for (const emoji of growing) {
        const clash = finished.get(emoji)
        expect(
          clash === undefined || clash === kind.id,
          `${kind.name} grows through ${emoji}, which is what a finished ${clash} looks like`,
        ).toBe(true)
      }
    }
  })

  it('gives every plant a distinct finished form', () => {
    const finals = PLANT_KINDS.map((k) => k.stages[k.stages.length - 1])
    expect(new Set(finals).size).toBe(finals.length)
  })

  it('never uses a wilting or dead plant in a growth sequence', () => {
    // The garden is a reward that only ever accumulates. 🥀 reads as "I killed it".
    const unhappy = ['🥀', '🍂', '🪦']
    for (const kind of PLANT_KINDS) {
      for (const emoji of kind.stages) {
        expect(unhappy, `${kind.name} uses ${emoji}`).not.toContain(emoji)
      }
    }
  })

  it('starts every plant from a seedling', () => {
    for (const kind of PLANT_KINDS) {
      expect(kind.stages[0], kind.name).toBe('🌱')
      expect(kind.stages.length).toBeGreaterThanOrEqual(2)
    }
  })

  it('costs more for plants that take longer to grow', () => {
    const sorted = [...PLANT_KINDS].sort((a, b) => a.cost - b.cost)
    expect(sorted.map((k) => k.id)).toEqual(PLANT_KINDS.map((k) => k.id))
  })
})

describe('plant rendering', () => {
  it('clamps past the last stage rather than going blank', () => {
    const cherry = plantKindById('cherry')!
    expect(plantEmoji('cherry', 99)).toBe(cherry.stages[cherry.stages.length - 1])
    expect(isFullyGrown('cherry', 99)).toBe(true)
  })

  it('survives an unknown plant id from an old save', () => {
    expect(plantEmoji('nonexistent', 2)).toBe('🌱')
    expect(isFullyGrown('nonexistent', 5)).toBe(false)
  })
})

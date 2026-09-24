import type { RewardKind, RewardTheme } from './types'

/**
 * Pokémon. Coins buy an egg; the next lesson hatches it, and every lesson after
 * that it evolves, until it reaches its final form. Evolution *is* the "one stage
 * per lesson" mechanic, so this theme needs no invention — only drawings, which
 * live in `src/art/pokemon/`.
 *
 * Each egg is speckled in its line's colour, so a kid can tell which egg is
 * which before it hatches.
 */

type Line = {
  id: string
  cost: number
  /** Speckle colour on the egg. */
  eggColour: string
  /** Form ids, which double as display names. */
  forms: string[]
}

const LINES: Line[] = [
  { id: 'magikarp', cost: 10, eggColour: '#f97316', forms: ['Magikarp', 'Gyarados'] },
  { id: 'caterpie', cost: 15, eggColour: '#84cc16', forms: ['Caterpie', 'Metapod', 'Butterfree'] },
  { id: 'pichu', cost: 20, eggColour: '#facc15', forms: ['Pichu', 'Pikachu', 'Raichu'] },
  { id: 'igglybuff', cost: 25, eggColour: '#f9a8d4', forms: ['Igglybuff', 'Jigglypuff', 'Wigglytuff'] },
  { id: 'bulbasaur', cost: 30, eggColour: '#34d399', forms: ['Bulbasaur', 'Ivysaur', 'Venusaur'] },
  { id: 'charmander', cost: 35, eggColour: '#ef4444', forms: ['Charmander', 'Charmeleon', 'Charizard'] },
  { id: 'squirtle', cost: 40, eggColour: '#38bdf8', forms: ['Squirtle', 'Wartortle', 'Blastoise'] },
  { id: 'gastly', cost: 50, eggColour: '#8b5cf6', forms: ['Gastly', 'Haunter', 'Gengar'] },
  { id: 'dratini', cost: 70, eggColour: '#60a5fa', forms: ['Dratini', 'Dragonair', 'Dragonite'] },
]

export const EGG_PREFIX = 'egg:'

/** Speckle colour for an egg stage id like `egg:pichu`. */
export function eggColour(stageId: string): string | undefined {
  return LINES.find((l) => `${EGG_PREFIX}${l.id}` === stageId)?.eggColour
}

const TEAM: RewardKind[] = LINES.map((line) => ({
  id: line.id,
  name: line.forms[0],
  cost: line.cost,
  stages: [
    { id: `${EGG_PREFIX}${line.id}`, name: `${line.forms[0]} egg` },
    ...line.forms.map((form) => ({ id: form.toLowerCase(), name: form })),
  ],
}))

export const POKEMON: RewardTheme = {
  id: 'pokemon',
  name: 'Pokémon',
  blurb: 'Hatch eggs and evolve them — Pikachu, Charmander and friends.',
  icon: '⚡',
  navLabel: '⚡ Pokémon',
  collectionTitle: 'Your Pokémon',
  collectionBlurb: 'Every lesson you finish helps your Pokémon hatch and evolve.',
  shopTitle: 'Egg shop',
  ownedLabel: 'On your team',
  emptySlotLabel: 'Empty nest',
  slots: 12,
  unique: false,
  showcase: { kindId: 'pichu', stage: 2 },
  shopPreviewStage: 1, // the first form out of the egg
  backdropClass: 'bg-gradient-to-b from-sky-100 to-lime-100',
  badgeCopy: {
    first: { name: 'Hatchling', emoji: '🥚', how: 'Get your first Pokémon egg' },
    full: { name: 'Full Team', emoji: '⭐', how: 'Fill every nest with a Pokémon' },
  },
  kinds: TEAM,
}

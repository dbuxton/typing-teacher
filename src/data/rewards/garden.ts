import type { RewardKind, RewardTheme } from './types'

/**
 * The garden. Coins buy seeds; every completed lesson advances every planted seed
 * by one growth stage. Nothing ever wilts, dies, or asks to be watered — a kid who
 * skips a week comes back to exactly the garden they left.
 */

function plant(id: string, name: string, cost: number, emoji: string[]): RewardKind {
  return {
    id,
    name,
    cost,
    stages: emoji.map((e, i) => ({
      id: e,
      name: i === 0 ? `${name} seedling` : i === emoji.length - 1 ? name : `Growing ${name.toLowerCase()}`,
    })),
  }
}

const PLANTS: RewardKind[] = [
  plant('daisy', 'Daisy', 10, ['🌱', '🌿', '🌼']),
  plant('tulip', 'Tulip', 15, ['🌱', '🌿', '🌷']),
  plant('sunflower', 'Sunflower', 25, ['🌱', '🌿', '🌻']),
  // No wilting emoji anywhere in a growth sequence — a kid reads 🥀 as "I killed it".
  plant('rose', 'Rose', 30, ['🌱', '🌿', '🌹']),
  plant('cactus', 'Cactus', 35, ['🌱', '🌿', '🌵']),
  plant('mushroom', 'Toadstool', 40, ['🌱', '🍄']),
  plant('palm', 'Palm Tree', 60, ['🌱', '🌿', '🎋', '🌴']),
  // Evergreen, so it doesn't collide with the cherry's third stage below. A
  // half-grown plant must never look like another plant's finished one, or the
  // kid can't tell what's done and what's still coming.
  plant('tree', 'Pine Tree', 80, ['🌱', '🌿', '🌲']),
  plant('cherry', 'Cherry Blossom', 100, ['🌱', '🌿', '🌳', '🌸']),
]

export const GARDEN: RewardTheme = {
  id: 'garden',
  name: 'Garden',
  blurb: 'Plant seeds and watch them grow into flowers and trees.',
  icon: '🌻',
  navLabel: '🌻 Garden',
  collectionTitle: 'Your garden',
  collectionBlurb: 'Every lesson you finish makes your plants grow a little bit more.',
  shopTitle: 'Seed shop',
  ownedLabel: 'Planted',
  emptySlotLabel: 'Empty plot',
  slots: 18,
  unique: false,
  showcase: { kindId: 'sunflower', stage: 2 },
  shopPreviewStage: -1,
  backdropClass: 'bg-gradient-to-b from-emerald-100 to-amber-50',
  badgeCopy: {
    first: { name: 'Green Fingers', emoji: '🌱', how: 'Plant your first seed' },
    full: { name: 'Garden Party', emoji: '🌻', how: 'Collect 18 plants in your garden' },
  },
  kinds: PLANTS,
}

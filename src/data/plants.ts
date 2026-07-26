/**
 * The garden. Coins buy seeds; every completed lesson advances every planted seed
 * by one growth stage. Nothing ever wilts, dies, or asks to be watered — a kid who
 * skips a week comes back to exactly the garden they left.
 */

export type PlantKind = {
  id: string
  name: string
  cost: number
  /** Emoji per growth stage; the last one is fully grown. */
  stages: string[]
}

export const PLANT_KINDS: PlantKind[] = [
  { id: 'daisy', name: 'Daisy', cost: 10, stages: ['🌱', '🌿', '🌼'] },
  { id: 'tulip', name: 'Tulip', cost: 15, stages: ['🌱', '🌿', '🌷'] },
  { id: 'sunflower', name: 'Sunflower', cost: 25, stages: ['🌱', '🌿', '🌻'] },
  // No wilting emoji anywhere in a growth sequence — a kid reads 🥀 as "I killed it".
  { id: 'rose', name: 'Rose', cost: 30, stages: ['🌱', '🌿', '🌹'] },
  { id: 'cactus', name: 'Cactus', cost: 35, stages: ['🌱', '🌿', '🌵'] },
  { id: 'mushroom', name: 'Toadstool', cost: 40, stages: ['🌱', '🍄'] },
  { id: 'palm', name: 'Palm Tree', cost: 60, stages: ['🌱', '🌿', '🎋', '🌴'] },
  // Evergreen, so it doesn't collide with the cherry's third stage below. A
  // half-grown plant must never look like another plant's finished one, or the
  // kid can't tell what's done and what's still coming.
  { id: 'tree', name: 'Pine Tree', cost: 80, stages: ['🌱', '🌿', '🌲'] },
  { id: 'cherry', name: 'Cherry Blossom', cost: 100, stages: ['🌱', '🌿', '🌳', '🌸'] },
]

export const GARDEN_PLOTS = 12

export function plantKindById(id: string): PlantKind | undefined {
  return PLANT_KINDS.find((p) => p.id === id)
}

/** The emoji to show for a plant that has been growing for `stage` lessons. */
export function plantEmoji(kindId: string, stage: number): string {
  const kind = plantKindById(kindId)
  if (!kind) return '🌱'
  return kind.stages[Math.min(stage, kind.stages.length - 1)]
}

export function isFullyGrown(kindId: string, stage: number): boolean {
  const kind = plantKindById(kindId)
  if (!kind) return false
  return stage >= kind.stages.length - 1
}

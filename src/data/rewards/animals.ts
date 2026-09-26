import type { RewardKind, RewardTheme } from './types'

/** Frogs and butterflies follow their natural transformations. */
export function animalStageNames(id: string): readonly string[] {
  if (id === 'tree-frog') return ['Tadpole', 'Froglet', 'Adult']
  if (id === 'butterfly') return ['Caterpillar', 'Chrysalis', 'Adult']
  return ['Baby', 'Juvenile', 'Adult']
}

export const ANIMAL_SPECIES = [
  { id: 'robin', name: 'Robin', group: 'Birds', cost: 10 },
  { id: 'barn-owl', name: 'Barn owl', group: 'Birds', cost: 50 },
  { id: 'puffin', name: 'Puffin', group: 'Birds', cost: 55 },
  { id: 'kingfisher', name: 'Kingfisher', group: 'Birds', cost: 65 },
  { id: 'flamingo', name: 'Flamingo', group: 'Birds', cost: 80 },
  { id: 'penguin', name: 'Penguin', group: 'Birds', cost: 70 },
  { id: 'red-fox', name: 'Red fox', group: 'Mammals', cost: 40 },
  { id: 'rabbit', name: 'Rabbit', group: 'Mammals', cost: 15 },
  { id: 'hedgehog', name: 'Hedgehog', group: 'Mammals', cost: 20 },
  { id: 'red-panda', name: 'Red panda', group: 'Mammals', cost: 90 },
  { id: 'otter', name: 'Otter', group: 'Mammals', cost: 60 },
  { id: 'elephant', name: 'Elephant', group: 'Mammals', cost: 95 },
  { id: 'tortoise', name: 'Tortoise', group: 'More animals', cost: 45 },
  { id: 'tree-frog', name: 'Tree frog', group: 'More animals', cost: 30 },
  { id: 'gecko', name: 'Gecko', group: 'More animals', cost: 35 },
  { id: 'seahorse', name: 'Seahorse', group: 'More animals', cost: 75 },
  { id: 'octopus', name: 'Octopus', group: 'More animals', cost: 85 },
  { id: 'butterfly', name: 'Butterfly', group: 'More animals', cost: 25 },
] as const

const FRIENDS: RewardKind[] = ANIMAL_SPECIES.map(animal => ({
  ...animal,
  stages: animalStageNames(animal.id).map((stage, index) => ({
    id: [animal.id + '-baby', animal.id + '-juvenile', animal.id][index],
    name: animal.name + ' · ' + stage,
  })),
})).sort((a, b) => a.cost - b.cost)

export const ANIMALS: RewardTheme = {
  id: 'animals',
  name: 'Animals',
  blurb: 'Raise baby birds, mammals and more. Watch them grow!',
  icon: '🐾',
  navLabel: '🐾 Animals',
  collectionTitle: 'Your animal friends',
  collectionBlurb: 'Every lesson helps your babies grow into juveniles, then adults.',
  shopTitle: 'Meet a baby animal',
  ownedLabel: 'Your friend',
  emptySlotLabel: 'Room for a new friend',
  slots: 18,
  unique: false,
  showcase: { kindId: 'red-fox', stage: 2 },
  shopPreviewStage: 0,
  backdropClass: 'bg-gradient-to-b from-teal-100 to-amber-50',
  badgeCopy: {
    first: { name: 'Animal Friend', emoji: '🐾', how: 'Welcome your first animal friend' },
    full: { name: 'Wildlife Party', emoji: '🦜', how: 'Welcome 18 animal friends' },
  },
  kinds: FRIENDS,
}

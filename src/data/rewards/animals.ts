import type { RewardKind, RewardTheme } from './types'

/** Frogs and butterflies follow their natural transformations. */
export function animalStageNames(id: string): readonly string[] {
  if (id === 'tree-frog') return ['Tadpole', 'Froglet', 'Adult']
  if (id === 'butterfly') return ['Caterpillar', 'Chrysalis', 'Adult']
  return ['Baby', 'Juvenile', 'Adult']
}

export const ANIMAL_SPECIES = [
  { id: 'robin', name: 'Robin', group: 'Birds' },
  { id: 'barn-owl', name: 'Barn owl', group: 'Birds' },
  { id: 'puffin', name: 'Puffin', group: 'Birds' },
  { id: 'kingfisher', name: 'Kingfisher', group: 'Birds' },
  { id: 'flamingo', name: 'Flamingo', group: 'Birds' },
  { id: 'penguin', name: 'Penguin', group: 'Birds' },
  { id: 'red-fox', name: 'Red fox', group: 'Mammals' },
  { id: 'rabbit', name: 'Rabbit', group: 'Mammals' },
  { id: 'hedgehog', name: 'Hedgehog', group: 'Mammals' },
  { id: 'red-panda', name: 'Red panda', group: 'Mammals' },
  { id: 'otter', name: 'Otter', group: 'Mammals' },
  { id: 'elephant', name: 'Elephant', group: 'Mammals' },
  { id: 'tortoise', name: 'Tortoise', group: 'More animals' },
  { id: 'tree-frog', name: 'Tree frog', group: 'More animals' },
  { id: 'gecko', name: 'Gecko', group: 'More animals' },
  { id: 'seahorse', name: 'Seahorse', group: 'More animals' },
  { id: 'octopus', name: 'Octopus', group: 'More animals' },
  { id: 'butterfly', name: 'Butterfly', group: 'More animals' },
] as const

const FRIENDS: RewardKind[] = ANIMAL_SPECIES.map(animal => ({
  ...animal,
  cost: 20,
  stages: animalStageNames(animal.id).map((stage, index) => ({
    id: [animal.id + '-baby', animal.id + '-juvenile', animal.id][index],
    name: animal.name + ' · ' + stage,
  })),
}))

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

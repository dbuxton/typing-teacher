import type { RewardKind, RewardTheme } from './types'

/** Short facts checked against museum and National Park Service sources. */
export const DINOSAUR_SPECIES = [
  {
    "id": "triceratops",
    "name": "Triceratops",
    "group": "Crests & armour",
    "cost": 10,
    "fact": "It had three horns and a large bony frill behind its head.",
    "source": "https://www.nhm.ac.uk/discover/dino-directory/triceratops.html"
  },
  {
    "id": "stegosaurus",
    "name": "Stegosaurus",
    "group": "Crests & armour",
    "cost": 15,
    "fact": "Its back plates stood upright in two alternating rows.",
    "source": "https://www.nhm.ac.uk/discover/dino-directory/stegosaurus.html"
  },
  {
    "id": "parasaurolophus",
    "name": "Parasaurolophus",
    "group": "Crests & armour",
    "cost": 20,
    "fact": "This duck-billed dinosaur could walk on two legs or four.",
    "source": "https://www.nhm.ac.uk/discover/dino-directory/parasaurolophus.html"
  },
  {
    "id": "oviraptor",
    "name": "Oviraptor",
    "group": "Two-legged",
    "cost": 25,
    "fact": "It had a curved beak instead of teeth.",
    "source": "https://www.nhm.ac.uk/discover/dino-directory/oviraptor.html"
  },
  {
    "id": "camarasaurus",
    "name": "Camarasaurus",
    "group": "Long necks",
    "cost": 30,
    "fact": "Its name means chambered lizard, after spaces inside its backbone.",
    "source": "https://home.nps.gov/places/camarasaurus-lentus.htm"
  },
  {
    "id": "ankylosaurus",
    "name": "Ankylosaurus",
    "group": "Crests & armour",
    "cost": 35,
    "fact": "Bony armour covered its body, and its tail ended in a heavy club.",
    "source": "https://www.nhm.ac.uk/discover/dino-directory/ankylosaurus.html"
  },
  {
    "id": "pachycephalosaurus",
    "name": "Pachycephalosaurus",
    "group": "Crests & armour",
    "cost": 40,
    "fact": "It had a thick bony dome on top of its head.",
    "source": "https://www.nhm.ac.uk/discover/dino-directory/pachycephalosaurus.html"
  },
  {
    "id": "diplodocus",
    "name": "Diplodocus",
    "group": "Long necks",
    "cost": 45,
    "fact": "Its long neck helped it reach plants, and it had a whip-like tail.",
    "source": "https://www.nhm.ac.uk/discover/dino-directory/diplodocus.html"
  },
  {
    "id": "styracosaurus",
    "name": "Styracosaurus",
    "group": "Crests & armour",
    "cost": 50,
    "fact": "Long spikes surrounded its frill, with a big horn on its nose.",
    "source": "https://www.nhm.ac.uk/discover/dino-directory/styracosaurus.html"
  },
  {
    "id": "deinonychus",
    "name": "Deinonychus",
    "group": "Two-legged",
    "cost": 55,
    "fact": "Its long stiff tail helped it balance.",
    "source": "https://www.nhm.ac.uk/discover/dino-directory/deinonychus.html"
  },
  {
    "id": "apatosaurus",
    "name": "Apatosaurus",
    "group": "Long necks",
    "cost": 60,
    "fact": "It shared its world with Stegosaurus, Diplodocus and Allosaurus.",
    "source": "https://www.nhm.ac.uk/discover/dino-directory/apatosaurus.html"
  },
  {
    "id": "velociraptor",
    "name": "Velociraptor",
    "group": "Two-legged",
    "cost": 65,
    "fact": "Real Velociraptor had a feathery covering.",
    "source": "https://www.nhm.ac.uk/discover/dino-directory/velociraptor.html"
  },
  {
    "id": "amargasaurus",
    "name": "Amargasaurus",
    "group": "Long necks",
    "cost": 70,
    "fact": "It had two rows of long spines along its neck and back.",
    "source": "https://www.nhm.ac.uk/discover/dino-directory/amargasaurus.html"
  },
  {
    "id": "allosaurus",
    "name": "Allosaurus",
    "group": "Two-legged",
    "cost": 75,
    "fact": "It had three fingers on each hand and small horns above its eyes.",
    "source": "https://www.nhm.ac.uk/discover/dino-directory/allosaurus.html"
  },
  {
    "id": "brachiosaurus",
    "name": "Brachiosaurus",
    "group": "Long necks",
    "cost": 80,
    "fact": "This tall plant-eater lived in what is now North America.",
    "source": "https://www.nhm.ac.uk/discover/dino-directory/brachiosaurus.html"
  },
  {
    "id": "spinosaurus",
    "name": "Spinosaurus",
    "group": "Two-legged",
    "cost": 85,
    "fact": "Its broad paddle-like tail is a clue to a life near water.",
    "source": "https://www.nhm.ac.uk/discover/dino-directory/spinosaurus.html"
  },
  {
    "id": "argentinosaurus",
    "name": "Argentinosaurus",
    "group": "Long necks",
    "cost": 90,
    "fact": "It was one of the biggest land animals ever discovered.",
    "source": "https://www.nhm.ac.uk/discover/dino-directory/argentinosaurus.html"
  },
  {
    "id": "tyrannosaurus",
    "name": "T. rex",
    "group": "Two-legged",
    "cost": 95,
    "fact": "It walked on two powerful legs and ate other animals.",
    "source": "https://www.nhm.ac.uk/discover/dino-directory/tyrannosaurus.html"
  }
] as const

const DINOS: RewardKind[] = DINOSAUR_SPECIES.map(dinosaur => ({
  ...dinosaur,
  stages: [
    { id: dinosaur.id + '-egg', name: dinosaur.name + ' · Egg' },
    { id: dinosaur.id + '-baby', name: dinosaur.name + ' · Hatchling' },
    { id: dinosaur.id + '-juvenile', name: dinosaur.name + ' · Juvenile' },
    { id: dinosaur.id, name: dinosaur.name + ' · Adult' },
  ],
})).sort((a, b) => a.cost - b.cost)

export const DINOSAURS: RewardTheme = {
  id: 'dinosaurs',
  name: 'Dinosaurs',
  blurb: 'Hatch dinosaur eggs and grow your own prehistoric island!',
  icon: '🦕',
  navLabel: '🦕 Dinosaurs',
  collectionTitle: 'Your dinosaur island',
  collectionBlurb: 'Each lesson helps your eggs hatch and your dinosaurs grow.',
  shopTitle: 'Dinosaur egg shop',
  ownedLabel: 'On your island',
  emptySlotLabel: 'Room for a dinosaur',
  slots: 18,
  unique: false,
  showcase: { kindId: 'triceratops', stage: 3 },
  shopPreviewStage: 1,
  backdropClass: 'bg-gradient-to-b from-lime-100 to-emerald-100',
  badgeCopy: {
    first: { name: 'Dino Discoverer', emoji: '🥚', how: 'Welcome your first dinosaur egg' },
    full: { name: 'Dinosaur Island', emoji: '🦕', how: 'Collect 18 dinosaurs on your island' },
  },
  kinds: DINOS,
}

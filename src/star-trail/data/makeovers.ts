/**
 * Ship makeovers: paint, a whole new ship, trail colours, engine flames, and a
 * horn that plays when you find a piece. They're just for fun and never change
 * how a hunt plays, so they're always in stock and can't upset the balance.
 * Change a name or a price here and the space station follows.
 *
 * The first of each kind is the one every ship starts with, free.
 */

export type MakeoverKind = 'paint' | 'ship' | 'trail' | 'flame' | 'horn'
export const MAKEOVER_KINDS: readonly MakeoverKind[] = ['paint', 'ship', 'trail', 'flame', 'horn']

export type ShipShape = 'dart' | 'rocket' | 'saucer' | 'shuttle' | 'cruiser'
export type HornTune = 'chime' | 'trumpet' | 'robot' | 'slide' | 'fanfare'

type Base<K extends MakeoverKind> = { id: string; kind: K; name: string; price: number }

/** A rainbow paint or flame shimmers through every colour, starting from `colour`. */
export type Paint = Base<'paint'> & { colour: string; rainbow?: boolean }
export type Ship = Base<'ship'> & { shape: ShipShape }
/** One colour for the whole trail, or several taking turns letter by letter. */
export type TrailColour = Base<'trail'> & { colours: readonly string[] }
export type Flame = Base<'flame'> & { colour: string; tip: string; rainbow?: boolean }
export type Horn = Base<'horn'> & { tune: HornTune }
export type Makeover = Paint | Ship | TrailColour | Flame | Horn
export type MakeoverOf<K extends MakeoverKind> = Extract<Makeover, { kind: K }>

export const MAKEOVERS: readonly Makeover[] = [
  { id: 'paint:cyan', kind: 'paint', name: 'Neon blue', price: 0, colour: '#5ef2ff' },
  { id: 'paint:pink', kind: 'paint', name: 'Bubblegum pink', price: 20, colour: '#ff6fd8' },
  { id: 'paint:lime', kind: 'paint', name: 'Slime green', price: 20, colour: '#a6ff6a' },
  { id: 'paint:violet', kind: 'paint', name: 'Galaxy purple', price: 25, colour: '#a98bff' },
  { id: 'paint:silver', kind: 'paint', name: 'Moon silver', price: 35, colour: '#e8edff' },
  { id: 'paint:gold', kind: 'paint', name: 'Solid gold', price: 50, colour: '#ffe36e' },
  { id: 'paint:rainbow', kind: 'paint', name: 'Rainbow', price: 150, colour: '#ff6fd8', rainbow: true },

  { id: 'ship:dart', kind: 'ship', name: 'Star dart', price: 0, shape: 'dart' },
  { id: 'ship:rocket', kind: 'ship', name: 'Retro rocket', price: 60, shape: 'rocket' },
  { id: 'ship:saucer', kind: 'ship', name: 'Flying saucer', price: 90, shape: 'saucer' },
  { id: 'ship:shuttle', kind: 'ship', name: 'Space shuttle', price: 150, shape: 'shuttle' },
  { id: 'ship:cruiser', kind: 'ship', name: 'Star cruiser', price: 250, shape: 'cruiser' },

  // Never amber, or anything close: amber marks a slip.
  { id: 'trail:cyan', kind: 'trail', name: 'Neon blue', price: 0, colours: ['#5ef2ff'] },
  { id: 'trail:pink', kind: 'trail', name: 'Bubblegum', price: 25, colours: ['#ff6fd8'] },
  { id: 'trail:lime', kind: 'trail', name: 'Slime', price: 25, colours: ['#a6ff6a'] },
  { id: 'trail:violet', kind: 'trail', name: 'Nebula', price: 25, colours: ['#a98bff'] },
  { id: 'trail:ice', kind: 'trail', name: 'Ice', price: 40, colours: ['#e4fdff', '#8fe3ff'] },
  { id: 'trail:fire', kind: 'trail', name: 'Fire', price: 60, colours: ['#ff3d6e', '#ff5a3d', '#ff7847'] },
  { id: 'trail:rainbow', kind: 'trail', name: 'Rainbow', price: 150, colours: ['#5ef2ff', '#a6ff6a', '#ff6fd8', '#a98bff', '#6aa8ff'] },

  { id: 'flame:orange', kind: 'flame', name: 'Rocket orange', price: 0, colour: '#ffb547', tip: '#ffe36e' },
  { id: 'flame:blue', kind: 'flame', name: 'Blue flame', price: 20, colour: '#5ea8ff', tip: '#d4f1ff' },
  { id: 'flame:green', kind: 'flame', name: 'Green flame', price: 20, colour: '#a6ff6a', tip: '#eaffd9' },
  { id: 'flame:pink', kind: 'flame', name: 'Pink flame', price: 25, colour: '#ff6fd8', tip: '#ffd6f5' },
  { id: 'flame:white', kind: 'flame', name: 'White-hot', price: 40, colour: '#ffffff', tip: '#bff6ff' },
  { id: 'flame:rainbow', kind: 'flame', name: 'Rainbow flame', price: 120, colour: '#ff6fd8', tip: '#ffffff', rainbow: true },

  { id: 'horn:chime', kind: 'horn', name: 'Star chime', price: 0, tune: 'chime' },
  { id: 'horn:trumpet', kind: 'horn', name: 'Space trumpet', price: 30, tune: 'trumpet' },
  { id: 'horn:robot', kind: 'horn', name: 'Robot beeps', price: 30, tune: 'robot' },
  { id: 'horn:slide', kind: 'horn', name: 'Slide whistle', price: 40, tune: 'slide' },
  { id: 'horn:fanfare', kind: 'horn', name: 'Royal fanfare', price: 60, tune: 'fanfare' },
]

export const KIND_INFO: Record<MakeoverKind, { name: string; icon: string; blurb: string }> = {
  paint: { name: 'Paint', icon: '🎨', blurb: 'A new colour for your ship.' },
  ship: { name: 'Ships', icon: '🚀', blurb: 'Fly something completely different.' },
  trail: { name: 'Trail colours', icon: '🌈', blurb: 'The glow of the letters you’ve typed.' },
  flame: { name: 'Engine flames', icon: '🔥', blurb: 'What comes out of the back.' },
  horn: { name: 'Horns', icon: '📯', blurb: 'Plays when you find a piece (with the sound on).' },
}

/** What a ship looks like, and which pet (if any) rides along. Values are makeover and pet ids. */
export type Look = Record<MakeoverKind, string> & { pet: string | null }

export function makeoversOf<K extends MakeoverKind>(kind: K): MakeoverOf<K>[] {
  return MAKEOVERS.filter((item): item is MakeoverOf<K> => item.kind === kind)
}

/** The free one of each kind, which every ship starts with. */
export function defaultOf<K extends MakeoverKind>(kind: K): MakeoverOf<K> {
  return makeoversOf(kind)[0]
}

export const DEFAULT_LOOK: Look = {
  paint: defaultOf('paint').id,
  ship: defaultOf('ship').id,
  trail: defaultOf('trail').id,
  flame: defaultOf('flame').id,
  horn: defaultOf('horn').id,
  pet: null,
}

export function makeover(id: string): Makeover | undefined {
  return MAKEOVERS.find((item) => item.id === id)
}

/** What a look is wearing of one kind; anything unknown falls back to the free one. */
export function worn<K extends MakeoverKind>(look: Look, kind: K): MakeoverOf<K> {
  const item = makeover(look[kind])
  return item && item.kind === kind ? (item as MakeoverOf<K>) : defaultOf(kind)
}

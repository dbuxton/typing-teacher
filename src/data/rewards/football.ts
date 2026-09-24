import type { RewardKind, RewardTheme } from './types'

/**
 * Women's Super League. Coins sign a player; every lesson she trains and her card
 * goes up a tier, from Academy to Legend.
 *
 * These are real people, so the cards carry no faces and no club crests — just a
 * shirt in club colours, her name, position and club. Every player costs the
 * same: a price list would rank real women against each other, and a kid's
 * favourite should never be "the cheap one".
 *
 * Clubs as of the 2025–26 season. Players move; if a kid points out that
 * someone's shirt is wrong, this list is the only place to fix it.
 */

export type Position = 'GK' | 'DEF' | 'MID' | 'FWD'

export type Club = {
  name: string
  /** Shirt colour, then trim/number colour. */
  colours: [string, string]
}

export const CLUBS = {
  arsenal: { name: 'Arsenal', colours: ['#db0007', '#ffffff'] },
  chelsea: { name: 'Chelsea', colours: ['#034694', '#ffffff'] },
  city: { name: 'Man City', colours: ['#6cabdd', '#1c2c5b'] },
  united: { name: 'Man Utd', colours: ['#da291c', '#111111'] },
} satisfies Record<string, Club>

export type Player = {
  id: string
  /** Full name, for the shop and hover text. */
  fullName: string
  /** What goes on the card — usually the surname, as on the back of a shirt. */
  cardName: string
  position: Position
  club: Club
}

/** A starting eleven in a 4-3-3, keeper first. */
export const PLAYERS: Player[] = [
  { id: 'hampton', fullName: 'Hannah Hampton', cardName: 'Hampton', position: 'GK', club: CLUBS.chelsea },
  { id: 'bronze', fullName: 'Lucy Bronze', cardName: 'Bronze', position: 'DEF', club: CLUBS.chelsea },
  { id: 'bright', fullName: 'Millie Bright', cardName: 'Bright', position: 'DEF', club: CLUBS.chelsea },
  { id: 'williamson', fullName: 'Leah Williamson', cardName: 'Williamson', position: 'DEF', club: CLUBS.arsenal },
  { id: 'greenwood', fullName: 'Alex Greenwood', cardName: 'Greenwood', position: 'DEF', club: CLUBS.city },
  { id: 'walsh', fullName: 'Keira Walsh', cardName: 'Walsh', position: 'MID', club: CLUBS.chelsea },
  { id: 'toone', fullName: 'Ella Toone', cardName: 'Toone', position: 'MID', club: CLUBS.united },
  { id: 'mariona', fullName: 'Mariona Caldentey', cardName: 'Mariona', position: 'MID', club: CLUBS.arsenal },
  { id: 'james', fullName: 'Lauren James', cardName: 'James', position: 'FWD', club: CLUBS.chelsea },
  { id: 'russo', fullName: 'Alessia Russo', cardName: 'Russo', position: 'FWD', club: CLUBS.arsenal },
  { id: 'shaw', fullName: 'Khadija Shaw', cardName: 'Shaw', position: 'FWD', club: CLUBS.city },
]

/** Card tiers, lowest first. The stage number is the index into this list. */
export const TIERS = ['Academy', 'Bronze', 'Silver', 'Gold', 'Legend'] as const
export type Tier = (typeof TIERS)[number]

export const PLAYER_COST = 20

export function playerById(id: string): Player | undefined {
  return PLAYERS.find((p) => p.id === id)
}

const SQUAD: RewardKind[] = PLAYERS.map((player) => ({
  id: player.id,
  name: player.fullName,
  cost: PLAYER_COST,
  stages: TIERS.map((tier) => ({ id: `${player.id}:${tier}`, name: `${player.cardName} · ${tier}` })),
}))

export const FOOTBALL: RewardTheme = {
  id: 'football',
  name: "Women's Super League",
  blurb: 'Sign Lionesses and WSL stars, and train them up to Legend.',
  icon: '⚽',
  navLabel: '⚽ Squad',
  collectionTitle: 'Your squad',
  collectionBlurb: 'Every lesson you finish is a training session — your players’ cards level up.',
  shopTitle: 'Transfer market',
  ownedLabel: 'In your squad',
  emptySlotLabel: 'Empty shirt',
  slots: PLAYERS.length,
  unique: true,
  showcase: { kindId: 'russo', stage: 3 },
  shopPreviewStage: 3, // Gold: what she'll look like, without spoiling Legend
  backdropClass: 'bg-gradient-to-b from-green-200 to-green-50',
  badgeCopy: {
    first: { name: 'Signed!', emoji: '✍️', how: 'Sign your first player' },
    full: { name: 'Full XI', emoji: '⚽', how: 'Sign a whole starting eleven' },
  },
  kinds: SQUAD,
}

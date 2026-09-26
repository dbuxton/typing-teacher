import type { RewardKind, RewardTheme } from './types'

/**
 * Women's Super League. Coins sign a player; every lesson she trains and her card
 * goes up a tier, from Academy to Legend.
 *
 * The cards use individual illustrated portraits, shirts in club colours, and
 * live text for each player's name, position and club. Each player has a fixed
 * coin price, mixing quick signings with longer savings goals.
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
  cost: number
  position: Position
  club: Club
}

/** The original starting eleven, plus seven more players to fill an 18-player squad. */
export const PLAYERS: Player[] = [
  { id: 'hampton', fullName: 'Hannah Hampton', cardName: 'Hampton', cost: 20, position: 'GK', club: CLUBS.chelsea },
  { id: 'bronze', fullName: 'Lucy Bronze', cardName: 'Bronze', cost: 70, position: 'DEF', club: CLUBS.chelsea },
  { id: 'bright', fullName: 'Millie Bright', cardName: 'Bright', cost: 30, position: 'DEF', club: CLUBS.chelsea },
  { id: 'williamson', fullName: 'Leah Williamson', cardName: 'Williamson', cost: 90, position: 'DEF', club: CLUBS.arsenal },
  { id: 'greenwood', fullName: 'Alex Greenwood', cardName: 'Greenwood', cost: 40, position: 'DEF', club: CLUBS.city },
  { id: 'walsh', fullName: 'Keira Walsh', cardName: 'Walsh', cost: 60, position: 'MID', club: CLUBS.chelsea },
  { id: 'toone', fullName: 'Ella Toone', cardName: 'Toone', cost: 45, position: 'MID', club: CLUBS.united },
  { id: 'mariona', fullName: 'Mariona Caldentey', cardName: 'Mariona', cost: 75, position: 'MID', club: CLUBS.arsenal },
  { id: 'james', fullName: 'Lauren James', cardName: 'James', cost: 85, position: 'FWD', club: CLUBS.chelsea },
  { id: 'russo', fullName: 'Alessia Russo', cardName: 'Russo', cost: 95, position: 'FWD', club: CLUBS.arsenal },
  { id: 'shaw', fullName: 'Khadija Shaw', cardName: 'Shaw', cost: 80, position: 'FWD', club: CLUBS.city },
  { id: 'tullis-joyce', fullName: 'Phallon Tullis-Joyce', cardName: 'Tullis-Joyce', cost: 10, position: 'GK', club: CLUBS.united },
  { id: 'wubben-moy', fullName: 'Lotte Wubben-Moy', cardName: 'Wubben-Moy', cost: 15, position: 'DEF', club: CLUBS.arsenal },
  { id: 'girma', fullName: 'Naomi Girma', cardName: 'Girma', cost: 65, position: 'DEF', club: CLUBS.chelsea },
  { id: 'nusken', fullName: 'Sjoeke Nüsken', cardName: 'Nüsken', cost: 25, position: 'MID', club: CLUBS.chelsea },
  { id: 'park', fullName: 'Jess Park', cardName: 'Park', cost: 35, position: 'MID', club: CLUBS.united },
  { id: 'hemp', fullName: 'Lauren Hemp', cardName: 'Hemp', cost: 55, position: 'FWD', club: CLUBS.city },
  { id: 'beever-jones', fullName: 'Aggie Beever-Jones', cardName: 'Beever-Jones', cost: 50, position: 'FWD', club: CLUBS.chelsea },
]

/** Card tiers, lowest first. The stage number is the index into this list. */
export const TIERS = ['Academy', 'Bronze', 'Silver', 'Gold', 'Legend'] as const
export type Tier = (typeof TIERS)[number]

export function playerById(id: string): Player | undefined {
  return PLAYERS.find((p) => p.id === id)
}

const SQUAD: RewardKind[] = PLAYERS.map((player) => ({
  id: player.id,
  name: player.fullName,
  cost: player.cost,
  stages: TIERS.map((tier) => ({ id: `${player.id}:${tier}`, name: `${player.cardName} · ${tier}` })),
})).sort((a, b) => a.cost - b.cost)

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
    full: { name: 'Full Squad', emoji: '⚽', how: 'Sign all 18 players' },
  },
  kinds: SQUAD,
}

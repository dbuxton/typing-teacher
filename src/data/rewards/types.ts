/**
 * A reward theme is the thing coins buy and lessons grow: a garden of plants, a
 * squad of footballers, a team of Pokémon or animal friends. The mechanics are identical across
 * themes — buy something, and every completed lesson moves it up one stage —
 * only the art and the words change.
 *
 * Every theme is a fixed, finite catalogue. Artwork is bundled with the app;
 * nothing is generated at runtime.
 */

export type ThemeId = 'garden' | 'football' | 'pokemon' | 'animals'

export type RewardStage = {
  /** Unique within the theme. For the garden it's the emoji itself. */
  id: string
  /** What the kid is told this is, e.g. "Charmeleon" or "Russo · Silver". */
  name: string
}

export type RewardKind = {
  id: string
  name: string
  cost: number
  /** Optional shop category, for example Birds or Mammals. */
  group?: string
  /** In growth order; the last one is fully grown. */
  stages: RewardStage[]
}

type BadgeText = { name: string; emoji: string; how: string }

export type RewardTheme = {
  id: ThemeId
  /** Shown on the picker when a new player is created. */
  name: string
  blurb: string
  /** One emoji standing for the whole theme, for buttons. */
  icon: string
  /** Top-bar button, e.g. "🌻 Garden". */
  navLabel: string
  collectionTitle: string
  collectionBlurb: string
  shopTitle: string
  /** Word on a shop item's button area when it's already owned (unique themes). */
  ownedLabel: string
  emptySlotLabel: string
  /** Starting spaces and collection badge milestone. Repeatable themes expand. */
  slots: number
  /** Each kind can be bought once. Two of the same real footballer makes no sense. */
  unique: boolean
  /** What the new-player picker draws to sell this theme. */
  showcase: { kindId: string; stage: number }
  /** Which stage the shop shows as a preview. Negative counts from the end. */
  shopPreviewStage: number
  /** Tailwind classes for the collection's background. */
  backdropClass: string
  /** Theme-specific copy for the two collection badges (ids stay fixed). */
  badgeCopy: { first: BadgeText; full: BadgeText }
  kinds: RewardKind[]
}

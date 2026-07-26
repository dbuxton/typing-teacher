import type { Profile, LessonResult } from '../store/schema'

/**
 * Badges are pure predicates over the profile *after* a lesson has been recorded,
 * plus that lesson's result. Adding one means adding a row here — nothing else.
 *
 * The eyes-up badges (eagle-eye, blindfold, no-peeking) are the rare ones on
 * purpose: they're the behaviour the whole app is trying to build.
 */

export type Badge = {
  id: string
  name: string
  emoji: string
  /** Kid-facing description of how to earn it. */
  how: string
  rare?: boolean
  earned: (profile: Profile, lesson: LessonResult) => boolean
}

export const BADGES: Badge[] = [
  {
    id: 'first-lesson',
    name: 'First Steps',
    emoji: '🐣',
    how: 'Finish your very first lesson',
    earned: (p) => p.lessonsCompleted >= 1,
  },
  {
    id: 'ten-lessons',
    name: 'Getting Going',
    emoji: '🚀',
    how: 'Finish 10 lessons',
    earned: (p) => p.lessonsCompleted >= 10,
  },
  {
    id: 'fifty-lessons',
    name: 'Half Century',
    emoji: '🏅',
    how: 'Finish 50 lessons',
    earned: (p) => p.lessonsCompleted >= 50,
  },
  {
    id: 'home-row',
    name: 'Home Sweet Home',
    emoji: '🏠',
    how: 'Finish the home row levels',
    earned: (p) => p.highestLevelUnlocked > 2,
  },
  {
    id: 'hundred-words',
    name: 'Word Collector',
    emoji: '📚',
    how: 'Type 100 words',
    earned: (p) => p.totalWordsTyped >= 100,
  },
  {
    id: 'thousand-words',
    name: 'Word Wizard',
    emoji: '🧙',
    how: 'Type 1,000 words',
    earned: (p) => p.totalWordsTyped >= 1000,
  },
  {
    id: 'accuracy-95',
    name: 'Sharpshooter',
    emoji: '🎯',
    how: 'Finish a lesson with 95% accuracy',
    earned: (_p, l) => l.accuracy >= 0.95,
  },
  {
    id: 'perfect-lesson',
    name: 'Flawless',
    emoji: '💎',
    how: 'Finish a lesson with no mistakes at all',
    earned: (_p, l) => l.accuracy === 1,
  },
  {
    id: 'three-stars',
    name: 'Triple Star',
    emoji: '⭐',
    how: 'Get three stars in one lesson',
    earned: (_p, l) => l.stars === 3,
  },
  {
    id: 'streak-3',
    name: 'Three in a Row',
    emoji: '🔥',
    how: 'Practise three days running',
    earned: (p) => p.streak >= 3,
  },
  {
    id: 'streak-7',
    name: 'Week Warrior',
    emoji: '🔥',
    how: 'Practise seven days running',
    earned: (p) => p.streak >= 7,
  },
  {
    id: 'streak-30',
    name: 'Unstoppable',
    emoji: '☄️',
    how: 'Practise thirty days running',
    rare: true,
    earned: (p) => p.streak >= 30,
  },
  {
    id: 'speller-10',
    name: 'Spelling Bee',
    emoji: '🐝',
    how: 'Get 10 Spelling Stars right',
    earned: (p) => p.spellingWordsCorrect >= 10,
  },
  {
    id: 'speller-100',
    name: 'Dictionary Brain',
    emoji: '🧠',
    how: 'Get 100 Spelling Stars right',
    rare: true,
    earned: (p) => p.spellingWordsCorrect >= 100,
  },
  {
    id: 'gardener',
    name: 'Green Fingers',
    emoji: '🌱',
    how: 'Plant your first seed',
    earned: (p) => p.garden.length >= 1,
  },
  {
    id: 'full-garden',
    name: 'Garden Party',
    emoji: '🌻',
    how: 'Fill every plot in the garden',
    earned: (p) => p.garden.length >= 12,
  },
  // --- the eyes-up set ---
  {
    id: 'eagle-eye',
    name: 'Eagle Eye',
    emoji: '🦅',
    how: 'Catch every Sneaky Star in a lesson',
    earned: (_p, l) => l.sneakyStarsTotal >= 3 && l.sneakyStarsCaught === l.sneakyStarsTotal,
  },
  {
    id: 'blindfold',
    name: 'Blindfold',
    emoji: '🙈',
    how: 'Finish a lesson with the letters hidden',
    rare: true,
    earned: (_p, l) => l.assistLevel === 'letters-off' || l.assistLevel === 'on-miss' || l.assistLevel === 'off',
  },
  {
    id: 'no-peeking',
    name: 'No Peeking',
    emoji: '👑',
    how: 'Finish a lesson with no keyboard at all',
    rare: true,
    earned: (_p, l) => l.assistLevel === 'off',
  },
  {
    id: 'level-master',
    name: 'Typing Champion',
    emoji: '🏆',
    how: 'Unlock every level',
    rare: true,
    earned: (p) => p.highestLevelUnlocked >= 12,
  },
]

export function badgeById(id: string): Badge | undefined {
  return BADGES.find((b) => b.id === id)
}

/** Badge ids newly earned by this lesson (i.e. not already in the profile). */
export function newlyEarnedBadges(profile: Profile, lesson: LessonResult): string[] {
  return BADGES.filter((b) => !profile.badges.includes(b.id) && b.earned(profile, lesson)).map(
    (b) => b.id,
  )
}

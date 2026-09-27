import type { HuntRecord, KeyStat } from '../store/schema'
import {
  HELP_DEMOTE_ACCURACY,
  HELP_DEMOTE_HUNTS,
  HELP_PROMOTE_ACCURACY,
  HELP_PROMOTE_HUNTS,
  HELP_PROMOTE_LETTERS,
  MISSES_BEFORE_HELP,
  TRIES_BEFORE_LABEL_FADES,
} from './balance'

/**
 * How much the on-screen keyboard helps. It is always free — nobody should
 * have to buy their way to finding a key — and it steps back as the pilot
 * improves, the same idea as Typing Teacher's fading keyboard:
 *
 *   letters  → every key shows its letter, the next one glows
 *   colours  → keys show only their finger colour
 *   on-slip  → the keyboard only appears after a slip
 *
 * It moves both ways. A pilot who is struggling gets a step of help back,
 * framed as the ship's choice rather than their failure.
 */
export type HelpLevel = 'letters' | 'colours' | 'on-slip'

export const HELP_ORDER: readonly HelpLevel[] = ['letters', 'colours', 'on-slip']

export function isHelpLevel(value: unknown): value is HelpLevel {
  return HELP_ORDER.includes(value as HelpLevel)
}

function step(level: HelpLevel, by: number): HelpLevel {
  const index = HELP_ORDER.indexOf(level) + by
  return HELP_ORDER[Math.min(Math.max(index, 0), HELP_ORDER.length - 1)]
}

/**
 * The help level after a hunt. `history` already includes the hunt just flown.
 * Less help needs a sustained run of accurate, finished hunts at this level; more
 * help comes back after a couple of poor ones — one bad day moves nobody.
 */
export function helpAfterHunt(history: readonly HuntRecord[], current: HelpLevel): HelpLevel {
  const here = history.filter((hunt) => hunt.help === current && hunt.result !== 'aborted')

  const recent = here.slice(-HELP_PROMOTE_HUNTS)
  const earnedLess =
    current !== 'on-slip' &&
    recent.length === HELP_PROMOTE_HUNTS &&
    recent.every((hunt) => hunt.result === 'found' && hunt.accuracy >= HELP_PROMOTE_ACCURACY) &&
    recent.reduce((sum, hunt) => sum + hunt.letters, 0) >= HELP_PROMOTE_LETTERS
  if (earnedLess) return step(current, 1)

  const poor = here.slice(-HELP_DEMOTE_HUNTS)
  const needsMore =
    current !== 'letters' &&
    poor.length === HELP_DEMOTE_HUNTS &&
    poor.every((hunt) => hunt.result === 'towed' || hunt.accuracy < HELP_DEMOTE_ACCURACY)
  if (needsMore) return step(current, -1)

  return current
}

/** Mid-hunt: stuck on a letter brings one step more help, just while it's needed. */
export function effectiveHelp(saved: HelpLevel, missesHere: number): HelpLevel {
  return missesHere >= MISSES_BEFORE_HELP ? step(saved, -1) : saved
}

/** Is the keyboard drawn at all right now? */
export function showsKeyboard(help: HelpLevel, recentlyMissed: boolean): boolean {
  return help !== 'on-slip' || recentlyMissed
}

/**
 * Does this key show its letter? Always at the 'letters' level; otherwise only
 * while the key is still new to this pilot, so a freshly unlocked key is never
 * a blank the kid has to guess.
 */
export function showsLabel(key: string, help: HelpLevel, keyStats: Record<string, KeyStat>): boolean {
  return help === 'letters' || (keyStats[key]?.attempts ?? 0) < TRIES_BEFORE_LABEL_FADES
}

/** Kid-facing line when the keyboard steps back. */
export function lessHelpMessage(to: HelpLevel): string {
  return to === 'colours'
    ? 'You know where the letters are! The keyboard shows just the finger colours now.'
    : 'Ace flying — the keyboard only pops up if you slip now.'
}

/** Kid-facing line when help comes back. The ship's idea, not the pilot's fault. */
export function moreHelpMessage(to: HelpLevel): string {
  return to === 'letters'
    ? "I've put the letters back on the keyboard for a bit. No rush."
    : "I'll keep the keyboard showing for a while — it's there when you want it."
}

import { ASSIST_ORDER, type AssistLevel, type Profile } from '../store/schema'

/**
 * How much the on-screen keyboard helps, and when it steps back.
 *
 * The ladder moves BOTH ways. v1 only ever promoted, on the reasoning that
 * demotion feels like punishment — but leaving a kid stranded at an assist level
 * they can't cope with is itself pushing them faster than they can go, which is
 * worse. The fix isn't to refuse to ease off, it's to ease off kindly: sustained
 * low accuracy quietly restores the previous rung with encouraging copy, and
 * within a lesson `shouldTemporarilyHelp` brings help back immediately.
 */

/** Accuracy needed to earn less help. */
export const PROMOTE_ACCURACY = 0.9
/** Lessons at the current assist level before promotion is even considered. */
export const LESSONS_BEFORE_PROMOTION = 3
/** Below this sustained accuracy, hand some help back. */
export const DEMOTE_ACCURACY = 0.7
/** Consecutive poor lessons before easing off — one bad day demotes nobody. */
export const LESSONS_BEFORE_DEMOTION = 2
/** Consecutive misses within an item that summon temporary help. */
export const MISSES_BEFORE_HELP = 3

export function nextAssistLevel(current: AssistLevel): AssistLevel {
  const index = ASSIST_ORDER.indexOf(current)
  return ASSIST_ORDER[Math.min(index + 1, ASSIST_ORDER.length - 1)]
}

export function previousAssistLevel(current: AssistLevel): AssistLevel {
  const index = ASSIST_ORDER.indexOf(current)
  return ASSIST_ORDER[Math.max(index - 1, 0)]
}

/**
 * Should this kid get less help after this lesson? Needs a run of lessons at the
 * current level and good accuracy on this one.
 */
export function shouldPromote(profile: Profile, accuracy: number): boolean {
  if (profile.assistLevel === 'off') return false
  if (accuracy < PROMOTE_ACCURACY) return false
  const atThisLevel = profile.history.filter((h) => h.assistLevel === profile.assistLevel).length
  return atThisLevel + 1 >= LESSONS_BEFORE_PROMOTION
}

/**
 * Should this kid get MORE help back? True when the last few lessons at the
 * current assist level have all been a struggle — not on the strength of one.
 */
export function shouldDemote(profile: Profile, accuracy: number): boolean {
  if (profile.assistLevel === 'full') return false
  if (accuracy >= DEMOTE_ACCURACY) return false

  const recentAtThisLevel = profile.history
    .filter((h) => h.assistLevel === profile.assistLevel)
    .slice(-(LESSONS_BEFORE_DEMOTION - 1))

  if (recentAtThisLevel.length < LESSONS_BEFORE_DEMOTION - 1) return false
  return recentAtThisLevel.every((h) => h.accuracy < DEMOTE_ACCURACY)
}

/** The assist level to save after a lesson. Moves in both directions. */
export function assistAfterLesson(profile: Profile, accuracy: number): AssistLevel {
  if (shouldPromote(profile, accuracy)) return nextAssistLevel(profile.assistLevel)
  if (shouldDemote(profile, accuracy)) return previousAssistLevel(profile.assistLevel)
  return profile.assistLevel
}

/**
 * Within a lesson: after a few misses in a row, show more of the keyboard for
 * the rest of the current item. Help arrives when they're stuck, and it isn't
 * recorded anywhere — it doesn't affect the saved assist level.
 */
export function shouldTemporarilyHelp(consecutiveMisses: number): boolean {
  return consecutiveMisses >= MISSES_BEFORE_HELP
}

/** The assist level actually in force right now, given in-lesson struggling. */
export function effectiveAssist(saved: AssistLevel, consecutiveMisses: number): AssistLevel {
  return shouldTemporarilyHelp(consecutiveMisses) ? previousAssistLevel(saved) : saved
}

/** Does this assist level draw a keyboard at all right now? */
export function showsKeyboard(assist: AssistLevel, recentlyMissed: boolean): boolean {
  if (assist === 'full' || assist === 'letters-off') return true
  if (assist === 'on-miss') return recentlyMissed
  return false
}

export function showsLetters(assist: AssistLevel): boolean {
  return assist === 'full' || assist === 'on-miss'
}

/** Kid-facing message when the keyboard steps back a notch. */
export function promotionMessage(to: AssistLevel): string {
  switch (to) {
    case 'letters-off':
      return "You know where the letters are! I've turned the letters off — follow the colours instead."
    case 'on-miss':
      return "You barely need the keyboard now. It'll only pop up if you slip."
    case 'off':
      return "No keyboard at all — you're touch typing for real. 👑"
    default:
      return 'Well done!'
  }
}

/**
 * Kid-facing message when help comes back. Framed as the app's choice, not the
 * kid's failure — "I've put them back" rather than "you weren't good enough".
 */
export function demotionMessage(to: AssistLevel): string {
  switch (to) {
    case 'full':
      return "I've put the letters back on the keyboard for a bit. No rush at all."
    case 'letters-off':
      return "Let's keep the keyboard up for a while longer — it's there when you want it."
    case 'on-miss':
      return "I'll pop the keyboard up whenever you slip, just for a bit."
    default:
      return 'Taking it a bit steadier.'
  }
}

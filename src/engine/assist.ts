import { ASSIST_ORDER, type AssistLevel, type Profile } from '../store/schema'

/**
 * How much the on-screen keyboard helps, and when it steps back.
 *
 * The ladder only ever goes up, and only after a genuinely good lesson. There is
 * no permanent demotion: if a kid struggles at a harder assist level they get
 * temporary help within the lesson (see `shouldTemporarilyHelp`) rather than
 * being knocked back down a rung, which would read as punishment.
 */

/** Accuracy needed to earn less help. */
export const PROMOTE_ACCURACY = 0.9
/** Lessons at the current assist level before promotion is even considered. */
export const LESSONS_BEFORE_PROMOTION = 3
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

/** The assist level to save after a lesson. Never goes down. */
export function assistAfterLesson(profile: Profile, accuracy: number): AssistLevel {
  return shouldPromote(profile, accuracy) ? nextAssistLevel(profile.assistLevel) : profile.assistLevel
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

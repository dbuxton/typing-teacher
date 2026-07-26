import { getLevel, isTypeable, SPELLING_STARTS_AT_LEVEL } from '../data/curriculum'
import { SPELLING_WORDS } from '../data/spellingWords'
import type { KeyStat, Profile } from '../store/schema'
import { type Rng, makeRng, pick, shuffle, weightedSample } from './rng'
import { selectSpellingWords } from './srs'
import { keyErrorRate, lessonShapeFor } from './adaptive'

/**
 * Builds a lesson: a list of items to type.
 *
 * The shape matters more than it looks. Drills teach the keys but they are
 * boring, so they're capped at DRILL_ITEMS and framed as a warm-up; everything
 * after that is real words and sentences. Levels 1-2 are the exception — there
 * simply aren't words in "f j" — so those levels are kept short instead.
 *
 * Length and difficulty come from the kid's `difficulty` signal rather than the
 * level, so a child who is struggling gets a shorter, gentler lesson instead of
 * the identical one they just failed.
 */

export type ItemKind = 'drill' | 'word' | 'sentence' | 'spelling'

export type LessonItem = {
  kind: ItemKind
  /** What the kid must type. */
  text: string
  /** For spelling items: the sentence shown on the reveal card. */
  hint?: string
  /**
   * For spelling items: has the kid never met this word before? A word has to be
   * taught before it can be tested, so a first encounter shows the spelling.
   * After that it's spoken and hidden, which is a real spelling test.
   */
  firstEncounter?: boolean
}

export const DRILL_ITEMS = 2
export const SPELLING_ITEMS = 2

export function generateLesson(profile: Profile, levelId: number, seed?: number): LessonItem[] {
  const level = getLevel(levelId)
  const rng = makeRng(seed ?? Math.floor(Math.random() * 2 ** 31))
  const shape = lessonShapeFor(profile.difficulty, level.itemCount)
  const items: LessonItem[] = []

  // Keys the kid skipped past by accelerating: unlocked but never practised.
  // They get the same emphasis as this level's own new keys so nothing is
  // silently missed on the way up.
  const focusKeys = [...new Set([...level.newKeys, ...unpractisedKeys(profile, level.allKeys)])]

  // 1. Warm-up drills, always first and always capped.
  const drillCount = level.words.length === 0 ? shape.itemCount : DRILL_ITEMS
  for (let i = 0; i < drillCount; i++) {
    const drillKeys = focusKeys.filter((k) => k !== 'Shift')
    items.push({ kind: 'drill', text: makeDrill(rng, drillKeys.length ? drillKeys : level.allKeys) })
  }
  if (items.length >= shape.itemCount) return items.slice(0, shape.itemCount)

  // 2. Spelling Stars, once the kid has letters enough to spell with.
  const spellingCount =
    levelId >= SPELLING_STARTS_AT_LEVEL
      ? Math.min(shape.spellingItems, shape.itemCount - items.length)
      : 0
  if (spellingCount > 0) {
    const words = selectSpellingWords(
      profile.spelling,
      levelId,
      profile.lessonsCompleted + 1,
      spellingCount,
      rng,
    )
    const seenWords = new Set(profile.spelling.map((s) => s.word))
    for (const word of words) {
      const entry = SPELLING_WORDS.find((w) => w.word === word)
      items.push({
        kind: 'spelling',
        text: word,
        hint: entry?.hint,
        firstEncounter: !seenWords.has(word),
      })
    }
  }

  // 3. A sentence, but only once they're coping — sentences are the longest and
  //    most punishing item to get wrong halfway through.
  const remaining = shape.itemCount - items.length
  if (shape.includeSentence && level.sentences.length > 0 && remaining > 1) {
    items.push({ kind: 'sentence', text: pick(rng, level.sentences) })
  }

  // 4. Fill the rest with words, weighted toward focus keys and weak keys, and
  //    kept short while the kid is finding it hard.
  const wordSlots = shape.itemCount - items.length
  if (wordSlots > 0 && level.words.length > 0) {
    const bank = wordBankFor(level.words, shape.maxWordLength)
    const chosen = weightedSample(rng, bank, wordSlots, (word) =>
      wordWeight(word, focusKeys, profile.perKeyStats),
    )
    // weightedSample is without replacement, so a short bank can under-fill.
    while (chosen.length < wordSlots) chosen.push(pick(rng, bank))
    for (const word of chosen) items.push({ kind: 'word', text: word })
  }

  // Warm-ups stay first; the rest is shuffled so lessons don't feel like a form.
  const warmups = items.filter((i) => i.kind === 'drill')
  const rest = shuffle(
    rng,
    items.filter((i) => i.kind !== 'drill'),
  )
  return [...warmups, ...rest]
}

/**
 * Prefer short words while the kid is struggling, but never hand back an empty
 * bank — a level whose words are all long still has to produce a lesson.
 */
function wordBankFor(words: string[], maxLength: number): string[] {
  if (!Number.isFinite(maxLength)) return words
  const short = words.filter((w) => w.length <= maxLength)
  return short.length >= 4 ? short : words
}

/**
 * Keys that are unlocked at this level but that the kid has barely typed —
 * which is exactly what happens after an acceleration jump skips a level or two.
 */
function unpractisedKeys(profile: Profile, allKeys: string[]): string[] {
  return allKeys.filter((key) => {
    if (key === 'Shift') return false
    const stat = profile.perKeyStats[key]
    return !stat || stat.attempts < 10
  })
}

/** e.g. "fjf jfj ffj" — short bursts, three groups, never longer than a breath. */
function makeDrill(rng: Rng, keys: string[]): string {
  const groups: string[] = []
  for (let g = 0; g < 3; g++) {
    let group = ''
    for (let i = 0; i < 3; i++) group += pick(rng, keys)
    groups.push(group)
  }
  return groups.join(' ')
}

/**
 * Words containing focus keys score higher, as do words containing keys this kid
 * gets wrong *proportionally* often.
 *
 * The rate matters. Weighting on raw error counts — which is what this did
 * originally — targets whichever letters appear most, because `e` and `a`
 * accumulate errors just by turning up in every word. That's the opposite of
 * targeting weak keys: it buries the rare letter they genuinely can't find.
 */
function wordWeight(word: string, focusKeys: string[], perKeyStats: Record<string, KeyStat>): number {
  let weight = 1
  for (const char of new Set(word.toLowerCase())) {
    if (focusKeys.includes(char)) weight += 2
    const rate = keyErrorRate(perKeyStats[char])
    // null = not enough attempts to judge; leave those alone rather than
    // treating "unknown" as "fine".
    if (rate !== null) weight += rate * 6
  }
  return weight
}

/** Every character a lesson would ask for. Used by the invariant test. */
export function charsIn(items: LessonItem[]): string[] {
  return [...new Set(items.flatMap((item) => item.text.split('')))]
}

/** True if every character in `items` is typeable at `levelId`. */
export function lessonIsTypeable(items: LessonItem[], levelId: number): boolean {
  const { allKeys } = getLevel(levelId)
  return charsIn(items).every((char) => isTypeable(char, allKeys))
}

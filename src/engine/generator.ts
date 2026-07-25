import { getLevel, isTypeable, SPELLING_STARTS_AT_LEVEL } from '../data/curriculum'
import { SPELLING_WORDS } from '../data/spellingWords'
import type { Profile } from '../store/schema'
import { type Rng, makeRng, pick, shuffle, weightedSample } from './rng'
import { selectSpellingWords } from './srs'

/**
 * Builds a lesson: a list of items to type.
 *
 * The shape matters more than it looks. Drills teach the keys but they are
 * boring, so they're capped at DRILL_ITEMS and framed as a warm-up; everything
 * after that is real words and sentences. Levels 1-2 are the exception — there
 * simply aren't words in "f j" — so those levels are kept short instead.
 */

export type ItemKind = 'drill' | 'word' | 'sentence' | 'spelling'

export type LessonItem = {
  kind: ItemKind
  /** What the kid must type. */
  text: string
  /** For spelling items: the sentence shown on the reveal card. */
  hint?: string
}

export const DRILL_ITEMS = 2
export const SPELLING_ITEMS = 2

export function generateLesson(profile: Profile, levelId: number, seed?: number): LessonItem[] {
  const level = getLevel(levelId)
  const rng = makeRng(seed ?? Math.floor(Math.random() * 2 ** 31))
  const items: LessonItem[] = []

  // 1. Warm-up drills, always first and always capped.
  const drillCount = level.words.length === 0 ? level.itemCount : DRILL_ITEMS
  for (let i = 0; i < drillCount; i++) {
    items.push({ kind: 'drill', text: makeDrill(rng, level.newKeys.length ? level.newKeys : level.allKeys) })
  }
  if (items.length >= level.itemCount) return items.slice(0, level.itemCount)

  // 2. Spelling Stars, once the kid has letters enough to spell with.
  const spellingCount =
    levelId >= SPELLING_STARTS_AT_LEVEL ? Math.min(SPELLING_ITEMS, level.itemCount - items.length) : 0
  if (spellingCount > 0) {
    const words = selectSpellingWords(
      profile.spelling,
      levelId,
      profile.lessonsCompleted + 1,
      spellingCount,
      rng,
    )
    for (const word of words) {
      const entry = SPELLING_WORDS.find((w) => w.word === word)
      items.push({ kind: 'spelling', text: word, hint: entry?.hint })
    }
  }

  // 3. One sentence if the level has any.
  const remaining = level.itemCount - items.length
  const wantSentence = level.sentences.length > 0 && remaining > 1
  if (wantSentence) {
    items.push({ kind: 'sentence', text: pick(rng, level.sentences) })
  }

  // 4. Fill the rest with words, weighted toward new keys and this kid's weak keys.
  const wordSlots = level.itemCount - items.length
  if (wordSlots > 0 && level.words.length > 0) {
    const chosen = weightedSample(rng, level.words, wordSlots, (word) =>
      wordWeight(word, level.newKeys, profile.keyErrors),
    )
    // weightedSample is without replacement, so a short bank can under-fill.
    while (chosen.length < wordSlots) chosen.push(pick(rng, level.words))
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
 * Words containing newly-taught keys score higher, as do words containing keys
 * this kid gets wrong a lot. That's how practice self-targets without the app
 * ever serving another dull drill.
 */
function wordWeight(word: string, newKeys: string[], keyErrors: Record<string, number>): number {
  let weight = 1
  for (const char of new Set(word.toLowerCase())) {
    if (newKeys.includes(char)) weight += 2
    weight += Math.min(keyErrors[char] ?? 0, 10) * 0.3
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

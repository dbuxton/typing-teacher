import { getLevel, isTypeable, LEVELS, SPELLING_STARTS_AT_LEVEL } from '../data/curriculum'
import { SPELLING_WORDS } from '../data/spellingWords'
import type { KeyStat, Profile } from '../store/schema'
import { type Rng, makeRng, pick, shuffle, weightedSample } from './rng'
import { selectSpellingWords } from './srs'
import { keyErrorRate, lessonShapeFor, weakKeys } from './adaptive'

/**
 * Builds a lesson: a list of items to type.
 *
 * The shape matters more than it looks. Drills teach the keys but they are
 * boring, so normally they're capped at DRILL_ITEMS as a warm-up; everything
 * after that is real words and sentences. Level 1 is the exception — there
 * simply aren't words in "f j" — so it uses varied, short key patterns instead.
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
  /** A friendly name for varied drills or a spaced return. */
  label?: string
  review?: boolean
}

export const DRILL_ITEMS = 2
export const SPELLING_ITEMS = 2

const WORD_BANK = [...new Set(LEVELS.flatMap(level => level.words))]

export function generateLesson(profile: Profile, levelId: number, seed?: number): LessonItem[] {
  const level = getLevel(levelId)
  const rng = makeRng(seed ?? Math.floor(Math.random() * 2 ** 31))
  const shape = lessonShapeFor(profile.difficulty, level.itemCount)
  const items: LessonItem[] = []
  const lessonNumber = profile.lessonsCompleted + 1
  const memory = profile.practice
  const recent = new Set(memory.filter(item => item.lastSeenAt >= lessonNumber - 2).map(item => item.text))
  const coolingDown = new Set(memory.filter(item => item.dueAt !== null && item.dueAt > lessonNumber).map(item => item.text))
  // Don't reveal a spelling answer in a typing item while it is resting, either.
  for (const word of profile.spelling) if (word.dueAt > lessonNumber) coolingDown.add(word.word)
  const resting = new Set(coolingDown)
  const typeable = (text: string) => [...text].every(char => isTypeable(char, level.allKeys))
  const bank = WORD_BANK.filter(word => typeable(word) && word.length <= shape.maxWordLength)

  // Include keys skipped by acceleration and the child's weak keys, while always
  // covering this level's actual new keys in the opening drill.
  const weak = weakKeys(profile.perKeyStats).filter(key => level.allKeys.includes(key)).slice(0, 2)
  const focusKeys = [...new Set([...level.newKeys, ...weak, ...unpractisedKeys(profile, level.allKeys)])]
  const drillKeys = focusKeys.filter(key => key !== 'Shift')
  // A child whose only weak keys are punctuation still needs a letter to
  // practise capitalising on the Shift level.
  if (level.newKeys.includes('Shift')) {
    drillKeys.push(...level.allKeys.filter(key => /^[a-z]$/.test(key)))
  }
  const keys = drillKeys.length ? drillKeys : level.allKeys.filter(key => key !== 'Shift')

  // At most one exact typing review per lesson. Old-level misses can return in a
  // later level too; going back to an easier level never introduces locked keys.
  const review = memory
    .filter(item => item.dueAt !== null && item.dueAt <= lessonNumber
      && item.lastSeenAt < lessonNumber - 1 && typeable(item.text)
      && (item.kind !== 'word' || item.text.split(' ').every(word => word.length <= shape.maxWordLength))
      && (item.kind !== 'sentence' || shape.includeSentence))
    .sort((a, b) => a.dueAt! - b.dueAt!)[0]
  const reviewItem = review ? { kind: review.kind, text: review.text, review: true, label: '🌱 Look how far you’ve come' } : null
  for (const item of memory) {
    if (item.dueAt !== null && item.text !== review?.text) resting.add(item.text)
  }

  const drillCount = bank.length === 0 ? shape.itemCount : DRILL_ITEMS
  for (let i = 0; i < drillCount; i++) {
    if (i === 1 && reviewItem?.kind === 'drill') {
      items.push(reviewItem)
      continue
    }
    const pattern = (profile.lessonsCompleted + i) % DRILL_PATTERNS.length
    let text = ''
    for (let attempt = 0; attempt < 64; attempt++) {
      text = makeDrill(rng, keys, pattern, i === 0 ? level.newKeys : [])
      if (!recent.has(text) && !resting.has(text) && !items.some(item => item.text === text)
        && text !== reviewItem?.text) break
    }
    items.push({ kind: 'drill', text, label: DRILL_PATTERNS[pattern].label })
  }
  if (items.length >= shape.itemCount) return items
  if (reviewItem && reviewItem.kind !== 'drill') items.push(reviewItem)

  // Spelling has its own spaced queue. On a repeated level, one is enough;
  // the rest of the lesson explores the same letters in different material.
  const spellingCount = levelId >= SPELLING_STARTS_AT_LEVEL
    ? Math.min(profile.levelStats[levelId] ? 1 : shape.spellingItems, shape.itemCount - items.length)
    : 0
  const seenWords = new Set(profile.spelling.map(word => word.word))
  const spelling = selectSpellingWords(profile.spelling, levelId, lessonNumber, spellingCount, rng)
  for (const word of spelling) {
    if (items.some(item => item.text === word) || resting.has(word)) continue
    const entry = SPELLING_WORDS.find(entry => entry.word === word)
    items.push({ kind: 'spelling', text: word, hint: entry?.hint, firstEncounter: !seenWords.has(word) })
  }

  // Mix familiar, mastered material with the new keys. Keep long sentences out
  // while struggling, and let the final sentence level actually use sentences.
  const sentenceBank = LEVELS.filter(candidate => candidate.id <= levelId)
    .flatMap(candidate => candidate.sentences).filter(typeable)
  const sentenceCount = shape.includeSentence ? (levelId === 12 ? 3 : 1) : 0
  for (let i = items.filter(item => item.kind === 'sentence').length; i < sentenceCount; i++) {
    if (shape.itemCount - items.length <= 1) break
    const pool = availableText(sentenceBank, items, recent, resting)
    if (!pool.length) break
    const focused = pool.filter(text => touchesKeys(text, level.newKeys))
    items.push({ kind: 'sentence', text: pick(rng, focused.length ? focused : pool) })
  }

  const wordSlots = shape.itemCount - items.length
  for (let i = 0; i < wordSlots; i++) {
    const pool = availableText(bank, items, recent, resting)
    const focused = pool.filter(word => touchesKeys(word, level.newKeys))
    // Most words practise the new keys; others give a little familiar success.
    const candidates = i < Math.ceil(wordSlots * 0.6) && focused.length ? focused : pool
    if (candidates.length) {
      const [text] = weightedSample(rng, candidates, 1, word => wordWeight(word, focusKeys, profile.perKeyStats))
      items.push({ kind: 'word', text })
    } else {
      // A tiny bank may be entirely resting. Fresh two-word trails still use
      // exactly the unlocked letters, without replaying a failed item verbatim.
      // Words whose gap has elapsed can join a new trail, even when their exact
      // single-word item is waiting its turn. A long run of misses must not turn
      // a word lesson back into a lesson made entirely of drills.
      const safe = bank.filter(word => !coolingDown.has(word))
      if (safe.length) {
        let text = ''
        for (let attempt = 0; attempt < 64; attempt++) {
          const first = pick(rng, safe)
          const others = safe.filter(word => word !== first)
          text = `${first} ${pick(rng, others.length ? others : safe)}`
          if (!recent.has(text) && !resting.has(text) && !items.some(item => item.text === text)) break
        }
        items.push({ kind: 'word', text, label: '👣 Word trail' })
      } else {
        items.push({ kind: 'drill', text: makeDrill(rng, keys, i % DRILL_PATTERNS.length), label: '🎵 Key rhythm' })
      }
    }
  }

  return [...items.filter(item => item.kind === 'drill'), ...shuffle(rng, items.filter(item => item.kind !== 'drill'))]
}

function availableText(bank: string[], items: LessonItem[], recent: Set<string>, resting: Set<string>): string[] {
  const unused = bank.filter(text => !resting.has(text) && !items.some(item => item.text === text))
  const fresh = unused.filter(text => !recent.has(text))
  return fresh.length ? fresh : unused
}

function touchesKeys(text: string, keys: string[]): boolean {
  return keys.some(key => key === 'Shift' ? /[A-Z]/.test(text) : text.toLowerCase().includes(key))
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

const DRILL_PATTERNS = [
  { groups: [2, 2, 2], label: '👣 Key pairs' },
  { groups: [3, 3], label: '🎵 Key rhythm' },
  { groups: [2, 3, 2], label: '🪜 Key steps' },
  { groups: [4, 4], label: '🦋 Key wings' },
  { groups: [3, 2, 3], label: '🔀 Key mix' },
  { groups: [2, 2, 2, 2], label: '⚡ Key switches' },
]

function makeDrill(rng: Rng, keys: string[], pattern: number, required: string[] = []): string {
  const lengths = DRILL_PATTERNS[pattern].groups
  const count = lengths.reduce((sum, length) => sum + length, 0)
  const chars = Array.from({ length: count }, () => pick(rng, keys))
  // Space is practised between groups. Shift gets real capitals, not the word
  // "Shift"; every other new key is guaranteed a turn in the opening item.
  const coverage = shuffle(rng, required.filter(key => key !== 'Shift'))
  coverage.forEach((key, index) => { chars[index] = key })
  if (required.includes('Shift')) {
    const letters = keys.filter(key => /[a-z]/.test(key))
    if (letters.length) chars[0] = pick(rng, letters).toUpperCase()
  }
  const groups = []
  let offset = 0
  for (const length of lengths) {
    groups.push(chars.slice(offset, offset + length).join(''))
    offset += length
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

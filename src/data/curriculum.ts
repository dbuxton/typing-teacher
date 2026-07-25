/**
 * The curriculum is data, not code. Each level unlocks a few new keys and carries
 * its own word/sentence bank built ONLY from keys unlocked so far — a kid should
 * never be asked to type a letter they haven't been taught.
 *
 * `generator.test.ts` enforces that invariant, so if you add a word here that uses
 * a locked letter the test suite will tell you. (It caught "they" sitting in level
 * 5, two levels before `h` is introduced.)
 */

export type Level = {
  id: number
  /** Shown on the map. Kid-facing, so keep it playful. */
  name: string
  /** Keys introduced by this level — drills and word weighting focus here. */
  newKeys: string[]
  /** Every key available at this level, including earlier ones. */
  allKeys: string[]
  /** Real words typeable from `allKeys`. */
  words: string[]
  /** Short sentences typeable from `allKeys`. Empty until enough letters exist. */
  sentences: string[]
  /** How many items make up one lesson here. Early levels are short on purpose. */
  itemCount: number
}

export const HOME_ROW = ['a', 's', 'd', 'f', 'j', 'k', 'l', ';']

const L3 = [...HOME_ROW, 'e', 'i']
const L4 = [...L3, 'r', 'u']
const L5 = [...L4, 't', 'y']
const L6 = [...L5, 'g', 'h']
const L7 = [...L6, 'o', 'n']
const L8 = [...L7, 'c', 'v', 'm']
const L9 = [...L8, 'w', 'q', 'p']
const L10 = [...L9, 'b', 'x', 'z', ',', '.']
const L11 = [...L10, 'Shift']
const L12 = [...L11, '?', '!', "'"]

export const LEVELS: Level[] = [
  {
    id: 1,
    name: 'Finding the Bumps',
    newKeys: ['f', 'j'],
    allKeys: ['f', 'j'],
    words: [],
    sentences: [],
    itemCount: 6,
  },
  {
    id: 2,
    name: 'The Home Row',
    newKeys: ['a', 's', 'd', 'k', 'l', ';'],
    allKeys: [...HOME_ROW],
    words: ['as', 'ask', 'lad', 'dad', 'sad', 'fads', 'flask', 'salad', 'all', 'fall', 'add', 'asks', 'lass', 'falls'],
    sentences: [],
    itemCount: 6,
  },
  {
    id: 3,
    name: 'E and I Join In',
    newKeys: ['e', 'i'],
    allKeys: L3,
    words: [
      'said', 'kids', 'like', 'side', 'slide', 'ideas', 'jail', 'leaf', 'field',
      'skies', 'seas', 'less', 'idea', 'file', 'sail', 'deal', 'lead', 'silk',
      'desk', 'likes', 'aside', 'ideal', 'flies', 'dial', 'sales', 'jade', 'laid',
      'lake', 'fake', 'skill', 'dislike',
    ],
    sentences: ['all kids like ideas', 'a lake is safe', 'i see a jellied eel'],
    itemCount: 10,
  },
  {
    id: 4,
    name: 'Reaching for R and U',
    newKeys: ['r', 'u'],
    allKeys: L4,
    words: [
      'ride', 'rule', 'user', 'jars', 'fair', 'read', 'real', 'safer',
      'ruler', 'rides', 'usual', 'raise', 'druid', 'series', 'sure', 'dare',
      'dear', 'fried', 'drill', 'radius', 'sailed', 'fires', 'liked', 'frail',
    ],
    sentences: ['a red flask is real', 'ideas are easier', 'i like a fair deal'],
    itemCount: 10,
  },
  {
    id: 5,
    name: 'T and Y Take Off',
    newKeys: ['t', 'y'],
    allKeys: L5,
    words: [
      'stay', 'daily', 'dirty', 'style', 'truly', 'title', 'trust', 'salty',
      'artist', 'safety', 'tasty', 'later', 'treat', 'jelly', 'tired', 'easy',
      'lady', 'dusty', 'results', 'street', 'faster', 'little', 'yesterday',
    ],
    sentences: ['it is a really tidy desk', 'stay just a little', 'a tasty jelly'],
    itemCount: 10,
  },
  {
    id: 6,
    name: 'G and H Say Hello',
    newKeys: ['g', 'h'],
    allKeys: L6,
    words: [
      'this', 'that', 'they', 'high', 'right', 'light', 'their', 'girl',
      'height', 'guest', 'hurry', 'these', 'eight', 'thirsty', 'garage',
      'daughter', 'laughter', 'tight', 'sight', 'slightly', 'straight',
    ],
    sentences: ['the girl is right here', 'he had a great day', 'she had a slight fright'],
    itemCount: 10,
  },
  {
    id: 7,
    name: 'O and N Arrive',
    newKeys: ['o', 'n'],
    allKeys: L7,
    words: [
      'not', 'and', 'one', 'onto', 'north', 'thing', 'sound', 'night', 'front',
      'strong', 'young', 'around', 'nothing', 'another', 'holiday', 'garden',
      'shining', 'donuts', 'orange', 'thunder',
    ],
    sentences: [
      'the dog is on the sand',
      'he found a shiny stone',
      'a long night in the garden',
    ],
    itemCount: 10,
  },
  {
    id: 8,
    name: 'Down to C, V and M',
    newKeys: ['c', 'v', 'm'],
    allKeys: L8,
    words: [
      'come', 'cave', 'move', 'much', 'time', 'even', 'music', 'money', 'never',
      'motion', 'monster', 'machine', 'costume', 'vitamin', 'ceremony', 'coconut',
      'chocolate', 'volcano', 'cousin', 'stomach',
    ],
    sentences: [
      'come and see the cave',
      'my monster ate my socks',
      'a mouse can move very fast',
    ],
    itemCount: 10,
  },
  {
    id: 9,
    name: 'Top Row: W, Q and P',
    newKeys: ['w', 'q', 'p'],
    allKeys: L9,
    words: [
      'we', 'up', 'was', 'went', 'play', 'quiet', 'people', 'wrong', 'happy',
      'purple', 'question', 'penguin', 'popcorn', 'quickly', 'wonderful',
      'important', 'whisper', 'puppy', 'window', 'square',
    ],
    sentences: [
      'we play in the park',
      'a quiet penguin went up',
      'people were very happy',
    ],
    itemCount: 10,
  },
  {
    id: 10,
    name: 'The Last Letters',
    newKeys: ['b', 'x', 'z', ',', '.'],
    allKeys: L10,
    words: [
      'big', 'box', 'buzz', 'zebra', 'about', 'before', 'because', 'pizza',
      'excited', 'bicycle', 'exactly', 'amazing', 'jumbled', 'lazy', 'expert',
      'buzzing', 'brilliant', 'puzzle', 'bubbles', 'sixty',
    ],
    sentences: [
      'the lazy zebra ate a big pizza.',
      'my bike is blue, red and green.',
      'we were excited, but very tired.',
    ],
    itemCount: 10,
  },
  {
    id: 11,
    name: 'Big Letters (Shift!)',
    newKeys: ['Shift'],
    allKeys: L11,
    words: ['Monday', 'London', 'Sam', 'Friday', 'April', 'Emma', 'Tuesday', 'Africa', 'June', 'Jack'],
    sentences: [
      'My name is Sam.',
      'We went to London in April.',
      'On Friday, Emma had a party.',
      'The Big Red Bus was late.',
    ],
    itemCount: 10,
  },
  {
    id: 12,
    name: 'Real Sentences',
    newKeys: [],
    allKeys: L12,
    words: [],
    sentences: [
      'The quick brown fox jumps over the lazy dog.',
      'What time does the film start?',
      'I think my cat has eaten my homework!',
      'We walked to the shop, then we came home.',
      'Do you know where my other sock went?',
      'It was raining, so we stayed inside and read books.',
    ],
    itemCount: 8,
  },
]

export const MAX_LEVEL = LEVELS.length

export function getLevel(id: number): Level {
  const level = LEVELS.find((l) => l.id === id)
  if (!level) throw new Error(`No level with id ${id}`)
  return level
}

/** Spelling Stars only start once there are enough letters to spell real words. */
export const SPELLING_STARTS_AT_LEVEL = 4

/**
 * Is `char` typeable at this level? Spaces are always allowed; a capital needs
 * Shift to have been introduced. Used by the generator and its tests.
 */
export function isTypeable(char: string, allKeys: string[]): boolean {
  if (char === ' ') return true
  const lower = char.toLowerCase()
  if (char !== lower && !allKeys.includes('Shift')) return false
  return allKeys.includes(lower)
}

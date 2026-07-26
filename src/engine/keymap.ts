/**
 * The physical keyboard layout, and which finger owns each key.
 *
 * Colour is the teaching device: a key and the finger that presses it are shown
 * in the same colour, so the mapping is learned as "pink finger, pink key"
 * rather than as a position the kid has to look down to find.
 */

export type Finger =
  | 'l-pinky'
  | 'l-ring'
  | 'l-middle'
  | 'l-index'
  | 'r-index'
  | 'r-middle'
  | 'r-ring'
  | 'r-pinky'
  | 'thumb'

export const FINGER_COLOURS: Record<Finger, string> = {
  'l-pinky': '#f472b6',
  'l-ring': '#a78bfa',
  'l-middle': '#60a5fa',
  'l-index': '#34d399',
  'r-index': '#fbbf24',
  'r-middle': '#fb923c',
  'r-ring': '#f87171',
  'r-pinky': '#e879f9',
  thumb: '#94a3b8',
}

export const FINGER_NAMES: Record<Finger, string> = {
  'l-pinky': 'left little finger',
  'l-ring': 'left ring finger',
  'l-middle': 'left middle finger',
  'l-index': 'left pointing finger',
  'r-index': 'right pointing finger',
  'r-middle': 'right middle finger',
  'r-ring': 'right ring finger',
  'r-pinky': 'right little finger',
  thumb: 'thumb',
}

export const KEY_FINGER: Record<string, Finger> = {
  '`': 'l-pinky', '1': 'l-pinky', q: 'l-pinky', a: 'l-pinky', z: 'l-pinky',
  '2': 'l-ring', w: 'l-ring', s: 'l-ring', x: 'l-ring',
  '3': 'l-middle', e: 'l-middle', d: 'l-middle', c: 'l-middle',
  '4': 'l-index', r: 'l-index', f: 'l-index', v: 'l-index',
  '5': 'l-index', t: 'l-index', g: 'l-index', b: 'l-index',
  '6': 'r-index', y: 'r-index', h: 'r-index', n: 'r-index',
  '7': 'r-index', u: 'r-index', j: 'r-index', m: 'r-index',
  '8': 'r-middle', i: 'r-middle', k: 'r-middle', ',': 'r-middle',
  '9': 'r-ring', o: 'r-ring', l: 'r-ring', '.': 'r-ring',
  '0': 'r-pinky', p: 'r-pinky', ';': 'r-pinky', '/': 'r-pinky',
  "'": 'r-pinky', '[': 'r-pinky', ']': 'r-pinky', '-': 'r-pinky', '=': 'r-pinky',
  ' ': 'thumb',
}

/** Rows as drawn on screen. */
export const KEYBOARD_ROWS: string[][] = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'],
]

/** Home row keys, drawn with a bump indicator. */
export const BUMP_KEYS = ['f', 'j']

export function fingerFor(char: string): Finger | undefined {
  return KEY_FINGER[char.toLowerCase()]
}

export function colourFor(char: string): string {
  const finger = fingerFor(char)
  return finger ? FINGER_COLOURS[finger] : '#cbd5e1'
}

/**
 * Which shift key to use for a capital: the opposite hand to the letter, which
 * is the correct technique and worth teaching from the start.
 */
export function shiftSideFor(char: string): 'left' | 'right' | null {
  const finger = fingerFor(char)
  if (!finger || finger === 'thumb') return null
  return finger.startsWith('l-') ? 'right' : 'left'
}

export function needsShift(char: string): boolean {
  return char !== char.toLowerCase()
}

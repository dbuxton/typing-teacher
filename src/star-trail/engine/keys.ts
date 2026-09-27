/**
 * Turning a browser key event into something the hunt understands.
 *
 * Kept pure (it takes the few fields it needs, not the event) so the awkward
 * cases are unit-tested rather than discovered by a kid:
 *
 *  - A held-down key repeats. Typing Teacher lets that through; here every
 *    wrong key can cost fuel, so repeats are ignored outright.
 *  - Keyboards that compose characters (accents, other alphabets) send "Dead"
 *    or "Process" keys mid-composition. Those aren't keystrokes yet.
 *  - Shortcuts (Ctrl, Cmd, Alt) belong to the browser, not the trail.
 */

export const CATCH_KEY = 'ArrowUp'
export const SKIP_KEY = 'ArrowRight'
export const PAUSE_KEY = 'Escape'

export type KeyInput = {
  key: string
  repeat?: boolean
  isComposing?: boolean
  ctrlKey?: boolean
  metaKey?: boolean
  altKey?: boolean
  /** Whether Caps Lock is on (`event.getModifierState('CapsLock')`). */
  capsLock?: boolean
}

export type KeyIntent =
  | { type: 'type'; char: string; capsLock: boolean }
  | { type: 'catch' }
  | { type: 'skip' }
  | { type: 'pause' }

const NOT_YET_A_KEY = new Set(['Dead', 'Process', 'Unidentified'])

export function intentFor(input: KeyInput): KeyIntent | null {
  if (input.repeat || input.isComposing) return null
  if (input.ctrlKey || input.metaKey || input.altKey) return null
  if (NOT_YET_A_KEY.has(input.key)) return null
  if (input.key === CATCH_KEY) return { type: 'catch' }
  if (input.key === SKIP_KEY) return { type: 'skip' }
  if (input.key === PAUSE_KEY) return { type: 'pause' }
  // Every other named key (Shift, Backspace, F5…) is longer than one character.
  if (input.key.length !== 1) return null
  return { type: 'type', char: input.key, capsLock: input.capsLock ?? false }
}

/**
 * Keys whose browser default must be stopped mid-hunt: Space scrolls the page,
 * `'` and `/` open Firefox's quick find, Tab walks focus onto buttons (where
 * the next Space would press them), and Backspace used to mean "go back".
 */
export function preventsDefault(key: string): boolean {
  return key.length === 1 || ['Backspace', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)
}

/**
 * Is the kid's keyboard laid out differently from the QWERTY picture on screen?
 * A letter key reports where it physically is (`code`) as well as what it typed
 * (`key`); on AZERTY or Dvorak those disagree, and the finger guide can't be
 * trusted. Worth one gentle heads-up rather than silent confusion.
 */
export function layoutDiffers(code: string, key: string): boolean {
  if (!/^Key[A-Z]$/.test(code) || !/^[a-z]$/i.test(key)) return false
  return code.slice(3).toLowerCase() !== key.toLowerCase()
}

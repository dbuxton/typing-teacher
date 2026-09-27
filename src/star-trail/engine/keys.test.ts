import { describe, expect, it } from 'vitest'
import { intentFor, preventsDefault } from './keys'

describe('reading the keyboard', () => {
  it('turns letters, the space bar and punctuation into keystrokes', () => {
    expect(intentFor({ key: 'a' })).toEqual({ type: 'type', char: 'a', capsLock: false })
    expect(intentFor({ key: ' ' })).toEqual({ type: 'type', char: ' ', capsLock: false })
    expect(intentFor({ key: ';' })).toEqual({ type: 'type', char: ';', capsLock: false })
    expect(intentFor({ key: 'Q' })).toEqual({ type: 'type', char: 'Q', capsLock: false })
  })

  it('passes Caps Lock through, so a stuck Caps Lock is not charged as slips', () => {
    expect(intentFor({ key: 'A', capsLock: true })).toEqual({ type: 'type', char: 'A', capsLock: true })
  })

  it('ignores a held-down key, so one slip can’t turn into a dozen', () => {
    expect(intentFor({ key: 'x', repeat: true })).toBeNull()
  })

  it('ignores keys that are still being composed into a character', () => {
    expect(intentFor({ key: 'e', isComposing: true })).toBeNull()
    expect(intentFor({ key: 'Dead' })).toBeNull()
    expect(intentFor({ key: 'Process' })).toBeNull()
    expect(intentFor({ key: 'Unidentified' })).toBeNull()
  })

  it('leaves browser shortcuts alone', () => {
    expect(intentFor({ key: 'r', ctrlKey: true })).toBeNull()
    expect(intentFor({ key: 'r', metaKey: true })).toBeNull()
    expect(intentFor({ key: 'r', altKey: true })).toBeNull()
  })

  it('uses the arrows and Escape for catching, skipping and pausing', () => {
    expect(intentFor({ key: 'ArrowUp' })).toEqual({ type: 'catch' })
    expect(intentFor({ key: 'ArrowRight' })).toEqual({ type: 'skip' })
    expect(intentFor({ key: 'Escape' })).toEqual({ type: 'pause' })
  })

  it('ignores other named keys like Shift and Backspace', () => {
    for (const key of ['Shift', 'Backspace', 'CapsLock', 'Tab', 'Enter', 'F5', 'ArrowLeft']) {
      expect(intentFor({ key }), key).toBeNull()
    }
  })

  it('stops the page scrolling, searching or moving focus mid-hunt', () => {
    for (const key of [' ', "'", '/', 'a', 'Tab', 'Backspace', 'ArrowUp', 'ArrowDown']) {
      expect(preventsDefault(key), key).toBe(true)
    }
    for (const key of ['F5', 'Escape', 'Shift']) expect(preventsDefault(key), key).toBe(false)
  })
})

import { describe, expect, it } from 'vitest'
import type { HuntRecord } from '../store/schema'
import { HELP_PROMOTE_HUNTS, MISSES_BEFORE_HELP, TRIES_BEFORE_LABEL_FADES } from './balance'
import { effectiveHelp, helpAfterHunt, showsKeyboard, showsLabel, type HelpLevel } from './help'

function hunt(help: HelpLevel, accuracy: number, extra: Partial<HuntRecord> = {}): HuntRecord {
  return {
    planet: 1,
    result: 'found',
    practice: false,
    letters: 25,
    slips: Math.round(25 * (1 - accuracy)),
    accuracy,
    newKeyTries: 10,
    newKeySlips: 0,
    stardust: 20,
    help,
    date: '2026-09-27',
    ...extra,
  }
}

const times = (n: number, record: HuntRecord) => Array.from({ length: n }, () => record)

describe('the keyboard steps back as the pilot improves', () => {
  it('shows less after a run of accurate, finished hunts', () => {
    expect(helpAfterHunt(times(HELP_PROMOTE_HUNTS, hunt('letters', 0.96)), 'letters')).toBe('colours')
    expect(helpAfterHunt(times(HELP_PROMOTE_HUNTS, hunt('colours', 0.96)), 'colours')).toBe('on-slip')
  })

  it('never moves on the strength of a few hunts, or short ones', () => {
    expect(helpAfterHunt(times(HELP_PROMOTE_HUNTS - 1, hunt('letters', 1)), 'letters')).toBe('letters')
    expect(helpAfterHunt(times(HELP_PROMOTE_HUNTS, hunt('letters', 1, { letters: 8 })), 'letters')).toBe('letters')
  })

  it('needs every hunt in the run to be finished and accurate', () => {
    const run = [...times(HELP_PROMOTE_HUNTS - 1, hunt('letters', 0.97)), hunt('letters', 0.97, { result: 'towed' })]
    expect(helpAfterHunt(run, 'letters')).toBe('letters')
  })

  it('only counts hunts flown at the current level', () => {
    const history = [...times(HELP_PROMOTE_HUNTS, hunt('letters', 1)), hunt('colours', 1)]
    expect(helpAfterHunt(history, 'colours')).toBe('colours')
  })
})

describe('help comes back when it’s needed', () => {
  it('after a couple of poor hunts — never after one', () => {
    expect(helpAfterHunt([hunt('colours', 0.6)], 'colours')).toBe('colours')
    expect(helpAfterHunt([hunt('colours', 0.6), hunt('colours', 0.6)], 'colours')).toBe('letters')
    expect(helpAfterHunt([hunt('on-slip', 0.9, { result: 'towed' }), hunt('on-slip', 0.7)], 'on-slip')).toBe('colours')
  })

  it('never takes the lettered keyboard away for struggling', () => {
    expect(helpAfterHunt(times(5, hunt('letters', 0.3)), 'letters')).toBe('letters')
  })

  it('steps in mid-hunt when a letter just won’t come', () => {
    expect(effectiveHelp('on-slip', MISSES_BEFORE_HELP - 1)).toBe('on-slip')
    expect(effectiveHelp('on-slip', MISSES_BEFORE_HELP)).toBe('colours')
    expect(effectiveHelp('letters', 10)).toBe('letters')
  })

  it('only hides the keyboard until the next slip', () => {
    expect(showsKeyboard('colours', false)).toBe(true)
    expect(showsKeyboard('on-slip', false)).toBe(false)
    expect(showsKeyboard('on-slip', true)).toBe(true)
  })

  it('keeps a new key’s letter showing until it has been practised', () => {
    const stats = { e: { attempts: TRIES_BEFORE_LABEL_FADES - 1, errors: 0 }, f: { attempts: 50, errors: 1 } }
    expect(showsLabel('e', 'colours', stats)).toBe(true)
    expect(showsLabel('f', 'colours', stats)).toBe(false)
    expect(showsLabel('q', 'colours', stats)).toBe(true)
    expect(showsLabel('f', 'letters', stats)).toBe(true)
  })
})

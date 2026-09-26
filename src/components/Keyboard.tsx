import { memo } from 'react'
import {
  BUMP_KEYS,
  FINGER_COLOURS,
  FINGER_NAMES,
  KEYBOARD_ROWS,
  colourFor,
  fingerFor,
  needsShift,
  shiftSideFor,
} from '../engine/keymap'
import type { AssistLevel } from '../store/schema'
import { showsLetters } from '../engine/assist'

/**
 * The on-screen keyboard. It sits directly under the text so the kid's eyes drop
 * a couple of centimetres instead of down to their hands — and it fades out as
 * they improve (see `assist.ts`).
 *
 * Memoised on (nextChar, assist, visible): a keystroke only repaints this when
 * the highlighted key actually changes.
 */

type Props = {
  nextChar?: string
  assist: AssistLevel
  visible: boolean
}

function KeyCap({
  char,
  isNext,
  withLetters,
}: {
  char: string
  isNext: boolean
  withLetters: boolean
}) {
  const colour = colourFor(char)
  return (
    <div
      className={`keyboard-key relative flex items-center justify-center rounded-lg border-2 font-bold transition-all ${
        isNext ? 'key-next border-slate-700 shadow-lg' : 'border-transparent'
      }`}
      style={{
        backgroundColor: isNext ? colour : `${colour}44`,
        color: isNext ? '#fff' : '#475569',
      }}
      aria-hidden
    >
      {withLetters ? char.toUpperCase() : ''}
      {BUMP_KEYS.includes(char) && (
        <span className="absolute bottom-1 h-1 w-4 rounded-full bg-slate-600/60" />
      )}
    </div>
  )
}

const MemoKeyCap = memo(KeyCap)

function KeyboardImpl({ nextChar, assist, visible }: Props) {
  if (!visible) {
    return (
      <div className="flex h-40 items-center justify-center text-center text-sm text-slate-400">
        <p>
          No keyboard — you know where the keys are. <br />
          Keep your eyes up here! 👀
        </p>
      </div>
    )
  }

  const withLetters = showsLetters(assist)
  const target = nextChar ? nextChar.toLowerCase() : undefined
  const shiftSide = nextChar && needsShift(nextChar) ? shiftSideFor(nextChar) : null

  return (
    <div className="typing-keyboard flex flex-col items-center select-none">
      {KEYBOARD_ROWS.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className="keyboard-row flex"
          style={{ paddingLeft: `calc(var(--key-size) * ${rowIndex * 0.375})` }}
        >
          {rowIndex === 2 && (
            <div
              className={`keyboard-shift flex items-center justify-center rounded-lg border-2 text-xs font-bold ${
                shiftSide === 'left' ? 'key-next border-slate-700 text-white' : 'border-transparent text-slate-500'
              }`}
              style={{
                backgroundColor: shiftSide === 'left' ? FINGER_COLOURS['l-pinky'] : '#e2e8f0',
              }}
            >
              ⇧
            </div>
          )}
          {row.map((char) => (
            <MemoKeyCap
              key={char}
              char={char}
              isNext={target === char}
              withLetters={withLetters}
            />
          ))}
          {rowIndex === 2 && (
            <div
              className={`keyboard-shift flex items-center justify-center rounded-lg border-2 text-xs font-bold ${
                shiftSide === 'right' ? 'key-next border-slate-700 text-white' : 'border-transparent text-slate-500'
              }`}
              style={{
                backgroundColor: shiftSide === 'right' ? FINGER_COLOURS['r-pinky'] : '#e2e8f0',
              }}
            >
              ⇧
            </div>
          )}
        </div>
      ))}
      <div
        className={`mt-1 flex h-9 w-64 items-center justify-center rounded-lg border-2 text-xs font-semibold transition-all ${
          target === ' ' ? 'key-next border-slate-700 text-white' : 'border-transparent text-slate-500'
        }`}
        style={{ backgroundColor: target === ' ' ? FINGER_COLOURS.thumb : '#e2e8f0' }}
      >
        space
      </div>
      {nextChar && (
        <p className="mt-1 h-5 text-xs text-slate-500">{fingerHint(nextChar)}</p>
      )}
    </div>
  )
}

function fingerHint(char: string): string {
  const finger = fingerFor(char)
  return finger ? `Use your ${FINGER_NAMES[finger]}` : ''
}

export const Keyboard = memo(KeyboardImpl)

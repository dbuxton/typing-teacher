import { memo } from 'react'
import { BUMP_KEYS, FINGER_COLOURS, FINGER_NAMES, KEYBOARD_ROWS, colourFor, fingerFor, needsShift, shiftSideFor } from '../../engine/keymap'
import type { Planet } from '../data/planets'
import { showsLabel, type HelpLevel } from '../engine/help'
import type { KeyStat } from '../store/schema'

/**
 * The ship's control panel: an on-screen keyboard right under the trail, so the
 * kid's eyes drop a couple of centimetres instead of down to their hands.
 *
 * Keys are outlined in their finger's colour (the same colours as Typing
 * Teacher, from the shared key map), and the next key lights up solid. Keys the
 * planet hasn't taught yet are drawn dark — they "power up" as new planets
 * unlock them.
 */

type Props = {
  nextChar?: string
  help: HelpLevel
  planet: Planet
  keyStats: Record<string, KeyStat>
}

function Key({ char, isNext, label, powered }: { char: string; isNext: boolean; label: boolean; powered: boolean }) {
  const colour = colourFor(char)
  return (
    <div
      className={`st-key ${isNext ? 'st-key-next' : ''} ${powered ? '' : 'st-key-off'}`}
      style={{ '--key-colour': colour } as React.CSSProperties}
      data-key={char}
      data-next-key={isNext || undefined}
      aria-hidden
    >
      {label && powered ? char.toUpperCase() : ''}
      {BUMP_KEYS.includes(char) && <span className="st-key-bump" />}
    </div>
  )
}

const MemoKey = memo(Key)

function ShiftKey({ lit }: { lit: boolean }) {
  return (
    <div
      className={`st-key st-key-shift ${lit ? 'st-key-next' : ''}`}
      style={{ '--key-colour': FINGER_COLOURS['l-pinky'] } as React.CSSProperties}
      aria-hidden
    >
      ⇧
    </div>
  )
}

function NeonKeyboardImpl({ nextChar, help, planet, keyStats }: Props) {
  const target = nextChar?.toLowerCase()
  const shiftSide = nextChar && needsShift(nextChar) ? shiftSideFor(nextChar) : null
  const shiftTaught = planet.allKeys.includes('Shift')
  const finger = nextChar ? fingerFor(nextChar) : undefined

  return (
    <div className="st-keyboard" data-testid="keyboard">
      {KEYBOARD_ROWS.map((row, rowIndex) => (
        <div key={rowIndex} className="st-key-row" style={{ paddingLeft: `calc(var(--key-size) * ${rowIndex * 0.375})` }}>
          {rowIndex === 2 && shiftTaught && <ShiftKey lit={shiftSide === 'left'} />}
          {row.map((char) => (
            <MemoKey
              key={char}
              char={char}
              isNext={target === char}
              label={showsLabel(char, help, keyStats)}
              powered={planet.allKeys.includes(char)}
            />
          ))}
          {rowIndex === 2 && shiftTaught && <ShiftKey lit={shiftSide === 'right'} />}
        </div>
      ))}
      <div
        className={`st-key st-key-space ${target === ' ' ? 'st-key-next' : ''}`}
        style={{ '--key-colour': FINGER_COLOURS.thumb } as React.CSSProperties}
        data-next-key={target === ' ' || undefined}
        aria-hidden
      >
        space
      </div>
      <p className="st-finger-hint">{finger ? `Use your ${FINGER_NAMES[finger]}` : ' '}</p>
    </div>
  )
}

export const NeonKeyboard = memo(NeonKeyboardImpl)

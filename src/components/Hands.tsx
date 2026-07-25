import { memo } from 'react'
import { FINGER_COLOURS, type Finger, fingerFor, needsShift, shiftSideFor } from '../engine/keymap'

/**
 * A pair of hands with the finger that should press the next key lit up in the
 * same colour as that key. The colour match is the teaching device: the kid
 * learns "orange finger presses the orange key" and never needs to look down to
 * find it.
 */

const LEFT_FINGERS: Finger[] = ['l-pinky', 'l-ring', 'l-middle', 'l-index']
const RIGHT_FINGERS: Finger[] = ['r-index', 'r-middle', 'r-ring', 'r-pinky']

/** Finger lengths, so the hand reads as a hand rather than a comb. */
const LENGTHS: Record<Finger, number> = {
  'l-pinky': 26,
  'l-ring': 36,
  'l-middle': 40,
  'l-index': 34,
  'r-index': 34,
  'r-middle': 40,
  'r-ring': 36,
  'r-pinky': 26,
  thumb: 18,
}

function Hand({ fingers, active, side }: { fingers: Finger[]; active?: Finger; side: 'left' | 'right' }) {
  return (
    <svg width="96" height="86" viewBox="0 0 96 86" aria-hidden>
      {/* palm */}
      <rect x="14" y="52" width="68" height="28" rx="12" fill="#e2e8f0" />
      {fingers.map((finger, index) => {
        const isActive = finger === active
        const length = LENGTHS[finger]
        const x = 16 + index * 17
        return (
          <rect
            key={finger}
            x={x}
            y={56 - length}
            width="13"
            height={length + 8}
            rx="6.5"
            fill={isActive ? FINGER_COLOURS[finger] : '#e2e8f0'}
            stroke={isActive ? '#334155' : 'transparent'}
            strokeWidth="2"
          />
        )
      })}
      {/* thumb */}
      <rect
        x={side === 'left' ? 72 : 6}
        y="58"
        width="18"
        height="13"
        rx="6.5"
        fill={active === 'thumb' ? FINGER_COLOURS.thumb : '#e2e8f0'}
        stroke={active === 'thumb' ? '#334155' : 'transparent'}
        strokeWidth="2"
      />
    </svg>
  )
}

function HandsImpl({ nextChar }: { nextChar?: string }) {
  const finger = nextChar ? fingerFor(nextChar) : undefined
  const shiftSide = nextChar && needsShift(nextChar) ? shiftSideFor(nextChar) : null

  // A capital needs the opposite-hand shift, so light that pinky too.
  const leftActive =
    finger && (LEFT_FINGERS.includes(finger) || finger === 'thumb')
      ? finger
      : shiftSide === 'left'
        ? 'l-pinky'
        : undefined
  const rightActive =
    finger && (RIGHT_FINGERS.includes(finger) || finger === 'thumb')
      ? finger
      : shiftSide === 'right'
        ? 'r-pinky'
        : undefined

  return (
    <div className="flex items-end justify-center gap-6">
      <Hand fingers={LEFT_FINGERS} active={leftActive} side="left" />
      <Hand fingers={RIGHT_FINGERS} active={rightActive} side="right" />
    </div>
  )
}

export const Hands = memo(HandsImpl)

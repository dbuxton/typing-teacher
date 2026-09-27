import { memo } from 'react'
import { FINGER_COLOURS, fingerFor, needsShift, shiftSideFor, type Finger } from '../../engine/keymap'

/**
 * Two neon hands, with the finger for the next key lit in that key's colour —
 * "orange finger, orange key". Drawn as outlines so they sit quietly on the dark
 * sky until a finger lights up.
 */

const LEFT: Finger[] = ['l-pinky', 'l-ring', 'l-middle', 'l-index']
const RIGHT: Finger[] = ['r-index', 'r-middle', 'r-ring', 'r-pinky']

const LENGTH: Record<Finger, number> = {
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

const IDLE = '#2c3a78'
/** The sky colour, used to fill shapes so overlapping outlines don't show through. */
const SKY = '#070a1c'

function Hand({ fingers, active, side }: { fingers: Finger[]; active?: Finger; side: 'left' | 'right' }) {
  const colourOf = (finger: Finger) => (finger === active ? FINGER_COLOURS[finger] : undefined)
  const thumb = colourOf('thumb')
  return (
    <svg width="92" height="82" viewBox="0 0 96 86" aria-hidden className="st-hand">
      {/* Drawn back to front: thumb and fingers first, then the palm over their roots. */}
      <rect
        x={side === 'left' ? 76 : 2}
        y="54"
        width="18"
        height="14"
        rx="7"
        fill={thumb ?? SKY}
        stroke={thumb ?? IDLE}
        strokeWidth="2"
        transform={`rotate(${side === 'left' ? -25 : 25} ${side === 'left' ? 85 : 11} 61)`}
        className={thumb ? 'st-finger-lit' : undefined}
      />
      {fingers.map((finger, index) => {
        const lit = colourOf(finger)
        const length = LENGTH[finger]
        return (
          <rect
            key={finger}
            x={16 + index * 17}
            y={58 - length}
            width="13"
            height={length + 8}
            rx="6.5"
            fill={lit ?? SKY}
            stroke={lit ?? IDLE}
            strokeWidth="2"
            className={lit ? 'st-finger-lit' : undefined}
          />
        )
      })}
      <rect x="14" y="54" width="68" height="26" rx="12" fill={SKY} stroke={IDLE} strokeWidth="2" />
    </svg>
  )
}

function NeonHandsImpl({ nextChar }: { nextChar?: string }) {
  const finger = nextChar ? fingerFor(nextChar) : undefined
  // A capital takes the opposite hand's little finger on Shift, so light that too.
  const shiftSide = nextChar && needsShift(nextChar) ? shiftSideFor(nextChar) : null
  const on = (hand: Finger[], pinky: Finger, side: 'left' | 'right') =>
    finger && (hand.includes(finger) || finger === 'thumb') ? finger : shiftSide === side ? pinky : undefined

  return (
    <div className="flex items-end justify-center gap-6" data-testid="hands">
      <Hand fingers={LEFT} active={on(LEFT, 'l-pinky', 'left')} side="left" />
      <Hand fingers={RIGHT} active={on(RIGHT, 'r-pinky', 'right')} side="right" />
    </div>
  )
}

export const NeonHands = memo(NeonHandsImpl)

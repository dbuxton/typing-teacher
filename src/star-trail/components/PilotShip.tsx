import { DEFAULT_LOOK, worn, type Look, type ShipShape } from '../data/makeovers'

/**
 * The pilot's own ship, in whatever the space station has made of it: the
 * shape, the paint and the colour of the engine flame.
 *
 * Every shape is drawn side-on in the same box, nose to the right, so they all
 * fly the trail the same way. Outlines are drawn in `currentColor` (the
 * paint), and the glow comes from the same CSS drop-shadow as every sprite.
 */

type Drawing = { flame: string; body: React.ReactNode }

const HULL = '#0b1236'
const GLASS = '#ff6fd8'
const LIGHT = '#ffe36e'
const line = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinejoin: 'round' } as const
const hull = { fill: HULL, stroke: 'currentColor', strokeWidth: 2.2, strokeLinejoin: 'round' } as const

const DRAWINGS: Record<ShipShape, Drawing> = {
  dart: {
    flame: 'M6 12 L-6 16 L6 20 Z',
    body: (
      <>
        <path d="M6 16 L18 7 H42 Q56 9 62 16 Q56 23 42 25 H18 Z" {...hull} />
        <path d="M20 7 L13 1 H23 L30 7" {...line} />
        <path d="M20 25 L13 31 H23 L30 25" {...line} />
        <circle cx="45" cy="16" r="4.2" fill={HULL} stroke={GLASS} strokeWidth="2" />
      </>
    ),
  },
  rocket: {
    flame: 'M7 12.5 L-6 16 L7 19.5 Z',
    body: (
      <>
        <path d="M13 10 L7 2 H15 L22 10" {...line} />
        <path d="M13 22 L7 30 H15 L22 22" {...line} />
        <path d="M10 10 H44 Q58 11 63 16 Q58 21 44 22 H10 Z" {...hull} />
        <path d="M44 10.5 Q47.5 16 44 21.5" {...line} strokeWidth={1.6} />
        <path d="M10 12 L7 13 V19 L10 20" {...line} strokeWidth={1.6} />
        <circle cx="26" cy="16" r="3" fill={HULL} stroke={GLASS} strokeWidth="1.8" />
        <circle cx="36" cy="16" r="3" fill={HULL} stroke={GLASS} strokeWidth="1.8" />
      </>
    ),
  },
  saucer: {
    flame: 'M5 17.5 L-6 20 L5 22.5 Z',
    body: (
      <>
        <path d="M20 16 Q20 4 32 4 Q44 4 44 16" fill={HULL} stroke={GLASS} strokeWidth="2" />
        <path d="M3 19 Q32 8 61 19 Q32 30 3 19 Z" {...hull} />
        <path d="M9 19 Q32 14 55 19" {...line} strokeWidth={1.4} opacity={0.7} />
        {[13, 22.5, 32, 41.5, 51].map((x) => (
          <circle key={x} cx={x} cy={x === 32 ? 23.5 : x === 22.5 || x === 41.5 ? 22.8 : 21.4} r="1.5" fill={LIGHT} />
        ))}
      </>
    ),
  },
  shuttle: {
    flame: 'M5 14.5 L-7 17.5 L5 20.5 Z',
    body: (
      <>
        <path d="M9 12 L5 2 H12 L22 12" {...line} />
        <path d="M8 12 H46 Q58 12 63 18 Q58 23 46 23 H8 Z" {...hull} />
        <path d="M20 23 L38 23 L48 30 H26 Z" {...hull} strokeWidth={2} />
        <path d="M48 14.5 H55 L58.5 17.5 H48 Z" fill={HULL} stroke={GLASS} strokeWidth="1.6" />
        <path d="M8 14 L5 13.5 V21.5 L8 21" {...line} strokeWidth={1.6} />
        <path d="M14 17.5 H40" {...line} strokeWidth={1.2} opacity={0.6} />
      </>
    ),
  },
  cruiser: {
    flame: 'M3 14.5 L-8 17 L3 19.5 Z',
    body: (
      <>
        <path d="M28 8 V3" {...line} strokeWidth={1.5} />
        <circle cx="28" cy="2.6" r="1.6" fill={LIGHT} />
        <path d="M14 14 L20 8 H36 L42 14" {...hull} strokeWidth={2} />
        <path d="M8 20 L12 26 H32 L36 20" {...hull} strokeWidth={2} />
        <path d="M2 14 H38 L63 17 L38 20 H2 Z" {...hull} />
        {[23, 28, 33].map((x) => (
          <circle key={x} cx={x} cy="11" r="1.3" fill={GLASS} />
        ))}
        <path d="M44 17 H56" {...line} strokeWidth={1.2} opacity={0.6} />
      </>
    ),
  },
}

export function ShipSprite({
  size = 64,
  flame = true,
  look = DEFAULT_LOOK,
  tint,
  className = '',
}: {
  size?: number
  flame?: boolean
  look?: Look
  /** Paint over the pilot's own colour (the tow screen's amber, say). */
  tint?: string
  className?: string
}) {
  const paint = worn(look, 'paint')
  const shape = worn(look, 'ship').shape
  const exhaust = worn(look, 'flame')
  const drawing = DRAWINGS[shape]
  const rainbow = paint.rainbow && !tint
  return (
    <svg
      width={size}
      height={size / 2}
      viewBox="-8 0 72 32"
      className={`st-glow ${rainbow ? 'st-rainbow-colour' : ''} ${className}`}
      style={{ color: tint ?? paint.colour }}
      aria-hidden
      data-ship={shape}
      data-paint={paint.id}
    >
      {flame && (
        <path
          className={`st-flame ${exhaust.rainbow ? 'st-rainbow-fill' : ''}`}
          d={drawing.flame}
          fill={exhaust.colour}
          stroke={exhaust.tip}
          strokeWidth="1"
          data-flame={exhaust.id}
        />
      )}
      {drawing.body}
    </svg>
  )
}

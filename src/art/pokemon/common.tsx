/**
 * Shared bits for the Pokémon drawings. Every form is drawn in the same 64×64
 * box with the same outline weight, so a team of them reads as one set.
 *
 * The style is deliberately chunky: thick outlines and flat fills survive being
 * shown at 40px in a garden-sized grid, where fine detail turns to mush.
 */

export const INK = '#1f2937'

/** Spread onto any shape that should get the standard outline. */
export const ink = {
  stroke: INK,
  strokeWidth: 2,
  strokeLinejoin: 'round' as const,
  strokeLinecap: 'round' as const,
}

/** A glossy cartoon eye: dark oval, optional coloured iris, white highlight. */
export function Eye({
  x,
  y,
  r = 3,
  iris,
}: {
  x: number
  y: number
  r?: number
  iris?: string
}) {
  return (
    <g>
      <ellipse cx={x} cy={y} rx={r * 0.85} ry={r} fill={INK} />
      {iris && <ellipse cx={x} cy={y + r * 0.25} rx={r * 0.55} ry={r * 0.6} fill={iris} />}
      <circle cx={x - r * 0.3} cy={y - r * 0.4} r={r * 0.32} fill="#fff" />
    </g>
  )
}

/** A small curved smile. */
export function Smile({ x, y, w = 4 }: { x: number; y: number; w?: number }) {
  return <path d={`M${x - w} ${y} Q${x} ${y + w * 0.8} ${x + w} ${y}`} fill="none" {...ink} strokeWidth={1.5} />
}

import { memo } from 'react'
import { PLANETS } from '../data/planets'
import { SHIP_SHAPES, SHIP_VIEWBOX } from './shipShapes'

/**
 * The Lost Ship blueprint. Each planet's part is three segments, lit one per
 * piece found. `highlight` makes one planet's part pulse — the piece just found.
 */
function LostShipArtImpl({
  pieces,
  highlight,
  size = 360,
  flying = false,
}: {
  pieces: Record<number, number>
  highlight?: number
  size?: number
  /** Everything glows and the star drive fires: the ending. */
  flying?: boolean
}) {
  const found = PLANETS.reduce((sum, planet) => sum + Math.min(3, pieces[planet.id] ?? 0), 0)
  return (
    <svg
      width={size}
      height={(size * 220) / 400}
      viewBox={SHIP_VIEWBOX}
      role="img"
      aria-label={`The Lost Ship: ${found} of ${PLANETS.length * 3} pieces found`}
      className={flying ? 'st-ship-flying' : undefined}
      data-testid="lost-ship"
    >
      {PLANETS.map((planet) => {
        const lit = flying ? 3 : Math.min(3, pieces[planet.id] ?? 0)
        return (
          <g key={planet.id} className={highlight === planet.id ? 'st-part-new' : undefined}>
            {SHIP_SHAPES[planet.partId].map((d, index) =>
              index < lit ? (
                <path
                  key={index}
                  d={d}
                  fill="none"
                  stroke={planet.hue}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ filter: `drop-shadow(0 0 4px ${planet.hue})` }}
                  data-lit
                />
              ) : (
                <path
                  key={index}
                  d={d}
                  fill="none"
                  stroke="#2a3470"
                  strokeWidth="2"
                  strokeDasharray="4 5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ),
            )}
          </g>
        )
      })}
    </svg>
  )
}

export const LostShipArt = memo(LostShipArtImpl)

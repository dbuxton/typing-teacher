import { memo, useMemo } from 'react'
import { makeRng } from '../../engine/rng'

/**
 * The sky behind everything. Seeded, so the stars don't jump about between
 * renders. Darker space (further planets, bigger ships) means fewer, fainter
 * stars — the darkness is something you can see, not just a number.
 */
function StarfieldImpl({ darkness = 0, seed = 11 }: { darkness?: number; seed?: number }) {
  const stars = useMemo(() => {
    const rng = makeRng(seed)
    return Array.from({ length: 120 }, () => ({
      x: rng() * 100,
      y: rng() * 100,
      size: 1 + rng() * 2,
      delay: rng() * 6,
      brightness: 0.35 + rng() * 0.65,
    }))
  }, [seed])

  // Each step of darkness hides one star in ten and dulls the rest.
  const hidden = Math.min(7, Math.max(0, darkness))
  const dull = Math.max(0.3, 1 - darkness * 0.1)

  return (
    <div className="st-starfield" aria-hidden>
      {stars.map((star, index) =>
        index % 10 < hidden ? null : (
          <span
            key={index}
            className="st-star"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
              opacity: star.brightness * dull,
              animationDelay: `${star.delay}s`,
            }}
          />
        ),
      )}
    </div>
  )
}

export const Starfield = memo(StarfieldImpl)

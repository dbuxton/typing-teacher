import { useId } from 'react'
import { TIERS, type Player } from '../data/rewards/football'

/**
 * A player's trading card, drawn in SVG. No face and no crest — a real person's
 * likeness and a club's badge aren't ours to draw — so the card is a shirt in
 * club colours with her initial, plus name, position and club.
 *
 * The frame is what levels up: Academy (training green) → Bronze → Silver → Gold →
 * Legend (gold with a holographic shimmer and stars). Each tier has to read as
 * better than the last at a glance, at the size of a garden plot.
 */

const FRAMES = [
  // Academy: training-pitch green, so it can't be mistaken for Silver.
  { edge: '#16a34a', light: '#f0fdf4', dark: '#bbf7d0', ink: '#14532d', stars: 0 },
  { edge: '#9a5b2c', light: '#f3c79b', dark: '#c4834f', ink: '#4a2a12', stars: 1 },
  { edge: '#6b7280', light: '#f8fafc', dark: '#b8c0cc', ink: '#1f2937', stars: 2 },
  { edge: '#a16207', light: '#fde68a', dark: '#eab308', ink: '#422006', stars: 3 },
  // Legend: gold, plus the holographic sheen layered on top.
  { edge: '#7c2d12', light: '#fef3c7', dark: '#f59e0b', ink: '#431407', stars: 5 },
]

export function PlayerCard({
  player,
  tier,
  size = 64,
  className,
}: {
  player: Player
  tier: number
  /** Height in px; the card is narrower than it is tall. */
  size?: number
  className?: string
}) {
  // React's ids contain characters that aren't safe inside url(#...) references.
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const level = Math.min(Math.max(tier, 0), TIERS.length - 1)
  const frame = FRAMES[level]
  const legend = level === TIERS.length - 1
  const [shirt, trim] = player.club.colours
  // Long surnames get a smaller font so they stay on the card.
  const nameSize = player.cardName.length > 8 ? 6.2 : 7.5

  return (
    <svg
      viewBox="0 0 64 88"
      width={(size * 64) / 88}
      height={size}
      className={className}
      role="img"
      aria-label={`${player.fullName}, ${TIERS[level]} card`}
    >
      <defs>
        <linearGradient id={`bg${uid}`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor={frame.light} />
          <stop offset="1" stopColor={frame.dark} />
        </linearGradient>
        {legend && (
          <linearGradient id={`holo${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f472b6" stopOpacity="0.55" />
            <stop offset="0.3" stopColor="#facc15" stopOpacity="0.1" />
            <stop offset="0.5" stopColor="#38bdf8" stopOpacity="0.5" />
            <stop offset="0.7" stopColor="#a3e635" stopOpacity="0.1" />
            <stop offset="1" stopColor="#c084fc" stopOpacity="0.55" />
          </linearGradient>
        )}
        <clipPath id={`clip${uid}`}>
          <rect x="3" y="3" width="58" height="82" rx="7" />
        </clipPath>
      </defs>

      {/* Card body and frame */}
      <rect x="1.5" y="1.5" width="61" height="85" rx="8" fill={frame.edge} />
      <rect x="3" y="3" width="58" height="82" rx="7" fill={`url(#bg${uid})`} />
      {legend && (
        <rect
          className="holo"
          x="3"
          y="3"
          width="58"
          height="82"
          rx="7"
          fill={`url(#holo${uid})`}
          clipPath={`url(#clip${uid})`}
        />
      )}

      {/* Position, top left */}
      <text x="8" y="14" fontSize="8" fontWeight="800" fill={frame.ink} fontFamily="Nunito, sans-serif">
        {player.position}
      </text>

      {/* Tier stars, top right */}
      {Array.from({ length: frame.stars }, (_, i) => (
        <text
          key={i}
          x={56 - (i % 3) * 6.5}
          y={i < 3 ? 13 : 20}
          fontSize="6.5"
          textAnchor="middle"
          fill={legend ? '#b45309' : frame.ink}
        >
          ★
        </text>
      ))}

      {/* The shirt */}
      <g transform="translate(32 42)">
        <path
          d="M-9 -16 L-19 -11 L-24 -1 L-17 3 L-14 -3 L-14 18 L14 18 L14 -3 L17 3 L24 -1 L19 -11 L9 -16 Q0 -10 -9 -16 Z"
          fill={shirt}
          stroke={frame.ink}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M-9 -16 Q0 -10 9 -16" fill="none" stroke={trim} strokeWidth="2.2" />
        <text
          y="9"
          fontSize="17"
          fontWeight="900"
          textAnchor="middle"
          fill={trim}
          fontFamily="Nunito, sans-serif"
        >
          {player.cardName[0]}
        </text>
      </g>

      {/* Name plate */}
      <rect x="6" y="63" width="52" height="11" rx="3" fill="#ffffff" opacity="0.75" />
      <text
        x="32"
        y="71"
        fontSize={nameSize}
        fontWeight="900"
        textAnchor="middle"
        fill={frame.ink}
        fontFamily="Nunito, sans-serif"
      >
        {player.cardName.toUpperCase()}
      </text>
      <text
        x="32"
        y="81"
        fontSize="5.5"
        fontWeight="700"
        textAnchor="middle"
        fill={frame.ink}
        fontFamily="Nunito, sans-serif"
      >
        {player.club.name} · {TIERS[level]}
      </text>
    </svg>
  )
}

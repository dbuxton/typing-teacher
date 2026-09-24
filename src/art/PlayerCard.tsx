import type { CSSProperties } from 'react'
import { TIERS, type Player } from '../data/rewards/football'
import { rewardImage } from './assets'

/** One illustrated portrait per player, with a live frame that levels up. */
const FRAMES = [
  { edge: '#16a34a', light: '#f0fdf4', dark: '#bbf7d0', ink: '#14532d', stars: 0 },
  { edge: '#9a5b2c', light: '#f3c79b', dark: '#c4834f', ink: '#4a2a12', stars: 1 },
  { edge: '#6b7280', light: '#f8fafc', dark: '#b8c0cc', ink: '#1f2937', stars: 2 },
  { edge: '#a16207', light: '#fde68a', dark: '#eab308', ink: '#422006', stars: 3 },
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
  const level = Math.min(Math.max(tier, 0), TIERS.length - 1)
  const frame = FRAMES[level]
  const style = {
    width: (size * 64) / 88,
    '--card-edge': frame.edge,
    '--card-light': frame.light,
    '--card-dark': frame.dark,
    '--card-ink': frame.ink,
  } as CSSProperties

  return (
    <span
      className={`player-card ${level === TIERS.length - 1 ? 'player-card-legend' : ''} ${className ?? ''}`}
      style={style}
      role="img"
      aria-label={`${player.fullName}, ${TIERS[level]} card`}
    >
      <span className="player-card-surface" aria-hidden="true">
        <img
          className="player-card-portrait"
          src={rewardImage(`football/${player.id}`)}
          alt=""
          decoding="async"
          draggable={false}
        />
        {level === TIERS.length - 1 && <span className="player-card-sheen holo" />}
        <span className="player-card-position">{player.position}</span>
        <span className="player-card-stars">{'★'.repeat(frame.stars)}</span>
        <span className={`player-card-name ${player.cardName.length > 8 ? 'player-card-name-long' : ''}`}>
          {player.cardName}
        </span>
        <span className="player-card-club">{player.club.name} · {TIERS[level]}</span>
      </span>
    </span>
  )
}

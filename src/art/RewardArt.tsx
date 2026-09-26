import { rewardStage, type ThemeId } from '../data/rewards'
import { playerById } from '../data/rewards/football'
import { eggColour, EGG_PREFIX } from '../data/rewards/pokemon'
import { PlayerCard } from './PlayerCard'
import { Egg } from './pokemon/egg'
import { EGG_IMAGES, GARDEN_IMAGES, POKEMON_IMAGES, rewardImage } from './assets'

/**
 * Draws one collected thing at one stage, whatever the theme: a painted plant, a
 * Pokémon, animal, dinosaur or a player's card. Every screen goes through here, so a theme's art
 * only has to be wired up once.
 *
 * Anything unrecognised (a kind from an old save, say) draws the theme's
 * starting form rather than nothing — a kid should never see a blank.
 */
export function RewardArt({
  theme,
  kindId,
  stage,
  size = 40,
  className,
}: {
  theme: ThemeId
  kindId: string
  stage: number
  /** Height in px. */
  size?: number
  /** Lets the art shrink into a small tile. */
  className?: string
}) {
  const current = rewardStage(theme, kindId, stage)

  if (theme === 'dinosaurs') {
    return (
      <RewardImage
        src={rewardImage(`dinosaurs/${current?.id ?? 'egg'}`)}
        alt={current?.name ?? 'Dinosaur egg'}
        size={size}
        scale={[0.7, 0.75, 0.875, 1][Math.min(Math.max(stage, 0), 3)]}
        className={className}
      />
    )
  }

  if (theme === 'animals') {
    return (
      <RewardImage
        src={rewardImage(`animals/${current?.id ?? 'robin-baby'}`)}
        alt={current?.name ?? 'Baby animal'}
        size={size}
        scale={0.75 + 0.125 * Math.min(Math.max(stage, 0), 2)}
        className={className}
      />
    )
  }

  if (theme === 'football') {
    const player = playerById(kindId)
    if (player) return <PlayerCard player={player} tier={stage} size={size} className={className} />
    return <Emoji size={size}>⚽</Emoji>
  }

  if (theme === 'pokemon') {
    const id = current?.id ?? `${EGG_PREFIX}unknown`
    if (current && id.startsWith(EGG_PREFIX) && EGG_IMAGES.has(kindId)) {
      return (
        <RewardImage
          src={rewardImage(`eggs/${kindId}`)}
          alt={current.name}
          size={size}
          className={className}
        />
      )
    }
    if (current && POKEMON_IMAGES.has(id)) {
      return (
        <RewardImage
          src={rewardImage(`pokemon/${id}`)}
          alt={current.name}
          size={size}
          className={className}
        />
      )
    }
    return (
      <svg viewBox="0 0 64 64" width={size} height={size} className={className} role="img" aria-label={current?.name ?? 'Egg'}>
        <Egg colour={eggColour(id) ?? '#cbd5e1'} />
      </svg>
    )
  }

  return (
    <RewardImage
      src={rewardImage(`garden/${GARDEN_IMAGES[current?.id ?? '🌱'] ?? 'seedling'}`)}
      alt={current?.name ?? 'Seedling'}
      size={size}
      className={className}
    />
  )
}

function RewardImage({ src, alt, size, scale = 1, className }: { src: string; alt: string; size: number; scale?: number; className?: string }) {
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      style={scale === 1 ? undefined : { transform: `scale(${scale})` }}
      className={`reward-image ${className ?? ''}`}
      decoding="async"
      draggable={false}
    />
  )
}

function Emoji({ size, children }: { size: number; children: string }) {
  // Only used for an unrecognised footballer from an old save.
  return (
    <span style={{ fontSize: size * 0.85, lineHeight: 1 }}>
      {children}
    </span>
  )
}

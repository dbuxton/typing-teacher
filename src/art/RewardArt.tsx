import { rewardStage, type ThemeId } from '../data/rewards'
import { playerById } from '../data/rewards/football'
import { eggColour, EGG_PREFIX } from '../data/rewards/pokemon'
import { PlayerCard } from './PlayerCard'
import { Egg, FORMS } from './pokemon'

/**
 * Draws one collected thing at one stage, whatever the theme: an emoji plant, a
 * Pokémon, or a player's card. Every screen goes through here, so a theme's art
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
  /** For the SVG themes, e.g. to let the art shrink into a small tile. */
  className?: string
}) {
  const current = rewardStage(theme, kindId, stage)

  if (theme === 'football') {
    const player = playerById(kindId)
    if (player) return <PlayerCard player={player} tier={stage} size={size} className={className} />
    return <Emoji size={size}>⚽</Emoji>
  }

  if (theme === 'pokemon') {
    const id = current?.id ?? `${EGG_PREFIX}unknown`
    const Form = FORMS[id]
    return (
      <svg viewBox="0 0 64 64" width={size} height={size} className={className} role="img" aria-label={current?.name ?? 'Egg'}>
        {Form ? <Form /> : <Egg colour={eggColour(id) ?? '#cbd5e1'} />}
      </svg>
    )
  }

  return <Emoji size={size}>{current?.id ?? '🌱'}</Emoji>
}

function Emoji({ size, children }: { size: number; children: string }) {
  // Emoji glyphs sit a little small for their font size; 0.85 lines them up
  // with the SVG themes at the same `size`.
  return (
    <span style={{ fontSize: size * 0.85, lineHeight: 1 }}>
      {children}
    </span>
  )
}

import { ROBOT_LEVELS, SCANNER_VISIBLE, SHIELD_PIPS, type TrackId } from '../engine/balance'
import { PLANET_COUNT, getPlanet } from './planets'

/** How the space station describes what it sells. Prices and effects live in balance.ts. */
export type TrackInfo = {
  name: string
  icon: string
  blurb: string
  /** What owning this level gives you, in a few words. */
  effect: (level: number) => string
}

export const TRACK_INFO: Record<TrackId, TrackInfo> = {
  scanner: {
    name: 'Scanner',
    icon: '🔭',
    blurb: 'See further along the trail — read ahead like a real pilot.',
    effect: (level) => `Shows ${SCANNER_VISIBLE[level]} letters at a time`,
  },
  shields: {
    name: 'Shields',
    icon: '🛡️',
    blurb: 'Soak up slips before they cost any fuel.',
    effect: (level) => `${SHIELD_PIPS[level]} shield${SHIELD_PIPS[level] === 1 ? '' : 's'} every hunt`,
  },
  robot: {
    name: 'Robot sidekick',
    icon: '🤖',
    blurb: 'Grabs stardust sparkles when you press ↑, and beeps when the piece is near.',
    effect: (level) =>
      level === 0
        ? 'No robot yet'
        : `Catches for ${ROBOT_LEVELS[level - 1].catchMs / 1000} seconds, ${ROBOT_LEVELS[level - 1].lootPerCatch}× stardust`,
  },
  engines: {
    name: 'Engines',
    icon: '🚀',
    blurb: 'Bigger engines fly you to the next planet, with new keys to learn.',
    effect: (level) => (level + 1 > PLANET_COUNT ? 'Every planet in reach' : `Reach ${getPlanet(level + 1).name}`),
  },
}

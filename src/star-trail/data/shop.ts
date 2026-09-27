import {
  FLARE_LETTERS,
  MAGNET_BONUS,
  ROBOT_LEVELS,
  SCANNER_VISIBLE,
  SHIELD_PIPS,
  TANK_CANS,
  type GadgetId,
  type TrackId,
} from '../engine/balance'
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
  tank: {
    name: 'Fuel tank',
    icon: '🛢️',
    blurb: 'A bigger tank: more slips before you run dry.',
    effect: (level) => `${TANK_CANS[level]} fuel cans`,
  },
  map: {
    name: 'Star map',
    icon: '🗺️',
    blurb: 'Know how far away the piece is while you fly.',
    effect: (level) =>
      level === 0
        ? 'No map yet'
        : level === 1
          ? 'Counts the words left to the piece'
          : 'Counts the words left, and shows the shape of each one',
  },
  magnet: {
    name: 'Stardust magnet',
    icon: '🧲',
    blurb: 'Pulls extra stardust out of every letter you type.',
    effect: (level) => (level === 0 ? 'No magnet yet' : `+${Math.round(MAGNET_BONUS[level] * 100)}% stardust from every letter`),
  },
  engines: {
    name: 'Engines',
    icon: '🚀',
    blurb: 'Bigger engines fly you to the next planet, with new keys to learn.',
    effect: (level) => (level + 1 > PLANET_COUNT ? 'Every planet in reach' : `Reach ${getPlanet(level + 1).name}`),
  },
}

/** Gadgets: loaded onto the ship at the station, used up on the next hunt. */
export const GADGET_INFO: Record<GadgetId, { name: string; icon: string; blurb: string }> = {
  fuel: { name: 'Emergency fuel', icon: '🥫', blurb: 'An extra fuel can for your next hunt.' },
  shield: { name: 'Shield booster', icon: '💠', blurb: 'An extra shield for your next hunt.' },
  flare: {
    name: 'Star flare',
    icon: '🎇',
    blurb: `Lights up the dark: see ${FLARE_LETTERS} more letters on your next hunt.`,
  },
  clover: { name: 'Lucky clover', icon: '🍀', blurb: 'Double stardust from every letter on your next hunt.' },
}

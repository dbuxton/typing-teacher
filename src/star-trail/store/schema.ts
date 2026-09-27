import { PLANET_COUNT } from '../data/planets'
import {
  HISTORY_LIMIT,
  NO_UPGRADES,
  PIECES_PER_PLANET,
  RECENT_LIMIT,
  ROBOT_LEVELS,
  SCANNER_LEVELS,
  SHIELD_LEVELS,
  START_SLIP_RATE,
  TRACKS,
  type TrackId,
  type Upgrades,
} from '../engine/balance'
import { isHelpLevel, type HelpLevel } from '../engine/help'

/**
 * Star Trail's save file: its own, under its own key, never touching Typing
 * Teacher's. Versioned from day one so a later change can migrate old saves
 * instead of wiping a kid's ship.
 *
 * `sanitizeSave` is the one gate every save passes through on its way in. It
 * never throws, clamps every number to something the game can use, and keeps
 * fields it doesn't recognise — so a save written by a NEWER build (say, after a
 * rollback) is carried forward, not wiped. That is the lesson from Typing
 * Teacher's schema, which starts fresh when it sees a newer version.
 */

export const SAVE_VERSION = 1
/** Where the save lives. Deliberately not versioned: the version is inside it. */
export const STORAGE_KEY = 'star-trail.save.v1'

export type KeyStat = { attempts: number; errors: number }

/** One hunt, remembered. The help ladder and the navigator check read these. */
export type HuntRecord = {
  planet: number
  result: 'found' | 'towed' | 'aborted'
  practice: boolean
  /** Letters the pilot had a first try at. */
  letters: number
  slips: number
  accuracy: number
  /** First tries (and slips) on the planet's new keys. */
  newKeyTries: number
  newKeySlips: number
  stardust: number
  help: HelpLevel
  date: string
}

export type Pilot = {
  id: string
  name: string
  avatar: string
  createdAt: string
  /** The planet the pilot is hunting on (may be an earlier one, for practice). */
  planet: number
  /** The furthest planet reached. */
  highestPlanet: number
  /** Pieces found on each planet, 0 to 3. */
  pieces: Record<number, number>
  stardust: number
  /** All stardust ever earned — for the pilot card, never spent. */
  stardustEarned: number
  upgrades: Upgrades
  help: HelpLevel
  /** Running estimate of the share of letters that slip. Sets trail length. */
  slipRate: number
  /** Tows in a row, for the safety nets. */
  failStreak: number
  keyStats: Record<string, KeyStat>
  /** Messages flown recently on each planet, so they aren't repeated. */
  recent: Record<number, string[]>
  huntsFlown: number
  huntsOnPlanet: Record<number, number>
  timesTowed: number
  /** Planets whose "new keys" intro has been shown. */
  introsSeen: number[]
  endingSeen: boolean
  sound: boolean
  history: HuntRecord[]
}

export type SaveFile = {
  version: number
  pilots: Pilot[]
  activePilotId: string | null
}

export function emptySave(): SaveFile {
  return { version: SAVE_VERSION, pilots: [], activePilotId: null }
}

/** Local calendar date as yyyy-mm-dd. */
export function today(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 8)
}

export function makePilot(name: string, avatar: string): Pilot {
  return {
    id: `pilot_${name.toLowerCase().replace(/[^a-z0-9]/g, '')}_${randomSuffix()}`,
    name,
    avatar,
    createdAt: today(),
    planet: 1,
    highestPlanet: 1,
    pieces: {},
    stardust: 0,
    stardustEarned: 0,
    upgrades: { ...NO_UPGRADES },
    help: 'letters',
    slipRate: START_SLIP_RATE,
    failStreak: 0,
    keyStats: {},
    recent: {},
    huntsFlown: 0,
    huntsOnPlanet: {},
    timesTowed: 0,
    introsSeen: [],
    endingSeen: false,
    sound: true,
    history: [],
  }
}

/** The highest level each station track goes to. */
export function maxLevel(track: TrackId): number {
  switch (track) {
    case 'scanner':
      return SCANNER_LEVELS.length
    case 'shields':
      return SHIELD_LEVELS.length
    case 'robot':
      return ROBOT_LEVELS.length
    case 'engines':
      return PLANET_COUNT - 1
  }
}

// ─── Cleaning up whatever came out of storage ──────────────────────────────

type Loose = Record<string, unknown>

const isObject = (value: unknown): value is Loose =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

function int(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.min(Math.max(Math.round(value), min), max)
}

function fraction(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.min(Math.max(value, 0), 1)
}

function text(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.length > 0 ? value : fallback
}

/** A per-planet record of whole numbers, keeping only real planets. */
function perPlanet(value: unknown, max: number): Record<number, number> {
  const out: Record<number, number> = {}
  if (!isObject(value)) return out
  for (let planet = 1; planet <= PLANET_COUNT; planet++) {
    const n = int(value[planet], 0, max, 0)
    if (n > 0) out[planet] = n
  }
  return out
}

function keyStats(value: unknown): Record<string, KeyStat> {
  const out: Record<string, KeyStat> = {}
  if (!isObject(value)) return out
  for (const [key, stat] of Object.entries(value)) {
    if (!isObject(stat)) continue
    const attempts = int(stat.attempts, 0, Number.MAX_SAFE_INTEGER, 0)
    out[key] = { attempts, errors: int(stat.errors, 0, attempts, 0) }
  }
  return out
}

function recent(value: unknown): Record<number, string[]> {
  const out: Record<number, string[]> = {}
  if (!isObject(value)) return out
  for (let planet = 1; planet <= PLANET_COUNT; planet++) {
    const list = value[planet]
    if (Array.isArray(list)) {
      const strings = list.filter((item): item is string => typeof item === 'string')
      if (strings.length > 0) out[planet] = strings.slice(-RECENT_LIMIT)
    }
  }
  return out
}

function huntRecord(value: unknown): HuntRecord | null {
  if (!isObject(value)) return null
  const result = value.result === 'found' || value.result === 'towed' ? value.result : 'aborted'
  const letters = int(value.letters, 0, 10_000, 0)
  const newKeyTries = int(value.newKeyTries, 0, 10_000, 0)
  return {
    ...value,
    planet: int(value.planet, 1, PLANET_COUNT, 1),
    result,
    practice: value.practice === true,
    letters,
    slips: int(value.slips, 0, letters, 0),
    accuracy: fraction(value.accuracy, 1),
    newKeyTries,
    newKeySlips: int(value.newKeySlips, 0, newKeyTries, 0),
    stardust: int(value.stardust, 0, 1_000_000, 0),
    help: isHelpLevel(value.help) ? value.help : 'letters',
    date: text(value.date, today()),
  }
}

export function sanitizePilot(value: unknown): Pilot | null {
  if (!isObject(value)) return null
  const base = makePilot(text(value.name, 'Pilot'), text(value.avatar, '🧑‍🚀'))
  const highestPlanet = int(value.highestPlanet, 1, PLANET_COUNT, 1)

  const upgradesIn = isObject(value.upgrades) ? value.upgrades : {}
  const upgrades = { ...NO_UPGRADES }
  for (const track of TRACKS) upgrades[track] = int(upgradesIn[track], 0, maxLevel(track), 0)
  // Reaching a planet means an engine got you there.
  upgrades.engines = Math.max(upgrades.engines, highestPlanet - 1)

  const introsSeen = Array.isArray(value.introsSeen)
    ? [...new Set(value.introsSeen.filter((n): n is number => Number.isInteger(n) && n >= 1 && n <= PLANET_COUNT))]
    : []

  const history = Array.isArray(value.history)
    ? value.history.map(huntRecord).filter((h): h is HuntRecord => h !== null).slice(-HISTORY_LIMIT)
    : []

  const stardust = int(value.stardust, 0, Number.MAX_SAFE_INTEGER, 0)

  return {
    // Unknown fields ride along untouched, in case a newer build wrote them.
    ...value,
    id: text(value.id, base.id),
    name: base.name,
    avatar: base.avatar,
    createdAt: text(value.createdAt, base.createdAt),
    planet: int(value.planet, 1, highestPlanet, 1),
    highestPlanet,
    pieces: perPlanet(value.pieces, PIECES_PER_PLANET),
    stardust,
    stardustEarned: int(value.stardustEarned, stardust, Number.MAX_SAFE_INTEGER, stardust),
    upgrades,
    help: isHelpLevel(value.help) ? value.help : base.help,
    slipRate: fraction(value.slipRate, base.slipRate),
    failStreak: int(value.failStreak, 0, 1000, 0),
    keyStats: keyStats(value.keyStats),
    recent: recent(value.recent),
    huntsFlown: int(value.huntsFlown, 0, Number.MAX_SAFE_INTEGER, 0),
    huntsOnPlanet: perPlanet(value.huntsOnPlanet, Number.MAX_SAFE_INTEGER),
    timesTowed: int(value.timesTowed, 0, Number.MAX_SAFE_INTEGER, 0),
    introsSeen,
    endingSeen: value.endingSeen === true,
    sound: value.sound !== false,
    history,
  }
}

/** Turn anything at all into a usable save. Never throws; never wipes real pilots. */
export function sanitizeSave(value: unknown): SaveFile {
  if (!isObject(value)) return emptySave()
  const seen = new Set<string>()
  const pilots: Pilot[] = []
  for (const raw of Array.isArray(value.pilots) ? value.pilots : []) {
    const pilot = sanitizePilot(raw)
    if (!pilot) continue
    // Two pilots sharing an id would share one ship; give the second its own.
    const id = seen.has(pilot.id) ? makePilot(pilot.name, pilot.avatar).id : pilot.id
    seen.add(id)
    pilots.push({ ...pilot, id })
  }
  const activePilotId = pilots.some((p) => p.id === value.activePilotId) ? (value.activePilotId as string) : null
  return { ...value, version: SAVE_VERSION, pilots, activePilotId }
}

/**
 * Bring a stored save up to the current version. There's nothing to convert
 * yet; when there is, add a step here — and make it safe to run twice, because
 * the storage layer writes a migrated save straight back.
 */
export function migrate(persisted: unknown, version: number): SaveFile {
  void version
  return sanitizeSave(persisted)
}

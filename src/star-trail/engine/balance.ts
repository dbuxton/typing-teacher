/**
 * Every number that decides how Star Trail feels, in one place.
 *
 * They were tuned by simulating hundreds of kids at different accuracies through
 * the whole galaxy; `journey.test.ts` replays that simulation against the real
 * engine, so a change here that makes the game unfair (or unfailable) turns a
 * test red rather than a kid off.
 */

/** Pieces per planet — one ship part is made of three. */
export const PIECES_PER_PLANET = 3

// ─── Fuel and shields ──────────────────────────────────────────────────────

/** Fuel cans in the tank. Fuel only ever drops on a mistake, never over time. */
export const FUEL_TANK = 5
/** Clean letters in a row that win one shield back (at most once per hunt). */
export const SHIELD_REGEN_STREAK = 12
/** Misses on one letter before "→ to skip" is offered. A kid is never trapped. */
export const MISSES_BEFORE_SKIP = 5
/**
 * A pilot's first hunts are training flights: the tank can't run dry. Without
 * this, most very shaky beginners were towed within three hunts — a rotten
 * first impression of a game they've only just met.
 */
export const TRAINING_FLIGHTS = 3

// ─── How shaky the pilot is (the skill estimate) ───────────────────────────

/** A new pilot is assumed to slip on one letter in five until shown otherwise. */
export const START_SLIP_RATE = 0.2
export const MIN_SLIP_RATE = 0.03
/**
 * The estimate rises fast and falls slowly: a bad hunt shortens the next trail
 * straight away, while longer trails have to be earned over several.
 */
export const SLIP_RATE_RISE = 0.5
export const SLIP_RATE_FALL = 0.25
/** New keys cause a burst of slips, so be careful for the first hunts on a planet. */
export const NEW_PLANET_CAUTION = 0.04
export const NEW_PLANET_CAUTION_HUNTS = 2
/** A hunt abandoned before this many letters says nothing about skill. */
export const MIN_LETTERS_TO_LEARN_FROM = 5

// ─── Trail length ──────────────────────────────────────────────────────────

/**
 * Trails are capped so the expected slips use about two thirds of what the
 * pilot can absorb. At a factor of 2 almost nobody was ever towed — which isn't
 * the "you can run out of fuel" game that was asked for; 1.5 makes tows real but
 * occasional. Raise it for a gentler game, lower it for a scarier one.
 */
export const SAFETY_FACTOR = 1.5
/** Trail length multiplier after 0, 1 or 2 tows in a row (3+ gets the shortest trail). */
export const TOW_STREAK_SHRINK = [1, 0.75, 0.6]
/** Spare fuel cans handed over after 0, 1, 2 or 3+ tows in a row. */
export const TOW_STREAK_SPARES = [0, 0, 1, 2]
/** Most spare cans Mission Control will add when even a short trail looks risky. */
export const MAX_TOP_UP = 3

// ─── The notebook's rule: helpers make the next hunt harder, but it pays more

/** Each scanner, shield, robot or fuel-tank level makes trails this many letters longer. */
export const LETTERS_PER_HELPER_LEVEL = 1.5
/** Every this-many helper levels, the pilot flies one step deeper (darker) into space… */
export const HELPER_LEVELS_PER_DEEP_STEP = 3
/** …and each step deeper pays this much more stardust per letter. */
export const DUST_BONUS_PER_DEEP_STEP = 0.1

// ─── Planets ───────────────────────────────────────────────────────────────

export type PlanetBalance = {
  /** How dark space is here: each step hides one letter the scanner could see. */
  darkness: number
  /** Trail length for the first piece, growth per piece found, and the limits. */
  trailBase: number
  trailPerPiece: number
  trailMax: number
  trailMin: number
  stardustPerLetter: number
  /** Paid for finding a piece (not for practice hunts once all three are found). */
  pieceBonus: number
  /** Paid per fuel can still in the tank when a piece is found. */
  fuelBonus: number
  /** Price of the engine upgrade that reaches the NEXT planet. */
  enginePrice: number | null
}

/**
 * Scale every engine price. Raise it for more practice on each set of keys
 * before the next planet (1.5 adds roughly two hunts per planet).
 */
export const ENGINE_PRICE_SCALE = 1

export const PLANET_BALANCE: readonly PlanetBalance[] = [
  { darkness: 0, trailBase: 12, trailPerPiece: 3, trailMax: 24, trailMin: 8, stardustPerLetter: 1, pieceBonus: 10, fuelBonus: 1, enginePrice: 100 },
  { darkness: 0, trailBase: 14, trailPerPiece: 3, trailMax: 28, trailMin: 8, stardustPerLetter: 1, pieceBonus: 12, fuelBonus: 1, enginePrice: 130 },
  { darkness: 0, trailBase: 16, trailPerPiece: 4, trailMax: 32, trailMin: 9, stardustPerLetter: 1.25, pieceBonus: 15, fuelBonus: 1, enginePrice: 170 },
  { darkness: 1, trailBase: 18, trailPerPiece: 4, trailMax: 36, trailMin: 9, stardustPerLetter: 1.25, pieceBonus: 18, fuelBonus: 2, enginePrice: 220 },
  { darkness: 1, trailBase: 20, trailPerPiece: 5, trailMax: 40, trailMin: 10, stardustPerLetter: 1.5, pieceBonus: 21, fuelBonus: 2, enginePrice: 280 },
  { darkness: 1, trailBase: 22, trailPerPiece: 5, trailMax: 44, trailMin: 10, stardustPerLetter: 1.5, pieceBonus: 25, fuelBonus: 2, enginePrice: 350 },
  { darkness: 2, trailBase: 24, trailPerPiece: 6, trailMax: 48, trailMin: 11, stardustPerLetter: 1.75, pieceBonus: 30, fuelBonus: 3, enginePrice: 430 },
  { darkness: 2, trailBase: 26, trailPerPiece: 6, trailMax: 52, trailMin: 11, stardustPerLetter: 2, pieceBonus: 35, fuelBonus: 3, enginePrice: 520 },
  { darkness: 3, trailBase: 28, trailPerPiece: 7, trailMax: 56, trailMin: 12, stardustPerLetter: 2.25, pieceBonus: 40, fuelBonus: 3, enginePrice: 620 },
  { darkness: 3, trailBase: 30, trailPerPiece: 7, trailMax: 60, trailMin: 12, stardustPerLetter: 2.5, pieceBonus: 50, fuelBonus: 4, enginePrice: null },
]

export function planetBalance(planetId: number): PlanetBalance {
  const balance = PLANET_BALANCE[planetId - 1]
  if (!balance) throw new Error(`No balance for planet ${planetId}`)
  return balance
}

// ─── The space station ─────────────────────────────────────────────────────

export type TrackId = 'scanner' | 'shields' | 'robot' | 'tank' | 'map' | 'magnet' | 'engines'
export const TRACKS: readonly TrackId[] = ['scanner', 'shields', 'robot', 'tank', 'map', 'magnet', 'engines']
/** The helpers: everything the station sells but engines, which only change where you are. */
export const HELPER_TRACKS: readonly TrackId[] = TRACKS.filter((track) => track !== 'engines')
/**
 * The helpers that make a hunt easier, and so (the notebook's rule) take the
 * pilot deeper. The star map only shows where you are, and the magnet only
 * brings stardust: "money, not something that helps you". Counting them too
 * made the shakiest simulated kids take far longer, for no help in return.
 */
export const DEEPER_TRACKS: readonly TrackId[] = ['scanner', 'shields', 'robot', 'tank']

/** A pilot's level on each station track. */
export type Upgrades = Record<TrackId, number>
export const NO_UPGRADES: Upgrades = { scanner: 0, shields: 0, robot: 0, tank: 0, map: 0, magnet: 0, engines: 0 }

export type StockLevel = {
  price: number
  /** The planet a pilot must have reached before this level is in stock. */
  stockAt: number
}

/**
 * Letters visible on the trail (including the one to type) at each scanner
 * level, before darkness takes its share. Level 0 shows just the next letter.
 */
export const SCANNER_VISIBLE = [1, 3, 5, 8, 12]
export const SCANNER_LEVELS: readonly StockLevel[] = [
  { price: 30, stockAt: 1 },
  { price: 70, stockAt: 3 },
  { price: 130, stockAt: 6 },
  { price: 220, stockAt: 8 },
]

/** Shields per hunt at each shield level. Every ship has one to start with. */
export const SHIELD_PIPS = [1, 2, 3, 4, 5]
export const SHIELD_LEVELS: readonly StockLevel[] = [
  { price: 25, stockAt: 1 },
  { price: 60, stockAt: 3 },
  { price: 110, stockAt: 5 },
  { price: 180, stockAt: 7 },
]

export type RobotLevel = StockLevel & {
  /**
   * How long a sparkle stays catchable. Typing Teacher's Sneaky Stars use
   * 1.2 s; a bought robot is a little more generous and upgrades add more.
   */
  catchMs: number
  /** Stardust per catch, as a multiple of the planet's stardust per letter. */
  lootPerCatch: number
  /** One sparkle per this many letters of trail. */
  sparkleEvery: number
}

export const ROBOT_LEVELS: readonly RobotLevel[] = [
  { price: 40, stockAt: 2, catchMs: 1500, lootPerCatch: 3, sparkleEvery: 20 },
  { price: 90, stockAt: 5, catchMs: 2000, lootPerCatch: 4, sparkleEvery: 15 },
  { price: 160, stockAt: 8, catchMs: 2500, lootPerCatch: 5, sparkleEvery: 12 },
]
/** Fuel cans in the tank at each fuel-tank level. */
export const TANK_CANS = [FUEL_TANK, 6, 7, 8]
export const TANK_LEVELS: readonly StockLevel[] = [
  { price: 50, stockAt: 2 },
  { price: 110, stockAt: 4 },
  { price: 190, stockAt: 7 },
]

/**
 * The star map. Level 1 counts the words left to the piece; level 2 also shows
 * the shape of the words still to come, as blanks — handy for pacing a long trail.
 */
export const MAP_LEVELS: readonly StockLevel[] = [
  { price: 35, stockAt: 1 },
  { price: 90, stockAt: 4 },
]

/** Extra stardust from every letter at each magnet level (added to the deep-space bonus). */
export const MAGNET_BONUS = [0, 0.1, 0.2, 0.3]
export const MAGNET_LEVELS: readonly StockLevel[] = [
  { price: 45, stockAt: 2 },
  { price: 100, stockAt: 5 },
  { price: 170, stockAt: 8 },
]

/** A pilot slipping on this share of letters or more is steered towards shields and fuel. */
export const SHAKY_SLIP_RATE = 0.12

/** Sparkles per trail stay between these, and away from the very start and end. */
export const MIN_SPARKLES = 1
export const MAX_SPARKLES = 4
export const SPARKLE_FROM = 0.2
export const SPARKLE_TO = 0.8
/** How long an uncatchable sparkle drifts past a pilot with no robot yet. */
export const NUDGE_SPARKLE_MS = 1500

// ─── Gadgets: bought at the station, used up on the next hunt ──────────────

export type GadgetId = 'fuel' | 'shield' | 'flare' | 'clover'
export const GADGETS: readonly GadgetId[] = ['fuel', 'shield', 'flare', 'clover']
/** The most of each gadget one hunt can use, which is also how many can be loaded. */
export const GADGET_MAX: Record<GadgetId, number> = { fuel: 3, shield: 3, flare: 1, clover: 1 }
/**
 * Prices on the first planet. Further out they rise in step with what a trail
 * pays there, so a gadget always costs roughly the same share of a hunt: a
 * lucky clover stays a gamble that pays off on a good hunt, rather than a way to
 * print stardust.
 */
export const GADGET_PRICE: Record<GadgetId, number> = { fuel: 10, shield: 10, flare: 15, clover: 20 }
/** Extra letters a flare lights up, on top of the scanner. */
export const FLARE_LETTERS = 3
/** A lucky clover multiplies the stardust from every letter, sparkle and pet by this. */
export const CLOVER_MULTIPLIER = 2

// ─── Pets: one rides along, and brings a little stardust ───────────────────

export type PetId = 'cat' | 'puppy' | 'alien' | 'dragon'
/** Clean letters in a row that make the space cat purr. */
export const CAT_STREAK = 10
/** What each of a pet's tricks is worth, as a multiple of the hunt's stardust per letter. */
export const PET_BONUS: Record<PetId, number> = { cat: 2, puppy: 3, alien: 0.5, dragon: 5 }
/** Where along the trail the moon puppy fetches its sparkle. */
export const PUPPY_FROM = 0.3
export const PUPPY_TO = 0.7

// ─── Named stars ───────────────────────────────────────────────────────────

export const STAR_PRICE = 50
export const MAX_NAMED_STARS = 12
export const STAR_NAME_LENGTH = 16

// ─── The navigator check (launching to a new planet) ───────────────────────

/**
 * Before the jump to new keys, the navigator wants to see that the current
 * planet's new keys have stuck: this share right first time…
 */
export const NAV_ACCURACY = 0.8
/** …over at least this many first tries on the new keys… */
export const NAV_MIN_TRIES = 20
/** …counting only the most recent tries (roughly this many). */
export const NAV_WINDOW_TRIES = 40
/**
 * A pilot who has been on a planet a long time gets a gentler check, so nobody
 * is stuck forever: it eases by this much per hunt past the first few, down to
 * a floor.
 */
export const NAV_RELAX_AFTER_HUNTS = 6
export const NAV_RELAX_PER_HUNT = 0.02
export const NAV_FLOOR = 0.6

// ─── Keyboard help ─────────────────────────────────────────────────────────

/** Less help after this many recent finished hunts, each at least this accurate… */
export const HELP_PROMOTE_HUNTS = 4
export const HELP_PROMOTE_ACCURACY = 0.92
/** …covering at least this many letters between them. */
export const HELP_PROMOTE_LETTERS = 80
/** More help after this many poor hunts in a row at the current step. */
export const HELP_DEMOTE_HUNTS = 2
export const HELP_DEMOTE_ACCURACY = 0.75
/** Misses on one letter that bring one step more keyboard help, just for it. */
export const MISSES_BEFORE_HELP = 3
/** A key keeps its letter on the keyboard until it has been tried this often. */
export const TRIES_BEFORE_LABEL_FADES = 10

// ─── Memory ────────────────────────────────────────────────────────────────

/** Hunts remembered per pilot. */
export const HISTORY_LIMIT = 60
/** Recent messages per planet that won't be repeated. */
export const RECENT_LIMIT = 8

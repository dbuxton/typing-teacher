import { useState } from 'react'
import {
  KIND_INFO,
  MAKEOVER_KINDS,
  makeoversOf,
  worn,
  type Look,
  type Makeover,
  type MakeoverKind,
} from '../data/makeovers'
import { PETS, type Pet } from '../data/pets'
import { getPlanet } from '../data/planets'
import { GADGET_INFO, TRACK_INFO } from '../data/shop'
import {
  GADGETS,
  HELPER_LEVELS_PER_DEEP_STEP,
  MAX_NAMED_STARS,
  PET_BONUS,
  STAR_NAME_LENGTH,
  STAR_PRICE,
  TRACKS,
  TRAINING_FLIGHTS,
  type GadgetId,
  type TrackId,
} from '../engine/balance'
import { helperLevels } from '../engine/difficulty'
import { launchCheck, stardustPerLetter, stockStatus, suggestHelper } from '../engine/economy'
import { gadgetStock, itemStock, starStock, type ItemStock } from '../engine/shop'
import { playHorn, playSound } from '../engine/sound'
import { useStarTrail } from '../store/pilotStore'
import { maxLevel, type Pilot } from '../store/schema'
import { NeonButton, TopBar } from '../components/Chrome'
import { PetSprite } from '../components/PetSprite'
import { ShipSprite } from '../components/PilotShip'
import { Starfield } from '../components/Starfield'

/**
 * The space station: where stardust becomes helpers, gadgets, makeovers, pets
 * and stars with your name on.
 *
 * Helpers are the notebook's "something that helps you find the next thing",
 * and its rule is spelled out rather than hidden: better kit takes you deeper,
 * where trails are longer and darker, and stardust is worth more. Everything
 * else is always in stock, so there's always something to save up for.
 */

type Tab = 'helpers' | 'gadgets' | 'makeovers' | 'pets' | 'stars'

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'helpers', icon: '🔧', label: 'Helpers' },
  { id: 'gadgets', icon: '🎒', label: 'Gadgets' },
  { id: 'makeovers', icon: '🎨', label: 'Makeovers' },
  { id: 'pets', icon: '🐾', label: 'Pets' },
  { id: 'stars', icon: '⭐', label: 'Name a star' },
]

/** The tab last looked at, so a trip to the galaxy and back lands in the same place. */
let lastTab: Tab = 'helpers'

export function SpaceStation({ pilot }: { pilot: Pilot }) {
  const goTo = useStarTrail((s) => s.goTo)
  const [tab, setTab] = useState<Tab>(lastTab)

  function choose(next: Tab) {
    lastTab = next
    setTab(next)
  }

  return (
    <div className="st-screen">
      <Starfield seed={99} />
      <TopBar pilot={pilot} />
      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5 px-4 pb-10">
        <div className="text-center">
          <h1 className="neon-title text-5xl font-black text-neon-pink">Space station</h1>
          <p className="mt-1 text-dim">Spend your stardust on things that help you find the next piece — or just look amazing.</p>
        </div>

        <MissionControl pilot={pilot} />

        <div className="flex flex-wrap justify-center gap-2" role="tablist" aria-label="What the station sells">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              className="st-tab"
              onClick={() => choose(item.id)}
            >
              <span aria-hidden>{item.icon}</span> {item.label}
            </button>
          ))}
        </div>

        <section role="tabpanel" aria-label={TABS.find((item) => item.id === tab)?.label} className="flex flex-col gap-4">
          {tab === 'helpers' && <Helpers pilot={pilot} />}
          {tab === 'gadgets' && <Gadgets pilot={pilot} />}
          {tab === 'makeovers' && <Makeovers pilot={pilot} />}
          {tab === 'pets' && <Pets pilot={pilot} />}
          {tab === 'stars' && <Stars pilot={pilot} />}
        </section>

        <div className="flex justify-center">
          <NeonButton tone="cyan" onClick={() => goTo('galaxy')}>
            Back to the galaxy
          </NeonButton>
        </div>
      </main>
    </div>
  )
}

function useBuySound(pilot: Pilot) {
  return () => {
    if (pilot.sound) playSound('buy')
  }
}

// ─── Mission Control: what to save up for ─────────────────────────────────

/** What Mission Control says about each helper it might suggest. */
function tipFor(track: TrackId, level: number): string {
  switch (track) {
    case 'shields':
      return 'more shields — they soak up slips before they cost any fuel.'
    case 'tank':
      return 'a bigger fuel tank — more fuel means more room for slips.'
    case 'scanner':
      return `${level === 0 ? 'a scanner' : 'a better scanner'} — see further along the trail and read ahead, like a real pilot.`
    case 'robot':
      return `${level === 0 ? 'a robot sidekick' : 'a better robot'} — grab stardust sparkles as they drift past.`
    default:
      return `${TRACK_INFO[track].name.toLowerCase()}.`
  }
}

function MissionControl({ pilot }: { pilot: Pilot }) {
  const check = launchCheck(pilot)
  const tip = suggestHelper(pilot)
  const saving = check.next !== null && !check.hasEngine && check.enginePrice !== null
  if (!saving && !tip) return null

  return (
    <section className="st-panel flex flex-col gap-2 p-4" aria-label="Mission Control">
      <h2 className="text-sm font-extrabold uppercase tracking-wide text-neon-cyan">🛰️ Mission Control</h2>
      {saving && check.next !== null && check.enginePrice !== null && (
        <div className="flex flex-col gap-1">
          <p>
            Engines to reach <strong style={{ color: getPlanet(check.next).hue }}>{getPlanet(check.next).name}</strong> cost ✨{' '}
            {check.enginePrice}
            {pilot.stardust >= check.enginePrice ? ' — you can afford them!' : ` — you have ✨ ${pilot.stardust}.`}
          </p>
          <div className="st-meter" aria-hidden>
            <span style={{ width: `${Math.min(100, (100 * pilot.stardust) / check.enginePrice)}%` }} />
          </div>
        </div>
      )}
      {tip && (
        <p data-testid="tip">
          <span className="font-bold text-neon-gold">Tip:</span> {pilot.failStreak > 0 ? 'after that tow, save' : 'Save'} up
          for {tipFor(tip, pilot.upgrades[tip])}
        </p>
      )}
    </section>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function Helpers({ pilot }: { pilot: Pilot }) {
  const buyUpgrade = useStarTrail((s) => s.buyUpgrade)
  const buySound = useBuySound(pilot)
  const tip = suggestHelper(pilot)
  const helpers = helperLevels(pilot.upgrades)
  const toNextStep = HELPER_LEVELS_PER_DEEP_STEP - (helpers % HELPER_LEVELS_PER_DEEP_STEP)

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {TRACKS.map((track) => (
          <TrackCard
            key={track}
            pilot={pilot}
            track={track}
            tipped={track === tip}
            onBuy={() => {
              buySound()
              buyUpgrade(track)
            }}
          />
        ))}
      </div>
      <p className="st-panel p-4 text-center text-sm text-dim">
        🌌 <strong className="text-ink">Better kit takes you deeper.</strong> For every {HELPER_LEVELS_PER_DEEP_STEP} scanner,
        shield, robot or fuel-tank upgrades, space gets a little darker and trails get a little longer — but every letter pays
        more stardust. The star map and the magnet don’t take you deeper.{' '}
        {toNextStep === 1 ? 'Your next scanner, shield, robot or tank upgrade will take you one step deeper.' : ''}
      </p>
    </>
  )
}

function TrackCard({ pilot, track, tipped, onBuy }: { pilot: Pilot; track: TrackId; tipped: boolean; onBuy: () => void }) {
  const info = TRACK_INFO[track]
  const level = pilot.upgrades[track]
  const stock = stockStatus(pilot, track)

  return (
    <section className="st-panel flex flex-col gap-2 p-5" aria-label={info.name} data-track={track}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-2xl font-extrabold">
          <span aria-hidden>{info.icon}</span> {info.name}
        </h2>
        <span className="st-chip text-neon-violet">
          Level {level} of {maxLevel(track)}
        </span>
      </div>
      {tipped && <span className="st-chip self-start text-neon-gold">⭐ Mission Control’s tip</span>}
      <p className="text-dim">{info.blurb}</p>
      <p className="text-sm">
        Now: <span className="font-bold">{info.effect(level)}</span>
      </p>
      {stock.status !== 'maxed' && (
        <p className="text-sm">
          Next: <span className="font-bold text-neon-cyan">{info.effect(stock.next.level)}</span>
        </p>
      )}
      <div className="mt-auto pt-2">
        {stock.status === 'maxed' && <span className="font-bold text-neon-lime">Fully upgraded ✓</span>}
        {stock.status === 'not-yet' && (
          <span className="text-sm text-dim">Arrives in stock when you reach {getPlanet(stock.next.stockAt).name}</span>
        )}
        {(stock.status === 'buy' || stock.status === 'too-dear') && (
          <div className="flex flex-wrap items-center gap-3">
            <NeonButton
              tone="gold"
              onClick={onBuy}
              disabled={stock.status === 'too-dear'}
              label={`Buy ${info.name} level ${stock.next.level} for ${stock.next.price} stardust`}
            >
              Buy for ✨ {stock.next.price}
            </NeonButton>
            {stock.status === 'too-dear' && (
              <span className="text-sm text-dim">Need ✨ {stock.next.price - pilot.stardust} more</span>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

// ─── Gadgets ──────────────────────────────────────────────────────────────

function Gadgets({ pilot }: { pilot: Pilot }) {
  const training = pilot.huntsFlown < TRAINING_FLIGHTS
  return (
    <>
      <p className="text-center text-dim">
        Gadgets are loaded onto your ship and used up on your next hunt. Prices go up the further out you fly.
        {training && ' Training flights can’t run dry, so extra fuel and shields wait until your training is over.'}
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {GADGETS.map((gadget) => (
          <GadgetCard key={gadget} pilot={pilot} gadget={gadget} />
        ))}
      </div>
    </>
  )
}

function GadgetCard({ pilot, gadget }: { pilot: Pilot; gadget: GadgetId }) {
  const buyGadget = useStarTrail((s) => s.buyGadget)
  const buySound = useBuySound(pilot)
  const info = GADGET_INFO[gadget]
  const stock = gadgetStock(pilot, gadget)

  return (
    <section className="st-panel flex flex-col gap-2 p-5" aria-label={info.name} data-gadget={gadget}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-2xl font-extrabold">
          <span aria-hidden>{info.icon}</span> {info.name}
        </h2>
        <span className="st-chip text-neon-violet" aria-label={`${stock.loaded} of ${stock.max} loaded`}>
          Loaded {stock.loaded} of {stock.max}
        </span>
      </div>
      <p className="text-dim">{info.blurb}</p>
      <div className="mt-auto flex flex-wrap items-center gap-3 pt-2">
        {stock.status === 'full' ? (
          <span className="font-bold text-neon-lime">Loaded for your next hunt ✓</span>
        ) : (
          <>
            <NeonButton
              tone="gold"
              disabled={stock.status === 'too-dear'}
              onClick={() => {
                buySound()
                buyGadget(gadget)
              }}
              label={`Buy ${info.name} for ${stock.price} stardust`}
            >
              Buy for ✨ {stock.price}
            </NeonButton>
            {stock.status === 'too-dear' && <span className="text-sm text-dim">Need ✨ {stock.price - pilot.stardust} more</span>}
          </>
        )}
      </div>
    </section>
  )
}

// ─── Makeovers ────────────────────────────────────────────────────────────

function Makeovers({ pilot }: { pilot: Pilot }) {
  const buyItem = useStarTrail((s) => s.buyItem)
  const wear = useStarTrail((s) => s.wear)
  const buySound = useBuySound(pilot)
  const [kind, setKind] = useState<MakeoverKind>('paint')
  // Trying things on changes only the preview, never the ship.
  const [trying, setTrying] = useState<Partial<Look>>({})
  const preview: Look = { ...pilot.look, ...trying }

  function forget(item: Makeover) {
    setTrying((current) => {
      const next = { ...current }
      delete next[item.kind]
      return next
    })
  }

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <ShipPreview look={preview} />
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2" aria-label="Kinds of makeover">
          {MAKEOVER_KINDS.map((k) => (
            <button
              key={k}
              type="button"
              className="st-chip"
              style={{ color: k === kind ? 'var(--color-neon-gold)' : 'var(--color-dim)' }}
              aria-pressed={k === kind}
              onClick={() => setKind(k)}
            >
              <span aria-hidden>{KIND_INFO[k].icon}</span> {KIND_INFO[k].name}
            </button>
          ))}
        </div>
        <p className="text-sm text-dim">{KIND_INFO[kind].blurb} Click one to try it on.</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {makeoversOf(kind).map((item) => (
            <ItemTile
              key={item.id}
              name={item.name}
              price={item.price}
              stock={itemStock(pilot, item.id)}
              need={item.price - pilot.stardust}
              trying={trying[item.kind] === item.id}
              onTry={() => {
                if (item.kind === 'horn') playHorn(item.tune)
                setTrying((current) => ({ ...current, [item.kind]: item.id }))
              }}
              onBuy={() => {
                buySound()
                buyItem(item.id)
                forget(item)
              }}
              onWear={() => {
                wear(item.id)
                forget(item)
              }}
              tryLabel={item.kind === 'horn' ? `Listen to ${item.name}` : `Try on ${item.name}`}
            >
              <Swatch item={item} base={pilot.look} />
            </ItemTile>
          ))}
        </div>
      </div>
    </div>
  )
}

/** The pilot's ship as it would look, flying over a scrap of trail. */
function ShipPreview({ look }: { look: Look }) {
  const trail = worn(look, 'trail')
  const letters = 'star trail'
  return (
    <div className="st-panel flex flex-col items-center justify-center gap-3 p-5" data-testid="preview">
      <div className="relative flex items-end gap-1">
        {look.pet && <PetPreview id={look.pet} />}
        <ShipSprite size={180} look={look} />
      </div>
      <p className="font-mono text-2xl font-extrabold" aria-hidden>
        {[...letters].map((char, index) => (
          <span key={index} className="st-preview-letter" style={{ color: trail.colours[index % trail.colours.length] }}>
            {char === ' ' ? ' ' : char}
          </span>
        ))}
      </p>
      <p className="text-sm text-dim">
        {worn(look, 'paint').name} {worn(look, 'ship').name.toLowerCase()}, {worn(look, 'trail').name.toLowerCase()} trail
      </p>
    </div>
  )
}

function PetPreview({ id }: { id: string }) {
  const pet = PETS.find((p) => p.id === id)
  return pet ? <PetSprite pet={pet.pet} size={48} className="mb-8" /> : null
}

/** The pilot's own ship wearing this one makeover. */
function Swatch({ item, base }: { item: Makeover; base: Look }) {
  const look = { ...base, [item.kind]: item.id }
  switch (item.kind) {
    case 'paint':
    case 'ship':
      return <ShipSprite size={72} flame={false} look={look} />
    case 'flame':
      return <ShipSprite size={72} look={look} />
    case 'trail':
      return (
        <span className="font-mono text-2xl font-extrabold" aria-hidden>
          {[...'abc'].map((char, index) => (
            <span key={index} className="st-preview-letter" style={{ color: item.colours[index % item.colours.length] }}>
              {char}
            </span>
          ))}
        </span>
      )
    case 'horn':
      return (
        <span className="text-3xl" aria-hidden>
          📯
        </span>
      )
  }
}

function ItemTile({
  name,
  price,
  stock,
  need,
  trying,
  onTry,
  onBuy,
  onWear,
  tryLabel,
  children,
}: {
  name: string
  price: number
  stock: ItemStock
  need: number
  trying: boolean
  onTry: () => void
  onBuy: () => void
  onWear: () => void
  tryLabel: string
  children: React.ReactNode
}) {
  return (
    <div className={`st-tile ${stock === 'wearing' ? 'st-tile-wearing' : ''} ${trying ? 'st-tile-trying' : ''}`} data-item={name}>
      <button type="button" className="st-tile-try" onClick={onTry} aria-label={tryLabel}>
        {children}
      </button>
      <span className="text-center text-sm font-extrabold leading-tight">{name}</span>
      {stock === 'wearing' && <span className="text-sm font-bold text-neon-lime">Wearing ✓</span>}
      {stock === 'owned' && (
        <NeonButton tone="lime" size="sm" onClick={onWear} label={`Wear ${name}`}>
          Wear
        </NeonButton>
      )}
      {(stock === 'buy' || stock === 'too-dear') && (
        <>
          <NeonButton
            tone="gold"
            size="sm"
            disabled={stock === 'too-dear'}
            onClick={onBuy}
            label={`Buy ${name} for ${price} stardust`}
          >
            ✨ {price}
          </NeonButton>
          {stock === 'too-dear' && <span className="text-center text-xs text-dim">Need ✨ {need} more</span>}
        </>
      )}
    </div>
  )
}

// ─── Pets ─────────────────────────────────────────────────────────────────

function Pets({ pilot }: { pilot: Pilot }) {
  const buyItem = useStarTrail((s) => s.buyItem)
  const wear = useStarTrail((s) => s.wear)
  const leavePetHome = useStarTrail((s) => s.leavePetHome)
  const buySound = useBuySound(pilot)
  const perLetter = stardustPerLetter(pilot.planet, pilot.upgrades)
  const riding = PETS.find((pet) => pet.id === pilot.look.pet)

  return (
    <>
      <p className="text-center text-dim">
        One pet rides along on every hunt, cheers you on, and brings a little stardust with its trick.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {PETS.map((pet) => (
          <PetCard
            key={pet.id}
            pet={pet}
            stock={itemStock(pilot, pet.id)}
            need={pet.price - pilot.stardust}
            trick={Math.max(1, Math.round(PET_BONUS[pet.pet] * perLetter))}
            onBuy={() => {
              buySound()
              buyItem(pet.id)
            }}
            onTake={() => wear(pet.id)}
          />
        ))}
      </div>
      {riding && (
        <div className="flex justify-center">
          <NeonButton tone="violet" onClick={leavePetHome}>
            Leave your {riding.name.toLowerCase()} at home
          </NeonButton>
        </div>
      )}
    </>
  )
}

function PetCard({
  pet,
  stock,
  need,
  trick,
  onBuy,
  onTake,
}: {
  pet: Pet
  stock: ItemStock
  need: number
  trick: number
  onBuy: () => void
  onTake: () => void
}) {
  return (
    <section
      className={`st-panel flex items-start gap-4 p-5 ${stock === 'wearing' ? 'st-tile-wearing' : ''}`}
      aria-label={pet.name}
      data-pet-card={pet.pet}
    >
      <PetSprite pet={pet.pet} size={64} />
      <div className="flex flex-1 flex-col gap-2">
        <h2 className="text-xl font-extrabold">{pet.name}</h2>
        <p className="text-dim">{pet.blurb}</p>
        <p className="text-sm">
          Each trick here: <span className="font-bold text-neon-gold">✨ {trick}</span>
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {stock === 'wearing' && <span className="font-bold text-neon-lime">Riding along ✓</span>}
          {stock === 'owned' && (
            <NeonButton tone="lime" size="sm" onClick={onTake} label={`Take ${pet.name} along`}>
              Take along
            </NeonButton>
          )}
          {(stock === 'buy' || stock === 'too-dear') && (
            <>
              <NeonButton tone="gold" size="sm" disabled={stock === 'too-dear'} onClick={onBuy} label={`Adopt ${pet.name} for ${pet.price} stardust`}>
                Adopt for ✨ {pet.price}
              </NeonButton>
              {stock === 'too-dear' && <span className="text-sm text-dim">Need ✨ {need} more</span>}
            </>
          )}
        </div>
      </div>
    </section>
  )
}

// ─── Named stars ──────────────────────────────────────────────────────────

function Stars({ pilot }: { pilot: Pilot }) {
  const nameStar = useStarTrail((s) => s.nameStar)
  const buySound = useBuySound(pilot)
  const [name, setName] = useState('')
  const stock = starStock(pilot)

  function submit() {
    if (!name.trim() || stock !== 'buy') return
    buySound()
    nameStar(name)
    setName('')
  }

  return (
    <div className="st-panel flex flex-col items-center gap-4 p-6 text-center">
      <p className="max-w-xl text-lg">
        Name a star after anyone you like — your mum, your cat, your best friend, yourself. It twinkles on your galaxy map
        for ever.
      </p>
      {stock === 'full' ? (
        <p className="font-bold text-neon-lime">Your sky is full: {MAX_NAMED_STARS} stars named!</p>
      ) : (
        <form
          className="flex w-full max-w-md flex-wrap items-center justify-center gap-3"
          onSubmit={(event) => {
            event.preventDefault()
            submit()
          }}
        >
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Star name"
            maxLength={STAR_NAME_LENGTH}
            aria-label="Star name"
            className="min-w-0 flex-1 rounded-xl border-2 border-space-600 bg-space-900 px-4 py-2 text-lg font-bold text-ink outline-none focus:border-neon-gold"
          />
          <button
            type="submit"
            className="st-button st-tone-gold st-button-md"
            disabled={!name.trim() || stock !== 'buy'}
            aria-label={`Name this star for ${STAR_PRICE} stardust`}
          >
            Name it for ✨ {STAR_PRICE}
          </button>
          {stock === 'too-dear' && <span className="w-full text-sm text-dim">Need ✨ {STAR_PRICE - pilot.stardust} more</span>}
        </form>
      )}
      {pilot.stars.length > 0 && (
        <ul className="flex flex-wrap justify-center gap-2" aria-label="Stars you’ve named">
          {pilot.stars.map((star, index) => (
            <li key={index} className="st-chip text-neon-gold">
              ⭐ {star}
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-dim">
        {pilot.stars.length} of {MAX_NAMED_STARS} named
      </p>
    </div>
  )
}

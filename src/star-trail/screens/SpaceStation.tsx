import { getPlanet } from '../data/planets'
import { TRACK_INFO } from '../data/shop'
import { HELPER_LEVELS_PER_DEEP_STEP, TRACKS, type TrackId } from '../engine/balance'
import { helperLevels } from '../engine/difficulty'
import { stockStatus } from '../engine/economy'
import { playSound } from '../engine/sound'
import { useStarTrail } from '../store/pilotStore'
import { maxLevel, type Pilot } from '../store/schema'
import { NeonButton, TopBar } from '../components/Chrome'
import { Starfield } from '../components/Starfield'

/**
 * The space station: where stardust becomes helpers. Four tracks, each with a
 * few levels; higher levels arrive in stock as the pilot flies further.
 *
 * Max's rule is spelled out here rather than hidden: better kit takes you
 * deeper, where trails are longer and darker — and stardust is worth more.
 */
export function SpaceStation({ pilot }: { pilot: Pilot }) {
  const buyUpgrade = useStarTrail((s) => s.buyUpgrade)
  const goTo = useStarTrail((s) => s.goTo)

  function buy(track: TrackId) {
    if (pilot.sound) playSound('buy')
    buyUpgrade(track)
  }

  const helpers = helperLevels(pilot.upgrades)
  const toNextStep = HELPER_LEVELS_PER_DEEP_STEP - (helpers % HELPER_LEVELS_PER_DEEP_STEP)

  return (
    <div className="st-screen">
      <Starfield seed={99} />
      <TopBar pilot={pilot} />
      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5 px-4 pb-10">
        <div className="text-center">
          <h1 className="neon-title text-5xl font-black text-neon-pink">Space station</h1>
          <p className="mt-1 text-dim">Spend your stardust on things that help you find the next piece.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {TRACKS.map((track) => (
            <TrackCard key={track} pilot={pilot} track={track} onBuy={() => buy(track)} />
          ))}
        </div>

        <p className="st-panel p-4 text-center text-sm text-dim">
          🌌 <strong className="text-ink">Better kit takes you deeper.</strong> For every {HELPER_LEVELS_PER_DEEP_STEP} scanner,
          shield or robot upgrades, space gets a little darker and trails get a little longer — but every letter pays more
          stardust. {toNextStep === 1 ? 'Your next helper upgrade will take you one step deeper.' : ''}
        </p>

        <div className="flex justify-center">
          <NeonButton tone="cyan" onClick={() => goTo('galaxy')}>
            Back to the galaxy
          </NeonButton>
        </div>
      </main>
    </div>
  )
}

function TrackCard({ pilot, track, onBuy }: { pilot: Pilot; track: TrackId; onBuy: () => void }) {
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

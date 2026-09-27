import { useEffect } from 'react'
import { speak } from '../../engine/speech'
import { getPlanet } from '../data/planets'
import { petFor } from '../data/pets'
import { shipPart } from '../data/ship'
import { PIECES_PER_PLANET } from '../engine/balance'
import { lessHelpMessage, moreHelpMessage, HELP_ORDER } from '../engine/help'
import { useStarTrail } from '../store/pilotStore'
import type { Pilot } from '../store/schema'
import { NeonButton, TopBar, useEnterToContinue } from '../components/Chrome'
import { LostShipArt } from '../components/LostShipArt'
import { PetSprite } from '../components/PetSprite'
import { ShipSprite } from '../components/PilotShip'
import { TowDroneSprite } from '../components/Sprites'
import { Starfield } from '../components/Starfield'

/** The two ways a hunt can end: a piece found, or a tow home. */

export function Found({ pilot }: { pilot: Pilot }) {
  const summary = useStarTrail((s) => s.lastHunt)
  const startHunt = useStarTrail((s) => s.startHunt)
  const goTo = useStarTrail((s) => s.goTo)

  // Read the message aloud: hearing the sentence they just typed is the payoff.
  const text = summary?.text
  useEffect(() => {
    if (text && pilot.sound) speak(text)
  }, [text, pilot.sound])

  const next = summary?.shipComplete ? () => goTo('ending') : () => startHunt()
  useEnterToContinue(next)
  if (!summary) return null

  const planet = getPlanet(summary.planetId)
  const part = shipPart(planet.partId)
  const { payout } = summary
  const rightFirstTime = summary.letters - summary.slips
  const helpChanged = summary.helpAfter !== summary.helpBefore
  const lessHelp = HELP_ORDER.indexOf(summary.helpAfter) > HELP_ORDER.indexOf(summary.helpBefore)
  const pet = petFor(summary.pet)

  return (
    <div className="st-screen">
      <Starfield />
      <TopBar pilot={pilot} />
      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col items-center gap-5 px-4 pb-10 text-center">
        <h1 className="neon-title st-rise text-5xl font-black text-neon-gold">
          {summary.practice ? 'Stardust haul!' : 'Found it!'}
        </h1>

        {summary.pieceFound && (
          <p className="text-xl font-bold">
            Piece {summary.piecesHere} of {PIECES_PER_PLANET} of the Lost Ship’s{' '}
            <span style={{ color: planet.hue }}>{part.name.toLowerCase()}</span>
          </p>
        )}

        {!summary.practice && <LostShipArt pieces={pilot.pieces} highlight={planet.id} size={320} />}

        {summary.partComplete && !summary.shipComplete && (
          <p className="st-panel px-4 py-3 text-lg font-bold text-neon-lime">
            You rebuilt the {part.name.toLowerCase()}! {part.blurb}
          </p>
        )}

        <figure className="st-panel w-full p-4">
          <figcaption className="mb-1 text-sm text-dim">The crew’s message</figcaption>
          <blockquote className="st-message text-2xl" data-testid="found-message">
            {summary.text}
          </blockquote>
          <button type="button" className="st-chip mt-2 text-neon-violet" onClick={() => speak(summary.text)}>
            🔊 Hear it
          </button>
        </figure>

        <dl className="grid w-full max-w-md grid-cols-[1fr_auto] gap-x-6 gap-y-1 text-left" aria-label="Stardust earned">
          <dt className="text-dim">Stardust from the trail</dt>
          <dd className="text-right font-bold">✨ {payout.trail}</dd>
          {payout.piece > 0 && (
            <>
              <dt className="text-dim">Finding the piece</dt>
              <dd className="text-right font-bold">✨ {payout.piece}</dd>
            </>
          )}
          {payout.fuel > 0 && (
            <>
              <dt className="text-dim">Fuel left in the tank</dt>
              <dd className="text-right font-bold">✨ {payout.fuel}</dd>
            </>
          )}
          {payout.loot > 0 && (
            <>
              <dt className="text-dim">Caught by your robot</dt>
              <dd className="text-right font-bold">✨ {payout.loot}</dd>
            </>
          )}
          {payout.pet > 0 && pet && (
            <>
              <dt className="flex items-center gap-2 text-dim">
                <PetSprite pet={pet.pet} size={24} />
                Your {pet.name.toLowerCase()} {pet.did(summary.petTricks)}
              </dt>
              <dd className="text-right font-bold">✨ {payout.pet}</dd>
            </>
          )}
          <dt className="border-t border-space-600 pt-1 font-extrabold text-neon-gold">Total</dt>
          <dd className="border-t border-space-600 pt-1 text-right font-extrabold text-neon-gold" data-testid="payout-total">
            +{payout.total} ✨
          </dd>
        </dl>

        {summary.gadgets.clover > 0 && (
          <p className="font-bold text-neon-lime">🍀 Your lucky clover doubled the stardust from every letter!</p>
        )}

        <p className="text-dim">
          {rightFirstTime} of {summary.letters} letters right first time
          {summary.slips === 0 && summary.letters > 0 ? ' — a perfect run! 🌟' : '.'}
        </p>

        {helpChanged && (
          <p className="text-neon-cyan">{lessHelp ? lessHelpMessage(summary.helpAfter) : moreHelpMessage(summary.helpAfter)}</p>
        )}

        <div className="flex flex-wrap justify-center gap-3">
          {summary.shipComplete ? (
            <NeonButton tone="gold" size="lg" onClick={() => goTo('ending')}>
              The Lost Ship is complete! 🚀
            </NeonButton>
          ) : (
            <NeonButton tone="lime" size="lg" onClick={() => startHunt()}>
              Hunt again
            </NeonButton>
          )}
          <NeonButton tone="cyan" onClick={() => goTo('galaxy')}>
            Galaxy map
          </NeonButton>
          <NeonButton tone="pink" onClick={() => goTo('station')}>
            Space station
          </NeonButton>
        </div>
        <p className="text-xs text-dim">Press Enter to carry on</p>
      </main>
    </div>
  )
}

export function Towed({ pilot }: { pilot: Pilot }) {
  const summary = useStarTrail((s) => s.lastHunt)
  const startHunt = useStarTrail((s) => s.startHunt)
  const goTo = useStarTrail((s) => s.goTo)
  useEnterToContinue(() => startHunt())
  if (!summary) return null

  const kept = summary.payout.total
  const spareComing = pilot.failStreak >= 2

  return (
    <div className="st-screen">
      <Starfield />
      <TopBar pilot={pilot} />
      <main className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col items-center gap-5 px-4 pb-10 text-center">
        <div className="st-tow flex flex-col items-center">
          <TowDroneSprite size={120} />
          <ShipSprite size={90} flame={false} look={pilot.look} tint="var(--color-neon-amber)" />
        </div>
        <h1 className="neon-title text-5xl font-black text-neon-amber">Out of fuel!</h1>
        <p className="text-xl">No problem — the tow-drone has brought you safely home.</p>
        {kept > 0 && (
          <p className="text-lg">
            You kept the <strong className="text-neon-gold">✨ {kept}</strong> stardust you’d already banked.
          </p>
        )}
        <p className="text-dim">
          The next trail will be a bit shorter{spareComing ? ', and Mission Control is adding spare fuel' : ''}. Shields and a
          bigger fuel tank from the space station give you room for more slips.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <NeonButton tone="lime" size="lg" onClick={() => startHunt()}>
            Try again
          </NeonButton>
          <NeonButton tone="cyan" onClick={() => goTo('galaxy')}>
            Galaxy map
          </NeonButton>
          <NeonButton tone="pink" onClick={() => goTo('station')}>
            Space station
          </NeonButton>
        </div>
        <p className="text-xs text-dim">Press Enter to try again</p>
      </main>
    </div>
  )
}

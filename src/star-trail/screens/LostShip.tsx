import { useEffect } from 'react'
import { ENDING } from '../data/ending'
import { PLANETS } from '../data/planets'
import { shipPart } from '../data/ship'
import { PIECES_PER_PLANET } from '../engine/balance'
import { playSound } from '../engine/sound'
import { TOTAL_PIECES, totalPieces } from '../engine/settle'
import { useStarTrail } from '../store/pilotStore'
import type { Pilot } from '../store/schema'
import { NeonButton, TopBar, useEnterToContinue } from '../components/Chrome'
import { LostShipArt } from '../components/LostShipArt'
import { Starfield } from '../components/Starfield'

/** The blueprint of the Lost Ship, and what's still missing. */
export function LostShip({ pilot }: { pilot: Pilot }) {
  const goTo = useStarTrail((s) => s.goTo)
  const found = totalPieces(pilot)

  return (
    <div className="st-screen">
      <Starfield seed={3} />
      <TopBar pilot={pilot} />
      <main className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col items-center gap-5 px-4 pb-10 text-center">
        <h1 className="neon-title text-5xl font-black text-neon-cyan">The Lost Ship</h1>
        <p className="text-dim">
          {found} of {TOTAL_PIECES} pieces found. Each planet hides one part, in three pieces.
        </p>
        <div className="st-panel w-full p-4">
          <LostShipArt pieces={pilot.pieces} size={640} />
        </div>
        <ul className="grid w-full gap-2 text-left sm:grid-cols-2">
          {PLANETS.map((planet) => {
            const part = shipPart(planet.partId)
            const pieces = pilot.pieces[planet.id] ?? 0
            const visited = planet.id <= pilot.highestPlanet
            return (
              <li key={planet.id} className="st-panel flex items-center justify-between gap-3 px-4 py-2">
                <span>
                  <span className="font-extrabold" style={{ color: visited ? planet.hue : undefined }}>
                    {part.name}
                  </span>
                  <span className="block text-xs text-dim">{visited ? `on ${planet.name}` : 'on a planet not reached yet'}</span>
                </span>
                <span className={pieces === PIECES_PER_PLANET ? 'font-bold text-neon-lime' : 'text-dim'}>
                  {pieces === PIECES_PER_PLANET ? 'Rebuilt ✓' : `${pieces} of ${PIECES_PER_PLANET}`}
                </span>
              </li>
            )
          })}
        </ul>
        {found === TOTAL_PIECES ? (
          <NeonButton tone="gold" size="lg" onClick={() => goTo('ending')}>
            Fly the Lost Ship 🚀
          </NeonButton>
        ) : (
          <NeonButton tone="cyan" onClick={() => goTo('galaxy')}>
            Back to the galaxy
          </NeonButton>
        )}
      </main>
    </div>
  )
}

/** The end of the story — for now. The words live in data/ending.ts. */
export function Ending({ pilot }: { pilot: Pilot }) {
  const finishEnding = useStarTrail((s) => s.finishEnding)
  useEnterToContinue(finishEnding, 1500)

  useEffect(() => {
    if (pilot.sound) playSound('launch')
  }, [pilot.sound])

  return (
    <div className="st-screen">
      <Starfield seed={42} />
      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-6 px-4 py-10 text-center">
        <div className="st-ending-flight">
          <LostShipArt pieces={pilot.pieces} flying size={520} />
        </div>
        <h1 className="neon-title st-rise text-5xl font-black text-neon-gold" data-testid="ending-title">
          {ENDING.title}
        </h1>
        {ENDING.lines.map((line, index) => (
          <p key={index} className="st-rise text-xl" style={{ animationDelay: `${0.6 + index * 0.9}s` }}>
            {line}
          </p>
        ))}
        <p className="st-rise text-dim" style={{ animationDelay: `${0.6 + ENDING.lines.length * 0.9}s` }}>
          {ENDING.signOff}
        </p>
        <NeonButton tone="cyan" onClick={finishEnding}>
          Back to the galaxy
        </NeonButton>
      </main>
    </div>
  )
}

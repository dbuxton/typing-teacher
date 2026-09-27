import { PLANETS, getPlanet, keyLabel } from '../data/planets'
import { shipPart } from '../data/ship'
import { PIECES_PER_PLANET } from '../engine/balance'
import { launchCheck } from '../engine/economy'
import { TOTAL_PIECES, totalPieces } from '../engine/settle'
import { useStarTrail } from '../store/pilotStore'
import type { Pilot } from '../store/schema'
import { NeonButton, TopBar, useEnterToContinue } from '../components/Chrome'
import { PlanetOrb } from '../components/Sprites'
import { Starfield } from '../components/Starfield'

/**
 * The galaxy map: the hub between hunts. Where you are, what's hidden here, how
 * far through the Lost Ship you are, and what the next planet needs.
 */
export function Galaxy({ pilot }: { pilot: Pilot }) {
  const startHunt = useStarTrail((s) => s.startHunt)
  const travel = useStarTrail((s) => s.travel)
  const launch = useStarTrail((s) => s.launch)
  const goTo = useStarTrail((s) => s.goTo)

  const planet = getPlanet(pilot.planet)
  const piecesHere = pilot.pieces[planet.id] ?? 0
  const part = shipPart(planet.partId)
  const atFrontier = pilot.planet === pilot.highestPlanet
  const check = launchCheck(pilot)
  const shipDone = totalPieces(pilot) === TOTAL_PIECES

  useEnterToContinue(() => startHunt(), 300)

  return (
    <div className="st-screen">
      <Starfield />
      <TopBar pilot={pilot} />
      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 pb-10">
        <ol className="grid grid-cols-5 gap-3 sm:grid-cols-10" aria-label="Planets">
          {PLANETS.map((p) => {
            const visited = p.id <= pilot.highestPlanet
            const here = p.id === pilot.planet
            const pieces = pilot.pieces[p.id] ?? 0
            return (
              <li key={p.id} className="flex flex-col items-center gap-1 text-center">
                <button
                  type="button"
                  disabled={!visited || here}
                  onClick={() => travel(p.id)}
                  className={`rounded-full p-1 transition ${here ? 'ring-2 ring-neon-cyan' : visited ? 'hover:bg-white/5' : ''}`}
                  aria-label={visited ? `${p.name}${here ? ' (you are here)' : ''}` : `${p.name} (not reached yet)`}
                  aria-current={here ? 'true' : undefined}
                >
                  <PlanetOrb hue={p.hue} size={52} ringed={p.id % 3 === 0} dim={!visited} />
                </button>
                <span className={`text-xs font-bold leading-tight ${visited ? 'text-ink' : 'text-dim/60'}`}>{p.name}</span>
                <span className="flex gap-0.5" aria-label={`${pieces} of ${PIECES_PER_PLANET} pieces`}>
                  {Array.from({ length: PIECES_PER_PLANET }, (_, i) => (
                    <span
                      key={i}
                      className={`h-2 w-2 rounded-full ${i < pieces ? 'bg-neon-gold shadow-[0_0_6px_#ffe36e]' : 'bg-space-600'}`}
                    />
                  ))}
                </span>
              </li>
            )
          })}
        </ol>

        {shipDone && (
          <div className="st-panel flex flex-wrap items-center justify-between gap-3 p-4">
            <p className="text-lg font-extrabold text-neon-gold">The Lost Ship is complete!</p>
            <NeonButton tone="gold" onClick={() => goTo('ending')}>
              {pilot.endingSeen ? 'Watch it fly again' : 'See where it takes you'} 🚀
            </NeonButton>
          </div>
        )}

        <section className="st-panel flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <PlanetOrb hue={planet.hue} size={110} ringed={planet.id % 3 === 0} />
          <div className="flex flex-1 flex-col gap-2">
            <h1 className="neon-text text-3xl font-black" style={{ color: planet.hue }}>
              {planet.name}
            </h1>
            <p className="text-dim">
              {piecesHere < PIECES_PER_PLANET ? (
                <>
                  Hidden here: the <strong className="text-ink">{part.name.toLowerCase()}</strong> of the Lost Ship —{' '}
                  {piecesHere} of {PIECES_PER_PLANET} pieces found.
                </>
              ) : (
                <>
                  You found all of the <strong className="text-ink">{part.name.toLowerCase()}</strong> here. Hunt again for
                  stardust and practice.
                </>
              )}
            </p>
            <p className="flex flex-wrap items-center gap-1 text-sm text-dim">
              Keys:
              {planet.allKeys.map((key) => (
                <kbd
                  key={key}
                  className={`rounded-md border px-1.5 py-0.5 font-mono text-xs font-bold ${
                    planet.newKeys.includes(key) ? 'border-neon-gold text-neon-gold' : 'border-space-600 text-ink'
                  }`}
                >
                  {keyLabel(key)}
                </kbd>
              ))}
            </p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <NeonButton tone="lime" size="lg" onClick={() => startHunt()}>
              Hunt! 🔭
            </NeonButton>
            <span className="text-xs text-dim">or press Enter</span>
          </div>
        </section>

        {!atFrontier && (
          <div className="flex justify-center">
            <NeonButton tone="violet" onClick={() => travel(pilot.highestPlanet)}>
              Fly back to {getPlanet(pilot.highestPlanet).name}
            </NeonButton>
          </div>
        )}

        {atFrontier && check.next !== null && <LaunchPanel pilot={pilot} onLaunch={launch} onStation={() => goTo('station')} />}
      </main>
    </div>
  )
}

function Tick({ done, children }: { done: boolean; children: React.ReactNode }) {
  return (
    <li className={`flex items-start gap-2 ${done ? 'text-neon-lime' : 'text-dim'}`}>
      <span aria-hidden className="mt-0.5 w-5 text-center">
        {done ? '✓' : '○'}
      </span>
      <span>{children}</span>
    </li>
  )
}

function LaunchPanel({ pilot, onLaunch, onStation }: { pilot: Pilot; onLaunch: () => void; onStation: () => void }) {
  const check = launchCheck(pilot)
  if (check.next === null) return null
  const next = getPlanet(check.next)
  const here = getPlanet(pilot.highestPlanet)
  const newKeys = here.newKeys.map(keyLabel).join(' ')
  const { nav } = check

  return (
    <section className="st-panel flex flex-col gap-3 p-5" aria-label="Next planet">
      <h2 className="text-xl font-extrabold">
        Next stop: <span style={{ color: next.hue }}>{next.name}</span>
        <span className="ml-2 text-sm font-bold text-dim">new keys: {next.newKeys.map(keyLabel).join(' ')}</span>
      </h2>
      <ul className="flex flex-col gap-1">
        <Tick done={check.piecesFound >= check.piecesNeeded}>
          All {check.piecesNeeded} pieces found on {here.name} ({check.piecesFound} of {check.piecesNeeded})
        </Tick>
        <Tick done={check.hasEngine}>
          {check.hasEngine ? (
            'Engines big enough to reach it'
          ) : (
            <>
              Bigger engines — ✨ {check.enginePrice} at the{' '}
              <button type="button" className="font-bold text-neon-cyan underline" onClick={onStation}>
                space station
              </button>
            </>
          )}
        </Tick>
        <Tick done={nav.passed}>
          {nav.passed
            ? `The navigator says your ${newKeys} keys are ready`
            : nav.tries < nav.minTries
              ? `The navigator wants to see more of your new keys (${newKeys}) — keep hunting here`
              : `The navigator wants ${Math.round(nav.required * 100)}% right first time on ${newKeys} — you're on ${Math.round(nav.accuracy * 100)}%`}
        </Tick>
      </ul>
      <div>
        <NeonButton tone="pink" size="lg" disabled={!check.ok} onClick={onLaunch}>
          Launch to {next.name}! 🚀
        </NeonButton>
      </div>
    </section>
  )
}

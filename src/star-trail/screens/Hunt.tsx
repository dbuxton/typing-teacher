import { useEffect, useRef, useState } from 'react'
import { worn } from '../data/makeovers'
import { getPlanet, keyLabel } from '../data/planets'
import { PIECES_PER_PLANET } from '../engine/balance'
import { effectiveHelp, showsKeyboard } from '../engine/help'
import { CATCH_KEY } from '../engine/keys'
import type { HuntPlan } from '../engine/plan'
import { wordsAhead } from '../engine/trail'
import { useTrail } from '../engine/useTrail'
import { useStarTrail } from '../store/pilotStore'
import type { Pilot } from '../store/schema'
import { Gauges } from '../components/Hud'
import { NeonHands } from '../components/NeonHands'
import { NeonKeyboard } from '../components/NeonKeyboard'
import { PlanetOrb, RobotSprite, SparkleSprite } from '../components/Sprites'
import { Starfield } from '../components/Starfield'
import { TrailView } from '../components/TrailView'

/**
 * The hunt: follow the trail letter by letter until the message is complete and
 * the piece is found — or the fuel runs out.
 *
 * Nothing on this screen takes keyboard focus. The hunt listens on the window,
 * and a focused button would turn the next Space into a click.
 */

const noFocus = (event: React.MouseEvent) => event.preventDefault()

export function Hunt({ pilot, plan }: { pilot: Pilot; plan: HuntPlan }) {
  const recordHunt = useStarTrail((s) => s.recordHunt)
  const planet = getPlanet(plan.planetId)
  const { state, next, ahead, message, nearEnd, otherLayout, abort, pause, resume } = useTrail({
    plan,
    onFinish: recordHunt,
    sound: pilot.sound,
    horn: worn(pilot.look, 'horn').tune,
  })

  const help = effectiveHelp(plan.help, state.missesHere)
  const keyboardOn = showsKeyboard(help, state.recentlyMissed)
  const piecesHere = pilot.pieces[plan.planetId] ?? 0
  const earned = state.banked + state.loot + state.petBonus
  const pop = useStardustPops(state.event, earned)
  // The star map: how many words are left, and at level 2 their shapes too.
  const words = plan.mapLevel > 0 ? wordsAhead(state, plan) : []

  return (
    <div className="st-screen">
      <Starfield darkness={plan.darkness} seed={plan.planetId * 7} />

      <header className="relative z-10 flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <PlanetOrb hue={planet.hue} size={34} />
          <span className="font-extrabold" style={{ color: planet.hue }}>
            {planet.name}
          </span>
          <span className="st-chip text-neon-violet">
            {plan.practice ? 'Practice run' : `Piece ${piecesHere + 1} of ${PIECES_PER_PLANET}`}
          </span>
        </div>
        <button type="button" className="st-chip text-dim" onMouseDown={noFocus} onClick={pause} title="Pause (Esc)">
          ⏸ Pause
        </button>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col gap-3 px-4 pb-6">
        <Gauges
          shields={state.shields}
          maxShields={plan.maxShields}
          tank={state.tank}
          tankSize={plan.tank}
          spare={state.spare}
          stardust={earned}
          training={plan.training}
          clover={plan.gadgets.clover > 0}
          flare={plan.gadgets.flare > 0}
          wordsLeft={plan.mapLevel > 0 && state.status === 'flying' ? words.length : null}
        />

        <p className="st-message" aria-live="polite" data-testid="message">
          <span className="mr-2 text-dim" aria-hidden>
            📡
          </span>
          {message}
          {state.status === 'flying' && <span className="st-caret" aria-hidden />}
          {plan.mapLevel > 1 && words.length > 0 && (
            <span className="st-map-shape" aria-hidden data-testid="map-shape">
              {words.map((length, index) => (
                <span key={index} className="st-map-word" style={{ width: `${length * 0.62}em` }} />
              ))}
            </span>
          )}
        </p>

        <div className="relative">
          <TrailView plan={plan} state={state} ahead={ahead} hue={planet.hue} look={pilot.look} />
          {state.sparkle && (
            <div
              key={`sparkle-${state.sparkle.id}`}
              className="st-sparkle"
              style={{ '--drift-ms': `${plan.catchMs}ms` } as React.CSSProperties}
              data-testid="sparkle"
            >
              <SparkleSprite size={36} />
            </div>
          )}
          {plan.robotLevel > 0 && (
            <div className="absolute bottom-1 left-2" title="Your robot sidekick">
              <RobotSprite size={40} beeping={nearEnd && state.status === 'flying'} />
            </div>
          )}
          {pop && state.status === 'flying' && (
            <span key={`pop-${pop.seq}`} className="st-pop absolute left-[38%] top-2 font-black text-neon-gold neon-text">
              +{pop.amount} ✨
            </span>
          )}
          {state.status === 'found' && (
            <p className="st-rise absolute inset-x-0 top-1 text-center text-3xl font-black text-neon-gold neon-title">Found it!</p>
          )}
          {state.status === 'towed' && (
            <p className="st-rise absolute inset-x-0 top-1 text-center text-3xl font-black text-neon-amber neon-title">
              Out of fuel!
            </p>
          )}
        </div>

        <div className="flex min-h-9 flex-wrap items-center justify-center gap-2 text-center" aria-live="polite">
          <Hint plan={plan} capsHint={state.capsHint} offerSkip={state.offerSkip} sparkle={state.sparkle !== null} />
          {otherLayout && (
            <span className="text-sm text-dim">
              Heads up: your keyboard isn’t laid out like the one on screen (QWERTY), so the finger guide may not match.
            </span>
          )}
        </div>

        <div className="flex flex-col items-center gap-2">
          {keyboardOn ? (
            <NeonKeyboard nextChar={next} help={help} planet={planet} keyStats={pilot.keyStats} />
          ) : (
            <p className="flex h-40 items-center text-center text-dim">
              Eyes on the trail! The keyboard pops up if you slip.
            </p>
          )}
          {keyboardOn && help === 'letters' && <NeonHands nextChar={next} />}
        </div>
      </main>

      {state.paused && state.status === 'flying' && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-space-950/80 px-4" role="dialog" aria-label="Paused">
          <div className="st-panel flex max-w-sm flex-col items-center gap-4 p-6 text-center">
            <h2 className="neon-title text-3xl font-black text-neon-cyan">Paused</h2>
            <p className="text-dim">Press any key to keep flying.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <button type="button" className="st-button st-tone-lime st-button-md" onMouseDown={noFocus} onClick={resume}>
                Keep flying
              </button>
              <button type="button" className="st-button st-tone-violet st-button-md" onMouseDown={noFocus} onClick={abort}>
                Back to base
              </button>
            </div>
            {earned > 0 && <p className="text-sm text-dim">You’ll keep the ✨ {earned} stardust you’ve banked.</p>}
          </div>
        </div>
      )}
    </div>
  )
}

function Hint({ plan, capsHint, offerSkip, sparkle }: { plan: HuntPlan; capsHint: boolean; offerSkip: boolean; sparkle: boolean }) {
  if (capsHint) return <span className="st-chip text-neon-amber">Caps Lock is on — tap it once to turn it off</span>
  if (offerSkip) return <span className="st-chip text-neon-violet">Tricky one! Press → to skip it</span>
  if (sparkle && plan.nudgeOnly) return <span className="st-chip text-neon-gold">✨ A robot sidekick could grab that stardust!</span>
  if (sparkle) return <span className="st-chip text-neon-gold">Press {CATCH_KEY === 'ArrowUp' ? '↑' : keyLabel(CATCH_KEY)} to grab the stardust!</span>
  if (plan.training && plan.planetId === 1) {
    return <span className="text-sm text-dim">Rest your fingers on the home row — feel for the bumps on F and J.</span>
  }
  return null
}

/** "+3 ✨" pops as stardust is banked or caught. */
function useStardustPops(event: { kind: string; seq: number } | null, total: number) {
  const last = useRef(total)
  const [pop, setPop] = useState<{ seq: number; amount: number } | null>(null)
  useEffect(() => {
    const gained = total - last.current
    last.current = total
    if (event && gained > 0) setPop({ seq: event.seq, amount: gained })
  }, [event, total])
  return pop
}

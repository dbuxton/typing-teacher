import { useEffect, useMemo, useState } from 'react'
import { getPlanet, keyLabel, keysInWords, type Planet } from '../data/planets'
import { shipPart } from '../data/ship'
import { playSound } from '../engine/sound'
import { useStarTrail } from '../store/pilotStore'
import type { Pilot } from '../store/schema'
import { NeonButton, useEnterToContinue } from '../components/Chrome'
import { NeonHands } from '../components/NeonHands'
import { NeonKeyboard } from '../components/NeonKeyboard'
import { PlanetOrb } from '../components/Sprites'
import { Starfield } from '../components/Starfield'

/**
 * Landing on a planet: its new keys "power up" one by one. The kid presses each
 * glowing key with the finger shown — a gentle first meeting before the keys
 * turn up on a trail. On the first planet, F and J (the keys with the bumps)
 * come first, because every other key is found from them.
 */

/**
 * The order to power keys up in: the bumps first. Shift is learned by making
 * capitals — J with the LEFT Shift, F with the RIGHT — because the habit worth
 * forming is "Shift on the other hand from the letter".
 */
function powerOrder(keys: readonly string[]): string[] {
  if (keys.includes('Shift')) return ['J', 'F']
  const bumps = ['f', 'j'].filter((key) => keys.includes(key))
  return [...bumps, ...keys.filter((key) => !bumps.includes(key))]
}

function matches(eventKey: string, key: string): boolean {
  const capital = key !== key.toLowerCase()
  return capital ? eventKey === key : eventKey.toLowerCase() === key
}

/** What this planet's trails need, in words. */
function trailKeys(planet: Planet): string {
  if (planet.id === 1) return 'the home row'
  if (planet.newKeys.includes('Shift')) return 'capital letters, made with Shift'
  return `new keys: ${keysInWords(planet.newKeys)}`
}

function instruction(key: string, first: boolean, planetId: number): string {
  if (key === 'J') return 'Make a capital J: hold the LEFT Shift with your little finger, then press J.'
  if (key === 'F') return 'Now a capital F: hold the RIGHT Shift, then press F.'
  if (first && planetId === 1) return 'Find the bumps: press F with your left pointing finger.'
  return `Press ${keyLabel(key)} to power it up.`
}

export function Arrival({ pilot }: { pilot: Pilot }) {
  const plan = useStarTrail((s) => s.plan)
  const justLaunched = useStarTrail((s) => s.justLaunched)
  const finishIntro = useStarTrail((s) => s.finishIntro)
  const startHunt = useStarTrail((s) => s.startHunt)

  const planet = getPlanet(plan?.planetId ?? pilot.planet)
  const order = useMemo(() => powerOrder(planet.newKeys), [planet])
  const [powered, setPowered] = useState(0)
  const done = powered >= order.length
  const target = order[powered]

  useEffect(() => {
    if (justLaunched && pilot.sound) playSound('launch')
  }, [justLaunched, pilot.sound])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.repeat || done) return
      if (event.key === ' ' || event.key.length === 1) event.preventDefault()
      if (!matches(event.key, target)) return
      if (pilot.sound) playSound('power')
      setPowered((n) => n + 1)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [done, target, pilot.sound])

  function go() {
    if (!done) return
    const hadPlan = plan !== null
    finishIntro()
    if (!hadPlan) startHunt()
  }
  useEnterToContinue(go, 200)

  return (
    <div className="st-screen">
      <Starfield seed={planet.id * 7} />
      <main className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col items-center gap-5 px-4 py-8 text-center">
        <div className="st-rise flex flex-col items-center gap-2">
          <PlanetOrb hue={planet.hue} size={130} ringed={planet.id % 3 === 0} />
          <p className="text-dim">{justLaunched ? 'Touchdown!' : 'Your first planet'}</p>
          <h1 className="neon-title text-5xl font-black" style={{ color: planet.hue }}>
            Welcome to {planet.name}
          </h1>
          <p className="max-w-lg text-lg">
            The crew hid the Lost Ship’s <strong>{shipPart(planet.partId).name.toLowerCase()}</strong> here, in three
            pieces. Their trails use {trailKeys(planet)} — power {planet.newKeys.length === 1 ? 'it' : 'them'} up so your
            ship can read them.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2" aria-label="New keys">
          {order.map((key, index) => (
            <kbd
              key={key}
              data-power-key={key}
              data-powered={index < powered || undefined}
              className={`rounded-xl border-2 px-3 py-2 font-mono text-2xl font-black transition ${
                index < powered
                  ? 'border-neon-lime text-neon-lime neon-text'
                  : index === powered
                    ? 'border-neon-gold text-neon-gold'
                    : 'border-space-600 text-dim'
              }`}
            >
              {keyLabel(key)}
            </kbd>
          ))}
        </div>

        {done ? (
          <div className="st-rise flex flex-col items-center gap-2">
            <p className="text-2xl font-extrabold text-neon-lime">All systems go!</p>
            <NeonButton tone="lime" size="lg" onClick={go}>
              Start hunting 🔭
            </NeonButton>
            <span className="text-xs text-dim">or press Enter</span>
          </div>
        ) : (
          <p className="text-xl font-bold" aria-live="polite">
            {instruction(target, powered === 0, planet.id)}
          </p>
        )}

        {!done && (
          <div className="flex flex-col items-center gap-2">
            <NeonKeyboard nextChar={target} help="letters" planet={planet} keyStats={{}} />
            <NeonHands nextChar={target} />
          </div>
        )}
      </main>
    </div>
  )
}

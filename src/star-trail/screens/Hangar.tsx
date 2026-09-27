import { useState } from 'react'
import { getPlanet } from '../data/planets'
import { totalPieces, TOTAL_PIECES } from '../engine/settle'
import { useStarTrail } from '../store/pilotStore'
import { NeonButton } from '../components/Chrome'
import { ShipSprite } from '../components/Sprites'

const AVATARS = ['🧑‍🚀', '👩‍🚀', '👨‍🚀', '🤖', '👽', '🐙', '🦊', '🐱', '🐸', '🦄', '🐉', '🦉']

/** A phone or tablet with no mouse probably has no keyboard either. */
const touchOnly = typeof window !== 'undefined' && window.matchMedia?.('(hover: none) and (pointer: coarse)').matches

/**
 * The hangar: pick a pilot or make a new one. Several kids can share a computer,
 * each with their own ship, stardust and pieces of the Lost Ship.
 */
export function Hangar() {
  const pilots = useStarTrail((s) => s.save.pilots)
  const addPilot = useStarTrail((s) => s.addPilot)
  const selectPilot = useStarTrail((s) => s.selectPilot)
  const deletePilot = useStarTrail((s) => s.deletePilot)

  const [adding, setAdding] = useState(pilots.length === 0)
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState(AVATARS[0])

  function create() {
    const trimmed = name.trim()
    if (!trimmed) return
    addPilot(trimmed, avatar)
  }

  return (
    <main className="st-screen items-center justify-center gap-8 px-4 py-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <ShipSprite size={120} className="text-neon-cyan" />
        <h1 className="neon-title text-6xl font-black tracking-wide text-neon-cyan sm:text-7xl">Star Trail</h1>
        <p className="max-w-md text-lg text-dim">
          Follow the glowing letters across the galaxy and find the pieces of the Lost Ship.
        </p>
      </div>

      {touchOnly && (
        <p className="st-panel max-w-xl px-4 py-3 text-center text-neon-amber">
          Star Trail is a typing game, so you’ll need a real keyboard — plug one in, or fly from a computer.
        </p>
      )}

      {pilots.length > 0 && (
        <section className="flex w-full max-w-xl flex-col gap-3" aria-label="Pilots">
          {pilots.map((pilot) => (
            <div key={pilot.id} className="st-panel flex items-center gap-3 p-3">
              <button
                type="button"
                onClick={() => selectPilot(pilot.id)}
                className="flex flex-1 items-center gap-4 rounded-xl p-1 text-left hover:bg-white/5"
              >
                <span className="text-4xl">{pilot.avatar}</span>
                <span className="flex-1">
                  <span className="block text-xl font-extrabold">{pilot.name}</span>
                  <span className="block text-sm text-dim">
                    {getPlanet(pilot.planet).name} · {totalPieces(pilot)} of {TOTAL_PIECES} pieces · ✨ {pilot.stardust}
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Delete ${pilot.name}'s ship and everything they've found? This can't be undone.`)) {
                    deletePilot(pilot.id)
                  }
                }}
                className="rounded-full px-2 py-1 text-xs text-dim hover:text-neon-amber"
                title="Delete this pilot"
                aria-label={`Delete ${pilot.name}`}
              >
                ✕
              </button>
            </div>
          ))}
        </section>
      )}

      {adding ? (
        <form
          className="st-panel flex w-full max-w-xl flex-col gap-4 p-5"
          onSubmit={(event) => {
            event.preventDefault()
            create()
          }}
        >
          <h2 className="text-xl font-extrabold text-neon-pink">New pilot</h2>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Pilot name"
            maxLength={20}
            autoFocus
            className="rounded-xl border-2 border-space-600 bg-space-900 px-4 py-3 text-xl font-bold text-ink outline-none focus:border-neon-cyan"
          />
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Choose your pilot">
            {AVATARS.map((choice) => (
              <button
                key={choice}
                type="button"
                role="radio"
                aria-checked={choice === avatar}
                onClick={() => setAvatar(choice)}
                className={`rounded-xl border-2 p-2 text-3xl transition ${
                  choice === avatar ? 'border-neon-cyan bg-neon-cyan/15' : 'border-transparent hover:bg-white/5'
                }`}
              >
                {choice}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button type="submit" className="st-button st-tone-lime st-button-md" disabled={!name.trim()}>
              Launch! 🚀
            </button>
            {pilots.length > 0 && (
              <NeonButton tone="violet" onClick={() => setAdding(false)}>
                Cancel
              </NeonButton>
            )}
          </div>
        </form>
      ) : (
        <NeonButton tone="pink" onClick={() => setAdding(true)}>
          + New pilot
        </NeonButton>
      )}
    </main>
  )
}

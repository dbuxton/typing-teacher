import { GARDEN_PLOTS, PLANT_KINDS, isFullyGrown, plantEmoji, plantKindById } from '../data/plants'
import { useStore } from '../store/profileStore'
import type { Profile } from '../store/schema'

/**
 * The garden. Coins buy seeds, and every lesson makes every plant grow a bit.
 *
 * Nothing here ever wilts, dies, or nags. A kid who doesn't play for a fortnight
 * comes back to exactly the garden they left — the reward for practising is that
 * things grow, not that skipping is punished.
 */
export function GardenScreen({ profile }: { profile: Profile }) {
  const plantSeed = useStore((s) => s.plantSeed)
  const setScreen = useStore((s) => s.setScreen)

  const plots = Array.from({ length: GARDEN_PLOTS }, (_, i) => profile.garden[i] ?? null)
  const full = profile.garden.length >= GARDEN_PLOTS

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 pb-12">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-slate-800">Your garden</h2>
        <p className="text-slate-500">
          Every lesson you finish makes your plants grow a little bit more.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3 rounded-3xl bg-gradient-to-b from-emerald-100 to-amber-50 p-5 shadow-inner sm:grid-cols-6">
        {plots.map((plant, index) => (
          <div
            key={index}
            className="flex aspect-square items-center justify-center rounded-2xl bg-white/60 text-4xl"
            title={plant ? plantKindById(plant.kindId)?.name : 'Empty plot'}
          >
            {plant ? (
              <span className={isFullyGrown(plant.kindId, plant.stage) ? 'pop-in' : ''}>
                {plantEmoji(plant.kindId, plant.stage)}
              </span>
            ) : (
              <span className="text-2xl text-slate-300">·</span>
            )}
          </div>
        ))}
      </div>

      <div>
        <h3 className="mb-3 text-center text-xl font-bold text-slate-700">
          Seed shop {full && <span className="text-sm font-normal text-slate-400">(garden full!)</span>}
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {PLANT_KINDS.map((kind) => {
            const affordable = profile.coins >= kind.cost && !full
            return (
              <button
                key={kind.id}
                disabled={!affordable}
                onClick={() => plantSeed(kind.id)}
                className={`flex items-center gap-3 rounded-2xl p-4 shadow transition ${
                  affordable
                    ? 'bg-white hover:-translate-y-0.5 hover:shadow-lg'
                    : 'cursor-not-allowed bg-slate-100 opacity-60'
                }`}
              >
                <span className="text-3xl">{kind.stages[kind.stages.length - 1]}</span>
                <span className="text-left">
                  <span className="block font-bold">{kind.name}</span>
                  <span className="block text-sm text-yellow-700">🪙 {kind.cost}</span>
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <button
        onClick={() => setScreen('map')}
        className="mx-auto rounded-2xl bg-white px-6 py-3 font-bold text-slate-600 shadow transition hover:bg-slate-50"
      >
        ← Back to lessons
      </button>
    </div>
  )
}

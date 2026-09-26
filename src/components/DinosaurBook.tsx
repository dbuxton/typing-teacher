import { DINOSAUR_SPECIES } from '../data/rewards/dinosaurs'
import { isFullyGrown } from '../data/rewards'
import { RewardArt } from '../art/RewardArt'

/** Facts unlock from the saved collection, so they survive reloads and rearranging. */
export function DinosaurBook({ collection }: { collection: { kindId: string; stage: number }[] }) {
  const grown = new Set(collection.filter(item => isFullyGrown('dinosaurs', item.kindId, item.stage)).map(item => item.kindId))
  const discoveries = DINOSAUR_SPECIES.filter(dinosaur => grown.has(dinosaur.id))

  return (
    <details className="rounded-2xl bg-white p-4 shadow">
      <summary className="cursor-pointer text-lg font-bold text-slate-700">
        📖 Your dinosaur book · {discoveries.length}/{DINOSAUR_SPECIES.length}
      </summary>
      <p className="mt-2 text-sm text-slate-500">Grow a dinosaur to adulthood to discover its fun fact.</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {discoveries.map(dinosaur => (
          <article key={dinosaur.id} className="flex items-center gap-3 rounded-xl bg-lime-50 p-3">
            <span className="shrink-0"><RewardArt theme="dinosaurs" kindId={dinosaur.id} stage={3} size={64} /></span>
            <div className="min-w-0">
              <h3 className="break-words font-bold text-slate-700">{dinosaur.name}</h3>
              <p className="text-sm text-slate-600">{dinosaur.fact}</p>
              <a href={dinosaur.source} target="_blank" rel="noreferrer" className="text-xs text-teal-800 underline">Learn more</a>
            </div>
          </article>
        ))}
      </div>
    </details>
  )
}

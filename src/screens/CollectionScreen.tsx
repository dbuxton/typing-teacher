import { isFullyGrown, rewardStage, shopPreviewStage, themeById } from '../data/rewards'
import { RewardArt } from '../art/RewardArt'
import { useStore } from '../store/profileStore'
import type { Profile } from '../store/schema'

/**
 * The collection: a garden, a football squad or a Pokémon team, depending on the
 * theme the kid picked. Coins buy things, and every lesson makes each one grow,
 * train or evolve a bit.
 *
 * Nothing here ever wilts, dies, or nags. A kid who doesn't play for a fortnight
 * comes back to exactly the collection they left — the reward for practising is
 * that things grow, not that skipping is punished.
 */
export function CollectionScreen({ profile }: { profile: Profile }) {
  const collectReward = useStore((s) => s.collectReward)
  const setScreen = useStore((s) => s.setScreen)

  const theme = themeById(profile.theme)
  const slots = Array.from({ length: theme.slots }, (_, i) => profile.garden[i] ?? null)
  const full = profile.garden.length >= theme.slots
  const owned = new Set(profile.garden.map((p) => p.kindId))

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 pb-12">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-slate-800">{theme.collectionTitle}</h2>
        <p className="text-slate-500">{theme.collectionBlurb}</p>
      </div>

      <div className={`grid grid-cols-4 gap-3 rounded-3xl p-5 shadow-inner sm:grid-cols-6 ${theme.backdropClass}`}>
        {slots.map((item, index) => {
          const name = item ? rewardStage(theme.id, item.kindId, item.stage)?.name : undefined
          return (
            <div
              key={index}
              className="flex flex-col items-center justify-center gap-0.5 rounded-2xl bg-white/60 p-1"
              title={item ? name : theme.emptySlotLabel}
            >
              <div className="flex aspect-square w-full items-center justify-center">
                {item ? (
                  <span
                    className={`flex h-full w-full items-center justify-center ${
                      isFullyGrown(theme.id, item.kindId, item.stage) ? 'pop-in' : ''
                    }`}
                  >
                    {/* Drawn at full size, shrunk to fit on a narrow screen. */}
                    <RewardArt
                      theme={theme.id}
                      kindId={item.kindId}
                      stage={item.stage}
                      size={theme.id === 'football' ? 96 : 64}
                      className="h-auto max-h-full w-auto max-w-full"
                    />
                  </span>
                ) : (
                  <span className="text-2xl text-slate-300">·</span>
                )}
              </div>
              {/* Player names and evolution forms need a caption at tile size. */}
              {item && theme.id !== 'garden' && (
                <span className="line-clamp-2 w-full text-center text-[9px] leading-tight font-bold text-slate-600 sm:text-[10px]">
                  {name}
                </span>
              )}
            </div>
          )
        })}
      </div>

      <div>
        <h3 className="mb-3 text-center text-xl font-bold text-slate-700">
          {theme.shopTitle}{' '}
          {full && <span className="text-sm font-normal text-slate-400">(all full!)</span>}
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {theme.kinds.map((kind) => {
            const alreadyOwned = theme.unique && owned.has(kind.id)
            const affordable = profile.coins >= kind.cost && !full && !alreadyOwned
            const last = kind.stages[kind.stages.length - 1]
            return (
              <button
                key={kind.id}
                disabled={!affordable}
                onClick={() => collectReward(kind.id)}
                className={`flex items-center gap-3 rounded-2xl p-3 shadow transition ${
                  affordable
                    ? 'bg-white hover:-translate-y-0.5 hover:shadow-lg'
                    : 'cursor-not-allowed bg-slate-100 opacity-60'
                }`}
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center">
                  <RewardArt theme={theme.id} kindId={kind.id} stage={shopPreviewStage(theme, kind)} size={48} />
                </span>
                <span className="min-w-0 text-left">
                  <span className="block text-sm leading-tight font-bold sm:text-base">{kind.name}</span>
                  {theme.id === 'pokemon' && (
                    <span className="block text-xs text-slate-500">→ {last.name}</span>
                  )}
                  {alreadyOwned ? (
                    <span className="block text-sm font-bold text-emerald-700">✓ {theme.ownedLabel}</span>
                  ) : (
                    <span className="block text-sm text-yellow-700">🪙 {kind.cost}</span>
                  )}
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

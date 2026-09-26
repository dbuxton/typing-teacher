import { useState } from 'react'
import { collectionIsFull, collectionSlots, isFullyGrown, rewardStage, shopPreviewStage, themeById } from '../data/rewards'
import { RewardArt } from '../art/RewardArt'
import { useStore } from '../store/profileStore'
import type { Profile } from '../store/schema'
import { DinosaurBook } from '../components/DinosaurBook'

/**
 * The collection: plants, players, Pokémon, animals or dinosaurs, depending on the
 * theme the kid picked. Coins buy things, and every lesson makes each one grow,
 * train or evolve a bit.
 *
 * Nothing here ever wilts, dies, or nags. A kid who doesn't play for a fortnight
 * comes back to exactly the collection they left — the reward for practising is
 * that things grow, not that skipping is punished.
 */
export function CollectionScreen({ profile }: { profile: Profile }) {
  const collectReward = useStore((s) => s.collectReward)
  const swapRewards = useStore((s) => s.swapRewards)
  const setScreen = useStore((s) => s.setScreen)
  const [group, setGroup] = useState('all')
  const [arranging, setArranging] = useState(false)
  const [selectedSpot, setSelectedSpot] = useState<number | null>(null)

  const theme = themeById(profile.theme)
  const slots = Array.from({ length: collectionSlots(theme, profile.garden.length) }, (_, i) => profile.garden[i] ?? null)
  const full = collectionIsFull(theme, profile.garden.length)
  const owned = new Set(profile.garden.map((p) => p.kindId))
  const groups = [...new Set(theme.kinds.flatMap(kind => kind.group ? [kind.group] : []))]
  const shopKinds = groups.length && group !== 'all' ? theme.kinds.filter(kind => kind.group === group) : theme.kinds

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 pb-12">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-slate-800">{theme.collectionTitle}</h2>
        <p className="text-slate-500">{theme.collectionBlurb}</p>
        {!theme.unique && <p className="mt-2 text-sm text-slate-500">More spaces appear as your collection grows.</p>}
        {theme.id === 'dinosaurs' && profile.garden.length > 1 && (
          <div className="mt-3">
            <button aria-pressed={arranging} onClick={() => { setArranging(!arranging); setSelectedSpot(null) }}
              className="rounded-full bg-white px-4 py-2 text-sm font-bold text-teal-800 shadow-sm">
              {arranging ? 'Done arranging' : 'Arrange island'}
            </button>
            {arranging && <p role="status" className="mt-2 text-sm text-teal-800">
              {selectedSpot === null ? 'Choose a dinosaur to move.' : 'Choose another dinosaur to swap their spots.'}
            </p>}
          </div>
        )}
      </div>

      <div aria-label="Your collection" className={`grid grid-cols-3 gap-3 rounded-3xl p-5 shadow-inner sm:grid-cols-6 ${theme.backdropClass}`}>
        {slots.map((item, index) => {
          const name = item ? rewardStage(theme.id, item.kindId, item.stage)?.name : undefined
          return (
            <div
              key={index}
              className={`relative flex flex-col items-center justify-center gap-0.5 rounded-2xl bg-white/60 p-1 ${arranging && selectedSpot === index ? 'ring-2 ring-teal-600' : ''}`}
              title={item ? name : theme.emptySlotLabel}
            >
              {arranging && item && <button
                aria-label={`${selectedSpot === null ? 'Move' : 'Swap with'} ${name}, spot ${index + 1}`}
                aria-pressed={selectedSpot === index}
                onClick={() => {
                  if (selectedSpot === null) setSelectedSpot(index)
                  else { swapRewards(selectedSpot, index); setSelectedSpot(null) }
                }}
                className="absolute inset-0 z-10 rounded-2xl hover:bg-teal-100/30 focus-visible:outline-2 focus-visible:outline-teal-700"
              />}
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
                      size={theme.id === 'football' || theme.id === 'animals' || theme.id === 'dinosaurs' ? 96 : 64}
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

      {theme.id === 'dinosaurs' && <DinosaurBook collection={profile.garden} />}

      <div>
        <h3 className="mb-3 text-center text-xl font-bold text-slate-700">
          {theme.shopTitle}{' '}
          {full && <span className="text-sm font-normal text-slate-400">(all full!)</span>}
        </h3>
        {groups.length > 0 && (
          <div role="group" aria-label={theme.id === 'dinosaurs' ? 'Dinosaur types' : 'Animal types'} className="mb-4 flex flex-wrap justify-center gap-2">
            {['all', ...groups].map(option => (
              <button key={option} aria-pressed={group === option} onClick={() => setGroup(option)}
                className={`rounded-full px-4 py-2 text-sm font-bold transition ${group === option ? 'bg-teal-700 text-white' : 'bg-white text-slate-600 shadow-sm hover:bg-teal-50'}`}>
                {option === 'all' ? (theme.id === 'dinosaurs' ? 'All dinosaurs' : 'All animals') : option}
              </button>
            ))}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {shopKinds.map((kind) => {
            const alreadyOwned = theme.unique && owned.has(kind.id)
            const affordable = profile.coins >= kind.cost && !full && !alreadyOwned
            const last = kind.stages[kind.stages.length - 1]
            return (
              <button
                key={kind.id}
                disabled={!affordable}
                onClick={() => collectReward(kind.id)}
                className={`flex items-center rounded-2xl p-3 shadow transition ${theme.id === 'dinosaurs' ? 'flex-col gap-2 sm:flex-row sm:gap-3' : 'gap-3'} ${
                  affordable
                    ? 'bg-white hover:-translate-y-0.5 hover:shadow-lg'
                    : 'cursor-not-allowed bg-slate-100 opacity-60'
                }`}
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center">
                  <RewardArt theme={theme.id} kindId={kind.id} stage={shopPreviewStage(theme, kind)} size={48} />
                </span>
                <span className={`min-w-0 ${theme.id === 'dinosaurs' ? 'w-full text-center sm:w-auto sm:text-left' : 'text-left'}`}>
                  <span className="block break-words text-sm leading-tight font-bold sm:text-base">{kind.name}</span>
                  {theme.id === 'dinosaurs' && <span className="block text-xs text-slate-500">Start with an egg</span>}
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

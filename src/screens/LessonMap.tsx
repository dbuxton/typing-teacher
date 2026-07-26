import { LEVELS } from '../data/curriculum'
import { ASSIST_LABELS } from '../engine/scoring'
import { useStore } from '../store/profileStore'
import type { Profile } from '../store/schema'
import { BigButton } from '../components/Chrome'

/** The level map — a path of stepping stones, locked ones greyed out. */
export function LessonMap({ profile }: { profile: Profile }) {
  const setLevel = useStore((s) => s.setLevel)
  const setScreen = useStore((s) => s.setScreen)
  const toggleSneakyStars = useStore((s) => s.toggleSneakyStars)
  const toggleReadAloud = useStore((s) => s.toggleReadAloud)

  function start(levelId: number) {
    setLevel(levelId)
    setScreen('lesson')
  }

  const best = (levelId: number) =>
    profile.history
      .filter((h) => h.levelId === levelId)
      .reduce((max, h) => Math.max(max, h.stars), 0)

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 pb-12">
      <div className="flex flex-col items-center gap-2 text-center">
        <h2 className="text-3xl font-extrabold text-slate-800">Choose a lesson</h2>
        <p className="text-slate-500">
          Keyboard help: <strong>{ASSIST_LABELS[profile.assistLevel]}</strong>
        </p>
      </div>

      <div className="flex justify-center">
        <BigButton onClick={() => start(profile.currentLevel)}>
          ▶ Carry on with Level {profile.currentLevel}
        </BigButton>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {LEVELS.map((level) => {
          const locked = level.id > profile.highestLevelUnlocked
          const stars = best(level.id)
          return (
            <button
              key={level.id}
              disabled={locked}
              onClick={() => start(level.id)}
              className={`flex flex-col items-start gap-1 rounded-2xl p-4 text-left shadow transition ${
                locked
                  ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                  : 'bg-white hover:-translate-y-0.5 hover:shadow-lg'
              }`}
            >
              <span className="text-xs font-bold text-slate-400">Level {level.id}</span>
              <span className="font-bold">{locked ? '🔒 Locked' : level.name}</span>
              <span className="text-sm text-slate-500">
                {level.newKeys.length > 0
                  ? level.newKeys.filter((k) => k !== 'Shift').join(' ').toUpperCase() || 'Shift'
                  : 'Everything!'}
              </span>
              <span className="text-amber-400">
                {stars > 0 ? '⭐'.repeat(stars) : <span className="text-slate-300">☆☆☆</span>}
              </span>
            </button>
          )
        })}
      </div>

      <div className="mx-auto flex flex-wrap justify-center gap-2">
        <label className="flex cursor-pointer items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm text-slate-600 shadow-sm">
          <input
            type="checkbox"
            checked={profile.sneakyStars}
            onChange={toggleSneakyStars}
            className="h-4 w-4 accent-sky-500"
          />
          Sneaky Stars (the eyes-up game)
        </label>
        <label className="flex cursor-pointer items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm text-slate-600 shadow-sm">
          <input
            type="checkbox"
            checked={profile.readAloud}
            onChange={toggleReadAloud}
            className="h-4 w-4 accent-amber-500"
          />
          Say spelling words out loud
        </label>
      </div>
    </div>
  )
}

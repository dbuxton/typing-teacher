import { BADGES } from '../data/badges'
import { ASSIST_LABELS } from '../engine/scoring'
import { useStore } from '../store/profileStore'
import type { Profile } from '../store/schema'

/** The badge shelf: earned badges in colour, the rest as greyed-out targets. */
export function BadgeShelf({ profile }: { profile: Profile }) {
  const setScreen = useStore((s) => s.setScreen)
  const earned = new Set(profile.badges)

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 pb-12">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-slate-800">Your badges</h2>
        <p className="text-slate-500">
          {earned.size} of {BADGES.length} collected
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {BADGES.map((badge) => {
          const has = earned.has(badge.id)
          return (
            <div
              key={badge.id}
              className={`flex flex-col items-center gap-1 rounded-2xl p-4 text-center shadow transition ${
                has ? 'bg-white' : 'bg-slate-100'
              }`}
            >
              <span className={`text-4xl ${has ? '' : 'opacity-25 grayscale'}`}>{badge.emoji}</span>
              <span className={`font-bold ${has ? 'text-slate-700' : 'text-slate-400'}`}>
                {badge.name}
              </span>
              <span className="text-xs text-slate-400">{badge.how}</span>
              {badge.rare && (
                <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-600">
                  RARE
                </span>
              )}
            </div>
          )
        })}
      </div>

      <div className="rounded-2xl bg-white/70 p-4 text-center text-sm text-slate-500">
        <p>
          Lessons finished: <strong>{profile.lessonsCompleted}</strong> · Words typed:{' '}
          <strong>{profile.totalWordsTyped}</strong> · Spelling Stars:{' '}
          <strong>{profile.spellingWordsCorrect}</strong>
        </p>
        <p className="mt-1">
          Keyboard help: <strong>{ASSIST_LABELS[profile.assistLevel]}</strong>
        </p>
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

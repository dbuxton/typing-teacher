import type { Profile } from '../store/schema'
import { useStore } from '../store/profileStore'

/** Small shared bits of furniture: the top bar, coins, streak flame, buttons. */

export function StreakFlame({ streak }: { streak: number }) {
  if (streak <= 0) return null
  return (
    <span
      className="flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-sm font-bold text-orange-700"
      title={`${streak} day${streak === 1 ? '' : 's'} in a row`}
    >
      🔥 {streak}
    </span>
  )
}

export function CoinCount({ coins }: { coins: number }) {
  return (
    <span className="flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-sm font-bold text-yellow-700">
      🪙 {coins}
    </span>
  )
}

export function TopBar({ profile }: { profile: Profile }) {
  const setScreen = useStore((s) => s.setScreen)
  const screen = useStore((s) => s.screen)

  return (
    <header className="flex w-full items-center justify-between gap-2 px-4 py-3">
      <button
        onClick={() => setScreen('map')}
        className="flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 text-sm font-bold shadow-sm transition hover:bg-white"
      >
        <span className="text-xl">{profile.avatar}</span>
        <span>{profile.name}</span>
      </button>

      <div className="flex items-center gap-2">
        <StreakFlame streak={profile.streak} />
        <CoinCount coins={profile.coins} />
        {screen !== 'garden' && (
          <button
            onClick={() => setScreen('garden')}
            className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700 transition hover:bg-emerald-200"
          >
            🌻 Garden
          </button>
        )}
        {screen !== 'badges' && (
          <button
            onClick={() => setScreen('badges')}
            className="rounded-full bg-violet-100 px-3 py-1 text-sm font-bold text-violet-700 transition hover:bg-violet-200"
          >
            🏅 Badges
          </button>
        )}
      </div>
    </header>
  )
}

export function BigButton({
  children,
  onClick,
  tone = 'primary',
  disabled,
}: {
  children: React.ReactNode
  onClick: () => void
  tone?: 'primary' | 'secondary'
  disabled?: boolean
}) {
  const tones = {
    primary: 'bg-sky-500 hover:bg-sky-600 text-white shadow-lg',
    secondary: 'bg-white hover:bg-slate-50 text-slate-700 shadow',
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-2xl px-7 py-3 text-lg font-bold transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${tones[tone]}`}
    >
      {children}
    </button>
  )
}

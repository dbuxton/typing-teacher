import { badgeById } from '../data/badges'
import { demotionMessage, promotionMessage } from '../engine/assist'
import { praiseFor, speedComment } from '../engine/scoring'
import { easierLevelMessage, jumpMessage } from '../engine/adaptive'
import { useStore } from '../store/profileStore'
import type { AssistLevel, Profile } from '../store/schema'
import { BigButton } from '../components/Chrome'

/**
 * Results, ordered on purpose: Sneaky Stars first, accuracy second, speed last
 * and smallest. Whatever we put at the top is what the kid will try to improve
 * next time, and speed is the thing we least want them chasing.
 */
export function Results({ profile }: { profile: Profile }) {
  const result = useStore((s) => s.lastResult)
  const setScreen = useStore((s) => s.setScreen)
  const setLevel = useStore((s) => s.setLevel)

  if (!result) {
    setScreen('map')
    return null
  }

  const jumpNote = jumpMessage(result.levelJump)

  function playLevel(levelId: number) {
    setLevel(levelId)
    setScreen('lesson')
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-5 p-6">
      <div className="pop-in text-6xl">
        {'⭐'.repeat(result.stars)}
        <span className="text-slate-200">{'☆'.repeat(3 - result.stars)}</span>
      </div>

      <p className="text-center text-xl font-bold text-slate-700">{praiseFor(result)}</p>

      {/* Levelled up — and by how much, since a multi-level jump deserves noise */}
      {jumpNote && (
        <div className="pop-in w-full rounded-2xl bg-emerald-50 p-4 text-center ring-2 ring-emerald-200">
          <p className="font-bold text-emerald-800">{jumpNote}</p>
        </div>
      )}

      {/* 1. Eyes up — the headline */}
      {result.sneakyStarsTotal > 0 && (
        <div className="w-full rounded-2xl bg-amber-50 p-5 text-center ring-2 ring-amber-200">
          <p className="text-sm font-bold tracking-wide text-amber-700 uppercase">Eyes on the screen</p>
          <p className="mt-1 text-4xl font-extrabold text-amber-900">
            {result.sneakyStarsCaught}/{result.sneakyStarsTotal}
          </p>
          <p className="text-sm text-amber-700">
            {result.sneakyStarsCaught === result.sneakyStarsTotal
              ? 'You spotted every Sneaky Star! 🦅'
              : 'Sneaky Stars spotted — watch the screen to catch more.'}
          </p>
        </div>
      )}

      {/* 2. Accuracy */}
      <div className="grid w-full grid-cols-2 gap-3">
        <Stat
          label="Accuracy"
          value={`${Math.round(result.accuracy * 100)}%`}
          tone="text-emerald-600"
        />
        <Stat
          label="Spelling Stars"
          value={
            result.spellingTotal > 0
              ? `${result.spellingCorrect}/${result.spellingTotal}`
              : '—'
          }
          tone="text-violet-600"
        />
      </div>

      {/* 3. Speed, last and smallest */}
      <div className="text-center text-sm text-slate-400">
        {Math.round(result.wpm)} words per minute ·{' '}
        {speedComment(result.wpm, profile.personalWpm)}
      </div>

      <div className="rounded-full bg-yellow-100 px-4 py-2 font-bold text-yellow-700">
        🪙 +{result.coinsEarned} coins
      </div>

      {result.assistChangedTo && (
        <div className="pop-in w-full rounded-2xl bg-sky-50 p-4 text-center ring-2 ring-sky-200">
          <p className="font-bold text-sky-800">
            {result.assistEased ? 'Keyboard help is back' : 'Keyboard help changed!'}
          </p>
          <p className="text-sm text-sky-700">
            {result.assistEased
              ? demotionMessage(result.assistChangedTo as AssistLevel)
              : promotionMessage(result.assistChangedTo as AssistLevel)}
          </p>
        </div>
      )}

      {result.newBadges.length > 0 && (
        <div className="pop-in w-full rounded-2xl bg-violet-50 p-4 ring-2 ring-violet-200">
          <p className="mb-2 text-center font-bold text-violet-800">New badge!</p>
          <div className="flex flex-wrap justify-center gap-3">
            {result.newBadges.map((id) => {
              const badge = badgeById(id)
              if (!badge) return null
              return (
                <div key={id} className="flex flex-col items-center">
                  <span className="text-4xl">{badge.emoji}</span>
                  <span className="text-xs font-bold text-violet-700">{badge.name}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/*
        Struggling: offer an easier level, as the primary button. It's an offer,
        never a demotion — carrying on where they are is right there next to it.
      */}
      {result.offerEasierLevel !== null && (
        <div className="w-full rounded-2xl bg-white p-4 text-center shadow">
          <p className="mb-3 text-slate-600">{easierLevelMessage(result.offerEasierLevel)}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <BigButton onClick={() => playLevel(result.offerEasierLevel!)}>
              Yes, Level {result.offerEasierLevel}
            </BigButton>
            <BigButton tone="secondary" onClick={() => playLevel(result.levelId)}>
              No, stay here
            </BigButton>
          </div>
        </div>
      )}

      <div className="mt-2 flex flex-wrap justify-center gap-3">
        {result.offerEasierLevel === null && (
          <BigButton onClick={() => setScreen('lesson')}>Another go!</BigButton>
        )}
        <BigButton tone="secondary" onClick={() => setScreen('map')}>
          Lesson map
        </BigButton>
        {profile.coins > 0 && (
          <BigButton tone="secondary" onClick={() => setScreen('garden')}>
            🌻 Spend coins
          </BigButton>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 text-center shadow">
      <p className="text-xs font-bold tracking-wide text-slate-400 uppercase">{label}</p>
      <p className={`text-3xl font-extrabold ${tone}`}>{value}</p>
    </div>
  )
}

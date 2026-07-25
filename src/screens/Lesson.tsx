import { useCallback, useMemo, useRef } from 'react'
import { getLevel } from '../data/curriculum'
import { generateLesson } from '../engine/generator'
import { useTypingSession, type SessionState } from '../engine/useTypingSession'
import { effectiveAssist, showsKeyboard } from '../engine/assist'
import { accuracyOf, coinsFor, starsFor, wpmOf, type LessonStats } from '../engine/scoring'
import { useStore } from '../store/profileStore'
import type { Profile } from '../store/schema'
import { Keyboard } from '../components/Keyboard'
import { Hands } from '../components/Hands'
import { TypingArea, ItemKindLabel } from '../components/TypingArea'
import { SneakyStar, CatchKeyHint } from '../components/SneakyStar'
import { SpellingCard } from '../components/SpellingCard'

export function Lesson({ profile }: { profile: Profile }) {
  const recordLesson = useStore((s) => s.recordLesson)
  const setScreen = useStore((s) => s.setScreen)

  const level = getLevel(profile.currentLevel)

  // One seed per mounted lesson: regenerating on every render would reshuffle
  // the words under the kid's fingers.
  const seed = useRef(Math.floor(Math.random() * 2 ** 31)).current
  const items = useMemo(
    () => generateLesson(profile, level.id, seed),
    // profile deliberately omitted: the lesson is fixed once it starts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [level.id, seed],
  )

  const onFinish = useCallback(
    (state: SessionState) => {
      const elapsedMs =
        state.startedAt && state.finishedAt ? state.finishedAt - state.startedAt : 1

      const stats: LessonStats = {
        correctChars: state.correctChars,
        errorChars: state.errorChars,
        elapsedMs,
        sneakyStarsCaught: state.sneakyStarsCaught,
        sneakyStarsTotal: state.sneakyStarsShown,
      }
      const stars = starsFor(stats)
      const spellingCorrect = state.spellingAnswers.filter((a) => a.correct).length

      recordLesson({
        levelId: level.id,
        accuracy: accuracyOf(stats),
        wpm: wpmOf(stats),
        stars,
        coins: coinsFor(stats, spellingCorrect, stars),
        sneakyStarsCaught: state.sneakyStarsCaught,
        sneakyStarsTotal: state.sneakyStarsShown,
        spellingAnswers: state.spellingAnswers,
        // Accumulated across the whole lesson by the session reducer.
        keyErrors: state.keyErrors,
        wordsTyped: items.reduce((sum, item) => sum + item.text.split(' ').length, 0),
        charsTyped: state.correctChars,
      })
    },
    [items, level.id, recordLesson],
  )

  const { state, item, nextChar, charStates, catchKey, skipReveal, totalItems } = useTypingSession({
    items,
    levelId: level.id,
    sneakyStarsEnabled: profile.sneakyStars,
    seed,
    onFinish,
  })

  if (!item) return null

  const assist = effectiveAssist(profile.assistLevel, state.consecutiveMisses)
  const keyboardVisible = showsKeyboard(assist, state.recentlyMissed)
  const progress = (state.itemIndex / totalItems) * 100

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 p-4">
      {/* progress */}
      <div className="flex w-full items-center gap-3">
        <button
          onClick={() => setScreen('map')}
          className="rounded-full bg-white/70 px-3 py-1 text-sm font-bold text-slate-500 shadow-sm transition hover:bg-white"
        >
          ← Back
        </button>
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/70">
          <div
            className="h-full rounded-full bg-emerald-400 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm font-bold text-slate-500">
          {state.itemIndex + 1}/{totalItems}
        </span>
      </div>

      <div className="flex w-full items-center justify-between">
        <ItemKindLabel kind={item.kind} />
        {profile.sneakyStars && (
          <CatchKeyHint catchKey={catchKey} caught={state.sneakyStarsCaught} />
        )}
      </div>

      {/* the text — eyes live here */}
      <div
        className={`relative flex min-h-36 w-full items-center justify-center rounded-3xl bg-white p-6 shadow-lg ${
          state.consecutiveMisses > 0 ? 'wobble' : ''
        }`}
      >
        <SneakyStar visible={state.starVisible} />
        {state.revealing ? (
          <SpellingCard item={item} onSkip={skipReveal} />
        ) : (
          <TypingArea item={item} charStates={charStates} hidden={false} />
        )}
      </div>

      {item.kind === 'spelling' && !state.revealing && (
        <p className="text-sm text-amber-700">
          ⭐ Type it from memory — {item.hint?.replace('___', '…')}
        </p>
      )}

      {/* the keyboard sits right under the text: a short glance, not a head turn */}
      <div className="min-h-56">
        <Keyboard nextChar={nextChar} assist={assist} visible={keyboardVisible} />
        {keyboardVisible && <Hands nextChar={nextChar} />}
      </div>
    </div>
  )
}

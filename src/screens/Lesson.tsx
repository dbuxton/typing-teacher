import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { SpellingCard, SayAgainButton } from '../components/SpellingCard'
import { lessonShapeFor } from '../engine/adaptive'
import { isSpeechAvailable } from '../engine/speech'

export function Lesson({ profile }: { profile: Profile }) {
  const recordLesson = useStore((s) => s.recordLesson)
  const setScreen = useStore((s) => s.setScreen)

  const level = getLevel(profile.currentLevel)
  const shape = lessonShapeFor(profile.difficulty, level.itemCount)

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
        // Speed is judged against this kid's own target, never an absolute.
        targetWpm: profile.personalWpm,
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
        // Accumulated across the whole lesson by the session reducer. Attempts
        // as well as errors, so weak keys are measured as a rate.
        keyErrors: state.keyErrors,
        keyAttempts: state.keyAttempts,
        wordsTyped: items.reduce((sum, item) => sum + item.text.split(' ').length, 0),
        charsTyped: state.correctChars,
      })
    },
    [items, level.id, recordLesson, profile.personalWpm],
  )

  const { state, item, nextChar, charStates, catchKey, skipReveal, skipChar, totalItems } =
    useTypingSession({
      items,
      levelId: level.id,
      sneakyStarsEnabled: profile.sneakyStars,
      sneakyStarCount: shape.sneakyStars,
      seed,
      onFinish,
    })

  // Whether the kid has asked to see the current hidden spelling word.
  const [revealed, setRevealed] = useState(false)
  useEffect(() => setRevealed(false), [state.itemIndex])

  if (!item) return null

  const assist = effectiveAssist(profile.assistLevel, state.consecutiveMisses)
  const keyboardVisible = showsKeyboard(assist, state.recentlyMissed)
  const progress = (state.itemIndex / totalItems) * 100

  // A spelling word is hidden only when we can actually speak it and the kid has
  // met it before — otherwise there'd be no way to know what to type.
  //
  // `revealed` is the escape hatch: some browsers report speech support but have
  // no voices installed, so the kid would hear nothing and be stuck spelling a
  // word they were never told. One tap always gets them out.
  const spellingIsHidden =
    item.kind === 'spelling' &&
    profile.readAloud &&
    isSpeechAvailable() &&
    !item.firstEncounter &&
    !revealed

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
          <SpellingCard item={item} readAloud={profile.readAloud} onSkip={skipReveal} />
        ) : (
          <TypingArea
            item={item}
            charStates={charStates}
            hidden={false}
            // A spoken word must stay hidden while they type it, or it's a
            // reading exercise rather than a spelling one.
            mask={spellingIsHidden}
            cursor={state.cursor}
          />
        )}
      </div>

      {item.kind === 'spelling' && !state.revealing && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-amber-700">
            ⭐ {spellingIsHidden ? 'Spell what you heard' : 'Type it from memory'} —{' '}
            {item.hint?.replace('___', '…')}
          </p>
          {spellingIsHidden && (
            <div className="flex items-center gap-2">
              <SayAgainButton word={item.text} hint={item.hint} />
              <button
                onClick={() => setRevealed(true)}
                className="rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-slate-500 shadow-sm transition hover:bg-white"
              >
                👁 Show me
              </button>
            </div>
          )}
        </div>
      )}

      {/* The way out of a key they genuinely cannot find. Never a dead end. */}
      {state.offerSkip && (
        <button
          onClick={skipChar}
          className="pop-in rounded-full bg-sky-100 px-4 py-2 text-sm font-bold text-sky-700 shadow-sm transition hover:bg-sky-200"
        >
          Tricky one! Press → to skip it
        </button>
      )}

      {/*
        The keyboard sits right under the text: a short glance, not a head turn.

        During a hidden spelling word the next-key highlight is suppressed — it
        would spell the word out one pulsing key at a time, turning the spelling
        test into a follow-the-lights exercise. The keyboard stays visible as a
        finger reference; it just stops giving the answer away.
      */}
      <div className="min-h-56">
        <Keyboard
          nextChar={spellingIsHidden ? undefined : nextChar}
          assist={assist}
          visible={keyboardVisible}
        />
        {keyboardVisible && <Hands nextChar={spellingIsHidden ? undefined : nextChar} />}
      </div>
    </div>
  )
}

import { useEffect } from 'react'
import type { LessonItem } from '../engine/generator'
import { isSpeechAvailable, speak, speakWordWithHint } from '../engine/speech'

/**
 * The Spelling Star card.
 *
 * Two modes, because being able to read a word is not the same as being able to
 * spell it:
 *
 * - **First time the kid meets a word** — show it. You have to teach a word
 *   before you can test it.
 * - **Every time after** — say it out loud and keep it hidden. The kid spells
 *   from sound, which is a real spelling test rather than a copying exercise.
 *
 * If the browser can't speak (or the grown-up switched it off) it falls back to
 * showing the word, because an unspellable silent card is just a dead end.
 */

type Props = {
  item: LessonItem
  readAloud: boolean
  onSkip: () => void
}

export function SpellingCard({ item, readAloud, onSkip }: Props) {
  const canSpeak = readAloud && isSpeechAvailable()
  // Hide the word only when we can actually say it AND they've met it before.
  const hideWord = canSpeak && !item.firstEncounter

  const [before, after] = (item.hint ?? '___').split('___')

  useEffect(() => {
    if (!canSpeak) return
    speakWordWithHint(item.text, item.hint)
  }, [canSpeak, item.text, item.hint])

  return (
    <div className="pop-in flex flex-col items-center gap-4 rounded-3xl bg-amber-50 px-8 py-6 ring-4 ring-amber-200">
      <p className="text-sm font-bold tracking-wide text-amber-700 uppercase">
        {hideWord ? '⭐ Spelling Star — listen!' : '⭐ Spelling Star — remember it!'}
      </p>

      {hideWord ? (
        <p className="type-text text-5xl tracking-widest text-amber-300">
          {'•'.repeat(item.text.length)}
        </p>
      ) : (
        <p className="type-text text-5xl text-amber-900">{item.text}</p>
      )}

      <p className="max-w-md text-center text-lg text-amber-800">
        {before}
        {hideWord ? (
          <strong className="underline decoration-amber-400 decoration-4">
            {' '.repeat(4)}
          </strong>
        ) : (
          <strong className="underline decoration-amber-400 decoration-4">{item.text}</strong>
        )}
        {after}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {canSpeak && (
          <button
            onClick={() => speakWordWithHint(item.text, item.hint)}
            className="rounded-full bg-white px-4 py-2 text-sm font-bold text-amber-700 shadow transition hover:bg-amber-100"
          >
            🔊 Say it again
          </button>
        )}
        <button
          onClick={onSkip}
          className="rounded-full bg-amber-500 px-5 py-2 text-sm font-bold text-white shadow transition hover:bg-amber-600"
        >
          {hideWord ? "I'm ready" : 'Got it!'}
        </button>
      </div>
    </div>
  )
}

/** The little "say it again" button shown while they're typing the hidden word. */
export function SayAgainButton({ word, hint }: { word: string; hint?: string }) {
  if (!isSpeechAvailable()) return null
  return (
    <button
      onClick={() => speak(hint ? hint.replace('___', word) : word)}
      className="rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-amber-700 shadow-sm transition hover:bg-white"
    >
      🔊 Say it again
    </button>
  )
}

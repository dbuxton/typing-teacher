import type { LessonItem } from '../engine/generator'

/**
 * The Spelling Star reveal: the word, big, in a sentence that gives it meaning,
 * for a couple of seconds. Then it hides and the kid types it from memory.
 *
 * The hint sentence matters — "friend" learned inside "My best friend came to
 * play" sticks better than "friend" learned as seven letters in a row.
 */

export function SpellingCard({ item, onSkip }: { item: LessonItem; onSkip: () => void }) {
  const [before, after] = (item.hint ?? '___').split('___')

  return (
    <div className="pop-in flex flex-col items-center gap-4 rounded-3xl bg-amber-50 px-8 py-6 ring-4 ring-amber-200">
      <p className="text-sm font-bold tracking-wide text-amber-700 uppercase">
        ⭐ Spelling Star — remember it!
      </p>
      <p className="type-text text-5xl text-amber-900">{item.text}</p>
      <p className="max-w-md text-center text-lg text-amber-800">
        {before}
        <strong className="underline decoration-amber-400 decoration-4">{item.text}</strong>
        {after}
      </p>
      <button
        onClick={onSkip}
        className="rounded-full bg-amber-500 px-5 py-2 text-sm font-bold text-white shadow transition hover:bg-amber-600"
      >
        Got it!
      </button>
    </div>
  )
}

import { memo } from 'react'
import type { CharState } from '../engine/useTypingSession'
import type { LessonItem } from '../engine/generator'

/**
 * The text being typed. Only the current word is at full contrast — you can't
 * coast on having memorised the line, you have to be looking at it.
 *
 * Mistakes are amber, never red, and never marked with a cross. A 7-year-old
 * reads a red X as "you are bad at this"; amber reads as "not that one, try
 * again", which is what we actually mean.
 */

const CHAR_CLASS: Record<CharState, string> = {
  pending: 'text-slate-400',
  correct: 'text-emerald-600',
  wrong: 'bg-amber-200 text-amber-900 rounded',
  current: 'bg-sky-500 text-white rounded',
}

function Char({ char, state }: { char: string; state: CharState }) {
  // A space needs visible width when it's highlighted as the current
  // character, so it is drawn as a non-breaking space.
  const display = char === ' ' ? '\u00A0' : char
  return <span className={`${CHAR_CLASS[state]} px-0.5 py-1`}>{display}</span>
}

const MemoChar = memo(Char)

type Props = {
  item: LessonItem
  charStates: CharState[]
  hidden: boolean
}

function TypingAreaImpl({ item, charStates, hidden }: Props) {
  if (hidden) {
    // Spelling item: the word is behind the reveal card, so show placeholders.
    return (
      <p className="type-text text-3xl tracking-widest text-slate-300 sm:text-4xl">
        {item.text.split('').map((_, i) => (
          <span key={i} className="px-0.5">
            _
          </span>
        ))}
      </p>
    )
  }

  return (
    <p className="type-text text-3xl leading-relaxed break-words sm:text-4xl">
      {item.text.split('').map((char, index) => (
        <MemoChar key={index} char={char} state={charStates[index] ?? 'pending'} />
      ))}
    </p>
  )
}

export const TypingArea = memo(TypingAreaImpl)

export function ItemKindLabel({ kind }: { kind: LessonItem['kind'] }) {
  const labels: Record<LessonItem['kind'], { text: string; className: string }> = {
    drill: { text: '🤸 Warm-up', className: 'bg-slate-100 text-slate-600' },
    word: { text: '✏️ Word', className: 'bg-sky-100 text-sky-700' },
    sentence: { text: '📖 Sentence', className: 'bg-violet-100 text-violet-700' },
    spelling: { text: '⭐ Spelling Star', className: 'bg-amber-100 text-amber-700' },
  }
  const label = labels[kind]
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${label.className}`}>
      {label.text}
    </span>
  )
}

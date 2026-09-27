import { memo } from 'react'
import type { HuntPlan } from '../engine/plan'
import type { TrailState, VisibleLetter } from '../engine/trail'
import { ShipSprite } from './Sprites'

/**
 * The trail itself: letters laid out in a gentle wave across space, scrolling
 * left as the ship flies along them.
 *
 * Behind the ship, the letters already typed glow — cyan when clean, amber
 * where they slipped. Ahead, only what the scanner can reach is drawn at all,
 * fading with distance; beyond that there is simply nothing to read. The letter
 * to type next sits right in front of the ship's nose.
 */

/** Typed letters kept on screen behind the ship. */
const BEHIND = 24

/** The trail's gentle wave, in multiples of the letter width. */
function wave(index: number): number {
  return Math.sin(index * 0.5) * 0.14
}

type CellKind = 'clean' | 'slipped' | 'skipped' | 'current' | 'current-slipped' | 'ahead'

function Cell({ index, char, kind, fade }: { index: number; char: string; kind: CellKind; fade: number }) {
  const isSpace = char === ' '
  return (
    <span
      className={`st-cell st-cell-${kind} ${isSpace ? 'st-cell-gap' : ''}`}
      style={{ '--i': index, '--wave': wave(index), '--fade': fade } as React.CSSProperties}
      data-ahead={kind === 'ahead' || undefined}
      data-current={kind.startsWith('current') || undefined}
    >
      {isSpace ? <span className="st-space-mark" /> : char}
    </span>
  )
}

const MemoCell = memo(Cell)

function TrailViewImpl({
  plan,
  state,
  ahead,
  hue,
}: {
  plan: HuntPlan
  state: TrailState
  ahead: VisibleLetter[]
  hue: string
}) {
  const behind = []
  for (let index = Math.max(0, state.cursor - BEHIND); index < state.cursor; index++) {
    const mark = state.marks[index] ?? 'clean'
    behind.push(
      <MemoCell
        key={index}
        index={index}
        char={plan.text[index]}
        kind={mark}
        fade={Math.max(0.15, 1 - (state.cursor - index - 1) / BEHIND)}
      />,
    )
  }

  const current = state.marks[state.cursor] === 'slipped' ? 'current-slipped' : 'current'

  return (
    <div
      className={`st-trail ${state.status === 'found' ? 'st-trail-found' : ''} ${state.status === 'towed' ? 'st-trail-towed' : ''}`}
      style={{ '--cursor': state.cursor, '--hue': hue, '--ship-wave': wave(state.cursor) } as React.CSSProperties}
      data-testid="trail"
      data-status={state.status}
      data-cursor={state.cursor}
      data-length={plan.text.length}
      data-target={plan.target}
      data-next={state.status === 'flying' ? plan.text[state.cursor] : ''}
    >
      <div className="st-trail-track">
        {behind}
        {ahead.map((letter) =>
          letter.index === state.cursor ? (
            // Keyed on wrong presses so the wobble replays on every miss.
            <MemoCell key={`${letter.index}-${state.wrongPresses}`} index={letter.index} char={letter.char} kind={current} fade={1} />
          ) : (
            <MemoCell key={letter.index} index={letter.index} char={letter.char} kind="ahead" fade={letter.glow} />
          ),
        )}
      </div>
      <div className="st-trail-ship">
        <ShipSprite size={72} className="text-neon-cyan" />
      </div>
    </div>
  )
}

export const TrailView = memo(TrailViewImpl)

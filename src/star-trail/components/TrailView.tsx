import { memo } from 'react'
import { worn, type Look } from '../data/makeovers'
import type { HuntPlan } from '../engine/plan'
import type { TrailState, VisibleLetter } from '../engine/trail'
import { PetSprite } from './PetSprite'
import { ShipSprite } from './PilotShip'

/**
 * The trail itself: letters laid out in a gentle wave across space, scrolling
 * left as the ship flies along them.
 *
 * Behind the ship, the letters already typed glow in the pilot's trail colour
 * when clean, and amber (with a dot beneath) where they slipped. Ahead, only what the scanner can reach is drawn at all,
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

function Cell({
  index,
  char,
  kind,
  fade,
  tint,
}: {
  index: number
  char: string
  kind: CellKind
  fade: number
  /** A colour of its own, for trails that take turns letter by letter. */
  tint?: string
}) {
  const isSpace = char === ' '
  return (
    <span
      className={`st-cell st-cell-${kind} ${isSpace ? 'st-cell-gap' : ''}`}
      style={{ '--i': index, '--wave': wave(index), '--fade': fade, '--tint': tint } as React.CSSProperties}
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
  look,
}: {
  plan: HuntPlan
  state: TrailState
  ahead: VisibleLetter[]
  hue: string
  look: Look
}) {
  const trail = worn(look, 'trail')
  const [first] = trail.colours
  const tintFor = (index: number) => (trail.colours.length > 1 ? trail.colours[index % trail.colours.length] : undefined)

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
        tint={mark === 'clean' ? tintFor(index) : undefined}
      />,
    )
  }

  const current = state.marks[state.cursor] === 'slipped' ? 'current-slipped' : 'current'

  return (
    <div
      className={`st-trail ${state.status === 'found' ? 'st-trail-found' : ''} ${state.status === 'towed' ? 'st-trail-towed' : ''}`}
      style={{ '--cursor': state.cursor, '--hue': hue, '--ship-wave': wave(state.cursor), '--trail': first } as React.CSSProperties}
      data-testid="trail"
      data-trail={trail.id}
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
        {plan.pet && (
          // Keyed on its tricks, so it bounces afresh every time.
          <span key={state.petTricks} className={`st-pet-ride ${state.petTricks > 0 ? 'st-pet-trick' : ''}`} data-testid="pet">
            <PetSprite pet={plan.pet.id} size={34} />
          </span>
        )}
        <ShipSprite size={72} look={look} />
      </div>
    </div>
  )
}

export const TrailView = memo(TrailViewImpl)

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import type { HornTune } from '../data/makeovers'
import { intentFor, layoutDiffers, preventsDefault } from './keys'
import type { HuntPlan } from './plan'
import { playHorn, playPetSound, playSound, type SoundKind } from './sound'
import {
  initTrail,
  isNearEnd,
  makeTrailReducer,
  messageSoFar,
  nextChar,
  outcomeOf,
  visibleAhead,
  type HuntOutcome,
  type TrailEventKind,
} from './trail'

/**
 * The React side of a hunt: everything with a side effect lives here, and the
 * rules all live in the pure reducer (trail.ts).
 *
 *  - One window-level keydown listener.
 *  - Leaving the window or switching tabs pauses; while paused, a key only
 *    resumes the game — it is never typed.
 *  - Sparkles appear as the ship reaches their letter and fade after the
 *    robot's catch window. That window is the only timer in the whole game.
 *  - The finish is reported exactly once, a moment after the last letter so the
 *    kid sees it land.
 */

const SOUND_FOR: Partial<Record<TrailEventKind, SoundKind>> = {
  hit: 'hit',
  word: 'word',
  shield: 'shield',
  spare: 'slip',
  fuel: 'slip',
  rescued: 'slip',
  regen: 'regen',
  catch: 'catch',
  towed: 'towed',
}

/** How long the found / towed moment shows before the next screen. */
const FINISH_DELAY = { found: 1100, towed: 1500 } as const
/** How long help lingers after a slip. */
const MISS_HELP_MS = 3000

export function useTrail({
  plan,
  onFinish,
  sound,
  horn = 'chime',
}: {
  plan: HuntPlan
  onFinish: (outcome: HuntOutcome) => void
  sound: boolean
  /** What plays when the piece is found. */
  horn?: HornTune
}) {
  const reducer = useMemo(() => makeTrailReducer(plan), [plan])
  const [state, dispatch] = useReducer(reducer, plan, initTrail)

  const stateRef = useRef(state)
  stateRef.current = state
  const finished = useRef(false)
  const shownSparkles = useRef(new Set<number>())
  const [otherLayout, setOtherLayout] = useState(false)

  const finish = useCallback(
    (outcome: HuntOutcome) => {
      if (finished.current) return
      finished.current = true
      onFinish(outcome)
    },
    [onFinish],
  )

  // Keys.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const modified = event.ctrlKey || event.metaKey || event.altKey
      if (!modified && preventsDefault(event.key)) event.preventDefault()
      const intent = intentFor({
        key: event.key,
        repeat: event.repeat,
        isComposing: event.isComposing,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        altKey: event.altKey,
        capsLock: event.getModifierState?.('CapsLock') ?? false,
      })
      if (!intent) return
      if (intent.type === 'type' && layoutDiffers(event.code, event.key)) setOtherLayout(true)
      if (stateRef.current.paused) {
        dispatch({ type: 'resume' })
        return
      }
      const now = Date.now()
      if (intent.type === 'type') dispatch({ type: 'key', char: intent.char, capsLock: intent.capsLock, now })
      else if (intent.type === 'catch') dispatch({ type: 'catch' })
      else if (intent.type === 'skip') dispatch({ type: 'skip', now })
      else dispatch({ type: 'pause' })
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // A focused button would swallow the next Space or Enter; start with nothing focused.
  useEffect(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  }, [])

  // Pause when the kid wanders off.
  useEffect(() => {
    const pause = () => dispatch({ type: 'pause' })
    const onVisibility = () => {
      if (document.hidden) pause()
    }
    window.addEventListener('blur', pause)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('blur', pause)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  // Sparkles drift in as the ship reaches their letter…
  useEffect(() => {
    if (state.status !== 'flying' || state.paused || state.sparkle) return
    if (!plan.sparkles.includes(state.cursor) || shownSparkles.current.has(state.cursor)) return
    shownSparkles.current.add(state.cursor)
    dispatch({ type: 'sparkle-show', id: state.cursor })
  }, [plan.sparkles, state.cursor, state.status, state.paused, state.sparkle])

  // …and drift away again.
  useEffect(() => {
    if (!state.sparkle) return
    const id = state.sparkle.id
    const timer = setTimeout(() => dispatch({ type: 'sparkle-hide', id }), plan.catchMs)
    return () => clearTimeout(timer)
  }, [state.sparkle, plan.catchMs])

  // Help after a slip lingers for a moment, then steps back.
  useEffect(() => {
    if (!state.recentlyMissed) return
    const timer = setTimeout(() => dispatch({ type: 'clear-miss' }), MISS_HELP_MS)
    return () => clearTimeout(timer)
  }, [state.recentlyMissed, state.wrongPresses])

  // Sounds, one per event. Finding the piece plays the pilot's own horn, and a
  // pet's trick its own noise.
  useEffect(() => {
    if (!sound || !state.event) return
    if (state.event.kind === 'found') playHorn(horn)
    else if (state.event.kind === 'pet' && plan.pet) playPetSound(plan.pet.id)
    else {
      const kind = SOUND_FOR[state.event.kind]
      if (kind) playSound(kind)
    }
  }, [sound, state.event, horn, plan.pet])

  // The finish.
  useEffect(() => {
    if (state.status === 'flying') return
    const outcome = outcomeOf(state, Date.now())
    const timer = setTimeout(() => finish(outcome), FINISH_DELAY[state.status])
    return () => clearTimeout(timer)
  }, [state, finish])

  /** Back to base: end the hunt now, keeping what's banked. */
  const abort = useCallback(() => finish(outcomeOf(stateRef.current, Date.now())), [finish])
  const pause = useCallback(() => dispatch({ type: 'pause' }), [])
  const resume = useCallback(() => dispatch({ type: 'resume' }), [])
  const skip = useCallback(() => dispatch({ type: 'skip', now: Date.now() }), [])

  return {
    state,
    next: nextChar(state, plan),
    ahead: visibleAhead(state, plan, plan.visible),
    message: messageSoFar(state, plan),
    nearEnd: isNearEnd(state, plan),
    otherLayout,
    abort,
    pause,
    resume,
    skip,
  }
}

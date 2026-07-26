import { CATCH_KEY_LABEL } from '../engine/sneakyStars'

/**
 * The star that drifts across the typing area. Catch it with the catch key
 * while it's visible.
 *
 * Deliberately silent about misses: no counter ticking down, no "you missed
 * one". The only feedback is the coins you did get, on the results screen.
 */

export function SneakyStar({ visible }: { visible: boolean }) {
  if (!visible) return null
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-8 overflow-hidden">
      <div className="sneaky-star inline-block text-3xl drop-shadow">⭐</div>
    </div>
  )
}

/** The persistent reminder of which key catches a star. */
export function CatchKeyHint({ catchKey, caught }: { catchKey: string; caught: number }) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
      <span>Sneaky Stars</span>
      <kbd className="rounded border border-slate-300 bg-slate-50 px-1.5 py-0.5 font-mono">
        {CATCH_KEY_LABEL[catchKey] ?? catchKey}
      </kbd>
      <span className="text-amber-500">{'⭐'.repeat(Math.min(caught, 5))}</span>
    </div>
  )
}

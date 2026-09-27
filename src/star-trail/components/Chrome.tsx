import { useEffect, useRef } from 'react'
import { activePilot, useStarTrail, type Screen } from '../store/pilotStore'
import type { Pilot } from '../store/schema'

/** Buttons, the top bar and other furniture shared by every screen. */

export type Tone = 'cyan' | 'pink' | 'lime' | 'gold' | 'violet'

export function NeonButton({
  children,
  onClick,
  tone = 'cyan',
  size = 'md',
  disabled,
  label,
}: {
  children: React.ReactNode
  onClick: () => void
  tone?: Tone
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  /** Accessible name, when the visible text isn't enough on its own. */
  label?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`st-button st-tone-${tone} st-button-${size}`}
    >
      {children}
    </button>
  )
}

export function Stardust({ amount, className = '' }: { amount: number; className?: string }) {
  return (
    <span className={`st-chip text-neon-gold ${className}`} title="Stardust">
      ✨ <span data-testid="stardust">{amount}</span>
    </span>
  )
}

export function TopBar({ pilot }: { pilot: Pilot }) {
  const screen = useStarTrail((s) => s.screen)
  const goTo = useStarTrail((s) => s.goTo)
  const toHangar = useStarTrail((s) => s.toHangar)
  const toggleSound = useStarTrail((s) => s.toggleSound)

  const nav: { screen: Screen; label: string }[] = [
    { screen: 'galaxy', label: '🪐 Galaxy' },
    { screen: 'station', label: '🛰️ Station' },
    { screen: 'ship', label: '🚀 Lost Ship' },
  ]

  return (
    <header className="relative z-10 flex w-full flex-wrap items-center justify-between gap-2 px-4 py-3">
      <button type="button" onClick={toHangar} className="st-chip text-ink hover:text-neon-cyan" title="Back to the hangar">
        <span className="text-lg">{pilot.avatar}</span> {pilot.name}
      </button>
      <nav className="flex flex-wrap items-center gap-2">
        {nav
          .filter((item) => item.screen !== screen)
          .map((item) => (
            <button key={item.screen} type="button" onClick={() => goTo(item.screen)} className="st-chip text-neon-cyan hover:text-ink">
              {item.label}
            </button>
          ))}
        <button
          type="button"
          onClick={toggleSound}
          className="st-chip text-neon-violet"
          aria-pressed={pilot.sound}
          title={pilot.sound ? 'Sound on' : 'Sound off'}
        >
          {pilot.sound ? '🔊' : '🔇'}
        </button>
        <Stardust amount={pilot.stardust} />
      </nav>
    </header>
  )
}

/** The pilot currently flying. Screens only render once there is one. */
export function useActivePilot(): Pilot | null {
  return useStarTrail(activePilot)
}

/**
 * Press Enter to carry on. Only Enter, and only after a short pause: a kid
 * still finishing a flurry of keys mustn't skip past their result by accident,
 * which is also why buttons here are never auto-focused (Space would press them).
 */
export function useEnterToContinue(action: () => void, delayMs = 700) {
  const ref = useRef(action)
  ref.current = action
  useEffect(() => {
    const armedAt = Date.now() + delayMs
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Enter' || event.repeat || Date.now() < armedAt) return
      event.preventDefault()
      ref.current()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [delayMs])
}

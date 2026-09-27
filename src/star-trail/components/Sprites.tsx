import { useId } from 'react'

/**
 * The little neon things that fly about: the robot sidekick, stardust
 * sparkles, the tow-drone and planets. The pilot's ship has a file of its own
 * (PilotShip.tsx), and so do the pets. All plain SVG outlines; the glow
 * comes from CSS drop-shadows in the element's own colour.
 */

export function RobotSprite({ size = 36, beeping = false }: { size?: number; beeping?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" className="st-glow text-neon-lime" aria-hidden>
      <line x1="18" y1="2" x2="18" y2="8" stroke="currentColor" strokeWidth="2" />
      <circle cx="18" cy="3" r="2.4" className={beeping ? 'st-beep' : undefined} fill={beeping ? '#ffe36e' : 'currentColor'} />
      <rect x="6" y="8" width="24" height="18" rx="6" fill="#0b1236" stroke="currentColor" strokeWidth="2" />
      <circle cx="13" cy="17" r="2.6" fill="#5ef2ff" />
      <circle cx="23" cy="17" r="2.6" fill="#5ef2ff" />
      <path d="M10 30 Q18 35 26 30" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function SparkleSprite({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" className="st-glow text-neon-gold" aria-hidden>
      <path
        d="M15 1 L18 12 L29 15 L18 18 L15 29 L12 18 L1 15 L12 12 Z"
        fill="currentColor"
        stroke="#fff4c2"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function TowDroneSprite({ size = 96 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.6} viewBox="0 0 100 60" className="st-glow text-neon-violet" aria-hidden>
      <ellipse cx="50" cy="18" rx="26" ry="11" fill="#0b1236" stroke="currentColor" strokeWidth="2.5" />
      <path d="M26 18 H8 M74 18 H92" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="8" cy="18" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="92" cy="18" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="42" cy="17" r="3" fill="#5ef2ff" />
      <circle cx="58" cy="17" r="3" fill="#5ef2ff" />
      <path d="M44 23 Q50 27 56 23" fill="none" stroke="#5ef2ff" strokeWidth="2" strokeLinecap="round" />
      <path d="M50 29 V56" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
    </svg>
  )
}

export function PlanetOrb({ hue, size = 64, ringed = false, dim = false }: { hue: string; size?: number; ringed?: boolean; dim?: boolean }) {
  const id = useId()
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden style={{ opacity: dim ? 0.35 : 1 }}>
      <defs>
        <radialGradient id={id} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="25%" stopColor={hue} />
          <stop offset="100%" stopColor="#070a1c" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="20" fill={`url(#${id})`} style={{ filter: dim ? undefined : `drop-shadow(0 0 6px ${hue})` }} />
      {ringed && (
        <ellipse cx="32" cy="34" rx="30" ry="8" fill="none" stroke={hue} strokeWidth="2" opacity="0.8" transform="rotate(-14 32 34)" />
      )}
    </svg>
  )
}

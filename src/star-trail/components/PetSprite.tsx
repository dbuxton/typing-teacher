import type { PetId } from '../engine/balance'

/**
 * The crew pets, in neon outline like everything else. Each wears a bubble
 * helmet: it is space, after all.
 */

const FACE = '#0b1236'

const PET_COLOUR: Record<PetId, string> = {
  cat: 'text-neon-violet',
  puppy: 'text-neon-gold',
  alien: 'text-neon-lime',
  dragon: 'text-neon-pink',
}

const DRAWINGS: Record<PetId, React.ReactNode> = {
  cat: (
    <>
      <path d="M9 15 L9 6 L14.5 11 H21.5 L27 6 L27 15 Q27 27 18 27 Q9 27 9 15 Z" fill={FACE} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="14.5" cy="17" r="1.8" fill="#a6ff6a" />
      <circle cx="21.5" cy="17" r="1.8" fill="#a6ff6a" />
      <path d="M17 20.5 H19 L18 22 Z" fill="#ff6fd8" />
      <path d="M5 19.5 H11 M5 23 L11 22 M25 19.5 H31 M25 22 L31 23" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </>
  ),
  puppy: (
    <>
      <circle cx="18" cy="18" r="8.5" fill={FACE} stroke="currentColor" strokeWidth="2" />
      <path d="M11 12 Q4 12 6 23 Q9.5 21.5 11 17" fill={FACE} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M25 12 Q32 12 30 23 Q26.5 21.5 25 17" fill={FACE} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="15" cy="17" r="1.6" fill="#5ef2ff" />
      <circle cx="21" cy="17" r="1.6" fill="#5ef2ff" />
      <ellipse cx="18" cy="21" rx="2" ry="1.4" fill="currentColor" />
      <path d="M17 23.5 Q18 27 19 23.5" fill="#ff6fd8" />
    </>
  ),
  alien: (
    <>
      <path d="M13 8.5 L10 3.5 M23 8.5 L26 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="10" cy="3.2" r="1.7" fill="#ff6fd8" />
      <circle cx="26" cy="3.2" r="1.7" fill="#ff6fd8" />
      <ellipse cx="18" cy="17.5" rx="9" ry="10" fill={FACE} stroke="currentColor" strokeWidth="2" />
      <ellipse cx="14" cy="16" rx="2.6" ry="3.4" fill="currentColor" />
      <ellipse cx="22" cy="16" rx="2.6" ry="3.4" fill="currentColor" />
      <circle cx="14.8" cy="14.8" r="0.9" fill={FACE} />
      <circle cx="22.8" cy="14.8" r="0.9" fill={FACE} />
      <path d="M15 22.5 Q18 25 21 22.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path className="st-pet-wave" d="M27 25 L32 19 M31 17.5 L32 19 L33.5 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  dragon: (
    <>
      <path d="M9.5 18 Q2 11 3 23 Q6 21 9.5 22.5 M26.5 18 Q34 11 33 23 Q30 21 26.5 22.5" fill={FACE} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M12 11.5 L9.5 4.5 L15 9.5 M24 11.5 L26.5 4.5 L21 9.5" fill="none" stroke="#ffe36e" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="18" cy="18" r="8.5" fill={FACE} stroke="currentColor" strokeWidth="2" />
      <circle cx="14.5" cy="16.5" r="1.7" fill="#ffe36e" />
      <circle cx="21.5" cy="16.5" r="1.7" fill="#ffe36e" />
      <circle cx="16.6" cy="20.4" r="0.7" fill="currentColor" />
      <circle cx="19.4" cy="20.4" r="0.7" fill="currentColor" />
      <path d="M14 22.5 Q18 25.5 22 22.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M15.6 23.4 L16.2 24.8 L16.8 23.8" fill="#ffffff" />
    </>
  ),
}

export function PetSprite({ pet, size = 36, className = '' }: { pet: PetId; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" className={`st-glow ${PET_COLOUR[pet]} ${className}`} aria-hidden data-pet={pet}>
      <circle cx="18" cy="18" r="16.5" fill="none" stroke="#e8edff" strokeWidth="0.8" opacity="0.35" />
      {DRAWINGS[pet]}
      <path d="M8 9 Q11 5 16 4" fill="none" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" opacity="0.45" />
    </svg>
  )
}

import { ink } from './common'

/**
 * Every Pokémon starts as an egg. The speckles are in the colour of what's
 * inside, so a kid with three eggs can still tell which will be Pikachu.
 */
export function Egg({ colour }: { colour: string }) {
  return (
    <g>
      <ellipse cx={32} cy={58} rx={14} ry={3} fill="#000" opacity={0.12} />
      <path d="M32 8 Q48 10 49 36 Q49 58 32 58 Q15 58 15 36 Q16 10 32 8 Z" fill="#fffbeb" {...ink} />
      <circle cx={25} cy={24} r={3.5} fill={colour} />
      <circle cx={39} cy={20} r={2.5} fill={colour} />
      <circle cx={40} cy={36} r={4.5} fill={colour} />
      <circle cx={24} cy={42} r={3} fill={colour} />
      <circle cx={33} cy={50} r={2.5} fill={colour} />
      <circle cx={31} cy={32} r={2} fill={colour} />
      <path d="M22 16 Q20 22 21 28" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" />
    </g>
  )
}

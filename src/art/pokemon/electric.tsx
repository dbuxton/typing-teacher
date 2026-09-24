import { Eye, INK, Smile, ink } from './common'

const YELLOW = '#facc15'

export function Pichu() {
  return (
    <g>
      {/* Tail */}
      <path d="M40 52 L50 46 L48 42 L54 38" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />
      {/* Big black-edged ears */}
      <path d="M21 26 Q4 22 3 6 Q18 8 27 20 Z" fill={INK} />
      <path d="M21 25 Q9 21 8 10 Q18 12 25 20 Z" fill={YELLOW} />
      <path d="M43 26 Q60 22 61 6 Q46 8 37 20 Z" fill={INK} />
      <path d="M43 25 Q55 21 56 10 Q46 12 39 20 Z" fill={YELLOW} />
      {/* Body and head */}
      <ellipse cx={32} cy={51} rx={10} ry={9} fill={YELLOW} {...ink} />
      <ellipse cx={32} cy={33} rx={16} ry={14} fill={YELLOW} {...ink} />
      <Eye x={25} y={31} r={3.2} />
      <Eye x={39} y={31} r={3.2} />
      <circle cx={20} cy={38} r={3.5} fill="#f9a8d4" />
      <circle cx={44} cy={38} r={3.5} fill="#f9a8d4" />
      <circle cx={32} cy={35} r={0.9} fill={INK} />
      <Smile x={32} y={38} w={2.5} />
      <ellipse cx={27} cy={59} rx={3.5} ry={2} fill={YELLOW} {...ink} strokeWidth={1.5} />
      <ellipse cx={37} cy={59} rx={3.5} ry={2} fill={YELLOW} {...ink} strokeWidth={1.5} />
    </g>
  )
}

export function Pikachu() {
  return (
    <g>
      {/* Lightning tail with a brown root */}
      <path d="M40 52 L52 45 L48 41 L58 33 L52 30 L61 18 L46 27 L50 31 L41 37 L45 41 L37 46 Z" fill={YELLOW} {...ink} />
      <path d="M40 52 L37 46 L42 43.5 L45 48 Z" fill="#92400e" />
      {/* Ears with black tips */}
      <path d="M22 22 L10 2 L27 17 Z" fill={YELLOW} {...ink} />
      <path d="M10 2 L13.6 8 L15.1 6.3 Z" fill={INK} {...ink} strokeWidth={1.5} />
      <path d="M42 22 L54 2 L37 17 Z" fill={YELLOW} {...ink} />
      <path d="M54 2 L50.4 8 L48.9 6.3 Z" fill={INK} {...ink} strokeWidth={1.5} />
      {/* Body and head */}
      <ellipse cx={32} cy={47} rx={13} ry={12} fill={YELLOW} {...ink} />
      <ellipse cx={32} cy={28} rx={15} ry={12.5} fill={YELLOW} {...ink} />
      <Eye x={25.5} y={26} r={3} />
      <Eye x={38.5} y={26} r={3} />
      <circle cx={20.5} cy={32} r={3.6} fill="#ef4444" />
      <circle cx={43.5} cy={32} r={3.6} fill="#ef4444" />
      <circle cx={32} cy={29.5} r={0.9} fill={INK} />
      <path d="M28.5 32 Q30.2 34.5 32 32 Q33.8 34.5 35.5 32" fill="none" {...ink} strokeWidth={1.4} />
      {/* Arms and feet */}
      <ellipse cx={25} cy={44} rx={3} ry={2} fill={YELLOW} {...ink} strokeWidth={1.5} />
      <ellipse cx={39} cy={44} rx={3} ry={2} fill={YELLOW} {...ink} strokeWidth={1.5} />
      <ellipse cx={25} cy={59} rx={4.5} ry={2.2} fill={YELLOW} {...ink} strokeWidth={1.5} />
      <ellipse cx={39} cy={59} rx={4.5} ry={2.2} fill={YELLOW} {...ink} strokeWidth={1.5} />
    </g>
  )
}

export function Raichu() {
  const orange = '#f59e0b'
  return (
    <g>
      {/* Long thin black tail ending in a bolt */}
      <path d="M40 50 Q58 52 55 34 Q53 24 56 16" fill="none" stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
      <path d="M52 18 L58 4 L57 10 L63 9 L56 22 L57.5 16 Z" fill={YELLOW} {...ink} strokeWidth={1.5} />
      {/* Curled ears: brown outside, yellow inside */}
      <path d="M19 20 Q2 16 5 3 Q16 3 25 15 Z" fill="#78350f" {...ink} />
      <path d="M18 18 Q9 14 9 7 Q15 8 21 15 Z" fill={YELLOW} />
      <path d="M45 20 Q62 16 59 3 Q48 3 39 15 Z" fill="#78350f" {...ink} />
      <path d="M46 18 Q55 14 55 7 Q49 8 43 15 Z" fill={YELLOW} />
      {/* Body, cream belly, head */}
      <ellipse cx={32} cy={46} rx={14} ry={13} fill={orange} {...ink} />
      <ellipse cx={32} cy={49} rx={8} ry={8} fill="#fef3c7" />
      <ellipse cx={32} cy={26} rx={15} ry={12.5} fill={orange} {...ink} />
      <Eye x={25.5} y={24.5} r={3} />
      <Eye x={38.5} y={24.5} r={3} />
      <circle cx={20.5} cy={31} r={3.6} fill="#fde047" />
      <circle cx={43.5} cy={31} r={3.6} fill="#fde047" />
      <circle cx={32} cy={28} r={0.9} fill={INK} />
      <Smile x={32} y={31} w={3} />
      <ellipse cx={24} cy={43} rx={3} ry={2} fill={orange} {...ink} strokeWidth={1.5} />
      <ellipse cx={40} cy={43} rx={3} ry={2} fill={orange} {...ink} strokeWidth={1.5} />
      <ellipse cx={25} cy={59} rx={5} ry={2.3} fill="#78350f" {...ink} strokeWidth={1.5} />
      <ellipse cx={39} cy={59} rx={5} ry={2.3} fill="#78350f" {...ink} strokeWidth={1.5} />
    </g>
  )
}

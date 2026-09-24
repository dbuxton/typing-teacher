import { Eye, INK, Smile, ink } from './common'

const CREAM = '#fde68a'

/** The tail flame every form in the line carries. Bigger as it evolves. */
function Flame({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M0 6 Q-7 0 -2 -10 Q-1 -5 1 -6 Q0 -12 4 -14 Q3 -8 7 -3 Q8 3 0 6 Z" fill="#f97316" {...ink} strokeWidth={1.5} />
      <path d="M0.5 3.5 Q-3 0 0 -5 Q1 -2 3 -2 Q5 1 0.5 3.5 Z" fill="#fde047" />
    </g>
  )
}

export function Charmander() {
  const orange = '#fb923c'
  return (
    <g>
      <path d="M38 52 Q52 54 53 40" fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" />
      <path d="M38 52 Q52 54 53 40" fill="none" stroke={orange} strokeWidth={4} strokeLinecap="round" />
      <Flame x={53} y={34} />
      <ellipse cx={30} cy={46} rx={11} ry={12} fill={orange} {...ink} />
      <ellipse cx={30} cy={49} rx={7} ry={8} fill={CREAM} />
      <ellipse cx={29} cy={25} rx={14} ry={12.5} fill={orange} {...ink} />
      <Eye x={23} y={23} r={3.6} iris="#1e3a8a" />
      <Eye x={35} y={23} r={3.6} iris="#1e3a8a" />
      <Smile x={29} y={30} w={4} />
      <ellipse cx={20} cy={42} rx={3.5} ry={2.2} fill={orange} {...ink} strokeWidth={1.5} />
      <ellipse cx={40} cy={42} rx={3.5} ry={2.2} fill={orange} {...ink} strokeWidth={1.5} />
      <ellipse cx={24} cy={58} rx={5} ry={2.6} fill={orange} {...ink} strokeWidth={1.5} />
      <ellipse cx={36} cy={58} rx={5} ry={2.6} fill={orange} {...ink} strokeWidth={1.5} />
    </g>
  )
}

export function Charmeleon() {
  const red = '#dc2626'
  return (
    <g>
      <path d="M38 52 Q55 56 55 36" fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" />
      <path d="M38 52 Q55 56 55 36" fill="none" stroke={red} strokeWidth={4} strokeLinecap="round" />
      <Flame x={55} y={29} scale={1.25} />
      <ellipse cx={30} cy={45} rx={11} ry={14} fill={red} {...ink} />
      <ellipse cx={30} cy={48} rx={7} ry={9.5} fill={CREAM} />
      {/* Head horn */}
      <path d="M34 14 L46 6 L40 19 Z" fill={red} {...ink} />
      <path d="M16 22 Q15 10 28 10 Q40 10 41 20 Q41 30 28 31 Q18 31 16 22 Z" fill={red} {...ink} />
      {/* Sharper, determined eyes */}
      <path d="M20 17 L27 19" {...ink} />
      <path d="M36 17 L30 19" {...ink} />
      <Eye x={23.5} y={22} r={2.8} iris="#0891b2" />
      <Eye x={33} y={22} r={2.8} iris="#0891b2" />
      <path d="M22 27 Q28 30 35 27" fill="none" {...ink} strokeWidth={1.5} />
      <ellipse cx={19} cy={40} rx={3.5} ry={2.2} fill={red} {...ink} strokeWidth={1.5} />
      <ellipse cx={41} cy={40} rx={3.5} ry={2.2} fill={red} {...ink} strokeWidth={1.5} />
      <ellipse cx={24} cy={59} rx={5} ry={2.6} fill={red} {...ink} strokeWidth={1.5} />
      <ellipse cx={36} cy={59} rx={5} ry={2.6} fill={red} {...ink} strokeWidth={1.5} />
    </g>
  )
}

export function Charizard() {
  const orange = '#f97316'
  const teal = '#0f766e'
  return (
    <g>
      {/* Wings behind */}
      <path d="M24 28 L3 6 L7 18 L1 22 L10 26 L6 34 Z" fill={orange} {...ink} />
      <path d="M22 28 L7 12 L10 21 L6 24 L13 27 L10 32 Z" fill={teal} />
      <path d="M40 28 L61 6 L57 18 L63 22 L54 26 L58 34 Z" fill={orange} {...ink} />
      <path d="M42 28 L57 12 L54 21 L58 24 L51 27 L54 32 Z" fill={teal} />
      {/* Tail */}
      <path d="M40 56 Q57 61 58 52" fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" />
      <path d="M40 56 Q57 61 58 52" fill="none" stroke={orange} strokeWidth={4} strokeLinecap="round" />
      <Flame x={58} y={47} scale={1.3} />
      {/* Body */}
      <ellipse cx={32} cy={45} rx={12} ry={14} fill={orange} {...ink} />
      <ellipse cx={32} cy={48} rx={8} ry={10} fill={CREAM} />
      {/* Neck and head with two horns */}
      <path d="M28 34 L28 24 L36 24 L36 34 Z" fill={orange} />
      <path d="M26 12 L21 3 L29 9 Z" fill={orange} {...ink} />
      <path d="M38 12 L43 3 L35 9 Z" fill={orange} {...ink} />
      <ellipse cx={32} cy={17} rx={10.5} ry={8.5} fill={orange} {...ink} />
      <path d="M26 13 L30 15" {...ink} />
      <path d="M38 13 L34 15" {...ink} />
      <Eye x={28} y={17} r={2.4} iris="#0891b2" />
      <Eye x={36} y={17} r={2.4} iris="#0891b2" />
      <path d="M28 22 Q32 24 36 22" fill="none" {...ink} strokeWidth={1.5} />
      <ellipse cx={20} cy={42} rx={3.5} ry={2.2} fill={orange} {...ink} strokeWidth={1.5} />
      <ellipse cx={44} cy={42} rx={3.5} ry={2.2} fill={orange} {...ink} strokeWidth={1.5} />
      <ellipse cx={25} cy={59} rx={5.5} ry={2.7} fill={orange} {...ink} strokeWidth={1.5} />
      <ellipse cx={39} cy={59} rx={5.5} ry={2.7} fill={orange} {...ink} strokeWidth={1.5} />
    </g>
  )
}

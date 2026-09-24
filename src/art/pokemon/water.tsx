import { Eye, INK, Smile, ink } from './common'

const CREAM = '#fde68a'
const SHELL = '#b45309'

export function Magikarp() {
  const red = '#f97316'
  const fin = '#fef3c7'
  return (
    <g>
      {/* Tail fin */}
      <path d="M46 34 L60 20 L57 34 L60 48 Z" fill={fin} {...ink} />
      {/* Crown-like back fin */}
      <path d="M18 24 L22 12 L26 20 L30 10 L34 20 L38 12 L40 24 Z" fill={fin} {...ink} />
      <ellipse cx={30} cy={34} rx={19} ry={13} fill={red} {...ink} />
      {/* Scales */}
      <path d="M30 28 Q34 32 30 36 M36 28 Q40 32 36 36 M33 36 Q37 40 33 44 M39 36 Q43 40 39 44" fill="none" stroke="#c2410c" strokeWidth={1.5} strokeLinecap="round" />
      {/* Belly fin and mouth */}
      <path d="M28 46 L24 56 L34 47 Z" fill={fin} {...ink} strokeWidth={1.5} />
      <ellipse cx={13} cy={37} rx={3.5} ry={4} fill="#fda4af" {...ink} strokeWidth={1.5} />
      {/* Whiskers */}
      <path d="M15 31 Q6 24 8 16 M16 40 Q8 46 10 54" fill="none" stroke="#facc15" strokeWidth={2.5} strokeLinecap="round" />
      {/* The famous blank stare */}
      <circle cx={20} cy={30} r={5} fill="#fff" {...ink} strokeWidth={1.5} />
      <circle cx={20} cy={30} r={1.4} fill={INK} />
    </g>
  )
}

export function Gyarados() {
  const blue = '#2563eb'
  return (
    <g>
      {/* Coiled serpent body: outline, fill, belly stripe */}
      <path d="M10 58 Q2 44 18 42 Q36 40 36 26" fill="none" stroke={INK} strokeWidth={14} strokeLinecap="round" />
      <path d="M10 58 Q2 44 18 42 Q36 40 36 26" fill="none" stroke={blue} strokeWidth={10} strokeLinecap="round" />
      <path d="M12 56 Q6 46 18 45 Q34 43 33 30" fill="none" stroke={CREAM} strokeWidth={3} strokeLinecap="round" />
      {/* Tail fin */}
      <path d="M10 58 L2 62 L6 52 Z" fill="#93c5fd" {...ink} strokeWidth={1.5} />
      {/* White crest */}
      <path d="M36 10 L32 2 L40 7 L42 0 L46 8 L52 4 L50 12 Z" fill="#dbeafe" {...ink} strokeWidth={1.5} />
      {/* Head with an open, roaring mouth */}
      <path d="M26 16 Q30 6 44 8 Q56 10 58 20 L48 22 L58 28 Q50 34 38 30 Q26 28 26 16 Z" fill={blue} {...ink} />
      <path d="M48 22 L58 20 L58 28 Z" fill="#fca5a5" />
      <path d="M50 21 L52 24 L54 21 M53 27 L55 24 L56 27" fill="#fff" stroke="#fff" strokeWidth={0.8} />
      {/* Angry red eye */}
      <path d="M36 12 L44 15" {...ink} />
      <Eye x={40} y={17} r={2.6} iris="#dc2626" />
      {/* Whiskers */}
      <path d="M30 26 Q22 30 20 24" fill="none" stroke="#dbeafe" strokeWidth={2} strokeLinecap="round" />
    </g>
  )
}

/** Squirtle's curly tail, shared in shape by the line. */
function CurlTail({ colour }: { colour: string }) {
  return (
    <g>
      <path d="M42 50 Q56 54 56 44 Q56 36 49 38 Q45 40 49 44" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
      <path d="M42 50 Q56 54 56 44 Q56 36 49 38 Q45 40 49 44" fill="none" stroke={colour} strokeWidth={3} strokeLinecap="round" />
    </g>
  )
}

export function Squirtle() {
  const blue = '#7dd3fc'
  return (
    <g>
      <CurlTail colour={blue} />
      <ellipse cx={32} cy={46} rx={14} ry={12} fill={SHELL} {...ink} />
      <ellipse cx={30} cy={47} rx={9} ry={10} fill={CREAM} {...ink} strokeWidth={1.5} />
      <path d="M22 44 H38 M22 50 H38" stroke="#d97706" strokeWidth={1.2} />
      <ellipse cx={30} cy={24} rx={14} ry={12.5} fill={blue} {...ink} />
      <Eye x={24} y={22} r={3.6} iris="#9a3412" />
      <Eye x={36} y={22} r={3.6} iris="#9a3412" />
      <Smile x={30} y={30} w={4} />
      <ellipse cx={18} cy={42} rx={3.5} ry={2.2} fill={blue} {...ink} strokeWidth={1.5} />
      <ellipse cx={42} cy={42} rx={3.5} ry={2.2} fill={blue} {...ink} strokeWidth={1.5} />
      <ellipse cx={24} cy={59} rx={5} ry={2.6} fill={blue} {...ink} strokeWidth={1.5} />
      <ellipse cx={36} cy={59} rx={5} ry={2.6} fill={blue} {...ink} strokeWidth={1.5} />
    </g>
  )
}

export function Wartortle() {
  const blue = '#60a5fa'
  const fluff = '#eef2ff'
  return (
    <g>
      {/* Big fluffy tail */}
      <path d="M40 52 Q48 58 56 52 Q64 46 58 38 Q62 30 54 28 Q50 22 44 28 Q40 34 44 40 Q40 44 40 52 Z" fill={fluff} {...ink} />
      <path d="M46 44 Q52 42 54 36" fill="none" stroke="#a5b4fc" strokeWidth={1.5} strokeLinecap="round" />
      <ellipse cx={30} cy={46} rx={13} ry={12.5} fill={SHELL} {...ink} />
      <ellipse cx={29} cy={47} rx={8.5} ry={10} fill={CREAM} {...ink} strokeWidth={1.5} />
      <path d="M21 44 H37 M21 50 H37" stroke="#d97706" strokeWidth={1.2} />
      {/* Feathery ears */}
      <path transform="translate(18 18) scale(0.72) translate(-18 -18)" d="M18 18 Q6 12 2 2 Q10 4 14 8 Q12 4 16 4 Q20 10 22 16 Z" fill={fluff} {...ink} />
      <path transform="translate(40 18) scale(0.72) translate(-40 -18)" d="M40 18 Q52 12 56 2 Q48 4 44 8 Q46 4 42 4 Q38 10 36 16 Z" fill={fluff} {...ink} />
      <ellipse cx={29} cy={25} rx={13.5} ry={12} fill={blue} {...ink} />
      <path d="M20 19 L27 21 M38 19 L31 21" {...ink} strokeWidth={1.5} />
      <Eye x={23.5} y={24} r={3.2} iris="#7c2d12" />
      <Eye x={34.5} y={24} r={3.2} iris="#7c2d12" />
      <Smile x={29} y={30} w={3.5} />
      <ellipse cx={17} cy={42} rx={3.5} ry={2.2} fill={blue} {...ink} strokeWidth={1.5} />
      <ellipse cx={41} cy={42} rx={3.5} ry={2.2} fill={blue} {...ink} strokeWidth={1.5} />
      <ellipse cx={23} cy={59} rx={5} ry={2.6} fill={blue} {...ink} strokeWidth={1.5} />
      <ellipse cx={35} cy={59} rx={5} ry={2.6} fill={blue} {...ink} strokeWidth={1.5} />
    </g>
  )
}

export function Blastoise() {
  const blue = '#3b82f6'
  const steel = '#9ca3af'
  return (
    <g>
      {/* Shell, bulky and wide */}
      <ellipse cx={32} cy={42} rx={22} ry={18} fill={SHELL} {...ink} />
      <path d="M12 34 Q32 26 52 34" fill="none" stroke="#fef3c7" strokeWidth={3} />
      {/* Shoulder cannons */}
      <g transform="rotate(-35 14 26)">
        <rect x={8} y={18} width={9} height={16} rx={2} fill={steel} {...ink} />
        <rect x={7} y={16} width={11} height={4} rx={1.5} fill="#6b7280" {...ink} strokeWidth={1.5} />
      </g>
      <g transform="rotate(35 50 26)">
        <rect x={47} y={18} width={9} height={16} rx={2} fill={steel} {...ink} />
        <rect x={46} y={16} width={11} height={4} rx={1.5} fill="#6b7280" {...ink} strokeWidth={1.5} />
      </g>
      {/* Belly plate */}
      <ellipse cx={32} cy={46} rx={12} ry={12} fill={CREAM} {...ink} strokeWidth={1.5} />
      <path d="M21 42 H43 M21 48 H43 M23 54 H41" stroke="#d97706" strokeWidth={1.2} />
      {/* Head, small and stern */}
      <ellipse cx={32} cy={22} rx={11} ry={9} fill={blue} {...ink} />
      <path d="M22 15 L20 10 L25 13 M42 15 L44 10 L39 13" fill={blue} {...ink} strokeWidth={1.5} />
      <path d="M24 18 L30 20 M40 18 L34 20" {...ink} />
      <Eye x={27} y={22} r={2.5} iris="#7c2d12" />
      <Eye x={37} y={22} r={2.5} iris="#7c2d12" />
      <path d="M28 27 Q32 29 36 27" fill="none" {...ink} strokeWidth={1.5} />
      {/* Arms and feet */}
      <ellipse cx={14} cy={46} rx={4.5} ry={3.5} fill={blue} {...ink} strokeWidth={1.5} />
      <ellipse cx={50} cy={46} rx={4.5} ry={3.5} fill={blue} {...ink} strokeWidth={1.5} />
      <ellipse cx={23} cy={60} rx={6} ry={3} fill={blue} {...ink} strokeWidth={1.5} />
      <ellipse cx={41} cy={60} rx={6} ry={3} fill={blue} {...ink} strokeWidth={1.5} />
    </g>
  )
}

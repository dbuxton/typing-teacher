import { Eye, INK, Smile, ink } from './common'

const PINK = '#f9a8d4'

export function Igglybuff() {
  return (
    <g>
      {/* The little curl on top */}
      <path d="M31 24 Q25 14 33 12 Q40 13 36 19" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
      <path d="M31 24 Q25 14 33 12 Q40 13 36 19" fill="none" stroke={PINK} strokeWidth={3} strokeLinecap="round" />
      <path d="M21 30 L17 22 L25 26 Z M43 30 L47 22 L39 26 Z" fill={PINK} {...ink} strokeWidth={1.5} />
      <circle cx={32} cy={40} r={15} fill={PINK} {...ink} />
      <Eye x={26} y={38} r={4} iris="#7c2d12" />
      <Eye x={38} y={38} r={4} iris="#7c2d12" />
      <ellipse cx={21} cy={45} rx={2.5} ry={1.5} fill="#f472b6" />
      <ellipse cx={43} cy={45} rx={2.5} ry={1.5} fill="#f472b6" />
      <Smile x={32} y={46} w={2.5} />
      <ellipse cx={26} cy={55} rx={4} ry={2.5} fill={PINK} {...ink} strokeWidth={1.5} />
      <ellipse cx={38} cy={55} rx={4} ry={2.5} fill={PINK} {...ink} strokeWidth={1.5} />
    </g>
  )
}

export function Jigglypuff() {
  return (
    <g>
      {/* Pointed ears with dark insides */}
      <path d="M16 20 L12 6 L26 14 Z" fill={PINK} {...ink} />
      <path d="M16 17 L14 10 L22 14 Z" fill={INK} />
      <path d="M48 20 L52 6 L38 14 Z" fill={PINK} {...ink} />
      <path d="M48 17 L50 10 L42 14 Z" fill={INK} />
      <circle cx={32} cy={34} r={20} fill={PINK} {...ink} />
      {/* Forehead swirl */}
      <path d="M32 26 Q26 22 28 16 Q32 12 36 16 Q38 20 34 20" fill="none" {...ink} strokeWidth={1.8} />
      {/* Big blue-green eyes */}
      <circle cx={24.5} cy={34} r={5.5} fill="#fff" {...ink} strokeWidth={1.5} />
      <circle cx={39.5} cy={34} r={5.5} fill="#fff" {...ink} strokeWidth={1.5} />
      <circle cx={25} cy={35} r={4} fill="#0ea5e9" />
      <circle cx={39} cy={35} r={4} fill="#0ea5e9" />
      <circle cx={25} cy={35.5} r={2} fill={INK} />
      <circle cx={39} cy={35.5} r={2} fill={INK} />
      <circle cx={23.5} cy={33} r={1.2} fill="#fff" />
      <circle cx={37.5} cy={33} r={1.2} fill="#fff" />
      <Smile x={32} y={44} w={3} />
      <ellipse cx={25} cy={55} rx={5} ry={2.8} fill={PINK} {...ink} strokeWidth={1.5} />
      <ellipse cx={39} cy={55} rx={5} ry={2.8} fill={PINK} {...ink} strokeWidth={1.5} />
    </g>
  )
}

export function Wigglytuff() {
  return (
    <g>
      {/* Tall rabbit ears */}
      <ellipse cx={20} cy={14} rx={6} ry={12} transform="rotate(-20 20 14)" fill={PINK} {...ink} />
      <ellipse cx={20} cy={15} rx={3} ry={8} transform="rotate(-20 20 15)" fill="#9d174d" />
      <ellipse cx={44} cy={14} rx={6} ry={12} transform="rotate(20 44 14)" fill={PINK} {...ink} />
      <ellipse cx={44} cy={15} rx={3} ry={8} transform="rotate(20 44 15)" fill="#9d174d" />
      {/* Tall body with a white tummy */}
      <ellipse cx={32} cy={40} rx={17} ry={19} fill={PINK} {...ink} />
      <ellipse cx={32} cy={46} rx={10} ry={11} fill="#fff" />
      {/* Fluffy white forehead tuft */}
      <path d="M24 26 Q22 20 28 20 Q30 15 34 18 Q40 16 40 22 Q44 26 38 28 Q32 26 28 29 Q23 30 24 26 Z" fill="#fff" {...ink} strokeWidth={1.5} />
      <Eye x={26} y={33} r={3.2} iris="#0ea5e9" />
      <Eye x={38} y={33} r={3.2} iris="#0ea5e9" />
      <Smile x={32} y={39} w={3} />
      <ellipse cx={16} cy={42} rx={3.5} ry={2.5} fill={PINK} {...ink} strokeWidth={1.5} />
      <ellipse cx={48} cy={42} rx={3.5} ry={2.5} fill={PINK} {...ink} strokeWidth={1.5} />
      <ellipse cx={25} cy={59} rx={5.5} ry={2.8} fill={PINK} {...ink} strokeWidth={1.5} />
      <ellipse cx={39} cy={59} rx={5.5} ry={2.8} fill={PINK} {...ink} strokeWidth={1.5} />
    </g>
  )
}

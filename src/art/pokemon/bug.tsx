import { INK, Smile, ink } from './common'

export function Caterpie() {
  const green = '#4ade80'
  const segments = [
    { x: 10, y: 52, r: 6 },
    { x: 19, y: 54, r: 7 },
    { x: 29, y: 52, r: 8 },
  ]
  return (
    <g>
      {segments.map((s) => (
        <g key={s.x}>
          <circle cx={s.x} cy={s.y} r={s.r} fill={green} {...ink} />
          <circle cx={s.x} cy={s.y + s.r * 0.35} r={s.r * 0.4} fill="#fde047" />
        </g>
      ))}
      {/* Body rising into the head */}
      <ellipse cx={38} cy={44} rx={9} ry={11} fill={green} {...ink} />
      <circle cx={37} cy={48} r={3.5} fill="#fde047" />
      {/* Red forked antenna */}
      <path d="M44 20 L46 12 M46 12 L42 6 M46 12 L52 8" fill="none" stroke="#dc2626" strokeWidth={3} strokeLinecap="round" />
      <circle cx={42} cy={28} r={12} fill={green} {...ink} />
      {/* Big yellow-ringed eye */}
      <circle cx={46} cy={26} r={5} fill="#fde047" {...ink} strokeWidth={1.5} />
      <circle cx={46.5} cy={26} r={3} fill={INK} />
      <circle cx={45.5} cy={24.8} r={1} fill="#fff" />
      <Smile x={40} y={33} w={3} />
    </g>
  )
}

export function Metapod() {
  const green = '#4ade80'
  return (
    <g>
      {/* The hard, still cocoon */}
      <path d="M24 60 Q12 42 20 24 Q28 8 42 10 Q34 18 38 28 Q48 42 38 60 Z" fill={green} {...ink} />
      <path d="M24 44 Q30 40 40 44 M22 52 Q30 48 40 52" fill="none" stroke="#16a34a" strokeWidth={1.8} strokeLinecap="round" />
      {/* Half-lidded eye: it's concentrating */}
      <path d="M26 30 L36 29" {...ink} />
      <path d="M27 30 Q31 35 35 30 Z" fill={INK} />
      <circle cx={30} cy={31} r={0.8} fill="#fff" />
    </g>
  )
}

export function Butterfree() {
  const purple = '#6d28d9'
  const wing = '#f8fafc'
  return (
    <g>
      {/* Four white wings with dark veins */}
      <path d="M30 28 Q14 4 4 12 Q0 26 28 34 Z" fill={wing} {...ink} />
      <path d="M34 28 Q50 4 60 12 Q64 26 36 34 Z" fill={wing} {...ink} />
      <path d="M29 36 Q10 38 10 52 Q22 58 31 40 Z" fill={wing} {...ink} />
      <path d="M35 36 Q54 38 54 52 Q42 58 33 40 Z" fill={wing} {...ink} />
      <path d="M8 13 L26 30 M56 13 L38 30 M13 50 L29 39 M51 50 L35 39" stroke={INK} strokeWidth={1.2} />
      <path d="M5 16 Q4 12 9 11 M59 16 Q60 12 55 11" fill="none" stroke={INK} strokeWidth={2.5} />
      {/* Antennae */}
      <path d="M29 20 Q24 10 22 6 M35 20 Q40 10 42 6" fill="none" {...ink} />
      {/* Round body and head */}
      <ellipse cx={32} cy={40} rx={6} ry={9} fill={purple} {...ink} />
      <circle cx={32} cy={26} r={9} fill={purple} {...ink} />
      {/* Big red compound eyes */}
      <ellipse cx={27.5} cy={25} rx={3.5} ry={4.5} fill="#dc2626" {...ink} strokeWidth={1.2} />
      <ellipse cx={36.5} cy={25} rx={3.5} ry={4.5} fill="#dc2626" {...ink} strokeWidth={1.2} />
      <circle cx={26.5} cy={23.5} r={1} fill="#fff" />
      <circle cx={35.5} cy={23.5} r={1} fill="#fff" />
      <path d="M30 31 L31 33 L32 31 L33 33 L34 31" fill="none" stroke="#e0e7ff" strokeWidth={1} />
      {/* Tiny blue hands and feet */}
      <circle cx={25} cy={40} r={2} fill="#93c5fd" {...ink} strokeWidth={1} />
      <circle cx={39} cy={40} r={2} fill="#93c5fd" {...ink} strokeWidth={1} />
      <circle cx={29} cy={50} r={2} fill="#93c5fd" {...ink} strokeWidth={1} />
      <circle cx={35} cy={50} r={2} fill="#93c5fd" {...ink} strokeWidth={1} />
    </g>
  )
}

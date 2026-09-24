import { Eye, INK, Smile, ink } from './common'

/** A thick serpent body: outline, fill, then a pale belly stripe. */
function Serpent({ d, colour, belly, width }: { d: string; colour: string; belly: string; width: number }) {
  return (
    <g>
      <path d={d} fill="none" stroke={INK} strokeWidth={width + 4} strokeLinecap="round" />
      <path d={d} fill="none" stroke={colour} strokeWidth={width} strokeLinecap="round" />
      <path d={d} fill="none" stroke={belly} strokeWidth={width * 0.3} strokeLinecap="round" transform="translate(-1 1.5)" />
    </g>
  )
}

/** The little white three-lobed fin both young dragons have for ears. */
function EarFin({ x, y, flip = false }: { x: number; y: number; flip?: boolean }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`}
      d="M0 0 Q-10 -2 -12 -8 Q-8 -8 -6 -6 Q-8 -12 -4 -12 Q-2 -8 -1 -6 Q0 -10 2 -9 Z"
      fill="#fff"
      {...ink}
      strokeWidth={1.5}
    />
  )
}

export function Dratini() {
  const blue = '#93c5fd'
  return (
    <g>
      <Serpent d="M12 56 Q4 44 16 42 Q34 42 36 26" colour={blue} belly="#fff" width={10} />
      <EarFin x={30} y={16} />
      <EarFin x={48} y={16} flip />
      <circle cx={39} cy={20} r={10} fill={blue} {...ink} />
      <ellipse cx={39} cy={25} rx={6} ry={4} fill="#fff" {...ink} strokeWidth={1.5} />
      <Eye x={35} y={18} r={2.6} />
      <Eye x={43} y={18} r={2.6} />
      <Smile x={39} y={25} w={2} />
    </g>
  )
}

export function Dragonair() {
  const blue = '#3b82f6'
  const orb = '#1d4ed8'
  return (
    <g>
      <Serpent d="M8 58 Q2 40 18 40 Q38 40 38 22" colour={blue} belly="#e0f2fe" width={9} />
      {/* Crystal orbs on neck and tail */}
      <circle cx={36} cy={32} r={3.5} fill={orb} {...ink} strokeWidth={1.5} />
      <circle cx={35} cy={31} r={1} fill="#bfdbfe" />
      <circle cx={8} cy={56} r={3} fill={orb} {...ink} strokeWidth={1.5} />
      <circle cx={10} cy={62} r={2.5} fill={orb} {...ink} strokeWidth={1.2} />
      {/* Wing-fins and horn */}
      <path d="M31 14 Q20 8 22 2 Q28 8 33 10 Z" fill="#fff" {...ink} strokeWidth={1.5} />
      <path d="M47 14 Q58 8 56 2 Q50 8 45 10 Z" fill="#fff" {...ink} strokeWidth={1.5} />
      <path d="M37 9 L39 1 L41 9 Z" fill="#fff" {...ink} strokeWidth={1.5} />
      <ellipse cx={39} cy={16} rx={9} ry={8} fill={blue} {...ink} />
      <ellipse cx={39} cy={21} rx={5} ry={3} fill="#e0f2fe" />
      <Eye x={35.5} y={15} r={2.4} />
      <Eye x={42.5} y={15} r={2.4} />
      <Smile x={39} y={21} w={2} />
    </g>
  )
}

export function Dragonite() {
  const orange = '#f59e0b'
  return (
    <g>
      {/* Small teal wings */}
      <path d="M20 30 L4 20 L8 30 L2 34 L16 38 Z" fill="#2dd4bf" {...ink} />
      <path d="M44 30 L60 20 L56 30 L62 34 L48 38 Z" fill="#2dd4bf" {...ink} />
      {/* Tail */}
      <path d="M44 54 Q58 58 58 48" fill="none" stroke={INK} strokeWidth={8} strokeLinecap="round" />
      <path d="M44 54 Q58 58 58 48" fill="none" stroke={orange} strokeWidth={5} strokeLinecap="round" />
      {/* Big friendly body with striped cream belly */}
      <ellipse cx={32} cy={43} rx={15} ry={16} fill={orange} {...ink} />
      <ellipse cx={32} cy={47} rx={10} ry={11} fill="#fef3c7" />
      <path d="M23 42 H41 M22.5 47 H41.5 M24 52 H40" stroke="#d97706" strokeWidth={1.2} />
      {/* Antennae */}
      <path d="M28 12 Q24 4 18 4 M36 12 Q40 4 46 4" fill="none" {...ink} />
      <circle cx={18} cy={4} r={2} fill={orange} {...ink} strokeWidth={1.2} />
      <circle cx={46} cy={4} r={2} fill={orange} {...ink} strokeWidth={1.2} />
      {/* Head */}
      <ellipse cx={32} cy={20} rx={11} ry={10} fill={orange} {...ink} />
      <ellipse cx={32} cy={25} rx={6} ry={3.5} fill="#fde68a" />
      <Eye x={27.5} y={18} r={2.6} />
      <Eye x={36.5} y={18} r={2.6} />
      <Smile x={32} y={24} w={3} />
      {/* Arms and feet */}
      <ellipse cx={17} cy={42} rx={4} ry={2.8} fill={orange} {...ink} strokeWidth={1.5} />
      <ellipse cx={47} cy={42} rx={4} ry={2.8} fill={orange} {...ink} strokeWidth={1.5} />
      <ellipse cx={24} cy={59} rx={6} ry={3} fill={orange} {...ink} strokeWidth={1.5} />
      <ellipse cx={40} cy={59} rx={6} ry={3} fill={orange} {...ink} strokeWidth={1.5} />
    </g>
  )
}

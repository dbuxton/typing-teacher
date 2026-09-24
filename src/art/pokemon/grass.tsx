import { Eye, Smile, ink } from './common'

/** The body the whole line shares: a squat four-legged lizard, facing us. */
function Body({ colour, spots, big = false }: { colour: string; spots: string; big?: boolean }) {
  const s = big ? 1.15 : 1
  return (
    <g transform={`translate(32 60) scale(${s}) translate(-32 -60)`}>
      {/* Back legs */}
      <rect x={38} y={48} width={8} height={10} rx={3} fill={colour} {...ink} />
      <rect x={48} y={46} width={8} height={10} rx={3} fill={colour} {...ink} />
      {/* Body */}
      <ellipse cx={40} cy={44} rx={17} ry={10} fill={colour} {...ink} />
      <ellipse cx={46} cy={41} rx={3} ry={2} fill={spots} />
      <ellipse cx={52} cy={46} rx={2} ry={1.5} fill={spots} />
      {/* Front legs */}
      <rect x={14} y={48} width={8} height={11} rx={3} fill={colour} {...ink} />
      <rect x={26} y={48} width={8} height={11} rx={3} fill={colour} {...ink} />
    </g>
  )
}

function Head({ colour, spots, cx = 22, cy = 38 }: { colour: string; spots: string; cx?: number; cy?: number }) {
  return (
    <g>
      <path d={`M${cx - 10} ${cy - 8} L${cx - 12} ${cy - 16} L${cx - 4} ${cy - 11} Z`} fill={colour} {...ink} />
      <path d={`M${cx + 10} ${cy - 8} L${cx + 12} ${cy - 16} L${cx + 4} ${cy - 11} Z`} fill={colour} {...ink} />
      <ellipse cx={cx} cy={cy} rx={13} ry={10.5} fill={colour} {...ink} />
      <ellipse cx={cx + 1} cy={cy - 8} rx={3} ry={1.6} fill={spots} />
      <Eye x={cx - 5.5} y={cy - 1} r={3.2} iris="#dc2626" />
      <Eye x={cx + 5.5} y={cy - 1} r={3.2} iris="#dc2626" />
      <Smile x={cx} y={cy + 5} w={5} />
    </g>
  )
}

export function Bulbasaur() {
  const teal = '#5fd3b0'
  const spots = '#0f766e'
  return (
    <g>
      <Body colour={teal} spots={spots} />
      {/* The bulb */}
      <path d="M30 38 Q26 22 40 14 Q54 22 52 38 Z" fill="#22c55e" {...ink} />
      <path d="M40 16 Q36 26 38 37 M46 20 Q47 28 46 37" fill="none" stroke="#15803d" strokeWidth={1.5} />
      <Head colour={teal} spots={spots} />
    </g>
  )
}

export function Ivysaur() {
  const teal = '#4fb8b0'
  const spots = '#115e59'
  return (
    <g>
      <Body colour={teal} spots={spots} />
      {/* Four broad leaves around a pink bud */}
      <path d="M40 34 Q24 30 20 20 Q32 18 40 32 Z" fill="#16a34a" {...ink} />
      <path d="M42 34 Q58 30 62 20 Q50 18 42 32 Z" fill="#16a34a" {...ink} />
      <path d="M40 34 Q30 20 34 10 Q42 18 41 32 Z" fill="#22c55e" {...ink} />
      <path d="M42 34 Q52 20 48 10 Q40 18 41 32 Z" fill="#22c55e" {...ink} />
      <path d="M36 32 Q34 20 41 16 Q48 20 46 32 Z" fill="#f472b6" {...ink} />
      <path d="M41 18 L41 30" stroke="#be185d" strokeWidth={1.5} />
      <Head colour={teal} spots={spots} cx={21} cy={39} />
    </g>
  )
}

export function Venusaur() {
  const teal = '#3fa39a'
  const spots = '#134e4a'
  const petals = [0, 72, 144, 216, 288]
  return (
    <g>
      <Body colour={teal} spots={spots} big />
      {/* Palm leaves under the flower */}
      <path d="M40 30 Q22 30 14 20 Q30 16 40 28 Z" fill="#15803d" {...ink} />
      <path d="M42 30 Q60 30 64 18 Q50 16 42 28 Z" fill="#15803d" {...ink} />
      {/* The big flower */}
      <g transform="translate(41 18)">
        {petals.map((angle) => (
          <g key={angle} transform={`rotate(${angle})`}>
            <ellipse cx={0} cy={-9} rx={6} ry={9} fill="#f472b6" {...ink} />
            <circle cx={-1.5} cy={-11} r={1.6} fill="#fdf2f8" />
            <circle cx={2} cy={-7} r={1.2} fill="#fdf2f8" />
          </g>
        ))}
        <circle r={5} fill="#fde047" {...ink} />
      </g>
      <Head colour={teal} spots={spots} cx={20} cy={40} />
    </g>
  )
}

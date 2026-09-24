import { INK, ink } from './common'

/**
 * The ghost line keeps its grins cheeky rather than scary. These are for
 * seven-year-olds.
 */

export function Gastly() {
  return (
    <g>
      {/* Purple gas cloud */}
      <circle cx={32} cy={34} r={24} fill="#c4b5fd" opacity={0.55} />
      <circle cx={16} cy={24} r={8} fill="#c4b5fd" opacity={0.5} />
      <circle cx={50} cy={46} r={7} fill="#c4b5fd" opacity={0.5} />
      {/* The dark ball */}
      <circle cx={32} cy={34} r={15} fill="#27213d" {...ink} />
      <path d="M22 26 L29 29 M42 26 L35 29" stroke="#fff" strokeWidth={1.5} strokeLinecap="round" />
      <ellipse cx={26} cy={31} rx={4} ry={3} fill="#fff" />
      <ellipse cx={38} cy={31} rx={4} ry={3} fill="#fff" />
      <circle cx={27} cy={31} r={1.4} fill={INK} />
      <circle cx={37} cy={31} r={1.4} fill={INK} />
      <path d="M23 38 Q32 46 41 38 Z" fill="#fca5a5" stroke="#fff" strokeWidth={1.2} strokeLinejoin="round" />
      <path d="M26 39 L27 42 L28 39.6 M36 39.6 L37 42 L38 39" fill="#fff" />
    </g>
  )
}

export function Haunter() {
  const purple = '#7c3aed'
  return (
    <g>
      {/* Spiky floating head */}
      <path
        d="M14 34 Q10 22 18 16 L16 6 L24 13 L28 3 L33 12 L40 4 L42 14 L50 10 L48 20 Q56 28 50 40 Q44 52 32 52 Q18 50 14 34 Z"
        fill={purple}
        {...ink}
      />
      <path d="M20 26 L28 29 M44 26 L36 29" {...ink} />
      <ellipse cx={24} cy={31} rx={4.5} ry={3.5} fill="#fff" {...ink} strokeWidth={1.2} />
      <ellipse cx={40} cy={31} rx={4.5} ry={3.5} fill="#fff" {...ink} strokeWidth={1.2} />
      <circle cx={25} cy={31.5} r={1.6} fill={INK} />
      <circle cx={39} cy={31.5} r={1.6} fill={INK} />
      <path d="M22 38 Q32 48 42 38 Z" fill="#9f1239" {...ink} strokeWidth={1.5} />
      <path d="M30 42 Q33 50 36 42" fill="#f472b6" />
      {/* Disembodied hands */}
      <path d="M4 46 Q2 40 6 40 L6 36 Q8 34 9 37 L10 34 Q12 33 12 37 Q14 38 12 44 Q9 48 4 46 Z" fill={purple} {...ink} strokeWidth={1.5} />
      <path d="M60 46 Q62 40 58 40 L58 36 Q56 34 55 37 L54 34 Q52 33 52 37 Q50 38 52 44 Q55 48 60 46 Z" fill={purple} {...ink} strokeWidth={1.5} />
    </g>
  )
}

export function Gengar() {
  const purple = '#6d28d9'
  return (
    <g>
      {/* Round body with a spiky back and pointed ears */}
      <path
        d="M10 40 Q8 22 18 16 L14 4 L26 12 Q32 10 38 12 L50 4 L46 16 Q52 18 54 24 L60 22 L56 30 L62 32 L56 38 Q56 52 44 56 Q32 60 20 56 Q10 52 10 40 Z"
        fill={purple}
        {...ink}
      />
      {/* Stubby legs and arms */}
      <ellipse cx={22} cy={58} rx={5} ry={3} fill={purple} {...ink} strokeWidth={1.5} />
      <ellipse cx={42} cy={58} rx={5} ry={3} fill={purple} {...ink} strokeWidth={1.5} />
      <ellipse cx={9} cy={42} rx={3.5} ry={2.5} fill={purple} {...ink} strokeWidth={1.5} />
      <ellipse cx={55} cy={42} rx={3.5} ry={2.5} fill={purple} {...ink} strokeWidth={1.5} />
      {/* Red eyes, mischievous rather than menacing */}
      <path d="M18 25 L26 28 L20 31 Z" fill="#ef4444" {...ink} strokeWidth={1.2} />
      <path d="M46 25 L38 28 L44 31 Z" fill="#ef4444" {...ink} strokeWidth={1.2} />
      {/* The big grin */}
      <path d="M17 36 Q32 50 47 36 Q32 42 17 36 Z" fill="#fff" {...ink} strokeWidth={1.5} />
      <path d="M22 38.5 L22 41 M27 40 L27 43.5 M32 40.6 L32 44.5 M37 40 L37 43.5 M42 38.5 L42 41" stroke={INK} strokeWidth={0.8} />
    </g>
  )
}

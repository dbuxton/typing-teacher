import { FUEL_TANK } from '../engine/balance'

/**
 * The flight gauges: shields, fuel and stardust. Deliberately few and big — a
 * kid should read "two shields, three cans" at a glance without looking away
 * from the trail for long.
 */

function FuelCan({ state }: { state: 'full' | 'empty' | 'spare' }) {
  const colour = state === 'spare' ? '#ffe36e' : '#a6ff6a'
  return (
    <svg width="18" height="24" viewBox="0 0 18 24" aria-hidden className={state === 'empty' ? 'opacity-30' : 'st-glow'}>
      <path d="M5 1 H11 V4 H5 Z" fill={state === 'empty' ? 'none' : colour} stroke={colour} strokeWidth="1.2" />
      <rect x="1.5" y="4.5" width="15" height="18" rx="3" fill={state === 'empty' ? 'none' : colour} stroke={colour} strokeWidth="1.5" />
    </svg>
  )
}

function ShieldPip({ on }: { on: boolean }) {
  return (
    <svg width="20" height="22" viewBox="0 0 20 22" aria-hidden className={on ? 'st-glow' : 'opacity-30'}>
      <path d="M10 1 L19 6 V16 L10 21 L1 16 V6 Z" fill={on ? '#5ef2ff' : 'none'} stroke="#5ef2ff" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

export function Gauges({
  shields,
  maxShields,
  tank,
  spare,
  stardust,
  training,
}: {
  shields: number
  maxShields: number
  tank: number
  spare: number
  stardust: number
  training: boolean
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2" data-tank={tank} data-spare={spare} data-shields={shields}>
      <div className="flex items-center gap-1" aria-label={`Shields: ${shields} of ${maxShields}`} title="Shields">
        {Array.from({ length: maxShields }, (_, i) => (
          <ShieldPip key={i} on={i < shields} />
        ))}
      </div>
      <div className="flex items-center gap-1" aria-label={`Fuel: ${tank} of ${FUEL_TANK} cans${spare ? `, ${spare} spare` : ''}`} title="Fuel">
        {Array.from({ length: FUEL_TANK }, (_, i) => (
          <FuelCan key={i} state={i < tank ? 'full' : 'empty'} />
        ))}
        {Array.from({ length: spare }, (_, i) => (
          <FuelCan key={`spare-${i}`} state="spare" />
        ))}
      </div>
      <span className="st-chip text-neon-gold" aria-label={`${stardust} stardust this hunt`}>
        ✨ {stardust}
      </span>
      {training && <span className="st-chip text-neon-lime">Training flight: the tank can’t run dry</span>}
    </div>
  )
}

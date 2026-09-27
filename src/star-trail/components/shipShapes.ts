import type { ShipPartId } from '../data/ship'

/**
 * The Lost Ship, drawn as a blueprint: every part is three SVG paths — one per
 * piece — in a 400 × 220 side view with the nose pointing right. A found piece
 * lights its path in the part's planet colour; a missing one is a faint dashed
 * outline, so a kid can see exactly what's left to find.
 */
export const SHIP_VIEWBOX = '0 0 400 220'

export const SHIP_SHAPES: Record<ShipPartId, readonly [string, string, string]> = {
  hull: [
    'M112 110 Q112 80 150 80 H292',
    'M112 110 Q112 140 150 140 H292',
    'M163 110 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0 M193 110 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0 M223 110 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0',
  ],
  cockpit: [
    'M242 80 Q252 56 282 60 Q292 66 296 80',
    'M254 76 Q262 64 280 66',
    'M270 60 L276 46 M273 43 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0',
  ],
  'nose-cone': ['M292 80 Q334 84 364 110', 'M292 140 Q334 136 364 110', 'M320 91 Q330 110 320 129'],
  wings: ['M176 80 L146 32 L122 32 L140 80', 'M176 140 L146 188 L122 188 L140 140', 'M152 58 L132 58 M152 162 L132 162'],
  'fuel-tanks': [
    'M150 146 H198 Q205 152 198 158 H150 Q143 152 150 146',
    'M214 146 H262 Q269 152 262 158 H214 Q207 152 214 146',
    'M198 152 H214 M174 146 V140 M238 146 V140',
  ],
  'landing-legs': [
    'M156 158 L136 196 M126 196 H146',
    'M206 158 L206 200 M196 200 H216',
    'M256 158 L278 196 M268 196 H288',
  ],
  'tail-fin': [
    'M120 84 L94 40 L76 40 L98 88',
    'M104 62 L88 62',
    'M76 40 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0',
  ],
  'radar-dish': ['M206 80 V60', 'M188 50 Q206 70 224 50', 'M230 42 Q236 50 230 58 M238 36 Q248 50 238 64'],
  'main-engine': ['M112 94 L86 86 V134 L112 126', 'M98 90 V130', 'M86 98 Q72 110 86 122'],
  'star-drive': [
    'M268 100 L271 107 L278 110 L271 113 L268 120 L265 113 L258 110 L265 107 Z',
    'M40 110 a58 22 0 1 0 116 0 a58 22 0 1 0 -116 0',
    'M86 104 L22 110 L86 116',
  ],
}

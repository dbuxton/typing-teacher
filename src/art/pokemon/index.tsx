import type { ComponentType } from 'react'
import { Butterfree, Caterpie, Metapod } from './bug'
import { Dragonair, Dragonite, Dratini } from './dragon'
import { Pichu, Pikachu, Raichu } from './electric'
import { Igglybuff, Jigglypuff, Wigglytuff } from './fairy'
import { Charizard, Charmander, Charmeleon } from './fire'
import { Gastly, Gengar, Haunter } from './ghost'
import { Bulbasaur, Ivysaur, Venusaur } from './grass'
import { Blastoise, Gyarados, Magikarp, Squirtle, Wartortle } from './water'

export { Egg } from './egg'

/**
 * Every drawn form, keyed by the stage id used in `src/data/rewards/pokemon.ts`.
 * The rewards tests fail if a stage id is missing from here, so a new line can't
 * ship with a blank where a Pokémon should be.
 */
export const FORMS: Record<string, ComponentType> = {
  magikarp: Magikarp,
  gyarados: Gyarados,
  caterpie: Caterpie,
  metapod: Metapod,
  butterfree: Butterfree,
  pichu: Pichu,
  pikachu: Pikachu,
  raichu: Raichu,
  igglybuff: Igglybuff,
  jigglypuff: Jigglypuff,
  wigglytuff: Wigglytuff,
  bulbasaur: Bulbasaur,
  ivysaur: Ivysaur,
  venusaur: Venusaur,
  charmander: Charmander,
  charmeleon: Charmeleon,
  charizard: Charizard,
  squirtle: Squirtle,
  wartortle: Wartortle,
  blastoise: Blastoise,
  gastly: Gastly,
  haunter: Haunter,
  gengar: Gengar,
  dratini: Dratini,
  dragonair: Dragonair,
  dragonite: Dragonite,
}

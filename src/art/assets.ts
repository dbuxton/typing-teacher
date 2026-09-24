/** Generated artwork is bundled locally; Vite supplies the deployed base path. */
export const EGG_IMAGES = new Set([
  'magikarp', 'caterpie', 'pichu', 'igglybuff', 'bulbasaur',
  'charmander', 'squirtle', 'gastly', 'dratini',
])

export const POKEMON_IMAGES = new Set([
  'magikarp', 'gyarados', 'caterpie', 'metapod', 'butterfree',
  'pichu', 'pikachu', 'raichu', 'igglybuff', 'jigglypuff', 'wigglytuff',
  'bulbasaur', 'ivysaur', 'venusaur', 'charmander', 'charmeleon', 'charizard',
  'squirtle', 'wartortle', 'blastoise', 'gastly', 'haunter', 'gengar',
  'dratini', 'dragonair', 'dragonite',
])

export const GARDEN_IMAGES: Record<string, string> = {
  '🌱': 'seedling',
  '🌿': 'leaves',
  '🌼': 'daisy',
  '🌷': 'tulip',
  '🌻': 'sunflower',
  '🌹': 'rose',
  '🌵': 'cactus',
  '🍄': 'mushroom',
  '🎋': 'palm-young',
  '🌴': 'palm',
  '🌲': 'pine',
  '🌳': 'cherry-young',
  '🌸': 'cherry',
}

export function rewardImage(path: string): string {
  return `${import.meta.env.BASE_URL}art/rewards/${path}.webp`
}

# Reward artwork

Generated individually on 24 September 2026, using the built-in image generation
tool for plants, eggs and player portraits, and Google's Nano Banana 2 for Pokémon.
The original emoji and SVG subjects informed the prompts. The supplied Pikachu
provided the style reference for the other characters. All finished artwork
is bundled locally as transparent 512 × 512 WebP images in `public/art/rewards/`.
WebP conversion preserves alpha and uses quality 88; no runtime image service is needed.

![Artwork overview](reward-art-preview.png)

## Asset set

- `garden/`: 13 illustrations covering all existing growth-stage ids, including
  shared seedlings and leaves, young trees, and each mature plant.
- `football/`: 11 individual illustrated player portraits. Each is reused across
  its five tiers; names, positions, club names, stars and upgrade frames are live
  HTML/CSS so they remain accurate and don't depend on generated lettering.
- `eggs/`: 9 individually generated ivory eggs with each evolution line's existing
  speckle colour.
- `pokemon/`: all 26 character forms across the nine evolution lines. Twenty-five
  were generated individually with Nano Banana 2; Pikachu uses the supplied image.

The portraits are generated illustrations, not official photographs. Clothing
uses the colours already defined by this branch's catalogue.

## Character artwork

![Pokémon artwork overview](pokemon-art-preview.png)

All character stages now use the generated illustrations. Original character
SVGs remain in the source tree as references; only the generic fallback egg is
used for an unrecognised saved item. No identities or progression rules changed.

Nano Banana 2 generated white-background originals. Local background removal
with the BiRefNet-General and General-Lite models and colour decontamination
produced transparent PNG cutouts, then 512px WebP assets. This also removed the checkerboard baked into
the supplied Pikachu. Charizard received one additional image-edit request to
remove a duplicated tail before background removal.

## Prompts and maintenance

To regenerate the Pokémon using your Google API key, follow the
[Nano Banana 2 setup](nano-banana-2.md). The local script sends the 25 saved
character prompts individually and can reuse the supplied Pikachu as a style
reference. Generated originals are kept separately until reviewed and prepared
as transparent assets.

The exact individual prompts, including the two rejected requests, are recorded
in [reward-art-prompts.json](reward-art-prompts.json). Each entry's `id` maps to
`public/art/rewards/<id>.webp`, except the two rejected `pokemon/` entries.
The final Pokémon prompt set is in
[pokemon-character-prompts.json](pokemon-character-prompts.json), and the
[generation record](pokemon-generation.json) includes the accepted output
settings and Charizard's correction prompt. The earlier rejections were from
the built-in tool; the subsequent Google requests produced all 25 characters.

`src/art/assets.ts` maps the original garden stage identifiers to image names.
Keeping those identifiers preserves saved progress and growth sequences. Egg
and portrait filenames match their existing kind ids.

To replace an illustration, generate that asset individually using its prompt,
inspect the output, and encode it as a transparent WebP at the same path. Keep
the whole subject visible for plants and eggs. Verify the picker, collection,
shop and lesson results at narrow and desktop widths.

## Verification

- Production build, 147 unit tests, 8 browser smoke tests and 8 generator checks passed.
- All 59 images are 512 × 512 with transparent background pixels and
  visible subjects; the full image set is approximately 2.4 MB (the Pokémon are 0.83 MB).
- All 26 character forms loaded in the app at desktop and 375px widths:
  no missing images, page errors or horizontal overflow. Cutouts were inspected
  on both light and dark backgrounds.
- Garden, squad and egg collections were checked at desktop and 375px widths:
  no broken images or horizontal overflow. Card proportions remain 64:88.

# Generate the Pokémon artwork with Nano Banana 2

The local script sends the 25 prompts in `pokemon-character-prompts.json` to
Google's Gemini API, one character per request. It uses Nano Banana 2
(`gemini-3.1-flash-image`) at square 1K resolution. Pikachu is excluded because
you already supplied that illustration.

## Add the key

Use a Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey).
In the project root, open `.env.local` and add:

```dotenv
GEMINI_API_KEY=your_actual_key_here
```

This file is ignored by Git. Keep the key out of chat and don't give it a
`VITE_` prefix: those variables can be exposed to the browser. The script reads
the key locally and sends it only in Google's authentication header. It also
accepts an existing `GEMINI_API_KEY` or `GOOGLE_API_KEY` environment variable,
preferring `GEMINI_API_KEY` if both are present. `.env.local.example` is the
blank template for another checkout.

## Run

Use Node.js 22 or later. No additional package installation is needed.
Run these commands from the project root.

Check the list without making any API requests:

```sh
npm run art:pokemon -- --dry-run
```

Generate a single image first:

```sh
npm run art:pokemon -- --only magikarp
```

To match the supplied Pikachu, add `--reference` with the path to that image.
This sends the reference image to Google with each character prompt:

```sh
npm run art:pokemon -- --only magikarp --reference /path/to/pikachu.png
```

Generate all remaining images, optionally adding the same reference:

```sh
npm run art:pokemon
```

Images and their prompt/settings records go to
`output/nano-banana-2/originals/`, which is ignored by Git. Existing images are
skipped, so rerunning resumes where it left off. Use `--only bulbasaur,charmander`
to select several characters or `--out output/nano-banana-2/variation` to make
another version without overwriting the first.

Each pending image uses your project's API quota and billing. Requests run
sequentially and stop on the first error or response without an image. There
are no automatic retries. After a network timeout, Google may already have
processed the request, so a rerun might incur another charge for that image.
If the process was forcibly terminated and left `.generation.lock` in the
output folder, ensure no generator is still running before deleting that file.

The prompts request plain white backgrounds. The script saves Google's output
unchanged; run the [background removal workflow](background-removal.md) to
prepare transparent app assets. Generation alone does not update the app;
`scripts/prepare-pokemon.py` writes its prepared WebP images into the app's
artwork folder.

## Verification and references

`npm run art:test` checks the request format, image extraction, error handling
and resume behaviour using mocked responses; it does not call Google.

- [Google's Nano Banana 2 model documentation](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-image)
- [Google's image generation REST examples](https://ai.google.dev/gemini-api/docs/generate-content/image-generation)
- [Google's API key setup](https://ai.google.dev/gemini-api/docs/api-key)

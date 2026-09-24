# Scripted background removal

## This project's character artwork

The prepared workflow uses rembg locally with the BiRefNet-General-Lite model and
colour decontamination to reduce pale fringes on transparent edges. It keeps
full-size transparent PNG cutouts and exports 512px WebP assets for the app.

```sh
python3.12 -m venv output/nano-banana-2/.venv-rembg
output/nano-banana-2/.venv-rembg/bin/python -m pip install -r scripts/requirements-art.txt
output/nano-banana-2/.venv-rembg/bin/python scripts/prepare-pokemon.py
```

Put the generated originals and the supplied `pikachu.png` in
`output/nano-banana-2/originals/`. Full-size cutouts are cached in
`output/nano-banana-2/cutouts/`; the app assets go to
`public/art/rewards/pokemon/`. The model cache also stays in the ignored output
folder. Initial setup downloads a roughly 224MB model; processing then runs locally.
Use `--model birefnet-general` for the larger, slower model (roughly 1GB).

Use `--only magikarp,pikachu` to prepare selected characters. To redo a cutout
after changing an original or selecting another model, remove that character's
cached PNG first. The script checks that each new cutout contains transparent and opaque pixels.
Inspect the edges against both pale and dark backgrounds before accepting it.

## General CLI alternative

Use rembg's local CLI. Its documented Python requirement is 3.11–3.13.

Install in a separate environment (this example uses Python 3.12):

```sh
python3.12 -m venv .venv-rembg
.venv-rembg/bin/python -m pip install "rembg[cpu,cli]"
```

One image:

```sh
.venv-rembg/bin/rembg i -m birefnet-general input.png cutout.png
```

An entire folder:

```sh
mkdir -p cutouts
.venv-rembg/bin/rembg p -m birefnet-general originals cutouts
```

Use a separate, empty output folder to preserve originals. The model downloads
on first use, then image processing runs locally. Inspect the cutouts against
light and dark backgrounds, particularly wing tips, tails and Gastly's gas.
The project workflow above uses the library directly; this CLI is an alternative.

Source: [rembg documentation](https://github.com/danielgatis/rembg).

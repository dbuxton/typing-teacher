"""Remove backgrounds locally and export the Pokémon as transparent WebP assets."""
import argparse
import json
import os
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WORK = ROOT / "output/nano-banana-2"
os.environ.setdefault("REMBG_HOME", str(WORK / "models"))
os.environ.setdefault("NUMBA_CACHE_DIR", str(WORK / "numba-cache"))
os.environ.setdefault("OMP_NUM_THREADS", "4")

from PIL import Image, ImageOps
from rembg import new_session, remove


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--only", help="Comma-separated character ids")
    parser.add_argument("--input", type=Path, default=WORK / "originals")
    parser.add_argument("--output", type=Path, default=ROOT / "public/art/rewards/pokemon")
    parser.add_argument("--model", choices=["birefnet-general-lite", "birefnet-general"], default="birefnet-general-lite")
    args = parser.parse_args()
    ids = [job["id"] for job in json.loads((ROOT / "docs/pokemon-character-prompts.json").read_text())["jobs"]]
    ids.insert(ids.index("raichu"), "pikachu")
    if args.only:
        selected = set(args.only.split(","))
        if selected - set(ids):
            parser.error("Unknown character id")
        ids = [id for id in ids if id in selected]
    sources = {}
    for id in ids:
        sources[id] = next((args.input / f"{id}{ext}" for ext in [".png", ".jpg", ".webp"] if (args.input / f"{id}{ext}").exists()), None)
        if sources[id] is None:
            parser.error(f"Missing original for {id}")
    cutouts = WORK / "cutouts"
    cutouts.mkdir(parents=True, exist_ok=True)
    args.output.mkdir(parents=True, exist_ok=True)
    session = None
    for id in ids:
        started = time.perf_counter()
        cutout_path = cutouts / f"{id}.png"
        if cutout_path.exists():
            cutout = Image.open(cutout_path).convert("RGBA")
        else:
            if session is None:
                print("Loading the local background-removal model…", flush=True)
                session = new_session(args.model, providers=["CPUExecutionProvider"])
            print(f"Removing background: {id}", flush=True)
            original = ImageOps.exif_transpose(Image.open(sources[id])).convert("RGB")
            cutout = remove(original, session=session, decontaminate=True).convert("RGBA")
            alpha = cutout.getchannel("A")
            if alpha.getextrema()[0] > 10 or alpha.getextrema()[1] < 245:
                raise RuntimeError(f"Unexpected transparency for {id}; inspect before continuing")
            temporary_cutout = cutout_path.with_suffix('.partial.png')
            cutout.save(temporary_cutout)
            temporary_cutout.replace(cutout_path)
            cutout_path.with_suffix('.json').write_text(json.dumps({"model": args.model, "decontaminate": True}) + '\n')
        asset = ImageOps.pad(cutout, (512, 512), method=Image.Resampling.LANCZOS, color=(0, 0, 0, 0))
        temporary_asset = args.output / f"{id}.partial.webp"
        asset.save(temporary_asset, quality=88, method=4)
        temporary_asset.replace(args.output / f"{id}.webp")
        print(f"Saved {id}.webp ({time.perf_counter() - started:.1f}s)", flush=True)


if __name__ == "__main__":
    main()

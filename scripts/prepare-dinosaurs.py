"""Package generated transparent dinosaur PNGs as local WebP game assets."""
import argparse
import hashlib
import json
import shutil
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
WORK = ROOT / 'output/dinosaur-art'
ASSETS = ROOT / 'public/art/rewards/dinosaurs'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--available', action='store_true', help='Package only completed requests')
    args = parser.parse_args()
    jobs = json.loads((ROOT / 'docs/dinosaur-art-prompts.json').read_text())['jobs']
    sources = json.loads((WORK / 'source-map.json').read_text())
    if not args.available:
        missing = [job['id'] for job in jobs if job['id'] not in sources]
        if missing:
            parser.error(f'Missing generated images: {missing}')
    ASSETS.mkdir(parents=True, exist_ok=True)
    originals = WORK / 'originals'
    originals.mkdir(parents=True, exist_ok=True)
    records = []
    for job in jobs:
        id = job['id']
        if id not in sources:
            continue
        source = Path(sources[id])
        original = originals / f'{id}.png'
        destination = ASSETS / f'{id}.webp'
        if not destination.exists():
            if source.resolve() != original.resolve():
                shutil.copyfile(source, original)
            image = Image.open(original).convert('RGBA')
            if image.getchannel('A').getextrema() != (0, 255):
                raise RuntimeError(f'{id}: expected genuine transparency; inspect the original')
            # Preserve the generated alpha; this is only resizing and encoding.
            image = ImageOps.contain(image, (472, 472), Image.Resampling.LANCZOS)
            canvas = Image.new('RGBA', (512, 512))
            canvas.alpha_composite(image, ((512 - image.width) // 2, (512 - image.height) // 2))
            canvas.save(destination, quality=88, method=4)
        data = destination.read_bytes()
        with Image.open(destination) as asset:
            records.append({'id': id, 'stage': job['stage'], 'file': str(destination.relative_to(ROOT)),
                            'generatedOriginal': source.name, 'dimensions': list(asset.size),
                            'alphaExtrema': list(asset.getchannel('A').getextrema()),
                            'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()})
    (ROOT / 'docs/dinosaur-art-generation.json').write_text(json.dumps({
        'provider': 'Built-in image_gen', 'note': 'Individual requests; original alpha preserved. Each dinosaur has its own egg and three illustrated ages. The original shared egg remains an unknown-kind fallback.',
        'assets': records,
    }, indent=2) + '\n')
    print(f'Packaged {len(records)}/{len(jobs)} dinosaur images')


if __name__ == '__main__':
    main()

"""Make contact sheets for visual review of the dinosaur assets."""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / 'public/art/rewards/dinosaurs'
WORK = ROOT / 'output/dinosaur-art'
species = json.loads((ROOT / 'docs/dinosaur-art-prompts.json').read_text())['species']
def load_font(size, bold=False):
    candidates = [
        '/System/Library/Fonts/Supplemental/Arial Bold.ttf' if bold else '/System/Library/Fonts/Supplemental/Arial.ttf',
        '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf' if bold else '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    ]
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default(size=size)


font = load_font(18)
title = load_font(28, bold=True)


def tile(canvas, id, x, y, size):
    path = ASSETS / f'{id}.webp'
    if path.exists():
        image = Image.open(path).convert('RGBA')
        image.thumbnail((size, size), Image.Resampling.LANCZOS)
        canvas.alpha_composite(image, (x + (size - image.width) // 2, y + (size - image.height) // 2))


for dark in [False, True]:
    canvas = Image.new('RGBA', (1200, 830), '#18353b' if dark else '#f1f7e9')
    draw = ImageDraw.Draw(canvas)
    ink = '#e9f2e7' if dark else '#254537'
    draw.text((28, 22), 'Your dinosaur island', font=title, fill=ink)
    draw.text((28, 60), '18 dinosaurs · individually illustrated · eggs grow through three ages', font=font, fill=ink)
    for i, dinosaur in enumerate(species):
        x, y = (i % 6) * 200, 106 + (i // 6) * 236
        tile(canvas, dinosaur['id'], x, y, 194)
        draw.text((x + 100, y + 192), dinosaur['name'], font=font, fill=ink, anchor='mt')
        draw.text((x + 100, y + 215), f"{dinosaur['cost']} coins", font=font, fill=ink, anchor='mt')
    canvas.convert('RGB').save(WORK / 'adults-dark.png' if dark else ROOT / 'docs/dinosaur-art-preview.png')

for group in ['Crests & armour', 'Long necks', 'Two-legged']:
    members = [s for s in species if s['group'] == group]
    canvas = Image.new('RGBA', (1150, 1470), '#f1f7e9')
    draw = ImageDraw.Draw(canvas)
    draw.text((28, 20), group + ' · growing up', font=title, fill='#254537')
    for col, label in enumerate(['Egg', 'Hatchling', 'Juvenile', 'Adult']):
        draw.text((340 + col * 225, 76), label, font=font, fill='#254537', anchor='mt')
    for row, dinosaur in enumerate(members):
        y = 115 + row * 220
        draw.text((18, y + 90), dinosaur['name'], font=font, fill='#254537')
        for col, id in enumerate(['egg', dinosaur['id'] + '-baby', dinosaur['id'] + '-juvenile', dinosaur['id']]):
            tile(canvas, id, 228 + col * 225, y, 214)
    slug = group.lower().replace(' & ', '-').replace(' ', '-')
    canvas.convert('RGB').save(WORK / f'{slug}-growth.png')
print('Dinosaur artwork previews saved')

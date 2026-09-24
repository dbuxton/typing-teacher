"""Create contact sheets to inspect every prepared character on light and dark backgrounds."""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
jobs = json.loads((ROOT / "docs/pokemon-character-prompts.json").read_text())["jobs"]
jobs.insert(6, {"id": "pikachu", "name": "Pikachu"})
def label_font(size):
    for name in ["Arial.ttf", "DejaVuSans.ttf", "/System/Library/Fonts/Supplemental/Arial.ttf"]:
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            pass
    return ImageFont.load_default(size=size)

font = label_font(18)
title_font = label_font(30)

for dark in [False, True]:
    background, card, ink = ("#152438", "#263b52", "#eaf2fa") if dark else ("#ecf3f7", "#ffffff", "#23384a")
    sheet = Image.new("RGBA", (1240, 1280), background)
    draw = ImageDraw.Draw(sheet)
    draw.text((32, 25), "The Pokémon collection", font=title_font, fill=ink)
    draw.text((32, 67), "26 painted characters / 9 evolution lines", font=font, fill=ink)
    for index, job in enumerate(jobs):
        path = ROOT / f"public/art/rewards/pokemon/{job['id']}.webp"
        x, y = 24 + (index % 6) * 200, 110 + (index // 6) * 230
        draw.rounded_rectangle((x, y, x + 188, y + 217), radius=16, fill=card)
        if path.exists():
            with Image.open(path) as image:
                thumbnail = image.convert("RGBA").resize((184, 184), Image.Resampling.LANCZOS)
            sheet.alpha_composite(thumbnail, (x + 2, y + 3))
        draw.text((x + 94, y + 192), job["name"], font=font, fill=ink, anchor="mt")
    destination = ROOT / ("output/nano-banana-2/alpha-preview.png" if dark else "docs/pokemon-art-preview.png")
    sheet.convert("RGB").save(destination)
    print(destination)

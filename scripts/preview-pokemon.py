"""Create contact sheets to inspect every prepared character on light and dark backgrounds."""
import argparse
import json
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--theme", choices=["pokemon", "animals"], default="pokemon")
args = parser.parse_args()
animals = args.theme == "animals"
manifest = "animal-art-prompts.json" if animals else "pokemon-character-prompts.json"
jobs = json.loads((ROOT / "docs" / manifest).read_text())["jobs"]
all_jobs = jobs
if animals:
    jobs = [job for job in jobs if job["stage"] == "adult"]
if not animals:
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
    sheet = Image.new("RGBA", (1240, 130 + math.ceil(len(jobs) / 6) * 230), background)
    draw = ImageDraw.Draw(sheet)
    draw.text((32, 25), "Your animal friends" if animals else "The Pokémon collection", font=title_font, fill=ink)
    draw.text((32, 67), "18 painted animals / birds, mammals and more" if animals else "26 painted characters / 9 evolution lines", font=font, fill=ink)
    for index, job in enumerate(jobs):
        path = ROOT / f"public/art/rewards/{args.theme}/{job['id']}.webp"
        x, y = 24 + (index % 6) * 200, 110 + (index // 6) * 230
        draw.rounded_rectangle((x, y, x + 188, y + 217), radius=16, fill=card)
        if path.exists():
            with Image.open(path) as image:
                thumbnail = image.convert("RGBA").resize((184, 184), Image.Resampling.LANCZOS)
            sheet.alpha_composite(thumbnail, (x + 2, y + 3))
        draw.text((x + 94, y + 192), job["name"], font=font, fill=ink, anchor="mt")
    work = "output/nano-banana-2/animals" if animals else "output/nano-banana-2"
    preview = "animal-art-preview.png" if animals else "pokemon-art-preview.png"
    destination = ROOT / (f"{work}/alpha-preview.png" if dark else f"docs/{preview}")
    sheet.convert("RGB").save(destination)
    print(destination)

if animals:
    for group in ["Birds", "Mammals", "More animals"]:
        species = [job for job in jobs if job["group"] == group]
        for dark in [False, True]:
            background, card, ink = ("#152438", "#263b52", "#eaf2fa") if dark else ("#ecf3f7", "#ffffff", "#23384a")
            sheet = Image.new("RGBA", (780, 1500), background)
            draw = ImageDraw.Draw(sheet)
            draw.text((30, 22), f"Growing up: {group.lower()}", font=title_font, fill=ink)
            draw.text((30, 65), "Baby / juvenile / adult", font=font, fill=ink)
            for row, animal in enumerate(species):
                for column, stage in enumerate(["baby", "juvenile", "adult"]):
                    job = next(j for j in all_jobs if j["animalId"] == animal["id"] and j["stage"] == stage)
                    x, y = 24 + column * 246, 104 + row * 230
                    draw.rounded_rectangle((x, y, x + 232, y + 217), radius=16, fill=card)
                    path = ROOT / f"public/art/rewards/animals/{job['id']}.webp"
                    if path.exists():
                        with Image.open(path) as image:
                            thumbnail = image.convert("RGBA").resize((184, 184), Image.Resampling.LANCZOS)
                        sheet.alpha_composite(thumbnail, (x + 24, y + 3))
                    label = animal["name"] + " · " + stage.title()
                    if animal["id"] == "tree-frog":
                        label = ["Tree frog · Tadpole", "Tree frog · Froglet", "Tree frog · Adult"][column]
                    elif animal["id"] == "butterfly":
                        label = ["Monarch caterpillar", "Monarch chrysalis", "Monarch butterfly"][column]
                    draw.text((x + 116, y + 192), label, font=font, fill=ink, anchor="mt")
            slug = group.lower().replace(" ", "-")
            destination = ROOT / (f"output/nano-banana-2/animals/{slug}-alpha.png" if dark else f"docs/animals-{slug}-growth.png")
            sheet.convert("RGB").save(destination)
            print(destination)

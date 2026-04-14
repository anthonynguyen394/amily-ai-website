"""Composite the transparent versions on a contrasting bright color
   to make any remaining magenta fringe visible."""
from PIL import Image
from pathlib import Path
ASSETS = Path("D:/Github/amily-ai-website/public/assets")

for name in ["logo-full-transparent.png", "amily-01-waving-transparent.png"]:
    im = Image.open(ASSETS / name).convert("RGBA")
    # Composite on a vivid green so any pink/magenta halo would jump out
    bg = Image.new("RGBA", im.size, (40, 180, 60, 255))
    out = Image.alpha_composite(bg, im).convert("RGB")
    out_path = ASSETS.parent.parent / "scripts" / f"check_{name.replace('.png','')}_on_green.png"
    out.save(out_path)
    print(f"saved {out_path.name}")

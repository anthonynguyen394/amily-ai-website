"""Produce transparent + cream-bg variants of the NB logo and hero images.

   Strategy: flood-fill from the 4 corners with a brightness threshold so we
   only kill the *connected* white background — interior whites (her shirt,
   teeth, highlights) are preserved because they're not touching the border.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ASSETS = Path("D:/Github/amily-ai-website/public/assets")
CREAM = (250, 245, 235)  # #faf5eb — hero bg top of gradient

# Threshold: how close to white (255) must a pixel be to count as background?
# Lower = more aggressive fill (catches off-white). Higher = more conservative.
NEAR_WHITE_THRESHOLD = 20

TARGETS = [
    ("logo-full-nb.png",        "logo-full-transparent.png",   "logo-full-cream.png"),
    ("amily-01-waving-nb.png",  "amily-01-waving-transparent.png", "amily-01-waving-cream.png"),
]

def flood_corners_to_transparent(img: Image.Image, thresh: int) -> Image.Image:
    """Flood fill from 4 corners with (0,0,0,0) replacement + threshold."""
    im = img.copy().convert("RGBA")
    W, H = im.size
    # PIL's floodfill works on the seed pixel's colour; it replaces connected pixels
    # within `thresh` distance of that colour with `value`.
    for x, y in [(0, 0), (W - 1, 0), (0, H - 1), (W - 1, H - 1)]:
        # Only seed if the corner is already near-white
        r, g, b, _a = im.getpixel((x, y))
        if r >= 240 and g >= 240 and b >= 240:
            ImageDraw.floodfill(im, (x, y), (0, 0, 0, 0), thresh=thresh)
    return im


def smooth_alpha_edge(img: Image.Image, radius: float = 0.7) -> Image.Image:
    """Slight blur on alpha only to kill jaggies from the flood fill."""
    r, g, b, a = img.split()
    a_blurred = a.filter(ImageFilter.GaussianBlur(radius=radius))
    return Image.merge("RGBA", (r, g, b, a_blurred))


for src_name, transp_name, cream_name in TARGETS:
    src_path = ASSETS / src_name
    print(f"\n=== {src_name} ===")
    if not src_path.exists():
        print(f"  MISSING: {src_path}")
        continue

    im = Image.open(src_path).convert("RGBA")
    print(f"  size: {im.size}")

    # Step 1: flood fill white bg → transparent
    transparent = flood_corners_to_transparent(im, NEAR_WHITE_THRESHOLD)
    transparent = smooth_alpha_edge(transparent, radius=0.7)

    out_t = ASSETS / transp_name
    transparent.save(out_t, optimize=True)
    print(f"  saved transparent: {out_t.name} ({out_t.stat().st_size // 1024}KB)")

    # Step 2: composite onto cream for Higgsfield
    cream_bg = Image.new("RGBA", transparent.size, CREAM + (255,))
    composited = Image.alpha_composite(cream_bg, transparent).convert("RGB")
    out_c = ASSETS / cream_name
    composited.save(out_c, optimize=True)
    print(f"  saved cream:       {out_c.name} ({out_c.stat().st_size // 1024}KB)")

print("\nDone.")

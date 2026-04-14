"""Improved magenta chroma-key with proper de-spill.

   For each pixel, magenta-strength = (R + B) / 2 - G.
     - Pure magenta (255, 0, 255): strength = 255  -> alpha 0
     - Pinkish skin (240, 180, 180): strength = 30 -> alpha 255 (kept)
     - Terracotta (200, 80, 70):    strength = 55 -> alpha 255 (kept)
     - Edge pixel (200, 100, 200):  strength = 100 -> alpha ~50%, despilled

   De-spill: subtract magenta-strength from R and B in proportion to how much
   magenta is bleeding into the pixel. Edge pixels (alpha 5-95%) get a full
   de-spill pass that neutralizes the pink halo.
"""
from pathlib import Path
from PIL import Image
import numpy as np

ASSETS = Path("D:/Github/amily-ai-website/public/assets")
CREAM = (250, 245, 235)


def chroma_key_v2(in_path: Path, out_transp: Path, out_cream: Path):
    im = Image.open(in_path).convert("RGB")
    arr = np.array(im).astype(np.float32)
    r, g, b = arr[..., 0], arr[..., 1], arr[..., 2]

    # Magenta-ness: how much (R+B)/2 exceeds G
    mag = (r + b) / 2.0 - g

    # Alpha mapping:
    #   mag <  60  -> fully opaque  (terracotta robot, skin, lips all sit below)
    #   mag > 180  -> fully transparent (pure magenta + heavy edge bleed)
    #   between    -> linear ramp (smooth anti-aliased edge)
    LO, HI = 60.0, 180.0
    alpha = np.clip(1.0 - (mag - LO) / (HI - LO), 0.0, 1.0)

    # De-spill — subtract the magenta component from R and B.
    # Strength of the subtraction scales with how much magenta is in the pixel.
    spill = np.maximum(mag, 0.0)

    # Stronger de-spill on edge pixels (where the halo is most visible),
    # gentle de-spill elsewhere as a safety net.
    edge_mask = (alpha > 0.05) & (alpha < 0.95)
    spill_factor = np.where(edge_mask, 1.0, 0.5)
    despill = spill * spill_factor

    new_r = np.clip(r - despill, 0.0, 255.0)
    new_b = np.clip(b - despill, 0.0, 255.0)
    # G stays as-is — magenta has G=0, so any G in the pixel is character signal.

    out = np.zeros((arr.shape[0], arr.shape[1], 4), dtype=np.uint8)
    out[..., 0] = new_r.astype(np.uint8)
    out[..., 1] = g.astype(np.uint8)
    out[..., 2] = new_b.astype(np.uint8)
    out[..., 3] = (alpha * 255.0).astype(np.uint8)

    transparent = Image.fromarray(out, "RGBA")
    transparent.save(out_transp, optimize=True)
    print(f"  saved transparent: {out_transp.name} ({out_transp.stat().st_size//1024}KB)")

    cream_bg = Image.new("RGBA", transparent.size, CREAM + (255,))
    Image.alpha_composite(cream_bg, transparent).convert("RGB").save(out_cream, optimize=True)
    print(f"  saved cream:       {out_cream.name} ({out_cream.stat().st_size//1024}KB)")


for src, transp, cream in [
    ("logo-full-magenta.png",       "logo-full-transparent.png",       "logo-full-cream.png"),
    ("amily-01-waving-magenta.png", "amily-01-waving-transparent.png", "amily-01-waving-cream.png"),
]:
    src_path = ASSETS / src
    if not src_path.exists():
        print(f"SKIP missing: {src}")
        continue
    print(f"\n=== {src} ===")
    chroma_key_v2(src_path, ASSETS / transp, ASSETS / cream)

print("\nDone.")

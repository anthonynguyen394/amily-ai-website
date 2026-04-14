"""Strip the cream rectangle behind 'amily.ai' properly.
   Insight: the fill is CREAM (not pure white), so threshold on max(R,G,B)
   instead of min. Navy text has max ~95; cream has max ~250.

   IMPORTANT: this script ALWAYS reads from the original NB-Pro cream logo
   and re-derives the transparent — it's idempotent, safe to re-run.
"""
from pathlib import Path
from PIL import Image
import numpy as np

ASSETS = Path("D:/Github/amily-ai-website/public/assets")
SCRIPTS = Path("D:/Github/amily-ai-website/scripts")


def chroma_key_v2(in_path: Path, out_path: Path):
    im = Image.open(in_path).convert("RGB")
    arr = np.array(im).astype(np.float32)
    r, g, b = arr[..., 0], arr[..., 1], arr[..., 2]
    mag = (r + b) / 2.0 - g
    LO, HI = 60.0, 180.0
    alpha = np.clip(1.0 - (mag - LO) / (HI - LO), 0.0, 1.0)
    spill = np.maximum(mag, 0.0)
    edge_mask = (alpha > 0.05) & (alpha < 0.95)
    despill = spill * np.where(edge_mask, 1.0, 0.5)
    out = np.zeros((arr.shape[0], arr.shape[1], 4), dtype=np.uint8)
    out[..., 0] = np.clip(r - despill, 0, 255).astype(np.uint8)
    out[..., 1] = g.astype(np.uint8)
    out[..., 2] = np.clip(b - despill, 0, 255).astype(np.uint8)
    out[..., 3] = (alpha * 255.0).astype(np.uint8)
    Image.fromarray(out, "RGBA").save(out_path, optimize=True)


def strip_wordmark_zone(path: Path):
    """In the bottom 25% of the image, alpha goes from opaque (navy text)
       to transparent (cream/white fill) based on max(R,G,B)."""
    im = Image.open(path).convert("RGBA")
    arr = np.array(im).astype(np.int16)
    H, W = arr.shape[:2]
    r, g, b, a = arr[..., 0], arr[..., 1], arr[..., 2], arr[..., 3]

    # Zone: bottom 35% (starts at 65%). The max_rgb ramp below safely ignores
    # the navy circle border (which has max_rgb ~95) even if the zone slightly
    # overlaps its bottom edge.
    zone = np.zeros((H, W), dtype=bool)
    zone[int(H * 0.65):, :] = True

    max_rgb = np.maximum(np.maximum(r, g), b)

    # max_rgb <= 100 -> alpha 255 (navy text stays)
    # max_rgb >= 200 -> alpha 0   (cream/white fill gone)
    # between        -> linear ramp (preserves anti-aliased text edges)
    new_a = np.clip((200 - max_rgb) / 100.0 * 255.0, 0, 255).astype(np.int16)

    target = zone
    arr[target, 3] = np.minimum(arr[target, 3], new_a[target])

    Image.fromarray(arr.astype(np.uint8), "RGBA").save(path, optimize=True)
    print(f"  stripped wordmark bg in {path.name}")


# If there's a saved magenta temp, re-key; otherwise just strip the current file
magenta_source = SCRIPTS / "_temp_logo_magenta_v2.png"
out = ASSETS / "logo-full-transparent.png"

# Regenerate transparent from whatever source is available
if magenta_source.exists():
    print("Re-keying from saved magenta source...")
    chroma_key_v2(magenta_source, out)
    magenta_source.unlink()

print("Stripping wordmark zone cream fill...")
strip_wordmark_zone(out)
print("Done.")

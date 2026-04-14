"""Post-process the transparent logo: alpha-out the white rectangle behind
   the 'amily.ai' wordmark while keeping the navy text pixels opaque.

   Works because: navy text has min(R,G,B) ~ 30-60 (dark). White fill has
   min(R,G,B) > 220 (bright). Wordmark zone = bottom 25% of the image
   (safely below the circle badge).
"""
from pathlib import Path
from PIL import Image
import numpy as np

PATH = Path("D:/Github/amily-ai-website/public/assets/logo-full-transparent.png")

im = Image.open(PATH).convert("RGBA")
arr = np.array(im).astype(np.int16)
H, W = arr.shape[:2]
r, g, b, a = arr[..., 0], arr[..., 1], arr[..., 2], arr[..., 3]

# Define the wordmark zone: bottom 25% of the image, outside the circle badge.
zone = np.zeros((H, W), dtype=bool)
zone[int(H * 0.75):, :] = True
print(f"wordmark zone: bottom {int(H * 0.25)} rows ({H - int(H * 0.75)} px)")

# Min channel = how dark/navy the pixel is. Navy text ~ 30-60. White fill ~ 240+.
min_rgb = np.minimum(np.minimum(r, g), b)

# Alpha ramp inside the zone:
#   min_rgb >= 220  -> alpha 0   (white fill — kill)
#   min_rgb <= 140  -> alpha 255 (navy text — keep)
#   between         -> linear ramp for anti-aliased text edges
new_a = np.clip((220 - min_rgb) / 80.0 * 255.0, 0, 255).astype(np.int16)

# Only touch opaque-ish pixels in the zone. Use min(old, new) so we never
# make a pixel MORE opaque than it already was.
target = zone & (a > 50)
arr[target, 3] = np.minimum(arr[target, 3], new_a[target])

# Also knock out near-white OPAQUE pixels in the zone completely
# (belt and braces — anything that was 240,240,240+ with alpha>200 dies)
hard_kill = zone & (min_rgb > 230) & (a > 100)
arr[hard_kill, 3] = 0

Image.fromarray(arr.astype(np.uint8), "RGBA").save(PATH, optimize=True)
killed = hard_kill.sum()
print(f"hard-killed {killed} pure-white pixels")
print(f"saved -> {PATH.name} ({PATH.stat().st_size // 1024}KB)")

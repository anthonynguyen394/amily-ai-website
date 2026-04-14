"""Fix the semi-transparent grey teeth on amily-01-waving.png
   and produce two variants:
     1. amily-01-waving-clean.png   -- same transparent PNG, teeth patched
     2. amily-01-waving-solid.png   -- full character on solid cream bg (Higgsfield-ready)
     3. amily-01-waving-white.png   -- full character on pure white bg (universal Higgsfield input)
"""
from PIL import Image
import numpy as np

SRC = "D:/Github/amily-ai-website/public/assets/amily-01-waving.png"
OUT_CLEAN = "D:/Github/amily-ai-website/public/assets/amily-01-waving-clean.png"
OUT_CREAM = "D:/Github/amily-ai-website/public/assets/amily-01-waving-solid.png"
OUT_WHITE = "D:/Github/amily-ai-website/public/assets/amily-01-waving-white.png"

im = Image.open(SRC).convert("RGBA")
arr = np.array(im).astype(np.int16)  # int16 so we can math safely
r, g, b, a = arr[..., 0], arr[..., 1], arr[..., 2], arr[..., 3]

# Tight teeth bbox (from diagnostic — the grey cluster sat at y=452-457, x=493-530)
# Expand slightly to catch the full tooth patch edges.
y0, y1 = 442, 475
x0, x1 = 480, 545

# Mask = within bbox AND RGB is whitish (near neutral, moderately bright) AND semi-transparent
in_box = np.zeros(r.shape, dtype=bool)
in_box[y0:y1, x0:x1] = True

whitish = (
    (np.abs(r - g) < 25) &
    (np.abs(g - b) < 25) &
    (r > 150) & (r < 240)
)

semi_trans = (a > 120) & (a < 255)

teeth_mask = in_box & whitish & semi_trans
print(f"Teeth pixels to patch: {teeth_mask.sum()}")

# Boost alpha to 255 and brighten the RGB to a clean warm off-white (soft, not clinical)
# Warm off-white: a touch of peach-cream so teeth don't pop against skin tone
CLEAN_R, CLEAN_G, CLEAN_B = 248, 243, 236

# Use alpha-weighted blend: where the pixel already had high alpha, mostly keep color;
# where it was very see-through, push hard toward the clean target.
# Simpler and more predictable: just overwrite the teeth pixels.
arr[teeth_mask, 0] = CLEAN_R
arr[teeth_mask, 1] = CLEAN_G
arr[teeth_mask, 2] = CLEAN_B
arr[teeth_mask, 3] = 255

clean_img = Image.fromarray(arr.astype(np.uint8), "RGBA")
clean_img.save(OUT_CLEAN)
print(f"Saved: {OUT_CLEAN}")

# --- Produce solid-bg variants for Higgsfield ---
# Version 1: warm cream bg (#faf5eb = 250,245,235) matching the site
cream = Image.new("RGBA", clean_img.size, (250, 245, 235, 255))
Image.alpha_composite(cream, clean_img).convert("RGB").save(OUT_CREAM, "PNG", optimize=True)
print(f"Saved: {OUT_CREAM}")

# Version 2: pure white bg — safer for most video-gen platforms that expect clean bg
white = Image.new("RGBA", clean_img.size, (255, 255, 255, 255))
Image.alpha_composite(white, clean_img).convert("RGB").save(OUT_WHITE, "PNG", optimize=True)
print(f"Saved: {OUT_WHITE}")

print("\nDone.")

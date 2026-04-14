"""Crop the mouth region for visual inspection + alpha heatmap."""
from PIL import Image
import numpy as np

SRC = "D:/Github/amily-ai-website/public/assets/amily-01-waving.png"
im = Image.open(SRC).convert("RGBA")

# Tight crop around the suspected mouth
MOUTH_BBOX = (420, 400, 620, 520)  # left, top, right, bottom
crop = im.crop(MOUTH_BBOX)
crop.save("D:/Github/amily-ai-website/scripts/mouth_crop.png")

# Also save a version on cream bg to see what the grey looks like in context
cream = Image.new("RGBA", crop.size, (250, 245, 235, 255))
composited = Image.alpha_composite(cream, crop)
composited.save("D:/Github/amily-ai-website/scripts/mouth_on_cream.png")

# Alpha heatmap visualization
arr = np.array(crop)
a = arr[..., 3]
# Make a visible alpha debug: pixels where alpha<255 but >0 get highlighted red
debug = np.zeros((*a.shape, 3), dtype=np.uint8)
debug[..., 0] = 255 * ((a < 255) & (a > 0))  # red = semi-transparent
debug[..., 1] = 255 * (a == 255)              # green = fully opaque
debug[..., 2] = 255 * (a == 0)                # blue = fully transparent
Image.fromarray(debug).save("D:/Github/amily-ai-website/scripts/mouth_alpha_debug.png")

print("Saved: mouth_crop.png, mouth_on_cream.png, mouth_alpha_debug.png")
print(f"Crop size: {crop.size}")

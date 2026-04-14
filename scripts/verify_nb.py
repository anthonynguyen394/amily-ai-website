"""Verify the Nano Banana output — crop mouth on cream bg."""
from PIL import Image
im = Image.open("D:/Github/amily-ai-website/public/assets/amily-01-waving-nb.png").convert("RGBA")
print("Size:", im.size)

# Crop roughly the same region (scale proportionally to new size)
W, H = im.size
# mouth bbox at 1024x1024 was (420, 400, 620, 520) — 20-60% x, 39-51% y
left   = int(W * 0.41)
top    = int(H * 0.39)
right  = int(W * 0.61)
bottom = int(H * 0.51)
crop = im.crop((left, top, right, bottom))
cream = Image.new("RGBA", crop.size, (250, 245, 235, 255))
Image.alpha_composite(cream, crop).save("D:/Github/amily-ai-website/scripts/mouth_nb_on_cream.png")
print("Saved mouth verification crop")

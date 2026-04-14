"""Crop the mouth region of the cleaned PNG and composite on cream for visual check."""
from PIL import Image

CLEAN = "D:/Github/amily-ai-website/public/assets/amily-01-waving-clean.png"
im = Image.open(CLEAN).convert("RGBA")
crop = im.crop((420, 400, 620, 520))
cream = Image.new("RGBA", crop.size, (250, 245, 235, 255))
Image.alpha_composite(cream, crop).save("D:/Github/amily-ai-website/scripts/mouth_fixed_on_cream.png")
print("Saved verification crop")

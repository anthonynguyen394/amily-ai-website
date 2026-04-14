"""Export solid-bg variants of the Nano Banana output for Higgsfield / video gen."""
from PIL import Image

SRC = "D:/Github/amily-ai-website/public/assets/amily-01-waving-nb.png"
OUT_WHITE = "D:/Github/amily-ai-website/public/assets/amily-01-waving-nb-white.png"
OUT_CREAM = "D:/Github/amily-ai-website/public/assets/amily-01-waving-nb-solid.png"

im = Image.open(SRC).convert("RGBA")

for bg_rgb, out_path, label in [
    ((255, 255, 255), OUT_WHITE, "white"),
    ((250, 245, 235), OUT_CREAM, "cream"),
]:
    bg = Image.new("RGBA", im.size, bg_rgb + (255,))
    Image.alpha_composite(bg, im).convert("RGB").save(out_path, "PNG", optimize=True)
    print(f"Saved {label}: {out_path}")

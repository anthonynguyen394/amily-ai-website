"""Build logo-full-cream.png + logo-full-transparent.png programmatically:
   - Character = the approved favicon (upscaled, bg stripped)
   - Wordmark = 'amily.ai' in Nunito (site's brand font), navy color
   - Composition: circle in top ~70%, floating wordmark below with clear gap

   Deterministic, zero AI drift.
"""
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageFilter

ASSETS = Path("D:/Github/amily-ai-website/public/assets")
SCRIPTS = Path("D:/Github/amily-ai-website/scripts")
FAVICON = ASSETS / "favicon-256.png"

CANVAS_SIZE = 1024
BADGE_SIZE = 720
BADGE_TOP_MARGIN = 40
TEXT_GAP = 50  # vertical gap between badge bottom and wordmark top
FONT_SIZE = 140

CREAM = (250, 245, 235, 255)
NAVY = (30, 58, 95, 255)


# ─── Step 1: Get a good rounded sans font (Nunito from Google Fonts) ─────
NUNITO_PATH = SCRIPTS / "_nunito_wght.ttf"
if not NUNITO_PATH.exists():
    url = "https://raw.githubusercontent.com/google/fonts/main/ofl/nunito/Nunito%5Bwght%5D.ttf"
    print(f"Downloading Nunito variable font...")
    try:
        urllib.request.urlretrieve(url, NUNITO_PATH)
        print(f"  saved {NUNITO_PATH.name} ({NUNITO_PATH.stat().st_size // 1024}KB)")
    except Exception as e:
        print(f"  download failed: {e}")
        raise SystemExit(1)


# ─── Step 2: Prep the favicon badge (upscale + strip outer white bg) ────
print("Preparing badge from favicon...")
fav = Image.open(FAVICON).convert("RGBA")
print(f"  favicon source: {fav.size}")

# Lanczos upscale to target size
badge = fav.resize((BADGE_SIZE, BADGE_SIZE), Image.LANCZOS)

# Flood-fill near-white from corners -> transparent
W, H = badge.size
filled = 0
for corner in [(0, 0), (W - 1, 0), (0, H - 1), (W - 1, H - 1)]:
    r, g, b, _a = badge.getpixel(corner)
    if r > 240 and g > 240 and b > 240:
        ImageDraw.floodfill(badge, corner, (0, 0, 0, 0), thresh=30)
        filled += 1
print(f"  flood-filled {filled} corners")

# Slight alpha blur to smooth the cut edge
r_ch, g_ch, b_ch, a_ch = badge.split()
a_ch = a_ch.filter(ImageFilter.GaussianBlur(radius=0.6))
badge = Image.merge("RGBA", (r_ch, g_ch, b_ch, a_ch))


# ─── Step 3: Create two canvases (cream + transparent) and composite ────
def build_canvas(bg_color):
    canvas = Image.new("RGBA", (CANVAS_SIZE, CANVAS_SIZE), bg_color)
    bx = (CANVAS_SIZE - BADGE_SIZE) // 2
    by = BADGE_TOP_MARGIN
    canvas.alpha_composite(badge, (bx, by))
    return canvas, by + BADGE_SIZE


# ─── Step 4: Draw wordmark ─────────────────────────────────────────────
font = ImageFont.truetype(str(NUNITO_PATH), FONT_SIZE)
# Nunito is a variable font — try to set the weight to ExtraBold (800)
try:
    font.set_variation_by_axes([800])
except Exception:
    pass  # fallback: default weight is fine

TEXT = "amily.ai"


def draw_wordmark(canvas, badge_bottom):
    draw = ImageDraw.Draw(canvas)
    bbox = draw.textbbox((0, 0), TEXT, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = (CANVAS_SIZE - tw) // 2 - bbox[0]
    ty = badge_bottom + TEXT_GAP - bbox[1]
    draw.text((tx, ty), TEXT, fill=NAVY, font=font)


# Build cream version
print("Building cream version...")
cream_canvas, badge_bottom = build_canvas(CREAM)
draw_wordmark(cream_canvas, badge_bottom)
cream_out = ASSETS / "logo-full-cream.png"
cream_canvas.save(cream_out, optimize=True)
print(f"  saved {cream_out.name} ({cream_out.stat().st_size // 1024}KB)")

# Build transparent version
print("Building transparent version...")
transp_canvas, badge_bottom = build_canvas((0, 0, 0, 0))
draw_wordmark(transp_canvas, badge_bottom)
transp_out = ASSETS / "logo-full-transparent.png"
transp_canvas.save(transp_out, optimize=True)
print(f"  saved {transp_out.name} ({transp_out.stat().st_size // 1024}KB)")

print("\nDone.")

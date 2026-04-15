"""Build a 1200x630 OG share image by compositing brand assets.

Layout: cream gradient bg, Amily character right, logo + tagline left,
mustard-to-terracotta underline accent on 'missed calls.'
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ASSETS = Path("D:/Github/amily-ai-website/public/assets")
OUT = ASSETS / "og-image-pil.png"

W, H = 1200, 630
CREAM_TOP = (250, 245, 235)
CREAM_BOT = (246, 238, 220)
NAVY = (30, 58, 95)
CHARCOAL = (12, 27, 48)
TERRACOTTA = (201, 123, 93)
MUSTARD = (232, 176, 78)

def gradient_bg():
    img = Image.new("RGB", (W, H), CREAM_TOP)
    px = img.load()
    for y in range(H):
        t = y / (H - 1)
        r = int(CREAM_TOP[0] * (1 - t) + CREAM_BOT[0] * t)
        g = int(CREAM_TOP[1] * (1 - t) + CREAM_BOT[1] * t)
        b = int(CREAM_TOP[2] * (1 - t) + CREAM_BOT[2] * t)
        for x in range(W):
            px[x, y] = (r, g, b)
    return img

def soft_blob(canvas, cx, cy, radius, color, alpha=60):
    layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.ellipse((cx - radius, cy - radius, cx + radius, cy + radius), fill=(*color, alpha))
    layer = layer.filter(ImageFilter.GaussianBlur(80))
    canvas.alpha_composite(layer)

def load_font(candidates, size):
    for path in candidates:
        try:
            return ImageFont.truetype(path, size)
        except Exception:
            continue
    return ImageFont.load_default()

HEADING_FONTS = [
    "C:/Windows/Fonts/georgiab.ttf",
    "C:/Windows/Fonts/georgia.ttf",
    str(Path(__file__).parent / "_nunito_wght.ttf"),
]
BODY_FONTS = [
    "C:/Windows/Fonts/segoeuib.ttf",
    "C:/Windows/Fonts/segoeui.ttf",
]

def build():
    bg = gradient_bg().convert("RGBA")
    soft_blob(bg, 80, 80, 260, TERRACOTTA, alpha=55)
    soft_blob(bg, 1050, 180, 280, MUSTARD, alpha=55)
    soft_blob(bg, 600, 620, 220, NAVY, alpha=35)

    # Character: fit on right side, ~600px tall, pushed further right
    char = Image.open(ASSETS / "amily-01-waving-transparent.png").convert("RGBA")
    # Trim transparent padding so we can size to visible content, not canvas.
    char_bbox = char.getbbox()
    if char_bbox:
        char = char.crop(char_bbox)
    target_h = 560
    ratio = target_h / char.height
    char = char.resize((int(char.width * ratio), target_h), Image.LANCZOS)
    margin = 30
    char_x = W - char.width - margin
    char_y = H - char.height - margin
    bg.alpha_composite(char, (char_x, char_y))

    draw = ImageDraw.Draw(bg)

    # Logo top-left
    logo = Image.open(ASSETS / "logo-full-transparent.png").convert("RGBA")
    logo_h = 80
    lratio = logo_h / logo.height
    logo = logo.resize((int(logo.width * lratio), logo_h), Image.LANCZOS)
    bg.alpha_composite(logo, (56, 40))

    # Headline - two lines
    heading = load_font(HEADING_FONTS, 68)
    line1 = "Stop losing jobs"
    line2 = "to missed calls."
    x = 60
    y = 180
    draw.text((x, y), line1, font=heading, fill=CHARCOAL)
    line1_bbox = draw.textbbox((x, y), line1, font=heading)
    y2 = line1_bbox[3] + 6
    # "to " prefix in charcoal, "missed calls." with gradient underline
    to_str = "to "
    mc_str = "missed calls."
    draw.text((x, y2), to_str, font=heading, fill=CHARCOAL)
    to_w = draw.textlength(to_str, font=heading)
    mc_x = x + to_w
    draw.text((mc_x, y2), mc_str, font=heading, fill=CHARCOAL)
    mc_bbox = draw.textbbox((mc_x, y2), mc_str, font=heading)
    # gradient underline: horizontal bar, mustard->terracotta
    ul_y0 = mc_bbox[3] + 4
    ul_y1 = mc_bbox[3] + 16
    ul_layer = Image.new("RGBA", bg.size, (0, 0, 0, 0))
    uld = ImageDraw.Draw(ul_layer)
    ul_w = int(mc_bbox[2] - mc_bbox[0])
    for i in range(ul_w):
        t = i / max(ul_w - 1, 1)
        r = int(MUSTARD[0] * (1 - t) + TERRACOTTA[0] * t)
        g = int(MUSTARD[1] * (1 - t) + TERRACOTTA[1] * t)
        b = int(MUSTARD[2] * (1 - t) + TERRACOTTA[2] * t)
        uld.line([(mc_x + i, ul_y0), (mc_x + i, ul_y1)], fill=(r, g, b, 230))
    bg.alpha_composite(ul_layer)

    # Subhead / tagline
    sub = load_font(BODY_FONTS, 30)
    draw.text((60, mc_bbox[3] + 40),
              "Your local AI guide for Melbourne small business.",
              font=sub, fill=(*NAVY, 220)[:3])

    # URL pill
    url_f = load_font(BODY_FONTS, 26)
    url_txt = "amily.ai"
    uw = draw.textlength(url_txt, font=url_f)
    pill_pad_x, pill_pad_y = 22, 10
    pill_x0 = 60
    pill_y0 = mc_bbox[3] + 95
    pill_x1 = pill_x0 + uw + pill_pad_x * 2
    pill_y1 = pill_y0 + 26 + pill_pad_y * 2
    draw.rounded_rectangle((pill_x0, pill_y0, pill_x1, pill_y1), radius=30, fill=NAVY)
    draw.text((pill_x0 + pill_pad_x, pill_y0 + pill_pad_y - 2), url_txt,
              font=url_f, fill=(250, 245, 235))

    bg.convert("RGB").save(OUT, "PNG", optimize=True)
    print(f"Saved: {OUT} ({W}x{H})")

if __name__ == "__main__":
    build()

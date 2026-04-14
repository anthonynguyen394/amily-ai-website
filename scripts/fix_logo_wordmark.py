"""Re-run option 1 with tighter wordmark prompt.
   Issue: NB Pro wrapped 'amily.ai' in a white rounded rectangle.
   Fix: explicitly instruct that the wordmark text sits DIRECTLY on magenta
        with NO white/cream/cream fill behind it.
"""
import sys
from pathlib import Path
from google import genai
from google.genai import types
from PIL import Image
import numpy as np

PROJECT = "amily-ai-business"
LOCATION = "global"
MODEL = "gemini-3-pro-image-preview"
ASSETS = Path("D:/Github/amily-ai-website/public/assets")
SCRIPTS = Path("D:/Github/amily-ai-website/scripts")

client = genai.Client(vertexai=True, project=PROJECT, location=LOCATION)

LOGO_CREAM = ASSETS / "logo-full-cream.png"
TEMP_MAGENTA = SCRIPTS / "_temp_logo_magenta_v2.png"
LOGO_TRANSPARENT = ASSETS / "logo-full-transparent.png"


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


prompt = (
    "Take this image. Change ONLY the background color to SOLID PURE MAGENTA "
    "RGB (255, 0, 255, bright fuchsia chroma-key pink). "
    "\n\n"
    "MAGENTA GOES ON: every pixel of cream/beige background OUTSIDE the navy "
    "circular border, including the entire bottom region of the image where "
    "the wordmark 'amily.ai' sits. "
    "\n\n"
    "CRITICAL — WORDMARK RULES: The 'amily.ai' text must sit DIRECTLY on the "
    "magenta background. The area AROUND and BEHIND the wordmark text — the "
    "whole bottom third of the image where the wordmark lives — is MAGENTA. "
    "Do NOT place the wordmark on a white rectangle, do NOT place the wordmark "
    "on a cream rectangle, do NOT add any background box or card or banner "
    "behind the text. The text characters themselves stay navy blue; every "
    "pixel surrounding them is pure magenta. The tiny enclosed negative-space "
    "pockets inside the letters (inside lowercase 'a' loops, inside 'm' gaps, "
    "inside the 'i' dot separation) are ALSO magenta. "
    "\n\n"
    "PRESERVE EXACTLY: the character (face, hair, outfit, pose), the navy "
    "circular double-ring border, the soft cream interior INSIDE the circle "
    "(the badge background — this stays cream, only OUTSIDE the circle turns "
    "magenta), the terracotta robot in her palm, the wordmark text 'amily.ai' "
    "itself (same navy color, same font, same letter spacing, same size, same "
    "position). "
    "\n\n"
    "Only the OUTER background (outside the circle) and the text-surround area "
    "(around and inside letter loops of the wordmark) become magenta. Nothing "
    "else changes. Output a 1:1 square PNG."
)

print("Calling NB Pro with tightened wordmark prompt...")
response = client.models.generate_content(
    model=MODEL,
    contents=[
        types.Part.from_bytes(data=LOGO_CREAM.read_bytes(), mime_type="image/png"),
        prompt,
    ],
    config=types.GenerateContentConfig(
        response_modalities=["IMAGE"],
        image_config=types.ImageConfig(aspect_ratio="1:1"),
    ),
)

saved = False
for cand in response.candidates or []:
    for part in (cand.content.parts or []) if cand.content else []:
        if getattr(part, "inline_data", None) and part.inline_data.data:
            TEMP_MAGENTA.write_bytes(part.inline_data.data)
            print(f"  saved temp magenta ({TEMP_MAGENTA.stat().st_size // 1024}KB)")
            saved = True
            break
    if saved:
        break

if not saved:
    print("ERROR: no image returned")
    sys.exit(1)

chroma_key_v2(TEMP_MAGENTA, LOGO_TRANSPARENT)
print(f"  chroma-keyed -> {LOGO_TRANSPARENT.name} ({LOGO_TRANSPARENT.stat().st_size // 1024}KB)")
TEMP_MAGENTA.unlink()
print("Done.")

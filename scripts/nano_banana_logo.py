"""Polish the logo-full.png face using Nano Banana Pro.
   Passes the favicon as a face-style reference and instructs the model to
   preserve the circular border + 'amily.ai' wordmark exactly.
"""
import sys
from pathlib import Path
from google import genai
from google.genai import types

PROJECT = "amily-ai-business"
LOCATION = "global"
MODEL = "gemini-3-pro-image-preview"

LOGO = Path("D:/Github/amily-ai-website/public/assets/logo-full.png")
FAVICON = Path("D:/Github/amily-ai-website/public/assets/favicon-256.png")
OUT = Path("D:/Github/amily-ai-website/public/assets/logo-full-nb.png")

for p in (LOGO, FAVICON):
    if not p.exists():
        print(f"ERROR: missing {p}")
        sys.exit(1)

client = genai.Client(vertexai=True, project=PROJECT, location=LOCATION)

prompt = (
    "IMAGE 1 is the current official logo for 'amily.ai'. "
    "IMAGE 2 is a reference showing how her face should look: warm brown eyes with "
    "visible iris and a gentle highlight, natural friendly smile with a touch of teeth, "
    "soft pink lips, slight blush. "
    "Your task: regenerate IMAGE 1 with IMAGE 2's warm, friendly face expression. "
    "She currently looks scary and haunted because her eyes read as flat black and her "
    "mouth looks off. Fix that. "
    "Strict preservation rules for IMAGE 1: "
    "(a) Keep the circular navy-blue double-ring border exactly as-is. "
    "(b) Keep the cream/beige interior background of the circle. "
    "(c) Keep the 'amily.ai' wordmark TEXT under the circle EXACTLY — same font, "
    "same navy color, same size, same spacing. Do not rewrite, restyle, or move it. "
    "(d) Keep the small terracotta robot icon in her open palm. "
    "(e) Keep her mustard-yellow cardigan, white top, brown wavy hair tied back, "
    "gold stud earring, and overall pose. "
    "(f) Keep the flat 2D illustration style, same line weight, same colors. "
    "(g) Keep the square aspect ratio and the white background outside the circle. "
    "Output the polished logo as a 1:1 square PNG."
)

print(f"Calling {MODEL}...")
try:
    response = client.models.generate_content(
        model=MODEL,
        contents=[
            "IMAGE 1 (the logo to polish):",
            types.Part.from_bytes(data=LOGO.read_bytes(), mime_type="image/png"),
            "IMAGE 2 (face-style reference — use this expression):",
            types.Part.from_bytes(data=FAVICON.read_bytes(), mime_type="image/png"),
            prompt,
        ],
        config=types.GenerateContentConfig(
            response_modalities=["IMAGE"],
            image_config=types.ImageConfig(aspect_ratio="1:1"),
        ),
    )
except Exception as e:
    print(f"API call failed: {e}")
    sys.exit(2)

saved = False
for cand in response.candidates or []:
    if not cand.content or not cand.content.parts:
        continue
    for part in cand.content.parts:
        if getattr(part, "inline_data", None) and part.inline_data.data:
            OUT.write_bytes(part.inline_data.data)
            print(f"Saved: {OUT} ({OUT.stat().st_size} bytes)")
            saved = True
            break
        elif getattr(part, "text", None):
            print(f"[model text]: {part.text[:300]}")
    if saved:
        break

if not saved:
    print("No image returned.")
    print(response)
    sys.exit(3)

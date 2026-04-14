"""Call Nano Banana Pro (gemini-3-pro-image-preview) via Vertex AI
   to fix the teeth artifact on amily-01-waving.png.

   Uses Application Default Credentials from `gcloud auth application-default login`.
"""
import os
import sys
from pathlib import Path
from google import genai
from google.genai import types

PROJECT = "amily-ai-business"
LOCATION = "global"          # Nano Banana Pro is served from the global endpoint
MODEL = "gemini-3-pro-image-preview"

SRC = Path("D:/Github/amily-ai-website/public/assets/amily-01-waving.png")
OUT = Path("D:/Github/amily-ai-website/public/assets/amily-01-waving-nb.png")

if not SRC.exists():
    print(f"ERROR: source not found: {SRC}")
    sys.exit(1)

print(f"Reading {SRC} ({SRC.stat().st_size} bytes)")
src_bytes = SRC.read_bytes()

client = genai.Client(vertexai=True, project=PROJECT, location=LOCATION)

prompt = (
    "Edit this illustrated character portrait. Fix ONLY the teeth inside her mouth: "
    "make the teeth a clean, bright off-white (warm cream-white, not grey or pink). "
    "Remove any grey discolouration, semi-transparency, or muddy patch on the teeth. "
    "Keep the small dark gap between the upper and lower teeth visible as a natural shadow. "
    "Do NOT change anything else: keep her exact face, hairstyle, mustard-yellow cardigan, "
    "earring, hand wave pose, line-art style, transparent background, resolution, and framing. "
    "Preserve the warm cartoon 2D flat-illustration style. Output a 1:1 square image with "
    "the same transparent background as the input."
)

print(f"Calling {MODEL} on project {PROJECT}...")
try:
    response = client.models.generate_content(
        model=MODEL,
        contents=[
            types.Part.from_bytes(data=src_bytes, mime_type="image/png"),
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

# Extract image bytes from response
image_saved = False
for cand in response.candidates or []:
    if not cand.content or not cand.content.parts:
        continue
    for part in cand.content.parts:
        if getattr(part, "inline_data", None) and part.inline_data.data:
            OUT.write_bytes(part.inline_data.data)
            print(f"Saved: {OUT} ({OUT.stat().st_size} bytes)")
            image_saved = True
            break
        elif getattr(part, "text", None):
            print(f"[model text]: {part.text[:300]}")
    if image_saved:
        break

if not image_saved:
    print("No image returned. Full response:")
    print(response)
    sys.exit(3)

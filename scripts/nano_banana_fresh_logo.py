"""Generate two FRESH amily.ai logos via Nano Banana Pro:
   - logo-full-cream.png   : cream bg, used directly (no chroma-key, no edits)
   - logo-full-magenta.png : magenta bg, chroma-keyed → logo-full-transparent.png

   Same prompt + favicon face-reference + seed for both → consistent character.
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

FAVICON = ASSETS / "favicon-256.png"
SEED = 7  # same seed for both calls -> consistent character pose/expression

client = genai.Client(vertexai=True, project=PROJECT, location=LOCATION)


def base_prompt(bg_description: str) -> str:
    return (
        "Generate a clean professional brand logo for 'amily.ai', a friendly Australian "
        "AI automation business for small business owners. Style and composition: "
        "\n\n"
        "COMPOSITION:\n"
        "- Square 1:1 layout, generous padding around all elements.\n"
        "- A circular badge centered in the upper portion: navy-blue (#1e3a5f) double-ring "
        "border (a thick outer ring and a thinner inner ring), enclosing a soft cream/beige "
        "interior background.\n"
        "- Inside the circle: a young woman (Amily) shown from the chest up, facing slightly "
        "right with a warm gentle smile, holding her right hand open palm-up, with a small "
        "cute terracotta-orange friendly robot icon hovering above her open palm.\n"
        "- Below the circle (with a clear gap), the wordmark text 'amily.ai' in a friendly "
        "rounded sans-serif font, navy color, lowercase, the '.ai' part slightly emphasized.\n"
        "\n"
        "CHARACTER (match the reference image for face/style):\n"
        "- Late-20s woman, warm friendly expression, large brown eyes with visible iris and "
        "subtle highlight (NOT flat black eyes), gentle smile showing a hint of teeth.\n"
        "- Brown wavy shoulder-length hair, side-parted, partially tied back into a small "
        "low bun on the left side. Clean hair silhouette, no random patches or stray marks.\n"
        "- Light/medium skin with subtle peach blush on the cheeks.\n"
        "- Mustard-yellow open cardigan over a white V-neck top.\n"
        "- A small gold stud earring visible on her ear.\n"
        "- Open right palm raised in front of her, fingers gently curled. The hand is clean "
        "with no extraneous shadow patches or dark blobs around it.\n"
        "\n"
        "STYLE:\n"
        "- Modern flat 2D illustration, clean confident linework, soft warm color palette.\n"
        "- Smooth even shading — no random dark patches, no muddy areas, no rough edges.\n"
        "- The illustration should look polished and intentional, like a brand asset.\n"
        "\n"
        f"BACKGROUND: {bg_description}\n"
        "\n"
        "Output a 1:1 square PNG."
    )


def generate(prompt: str, out_path: Path):
    print(f"  -> calling NB Pro -> {out_path.name}...")
    response = client.models.generate_content(
        model=MODEL,
        contents=[
            "FACE/STYLE REFERENCE — match the warm friendly face in this image:",
            types.Part.from_bytes(data=FAVICON.read_bytes(), mime_type="image/png"),
            prompt,
        ],
        config=types.GenerateContentConfig(
            response_modalities=["IMAGE"],
            image_config=types.ImageConfig(aspect_ratio="1:1"),
            seed=SEED,
        ),
    )
    for cand in response.candidates or []:
        for part in (cand.content.parts or []) if cand.content else []:
            if getattr(part, "inline_data", None) and part.inline_data.data:
                out_path.write_bytes(part.inline_data.data)
                print(f"     saved {out_path.name} ({out_path.stat().st_size//1024}KB)")
                return True
    print("     ERROR: no image returned")
    return False


def chroma_key_v2(in_path: Path, out_transp: Path):
    """Identical math to scripts/chroma_v2.py — magenta key + de-spill."""
    im = Image.open(in_path).convert("RGB")
    arr = np.array(im).astype(np.float32)
    r, g, b = arr[..., 0], arr[..., 1], arr[..., 2]
    mag = (r + b) / 2.0 - g
    LO, HI = 60.0, 180.0
    alpha = np.clip(1.0 - (mag - LO) / (HI - LO), 0.0, 1.0)
    spill = np.maximum(mag, 0.0)
    edge_mask = (alpha > 0.05) & (alpha < 0.95)
    spill_factor = np.where(edge_mask, 1.0, 0.5)
    despill = spill * spill_factor
    new_r = np.clip(r - despill, 0.0, 255.0)
    new_b = np.clip(b - despill, 0.0, 255.0)
    out = np.zeros((arr.shape[0], arr.shape[1], 4), dtype=np.uint8)
    out[..., 0] = new_r.astype(np.uint8)
    out[..., 1] = g.astype(np.uint8)
    out[..., 2] = new_b.astype(np.uint8)
    out[..., 3] = (alpha * 255.0).astype(np.uint8)
    Image.fromarray(out, "RGBA").save(out_transp, optimize=True)
    print(f"     chroma-keyed -> {out_transp.name} ({out_transp.stat().st_size//1024}KB)")


# === Generation 1: cream bg (used directly) ===
print("=== FRESH LOGO #1: cream bg ===")
cream_prompt = base_prompt(
    "Solid uniform cream/beige background filling the entire square — exact color "
    "RGB (250, 245, 235), warm off-white. The cream extends edge-to-edge with no "
    "vignette, no shadow, no gradient, no border. The cream OUTSIDE the circle is "
    "the same cream INSIDE the circle, so the circle border floats on a continuous "
    "warm background."
)
cream_out = ASSETS / "logo-full-cream.png"
if not generate(cream_prompt, cream_out):
    sys.exit(2)

# === Generation 2: magenta bg (chroma-key source) ===
print("\n=== FRESH LOGO #2: magenta bg ===")
magenta_prompt = base_prompt(
    "Solid pure MAGENTA background — exact color RGB (255, 0, 255), bright fuchsia/pink, "
    "like a chroma-key screen. Apply magenta to ALL background regions including: "
    "the area outside the circle border, the negative-space pockets inside any closed "
    "letter loops in 'amily.ai' (inside lowercase a, m, the 'l' loop, the 'i' dot gap), "
    "and any tiny gap between elements. Inside the circle the interior remains soft "
    "cream/beige (the badge background), only OUTSIDE the circle and inside letter "
    "holes turns magenta. Every pixel that would be 'see-through' if this were a "
    "die-cut sticker is magenta."
)
magenta_out = SCRIPTS / "_temp_logo_magenta.png"  # temp, not in assets
if not generate(magenta_prompt, magenta_out):
    sys.exit(3)

# Chroma-key into transparent version
print("\n=== chroma-key magenta -> transparent ===")
chroma_key_v2(magenta_out, ASSETS / "logo-full-transparent.png")

# Cleanup the temp magenta file
magenta_out.unlink()
print(f"     cleaned up {magenta_out.name}")

print("\nDone.")

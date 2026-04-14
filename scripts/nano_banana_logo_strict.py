"""Generate a clean logo with STRICT composition rules:
   - Perfectly round circle (not flat-bottomed, not attached to a plaque)
   - Clear empty-background gap between circle bottom and wordmark top
   - Wordmark 'amily.ai' floats directly on the background (NO plaque/pill/rectangle)

   Two steps:
   1) Fresh cream-bg generation (used directly).
   2) Pass result back to NB with 'swap cream -> magenta' prompt, then chroma-key.
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
FAVICON = ASSETS / "favicon-256.png"
REF_WAVING = ASSETS / "amily-01-waving-cream.png"
SEED = 42


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


def nb_generate(contents, out_path: Path, use_seed=True) -> bool:
    cfg = types.GenerateContentConfig(
        response_modalities=["IMAGE"],
        image_config=types.ImageConfig(aspect_ratio="1:1"),
    )
    if use_seed:
        cfg.seed = SEED
    response = client.models.generate_content(model=MODEL, contents=contents, config=cfg)
    for cand in response.candidates or []:
        for part in (cand.content.parts or []) if cand.content else []:
            if getattr(part, "inline_data", None) and part.inline_data.data:
                out_path.write_bytes(part.inline_data.data)
                print(f"  saved {out_path.name} ({out_path.stat().st_size // 1024}KB)")
                return True
    print(f"  ERROR no image for {out_path.name}")
    return False


STRICT_COMPOSITION = (
    "STRICT COMPOSITION RULES (follow exactly):\n"
    "1. The badge is a PERFECTLY ROUND, COMPLETE 360-degree circle. The bottom "
    "   of the circle is fully curved like the top — NOT flat, NOT cut off, NOT "
    "   attached to a banner, NOT attached to a plaque, NOT attached to any "
    "   rectangular shape. It is a pure round circular badge floating in space.\n"
    "2. The circle occupies roughly the TOP 65% of the square, centered horizontally.\n"
    "3. Below the circle there is EMPTY BACKGROUND SPACE — the same background color "
    "   as everywhere else — for approximately 8% of the image height. This gap is "
    "   PURE BACKGROUND, nothing drawn on it.\n"
    "4. The wordmark text 'amily.ai' sits in the BOTTOM 25% of the square, centered "
    "   horizontally, floating DIRECTLY on the background. No plaque, no pill, no "
    "   banner, no rectangle, no box, no card, no shape is drawn behind the text — "
    "   just the text characters in navy blue directly on the background.\n"
    "5. The background fills ALL space around, between, and through everything: "
    "   outside the circle, in the gap between circle and wordmark, around the "
    "   wordmark, and inside the enclosed loops of the wordmark letters (inside "
    "   lowercase 'a' holes, 'm' holes, the 'i' dot area).\n"
)


def build_prompt(bg_description: str) -> str:
    return (
        "Generate a clean professional brand logo for 'amily.ai', a friendly "
        "Australian AI automation business.\n\n"
        + STRICT_COMPOSITION
        + "\n"
        "CIRCLE BADGE DESIGN:\n"
        "- Navy-blue (#1e3a5f) double-ring border: a thicker outer ring and a thinner "
        "  concentric inner ring with a small gap between them.\n"
        "- Soft cream/beige interior fill INSIDE the circle (the badge interior stays "
        "  cream regardless of the outer background color).\n"
        "- Inside the circle: a late-20s Australian woman named Amily, chest-up view, "
        "  facing slightly right, warm gentle smile with a hint of teeth, large brown "
        "  eyes with visible iris and a subtle highlight, brown wavy shoulder-length "
        "  hair side-parted and partially tied into a small low bun, light/medium skin "
        "  with soft peach blush, mustard-yellow open cardigan over white V-neck top, "
        "  small gold stud earring. She holds her right hand open palm-up, with a "
        "  small cute terracotta-orange friendly robot hovering above her open palm.\n\n"
        "WORDMARK:\n"
        "- Text 'amily.ai', navy-blue color, friendly rounded sans-serif font, "
        "  lowercase, centered below the circle.\n\n"
        f"BACKGROUND: {bg_description}\n\n"
        "STYLE: Modern flat 2D cartoon illustration, clean confident linework, warm "
        "palette, polished brand-quality finish. Output a 1:1 square PNG."
    )


# ─── Step 1: Fresh CREAM generation with strict composition ──────────────
print("=== STEP 1: fresh cream logo with strict composition ===")
cream_prompt = build_prompt(
    "Solid uniform warm cream RGB (250, 245, 235) filling the entire square "
    "edge-to-edge, including the area outside the circle, the gap between the "
    "circle and the wordmark, the area around the wordmark text, and inside "
    "every enclosed letter loop in the wordmark. No gradient, no vignette, no "
    "border, no shadow."
)
CREAM_OUT = ASSETS / "logo-full-cream.png"
if not nb_generate(
    [
        "FACE reference — match this warm friendly face:",
        types.Part.from_bytes(data=FAVICON.read_bytes(), mime_type="image/png"),
        "CHARACTER BODY reference — match this same character style, outfit, hair:",
        types.Part.from_bytes(data=REF_WAVING.read_bytes(), mime_type="image/png"),
        cream_prompt,
    ],
    CREAM_OUT,
):
    sys.exit(1)


# ─── Step 2: Generate MAGENTA version with same composition, same seed ────
print("\n=== STEP 2: matching magenta-bg version for chroma-key ===")
magenta_prompt = build_prompt(
    "Solid pure MAGENTA RGB (255, 0, 255, bright fuchsia chroma-key pink) filling "
    "the entire square edge-to-edge, including the area outside the circle, the "
    "gap between the circle and the wordmark, the area around the wordmark text, "
    "and inside every enclosed letter loop in the wordmark. The cream interior "
    "INSIDE the circle badge remains cream (only the OUTER background turns "
    "magenta). No gradient, no vignette, no border. The wordmark text 'amily.ai' "
    "floats DIRECTLY on magenta with NOTHING behind it."
)
TEMP_MAGENTA = SCRIPTS / "_temp_logo_magenta_strict.png"
if nb_generate(
    [
        "FACE reference — match this warm friendly face:",
        types.Part.from_bytes(data=FAVICON.read_bytes(), mime_type="image/png"),
        "CHARACTER BODY reference — match this same character style, outfit, hair:",
        types.Part.from_bytes(data=REF_WAVING.read_bytes(), mime_type="image/png"),
        "COMPOSITION reference — match the circle position, size, and wordmark layout "
        "from this image (but with MAGENTA bg instead of cream):",
        types.Part.from_bytes(data=CREAM_OUT.read_bytes(), mime_type="image/png"),
        magenta_prompt,
    ],
    TEMP_MAGENTA,
):
    TRANSPARENT_OUT = ASSETS / "logo-full-transparent.png"
    chroma_key_v2(TEMP_MAGENTA, TRANSPARENT_OUT)
    print(f"  chroma-keyed -> {TRANSPARENT_OUT.name} ({TRANSPARENT_OUT.stat().st_size // 1024}KB)")
    TEMP_MAGENTA.unlink()

print("\nDone.")

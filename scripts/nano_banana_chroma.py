"""Re-process logo + hero via Nano Banana Pro with a magenta chroma-key bg.
   Magenta (255, 0, 255) is absent from the character palette, so we can
   alpha-mask it out cleanly — including enclosed pockets (letter loops,
   under-arm gap) that flood-fill from corners can't reach.
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
CREAM = (250, 245, 235)

client = genai.Client(vertexai=True, project=PROJECT, location=LOCATION)


def call_nb_with_magenta(src_path: Path, out_path: Path, preservation_clause: str) -> bool:
    prompt = (
        "Modify this image: replace the WHITE background with SOLID PURE MAGENTA "
        "(RGB 255, 0, 255 — bright fuchsia/pink, like a chroma-key screen). "
        "Apply magenta to EVERY background region, including: "
        "(a) the area outside the main subject; "
        "(b) every enclosed pocket of negative space inside the subject — "
        "specifically: inside any closed letter loops in the wordmark text "
        "(the holes inside lowercase 'a', 'm', 'i' dot, 'l' shape), the gap "
        "between her raised arm and her head, the gap between her side and "
        "any limb, between strands of hair, around her earring, and any tiny "
        "background gap between elements. "
        "Every pixel that would be SEE-THROUGH if this were a die-cut sticker "
        "must be magenta. Do not leave any white pixels anywhere — if it would "
        "be transparent, it must be magenta. "
        f"PRESERVE EXACTLY: {preservation_clause}. "
        "Do not modify any character/illustration pixel — only repaint background "
        "and negative-space pockets to magenta. Output a 1:1 square PNG."
    )

    print(f"  -> calling NB with magenta-bg prompt for {src_path.name}...")
    response = client.models.generate_content(
        model=MODEL,
        contents=[
            types.Part.from_bytes(data=src_path.read_bytes(), mime_type="image/png"),
            prompt,
        ],
        config=types.GenerateContentConfig(
            response_modalities=["IMAGE"],
            image_config=types.ImageConfig(aspect_ratio="1:1"),
        ),
    )
    for cand in response.candidates or []:
        for part in (cand.content.parts or []) if cand.content else []:
            if getattr(part, "inline_data", None) and part.inline_data.data:
                out_path.write_bytes(part.inline_data.data)
                print(f"     saved magenta version: {out_path.name} ({out_path.stat().st_size//1024}KB)")
                return True
    return False


def chroma_key_magenta(in_path: Path, out_transp: Path, out_cream: Path):
    """Convert magenta pixels to alpha=0, smooth edges, also de-spill."""
    im = Image.open(in_path).convert("RGBA")
    arr = np.array(im).astype(np.int16)
    r, g, b = arr[..., 0], arr[..., 1], arr[..., 2]

    # Manhattan distance from magenta (255, 0, 255). Range 0 (pure magenta) to 765.
    dist = np.abs(r - 255) + g + np.abs(b - 255)

    # Smooth alpha mask:
    #   dist <  50  -> fully transparent
    #   dist > 180  -> fully opaque
    #   between     -> linear ramp (anti-aliased edge)
    LO, HI = 50, 180
    new_alpha = np.clip((dist - LO) / (HI - LO) * 255.0, 0, 255).astype(np.uint8)

    # De-spill: where pixel is partially magenta (high R, high B, low G),
    # nudge R and B down toward G to remove the pink halo on edges.
    spill = ((r > 200) & (b > 200) & (g < 200) & (new_alpha > 0) & (new_alpha < 255))
    if spill.any():
        avg = ((r + b) // 2).astype(np.int16)
        # Pull R and B closer to G to neutralize spill on edge pixels
        target = np.maximum(g, 100).astype(np.int16)
        arr[spill, 0] = np.clip((arr[spill, 0] + target[spill]) // 2, 0, 255)
        arr[spill, 2] = np.clip((arr[spill, 2] + target[spill]) // 2, 0, 255)

    arr[..., 3] = new_alpha
    transparent = Image.fromarray(arr.astype(np.uint8), "RGBA")
    transparent.save(out_transp, optimize=True)
    print(f"     saved transparent: {out_transp.name} ({out_transp.stat().st_size//1024}KB)")

    cream_bg = Image.new("RGBA", transparent.size, CREAM + (255,))
    Image.alpha_composite(cream_bg, transparent).convert("RGB").save(out_cream, optimize=True)
    print(f"     saved cream:       {out_cream.name} ({out_cream.stat().st_size//1024}KB)")


# Process LOGO
logo_src = ASSETS / "logo-full-nb.png"
logo_magenta = ASSETS / "logo-full-magenta.png"
logo_transp = ASSETS / "logo-full-transparent.png"
logo_cream = ASSETS / "logo-full-cream.png"
print(f"=== LOGO ({logo_src.name}) ===")
if call_nb_with_magenta(
    logo_src,
    logo_magenta,
    "the navy-blue circular double-ring border, the cream interior background INSIDE the "
    "circle (which stays cream — only OUTSIDE the circle and inside letter holes turns "
    "magenta), the entire 'amily.ai' wordmark text including font and color, the small "
    "terracotta robot in her palm, her face, hair, mustard cardigan, and the overall composition",
):
    chroma_key_magenta(logo_magenta, logo_transp, logo_cream)
else:
    print("  ERROR: NB returned no image for logo")

# Process HERO
hero_src = ASSETS / "amily-01-waving-nb.png"
hero_magenta = ASSETS / "amily-01-waving-magenta.png"
hero_transp = ASSETS / "amily-01-waving-transparent.png"
hero_cream = ASSETS / "amily-01-waving-cream.png"
print(f"\n=== HERO ({hero_src.name}) ===")
if call_nb_with_magenta(
    hero_src,
    hero_magenta,
    "her face, hair, eyes, mouth, mustard-yellow cardigan, white top, gold earring, "
    "raised waving hand, body pose, and the cartoon flat illustration style. The white "
    "of her shirt stays WHITE (it's the character) — only background and the gap under "
    "her raised arm/between hair strands turns magenta",
):
    chroma_key_magenta(hero_magenta, hero_transp, hero_cream)
else:
    print("  ERROR: NB returned no image for hero")

print("\nDone.")

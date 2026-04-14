"""Two-part NB Pro job:
   Part 1 — Option 1 logo fix: take clean cream logo, repaint ONLY the bg magenta,
            chroma-key to transparent. Pixel-identical character between cream and transparent.
   Part 2 — 3 new Higgsfield Amily poses on cream bg, using waving-cream as face reference:
     - amily-02-phone-cream.png      (phone to ear + "Call answered in 0.3s" bubble)
     - amily-03-laptop-cream.png     (laptop typing + "12 jobs booked today" bubble)
     - amily-04-thumbsup-cream.png   (thumbs up + "4.9 stars" bubble)
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

CHARACTER = (
    "A late-20s Australian woman named Amily with a warm friendly smile. "
    "Large brown eyes with visible iris and a subtle highlight. "
    "Brown wavy shoulder-length hair, side-parted, partially tied back into a small low bun on one side. "
    "Light/medium skin with soft peach blush on her cheeks. "
    "Wearing a mustard-yellow open cardigan over a white V-neck top. "
    "Small gold stud earring visible. "
    "Modern flat 2D cartoon illustration style, clean confident linework, warm palette."
)


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


def nb_generate(contents, out_path: Path) -> bool:
    try:
        response = client.models.generate_content(
            model=MODEL,
            contents=contents,
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE"],
                image_config=types.ImageConfig(aspect_ratio="1:1"),
            ),
        )
    except Exception as e:
        print(f"  API error: {e}")
        return False
    for cand in response.candidates or []:
        for part in (cand.content.parts or []) if cand.content else []:
            if getattr(part, "inline_data", None) and part.inline_data.data:
                out_path.write_bytes(part.inline_data.data)
                print(f"  saved {out_path.name} ({out_path.stat().st_size // 1024}KB)")
                return True
    print(f"  ERROR: no image returned for {out_path.name}")
    return False


# ─── PART 1: logo option 1 ────────────────────────────────────────────────
print("=== PART 1: fix logo via option 1 (regenerate transparent from current cream) ===")
LOGO_CREAM = ASSETS / "logo-full-cream.png"
TEMP_MAGENTA = SCRIPTS / "_temp_logo_magenta.png"
LOGO_TRANSPARENT = ASSETS / "logo-full-transparent.png"

bg_swap_prompt = (
    "Take this image and change ONLY the background color. "
    "Replace every cream/beige background pixel OUTSIDE the navy circular border with "
    "SOLID PURE MAGENTA (RGB 255, 0, 255, bright fuchsia). "
    "ALSO paint magenta into every enclosed negative-space pocket inside the wordmark "
    "text 'amily.ai' (the holes inside the lowercase 'a' loops, the 'm' gaps, 'i' dot "
    "negative space, 'l' if closed). "
    "PRESERVE EVERY OTHER PIXEL IDENTICALLY: the character's face and hair and body, "
    "the mustard cardigan, the terracotta robot, the navy double-ring circle border, "
    "the cream interior INSIDE the circle (which stays cream), and the 'amily.ai' "
    "wordmark text itself (keep navy color, exact font, exact spacing). "
    "Do not redraw or restyle the character or text in any way. "
    "Only swap the outer background for magenta. Output a 1:1 square PNG."
)
if nb_generate(
    [types.Part.from_bytes(data=LOGO_CREAM.read_bytes(), mime_type="image/png"), bg_swap_prompt],
    TEMP_MAGENTA,
):
    chroma_key_v2(TEMP_MAGENTA, LOGO_TRANSPARENT)
    print(f"  chroma-keyed -> {LOGO_TRANSPARENT.name} ({LOGO_TRANSPARENT.stat().st_size // 1024}KB)")
    TEMP_MAGENTA.unlink()
else:
    print("  FAILED part 1 — continuing to part 2")


# ─── PART 2: 3 new Amily poses for Higgsfield ─────────────────────────────
print("\n=== PART 2: generate 3 new Amily pose cream-bg images ===")
REF_WAVING = ASSETS / "amily-01-waving-cream.png"
ref_bytes = REF_WAVING.read_bytes()

POSES = [
    {
        "out": "amily-02-phone-cream.png",
        "pose": (
            "She is holding a modern smartphone up to her right ear with her right hand, "
            "talking on the phone, smiling warmly like she's happy to have answered the "
            "call. Her left hand is relaxed or out of frame."
        ),
        "bubble_text": "Call answered in 0.3s",
        "bubble_extras": "",
    },
    {
        "out": "amily-03-laptop-cream.png",
        "pose": (
            "She is seated with an open laptop in front of her, both hands resting on "
            "the laptop keyboard mid-typing, looking happy and productive. The laptop "
            "screen faces toward her (we see the back/hinge of the laptop). She is "
            "smiling warmly — clearly busy but cheerful, not stressed."
        ),
        "bubble_text": "12 jobs booked today",
        "bubble_extras": "",
    },
    {
        "out": "amily-04-thumbsup-cream.png",
        "pose": (
            "She is giving an enthusiastic thumbs-up with her right hand raised in front "
            "of her at chest height, beaming a big warm confident smile, looking proud."
        ),
        "bubble_text": "4.9 stars",
        "bubble_extras": (
            "Also include five small filled mustard-yellow five-pointed stars arranged "
            "horizontally inside the bubble next to the '4.9 stars' text."
        ),
    },
]

for pose in POSES:
    print(f"\n- {pose['out']}  [bubble: '{pose['bubble_text']}']")
    out_path = ASSETS / pose["out"]
    prompt = (
        f"Generate a new illustration of THE SAME CHARACTER shown in the reference image. "
        f"Match the reference character EXACTLY — same face, hair style, skin tone, outfit, "
        f"and illustration style. {CHARACTER} "
        f"\n\n"
        f"NEW POSE (different from the reference's waving pose): {pose['pose']} "
        f"\n\n"
        f"SPEECH BUBBLE: Floating next to her head or shoulder area, a rounded white chat "
        f"speech bubble with a subtle soft navy-blue border and a small tail pointing back "
        f"toward her. Inside the bubble, render this EXACT text in a friendly rounded "
        f"sans-serif navy-blue font: \"{pose['bubble_text']}\". The text must be spelled "
        f"correctly and clearly legible. {pose['bubble_extras']} "
        f"The bubble should be prominent but not dominate — about 30% of the image width. "
        f"\n\n"
        f"BACKGROUND: Solid uniform warm cream RGB(250, 245, 235) filling the entire square "
        f"edge-to-edge. No gradient, no vignette, no border, no shadow — matching the "
        f"reference image's background exactly. "
        f"\n\n"
        f"FRAMING: Upper body portrait (chest up, or chest up + hands in frame as required "
        f"by the pose). Centered in the square. Similar zoom level to the reference. "
        f"\n\n"
        f"Output a 1:1 square PNG."
    )
    nb_generate(
        [
            "REFERENCE CHARACTER — use this exact face, hair, outfit, and illustration style:",
            types.Part.from_bytes(data=ref_bytes, mime_type="image/png"),
            prompt,
        ],
        out_path,
    )

print("\nDone.")

"""Generate a 1200x630 OG share image via Nano Banana Pro (Vertex).

Uses amily-01-waving-cream.png as the face/style reference so the generated
image matches the canonical Amily character exactly.
"""
import sys
from pathlib import Path
from google import genai
from google.genai import types
from PIL import Image

PROJECT = "amily-ai-business"
LOCATION = "global"
MODEL = "gemini-3-pro-image-preview"
ASSETS = Path("D:/Github/amily-ai-website/public/assets")
OUT = ASSETS / "og-image-nano.png"

REF = ASSETS / "amily-01-waving-cream.png"
LOGO_REF = ASSETS / "logo-full-cream.png"

PROMPT = """Create a social-media share image (Facebook/Messenger Open Graph card).

Layout: Horizontal 1.91:1 landscape banner. Warm cream background (#faf5eb → #f6eedc soft gradient) with subtle pastel blobs (terracotta top-left, mustard top-right).

Left side (55% of canvas): Large bold serif headline in dark navy (#0c1b30) — two lines:
  "Stop losing jobs"
  "to missed calls."
Under the headline, a mustard-to-terracotta gradient underline bar sits beneath "missed calls." (the underline is BELOW the text, not overlapping it).
Below the headline, a smaller navy subhead: "Your local AI guide for Melbourne small business."
Below the subhead, a small navy pill-button containing the text "amily.ai" in cream.

Top-left corner: the small amily.ai wordmark logo (use the provided logo reference).

Right side (45% of canvas): The Amily mascot character (use the provided character reference — same face, hair, cardigan, pose), waving with a warm friendly smile. She should be sized large, positioned on the right, partially extending to the edge like a magazine cover. Around her, a few small decorative floating "beats" — small white rounded-rectangle bubbles with subtle drop shadow, each containing one mini-element:
  - Phone icon + "Call answered in 0.3s"
  - Five mustard stars + "4.9 Google reviews"
  - Lightning bolt + "12 jobs booked today"

Overall: clean, premium, warm, inviting. Small-business friendly. Melbourne SMB target audience. NO extra text, NO watermarks, NO borders. Aspect ratio exactly 1.91:1 (1200×630). Flat 2D cartoon illustration style matching the reference."""


def main():
    client = genai.Client(vertexai=True, project=PROJECT, location=LOCATION)

    ref_img = Image.open(REF).convert("RGB")
    logo_img = Image.open(LOGO_REF).convert("RGB")

    contents = [PROMPT, ref_img, logo_img]

    print(f"Requesting Nano Banana Pro generation ({MODEL})...")
    response = client.models.generate_content(
        model=MODEL,
        contents=contents,
        config=types.GenerateContentConfig(
            response_modalities=["IMAGE"],
            image_config=types.ImageConfig(aspect_ratio="16:9"),
        ),
    )

    saved = False
    for part in response.candidates[0].content.parts:
        if getattr(part, "inline_data", None) and part.inline_data.data:
            tmp = ASSETS / "_og-nano-raw.png"
            tmp.write_bytes(part.inline_data.data)
            im = Image.open(tmp).convert("RGB")
            # Resize/crop to exact 1200x630 if model returns 16:9
            target_ratio = 1200 / 630
            cur_ratio = im.width / im.height
            if abs(cur_ratio - target_ratio) > 0.01:
                if cur_ratio > target_ratio:
                    new_w = int(im.height * target_ratio)
                    left = (im.width - new_w) // 2
                    im = im.crop((left, 0, left + new_w, im.height))
                else:
                    new_h = int(im.width / target_ratio)
                    top = (im.height - new_h) // 2
                    im = im.crop((0, top, im.width, top + new_h))
            im = im.resize((1200, 630), Image.LANCZOS)
            im.save(OUT, "PNG", optimize=True)
            tmp.unlink(missing_ok=True)
            print(f"Saved: {OUT}")
            saved = True
            break

    if not saved:
        print("No image returned.", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()

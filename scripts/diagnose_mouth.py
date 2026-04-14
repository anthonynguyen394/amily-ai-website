"""Locate the mouth region and report the grey color profile."""
from PIL import Image
import numpy as np

SRC = "D:/Github/amily-ai-website/public/assets/amily-01-waving.png"
im = Image.open(SRC).convert("RGBA")
arr = np.array(im)
H, W, _ = arr.shape
print(f"Image: {W}x{H}")

# Expected mouth region (eyeballed from the 1024x1024 image: head is roughly top 55%,
# mouth sits around y=430-520, x=360-470)
# Let's scan for grey-ish pixels in the face zone.
face = arr[300:600, 250:600]  # face bounding box
fh, fw, _ = face.shape
r = face[..., 0]; g = face[..., 1]; b = face[..., 2]; a = face[..., 3]

# A "grey" pixel = R≈G≈B with moderate brightness (not white, not black, not skin/hair/cardigan)
grey_mask = (
    (abs(r.astype(int) - g.astype(int)) < 12)
    & (abs(g.astype(int) - b.astype(int)) < 12)
    & (r > 120) & (r < 210)
    & (a > 200)
)
ys, xs = np.where(grey_mask)
if len(ys) == 0:
    print("No grey pixels found in face zone with tight tolerance.")
else:
    print(f"Grey-ish pixel count in face zone: {len(ys)}")
    # absolute coords
    ys_abs = ys + 300
    xs_abs = xs + 250
    print(f"  y range: {ys_abs.min()}-{ys_abs.max()}  x range: {xs_abs.min()}-{xs_abs.max()}")

    # Sample 10 of them
    idx = np.linspace(0, len(ys) - 1, min(10, len(ys))).astype(int)
    for i in idx:
        y, x = ys_abs[i], xs_abs[i]
        print(f"  px ({x},{y}) RGBA={tuple(arr[y, x])}")

# Also scan specifically for the mouth: narrower range
print("\n--- Mouth-only scan (y=430-510, x=360-490) ---")
mouth = arr[430:510, 360:490]
mh, mw, _ = mouth.shape
mr = mouth[..., 0]; mg = mouth[..., 1]; mb = mouth[..., 2]; ma = mouth[..., 3]
unique_colors = {}
for yy in range(mh):
    for xx in range(mw):
        if ma[yy, xx] < 200:
            continue
        key = (int(mr[yy, xx]) // 16 * 16, int(mg[yy, xx]) // 16 * 16, int(mb[yy, xx]) // 16 * 16)
        unique_colors[key] = unique_colors.get(key, 0) + 1

top = sorted(unique_colors.items(), key=lambda kv: -kv[1])[:12]
print("Top color buckets in mouth region:")
for (rr, gg, bb), ct in top:
    print(f"  RGB~({rr:3d},{gg:3d},{bb:3d})  count={ct}")

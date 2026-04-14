"""Map the semi-transparent teeth patch precisely."""
from PIL import Image
import numpy as np

SRC = "D:/Github/amily-ai-website/public/assets/amily-01-waving.png"
im = Image.open(SRC).convert("RGBA")
arr = np.array(im)

r, g, b, a = arr[..., 0], arr[..., 1], arr[..., 2], arr[..., 3]

# Teeth = grey-ish + semi-transparent (alpha 160-240) inside the face zone
mask = (
    (abs(r.astype(int) - g.astype(int)) < 15)
    & (abs(g.astype(int) - b.astype(int)) < 15)
    & (r > 150) & (r < 230)
    & (a > 150) & (a < 250)
)

# constrain to face zone
face_zone = np.zeros_like(mask, dtype=bool)
face_zone[380:560, 400:620] = True
mask &= face_zone

ys, xs = np.where(mask)
print(f"Semi-transparent grey pixels in mouth zone: {len(ys)}")
if len(ys):
    print(f"  y: {ys.min()}-{ys.max()}  x: {xs.min()}-{xs.max()}")
    # alpha distribution
    a_vals = arr[ys, xs, 3]
    print(f"  alpha: min={a_vals.min()} max={a_vals.max()} mean={a_vals.mean():.1f}")
    # rgb mean
    print(f"  mean RGB: ({arr[ys,xs,0].mean():.0f},{arr[ys,xs,1].mean():.0f},{arr[ys,xs,2].mean():.0f})")

# Also look for a broader cluster — maybe the teeth have fuller alpha but are just grey
broad = (
    (abs(r.astype(int) - g.astype(int)) < 20)
    & (abs(g.astype(int) - b.astype(int)) < 20)
    & (r > 160) & (r < 235)
    & (a > 100)
)
broad &= face_zone
ys2, xs2 = np.where(broad)
print(f"\nBroader grey-ish in face zone: {len(ys2)}")
if len(ys2):
    print(f"  y: {ys2.min()}-{ys2.max()}  x: {xs2.min()}-{xs2.max()}")

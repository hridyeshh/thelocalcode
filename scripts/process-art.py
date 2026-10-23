"""Turn the generated masters in art-src/ into web assets.

- Flat cartoon art: flattens each image to its own 32 main colours and smooths
  the edges between them at 3x, then renders at 2x: drops AI grain and wobbly
  lines, and leaves zoomed-in scenes sharp.
- Photo-like art (the computer): upscales 2x with a light
  sharpen instead, so shading and fine hatching survive.
- Keys out the flat magenta (#FF00FF) background to transparency, un-mixing
  the anti-aliased edge pixels so outlines don't keep a pink fringe.
- Finds the computer's blank white screen and writes its box as fractions of
  the image to lib/art.json, so the page can lay live content exactly over it.
- Splits the hand sheet (one hand drawn in three poses, a row each) into one
  image per pose, and records the point of each that the page pins to the disk
  and where its sleeve leaves the right edge, so the page can run it on.
- Writes public/art/<name>.webp.

Desky, the keychain and the floppy at the slot are drawn as SVG in
components/parts.tsx: they get zoomed far past any raster and they come apart
into layers (or tip into the slot in 3D).

Run: npm run art   (python3 with Pillow + numpy)
"""

import json
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC, OUT = ROOT / "art-src", ROOT / "public" / "art"

# name -> (source master, how many screens to find, flat cartoon?)
ART = {
    "mac": ("mac", 1, False),
    "butterfly": ("butterfly", 0, True),
}

MAGENTA = np.array([255.0, 0.0, 255.0])
# ponytail: thresholds tuned by eye on these images; widen LO if a fringe shows
LO, HI = 40.0, 190.0

# The hand sheet's poses, top to bottom, and the point of each that the page pins to the
# disk (sheet px): the held disk's centre, the gap between thumb and finger, the fingertip.
# DISK_PX is the held disk's width, which sizes the hand against the page's disk.
# ponytail: measured by eye on art-src/hands.png; re-measure if it's regenerated
POSES = {"hold": (326, 161), "pinch": (312, 490), "poke": (218, 780)}
DISK_PX = 238


def flatten(img: Image.Image, up: int = 3, out: int = 2, method: Image.Quantize = Image.Quantize.MEDIANCUT) -> Image.Image:
    w, h = img.size
    big = img.resize((w * up, h * up), Image.LANCZOS)
    pal = big.quantize(colors=32, method=method, dither=Image.Dither.NONE)
    # Mode-filter the palette indices (PIL won't filter "P" images directly)
    idx = Image.frombytes("L", pal.size, pal.tobytes()).filter(ImageFilter.ModeFilter(5))
    smooth = Image.frombytes("P", pal.size, idx.tobytes())
    smooth.putpalette(pal.getpalette())
    return smooth.convert("RGB").resize((w * out, h * out), Image.LANCZOS)


def upscale(img: Image.Image, k: int = 2) -> Image.Image:
    big = img.resize((img.width * k, img.height * k), Image.LANCZOS)
    return big.filter(ImageFilter.UnsharpMask(radius=2, percent=45, threshold=2))


def key_out(rgb: np.ndarray) -> np.ndarray:
    m = np.minimum(rgb[..., 0], rgb[..., 2]) - rgb[..., 1]  # "how magenta"
    bg = np.clip((m - LO) / (HI - LO), 0, 1)
    a = 1.0 - bg
    safe = np.maximum(a, 1e-3)[..., None]
    col = np.clip((rgb - (1 - a[..., None]) * MAGENTA) / safe, 0, 255)
    return np.dstack([col, a * 255]).astype(np.uint8)


def screens(rgba: np.ndarray, count: int) -> list[dict]:
    """Largest near-rectangular white regions, as fractions of the image."""
    if not count:
        return []
    step = 4  # label on a 1/4-size mask; plenty for box edges
    white = (rgba[::step, ::step, :3].min(axis=2) > 238) & (rgba[::step, ::step, 3] > 250)
    h, w = white.shape
    seen = np.zeros_like(white)
    found = []
    for y in range(h):
        for x in range(w):
            if not white[y, x] or seen[y, x]:
                continue
            q, n = deque([(y, x)]), 0
            seen[y, x] = True
            y0 = y1 = y
            x0 = x1 = x
            while q:
                cy, cx = q.popleft()
                n += 1
                y0, y1, x0, x1 = min(y0, cy), max(y1, cy), min(x0, cx), max(x1, cx)
                for ny, nx in ((cy + 1, cx), (cy - 1, cx), (cy, cx + 1), (cy, cx - 1)):
                    if 0 <= ny < h and 0 <= nx < w and white[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        q.append((ny, nx))
            box = (x1 - x0 + 1) * (y1 - y0 + 1)
            if n > 0.004 * h * w and n / box > 0.9:  # big and box-shaped: a screen, not a t-shirt
                found.append((n, x0, y0, x1 + 1, y1 + 1))
    found = sorted(found, reverse=True)[:count]
    found.sort(key=lambda f: f[1])  # left to right
    return [
        {"x": round(x0 / w, 4), "y": round(y0 / h, 4), "w": round((x1 - x0) / w, 4), "h": round((y1 - y0) / h, 4)}
        for _, x0, y0, x1, y1 in found
    ]


def hands(k: int = 2) -> dict:
    """One image per pose of the hand sheet, at k x the source size, each with its pin and sleeve."""
    # Octree keeps the label's small red name, which median cut merges into the grey ink
    sheet = flatten(Image.open(SRC / "hands.png").convert("RGB"), method=Image.Quantize.FASTOCTREE)
    rgba = key_out(np.asarray(sheet, dtype=np.float64))
    solid = rgba[..., 3] > 8
    rows = np.flatnonzero(solid.any(axis=1))
    gaps = np.flatnonzero(np.diff(rows) > 1)
    bands = [(a, b + 1) for a, b in zip(np.r_[rows[0], rows[gaps + 1]], np.r_[rows[gaps], rows[-1]]) if b - a > 40]
    assert len(bands) == len(POSES), f"hands: wanted {len(POSES)} poses, found {len(bands)}"
    meta = {"disk": DISK_PX * k}
    for (name, (px, py)), (y0, y1) in zip(POSES.items(), bands):
        y0, y1 = max(y0 - 6, 0), min(y1 + 6, rgba.shape[0])
        x0 = max(np.flatnonzero(solid[y0:y1].any(axis=0)).min() - 6, 0)
        img = rgba[y0:y1, x0:]  # keep the right edge: the sleeve runs off it, and the page runs it on
        h, w = img.shape[:2]
        edge = img[:, -3]
        cloth = np.flatnonzero(edge[:, 3] > 128)
        top, bottom = cloth.min(), cloth.max() + 1
        line = np.argmin(edge[top:bottom, :3].max(axis=1) < 110)  # dark rows at its top: the outline
        Image.fromarray(img).save(OUT / f"hand-{name}.webp", "WEBP", quality=88, method=6)
        meta[name] = {
            "w": w,
            "h": h,
            "pin": {"x": round((px * k - x0) / w, 4), "y": round((py * k - y0) / h, 4)},
            "sleeve": {"top": round(top / h, 4), "bottom": round(bottom / h, 4), "line": round(int(line) / h, 4)},
        }
        print(name, meta[name])
    return meta


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    meta = {}
    for name, (master, count, flat) in ART.items():
        src = Image.open(SRC / f"{master}.png").convert("RGB")
        rgb = np.asarray(flatten(src) if flat else upscale(src), dtype=np.float64)
        rgba = key_out(rgb)
        ys, xs = np.nonzero(rgba[..., 3] > 8)
        pad = 6
        y0, y1 = max(ys.min() - pad, 0), min(ys.max() + pad, rgba.shape[0])
        x0, x1 = max(xs.min() - pad, 0), min(xs.max() + pad, rgba.shape[1])
        rgba = rgba[y0:y1, x0:x1]
        found = screens(rgba, count)
        assert len(found) == count, f"{name}: wanted {count} screens, found {len(found)}"
        Image.fromarray(rgba).save(OUT / f"{name}.webp", "WEBP", quality=88, method=6)
        h, w = rgba.shape[:2]
        meta[name] = {"w": w, "h": h, "screens": found}
        print(name, meta[name])
    meta["hands"] = hands()
    (ROOT / "lib" / "art.json").write_text(json.dumps(meta, indent=2) + "\n")


if __name__ == "__main__":
    main()

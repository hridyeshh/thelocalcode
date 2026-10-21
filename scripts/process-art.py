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
- Cuts the hand out of the hand-and-floppy master (the page draws its own
  floppy, so it can tip it into the slot in 3D) and records where the thumb
  presses, so the page can pin the thumb to the disk.
- Writes public/art/<name>.webp.

Desky, the keychain and the floppy are drawn as SVG in components/parts.tsx:
they get zoomed far past any raster and they come apart into layers.

Run: npm run art   (python3 with Pillow + numpy)
"""

import json
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC, OUT = ROOT / "art-src", ROOT / "public" / "art"

# name -> (source master, how many screens to find, flat cartoon?)
ART = {
    "mac": ("mac", 1, False),
    "hand": ("floppy", 0, True),
    "butterfly": ("butterfly", 0, True),
}

MAGENTA = np.array([255.0, 0.0, 255.0])
# ponytail: thresholds tuned by eye on these images; widen LO if a fringe shows
LO, HI = 40.0, 190.0

# In the floppy master (source px): a point inside the disk's white label, where the hand
# starts (everything left of it is disk), and the pad of the thumb that presses the disk.
# ponytail: measured by eye on art-src/floppy.png; re-measure if it's regenerated
LABEL_SEED, HAND_LEFT, THUMB = (500, 300), 560, (640, 330)


def flatten(img: Image.Image, up: int = 3, out: int = 2) -> Image.Image:
    w, h = img.size
    big = img.resize((w * up, h * up), Image.LANCZOS)
    pal = big.quantize(colors=32, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
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


def cut_hand(rgba: np.ndarray, k: int = 2) -> tuple[np.ndarray, list[float]]:
    """Keep only the hand (and its sleeve) from the hand-and-floppy art, at k x the source size."""
    rgb, a = rgba[..., :3].astype(int), rgba[..., 3]
    white = (rgb.min(-1) > 230) & (a > 200)  # the shutter is light grey (~210), so it stays out
    dark = (rgb.max(-1) < 110) & (a > 120)
    # The label is the one white region that belongs to the disk; every other white region
    # right of the disk is skin or sleeve. (fromarray images are read-only: copy before filling.)
    regions = Image.fromarray((white * 255).astype(np.uint8)).copy()
    ImageDraw.floodfill(regions, (LABEL_SEED[0] * k, LABEL_SEED[1] * k), 128)
    skin = np.asarray(regions) == 255
    skin[:, : HAND_LEFT * k] = False
    near = np.asarray(Image.fromarray((skin * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(19))) > 0
    hand = skin | (dark & near)  # the outline is whatever ink hugs the skin
    # Fill holes (the nails): anything the outside can't reach is inside the hand.
    outside = Image.fromarray(np.where(hand, 0, 255).astype(np.uint8)).copy()
    ImageDraw.floodfill(outside, (0, 0), 100)
    hand |= np.asarray(outside) == 255
    out = rgba.copy()
    out[..., 3] = (a * hand).astype(np.uint8)
    return out, [THUMB[0] * k, THUMB[1] * k]


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    meta = {}
    for name, (master, count, flat) in ART.items():
        src = Image.open(SRC / f"{master}.png").convert("RGB")
        rgb = np.asarray(flatten(src) if flat else upscale(src), dtype=np.float64)
        rgba = key_out(rgb)
        grip = None
        if name == "hand":
            rgba, grip = cut_hand(rgba)
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
        if grip:
            meta[name]["grip"] = {"x": round((grip[0] - x0) / w, 4), "y": round((grip[1] - y0) / h, 4)}
        print(name, meta[name])
    (ROOT / "lib" / "art.json").write_text(json.dumps(meta, indent=2) + "\n")


if __name__ == "__main__":
    main()

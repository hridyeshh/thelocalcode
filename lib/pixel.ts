// The keychain's pixel world (a cat chasing a butterfly) and the pixel-dissolve
// colours. Plain canvas drawing on a tiny grid; CSS scales it up crisp.

export const PW = 160;
export const PH = 90;

const C = {
  sky: "#9fd8f6",
  haze: "#c9ecfb",
  sun: "#eebf12",
  cloud: "#ffffff",
  hill: "#72d184",
  hillTop: "#5bbd6f",
  ground: "#3e8e3a",
  grass: "#2f7a2c",
  trunk: "#7a4a24",
  leaf: "#2f9e4f",
  leafLit: "#48c068",
  ink: "#1b1b1b",
  fur: "#ffffff",
  nose: "#ff8fa3",
  wing: "#cfc9ee",
  wingDark: "#7f78c5",
  bloom: "#ffb4af",
  bloomWhite: "#ffffff",
};

export const DISSOLVE = { fill: "#194d15", sparks: ["#ffffff", "#cfc9ee", "#7f78c5"] };

/** Deterministic 0–1 noise, so the world looks the same on every visit. */
export const rand = (i: number) => {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

const FLOWERS = Array.from({ length: 28 }, (_, i) => ({
  x: Math.floor(rand(i) * PW),
  y: 74 + Math.floor(rand(i + 99) * 14),
  c: i % 3 ? C.bloom : C.bloomWhite,
}));

type Ctx = CanvasRenderingContext2D;

const box = (ctx: Ctx, x: number, y: number, w: number, h: number, c: string) => {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
};

/** A 14×10 cat facing right, mirrored when walking left. */
function cat(ctx: Ctx, x: number, y: number, dir: number, step: number) {
  const px = (dx: number, dy: number, w: number, h: number, c: string) =>
    box(ctx, dir > 0 ? x + dx : x + 14 - dx - w, y + dy, w, h, c);
  px(2, 4, 9, 4, C.ink); // body
  px(3, 5, 7, 2, C.fur);
  px(9, 1, 5, 5, C.ink); // head
  px(10, 2, 3, 3, C.fur);
  px(9, 0, 1, 1, C.ink); // ears
  px(12, 0, 1, 1, C.ink);
  px(11, 3, 1, 1, C.ink); // eye
  px(13, 4, 1, 1, C.nose);
  px(1, 3, 1, 2, C.ink); // tail, swishing
  px(0, step ? 1 : 2, 1, 2, C.ink);
  for (const leg of step ? [3, 6, 8, 11] : [4, 5, 9, 10]) px(leg, 8, 1, 2, C.ink);
}

function butterfly(ctx: Ctx, x: number, y: number, up: boolean) {
  box(ctx, x, y, 1, 3, C.ink);
  if (up) {
    box(ctx, x - 3, y - 2, 3, 3, C.wing);
    box(ctx, x + 1, y - 2, 3, 3, C.wing);
    box(ctx, x - 2, y - 1, 1, 1, C.wingDark);
    box(ctx, x + 2, y - 1, 1, 1, C.wingDark);
  } else {
    box(ctx, x - 2, y, 2, 2, C.wingDark);
    box(ctx, x + 1, y, 2, 2, C.wingDark);
  }
}

/** One frame of the world at time `t` (seconds). */
export function drawWorld(ctx: Ctx, t: number) {
  box(ctx, 0, 0, PW, 42, C.sky);
  box(ctx, 0, 42, PW, 28, C.haze);
  box(ctx, 136, 9, 10, 6, C.sun);
  box(ctx, 138, 7, 6, 10, C.sun);
  for (let i = 0; i < 3; i++) {
    const cx = ((t * (3 + i) + i * 61) % (PW + 40)) - 30;
    const cy = 10 + i * 8;
    box(ctx, cx, cy, 18, 4, C.cloud);
    box(ctx, cx + 4, cy - 3, 9, 3, C.cloud);
  }
  for (let x = 0; x < PW; x++) {
    const top = Math.round(54 + 4 * Math.sin(x / 13 + 1) + 2 * Math.sin(x / 5));
    box(ctx, x, top, 1, 70 - top, C.hill);
    box(ctx, x, top, 1, 1, C.hillTop);
  }
  box(ctx, 0, 70, PW, 20, C.ground);
  box(ctx, 0, 70, PW, 2, C.grass);
  for (const f of FLOWERS) box(ctx, f.x, f.y, 1, 1, f.c);
  box(ctx, 23, 50, 3, 20, C.trunk);
  box(ctx, 14, 38, 21, 13, C.leaf);
  box(ctx, 17, 33, 15, 5, C.leaf);
  box(ctx, 12, 42, 25, 6, C.leaf);
  box(ctx, 18, 36, 5, 3, C.leafLit);
  box(ctx, 27, 41, 4, 2, C.leafLit);

  // The chase: the cat follows the butterfly a beat behind and pounces when it dips.
  const a = t * 0.55;
  butterfly(ctx, 84 + 54 * Math.sin(a), 44 + 13 * Math.sin(t * 1.3), Math.floor(t * 8) % 2 === 0);
  const lag = a - 0.9;
  const hop = Math.round(9 * Math.max(0, Math.sin(t * 1.3 - 1.2)) ** 6);
  cat(ctx, 78 + 48 * Math.sin(lag), 61 - hop, Math.cos(lag) >= 0 ? 1 : -1, Math.floor(t * 8) % 2);
}

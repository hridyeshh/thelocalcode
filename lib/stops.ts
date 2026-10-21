// Pure scroll-timeline helpers (no React), so `node --test` can run them.

export type Range = readonly [number, number];
export type Beats<K extends string> = readonly (readonly [K, number])[];

/** Beat lengths -> each beat's [start, end] on a chapter's 0–1 progress. */
export function stops<K extends string>(beats: Beats<K>): Record<K, Range> {
  const total = length(beats);
  const out = {} as Record<K, Range>;
  let pos = 0;
  for (const [key, n] of beats) out[key] = [pos / total, (pos += n) / total];
  return out;
}

/** A chapter's scroll length: the sum of its beats. */
export function length(beats: Beats<string>): number {
  return beats.reduce((sum, [, n]) => sum + n, 0);
}

/** 0 before the range, 1 after it, smoothstep-eased in between. */
export function seg(v: number, [a, b]: Range): number {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** The point `f` (0–1) of the way through a range. */
export const at = ([a, b]: Range, f: number) => a + (b - a) * f;

/** A rectangle in px (x, y = top-left), or in fractions of another rectangle. */
export type Box = { x: number; y: number; w: number; h: number };

/** How far past the edges a zoomed-in screen goes, so its rounded corners stay out of view. */
export const OVERSHOOT = 1.08;

/**
 * Translate + scale that grows `screen` (fractions of `box`) until it covers a vw×vh view.
 * Use with transform-origin at the screen's centre. t=0 at rest, t=1 covered; the scale is
 * geometric so the zoom feels even all the way in.
 */
export function intoScreen(box: Box, screen: Box, vw: number, vh: number, t: number) {
  const cx = box.x + (screen.x + screen.w / 2) * box.w;
  const cy = box.y + (screen.y + screen.h / 2) * box.h;
  const k = Math.max(vw / (screen.w * box.w), vh / (screen.h * box.h)) * OVERSHOOT;
  return { x: (vw / 2 - cx) * t, y: (vh / 2 - cy) * t, scale: k ** t };
}

/**
 * Where a point of a drawing that comes apart in 3D lands on screen, from the drawing's
 * resting centre. Mirrors CSS on the drawing's box: `translate(tx, ty) scale(s)` and
 * `perspective: d`, then on its inner layer `rotateX(rx) rotateZ(rz)`, with the point's layer
 * at translateZ(z). (x, y, z, d) are in the drawing's own, unscaled px.
 */
export function tipped(x: number, y: number, z: number, o: { rx: number; rz: number; s: number; d: number; tx?: number; ty?: number }) {
  const a = (o.rx * Math.PI) / 180;
  const b = (o.rz * Math.PI) / 180;
  const x1 = x * Math.cos(b) - y * Math.sin(b);
  const y1 = x * Math.sin(b) + y * Math.cos(b);
  const y2 = y1 * Math.cos(a) - z * Math.sin(a);
  const z2 = y1 * Math.sin(a) + z * Math.cos(a);
  const k = (o.d / (o.d - z2)) * o.s;
  return { x: (o.tx ?? 0) + x1 * k, y: (o.ty ?? 0) + y2 * k };
}

export type Pt = readonly [number, number];

/** Point on a cubic Bézier at t, and its direction of travel there. */
export function bezier([p0, p1, p2, p3]: readonly [Pt, Pt, Pt, Pt], t: number) {
  const u = 1 - t;
  const pt = (i: 0 | 1) => u * u * u * p0[i] + 3 * u * u * t * p1[i] + 3 * u * t * t * p2[i] + t * t * t * p3[i];
  const d = (i: 0 | 1) => 3 * u * u * (p1[i] - p0[i]) + 6 * u * t * (p2[i] - p1[i]) + 3 * t * t * (p3[i] - p2[i]);
  return { x: pt(0), y: pt(1), dx: d(0), dy: d(1) };
}

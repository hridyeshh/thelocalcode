"use client";

// Drawn parts: pixel sprites, stickers and doodles that sit next to the illustrations.
import { motion, type MotionValue } from "motion/react";

/** Rows of "x" and "." as one crisp path, one unit per pixel. */
function pixels(rows: readonly string[], dx = 0, dy = 0) {
  let d = "";
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) if (row[x] === "x") d += `M${x + dx} ${y + dy}h1v1h-1z`;
  });
  return d;
}

const dots = (pts: readonly (readonly [number, number])[], dx = 0) => pts.map(([x, y]) => `M${x + dx} ${y}h1v1h-1z`).join("");

// The two of us, as the computer draws us: 13×15 each, arms added per pose.
const ONE = [
  "...x.x.x.x...",
  "...xxxxxxx...",
  "..xxxxxxxxx..",
  "..x.......x..",
  "..x.x...x.x..",
  "..x.......x..",
  "..x.x...x.x..",
  "..x..xxx..x..",
  "...x.....x...",
  "....xxxxx....",
  "..xxxxxxxxx..",
  "...xxxxxxx...",
  "...xxxxxxx...",
  "...xx...xx...",
  "...xx...xx...",
];
const TWO = [
  ".....xxx.....",
  "....xxxxx....",
  "..xxxxxxxxx..",
  ".xxx.....xxx.",
  ".xx.x...x.xx.",
  ".xx.......xx.",
  ".xx.x...x.xx.",
  "..x..xxx..x..",
  "...x.....x...",
  "....xxxxx....",
  "..xxxxxxxxx..",
  "...xxxxxxx...",
  "...xxxxxxx...",
  "...xx...xx...",
  "...xx...xx...",
];
const QUESTION = [".xxx.", "x...x", "....x", "...x.", "..x..", ".....", "..x.."];
const LEFT_DOWN = [[2, 11], [2, 12]] as const;
const RIGHT_DOWN = [[10, 11], [10, 12]] as const;
const RIGHT_UP = [[11, 9], [12, 8], [12, 7]] as const;
const RIGHT_HIGH = [[11, 9], [11, 8], [11, 7]] as const;
const LEFT_UP = [[1, 9], [0, 8], [0, 7]] as const;
const LEFT_HIGH = [[1, 9], [1, 8], [1, 7]] as const;
const GAP = 16;

const POSES = {
  // [always drawn, frame A, frame B]
  wave: [
    pixels(ONE) + pixels(TWO, GAP) + dots(LEFT_DOWN) + dots(RIGHT_DOWN, GAP),
    dots(RIGHT_UP) + dots(LEFT_HIGH, GAP),
    dots(RIGHT_HIGH) + dots(LEFT_UP, GAP),
  ],
  think: [
    pixels(ONE) + pixels(TWO, GAP) + dots([...LEFT_DOWN, ...RIGHT_DOWN]) + dots([...LEFT_DOWN, ...RIGHT_DOWN], GAP),
    pixels(QUESTION, 4, -9),
    pixels(QUESTION, 4 + GAP, -9),
  ],
  cheer: [
    pixels(ONE) + pixels(TWO, GAP),
    dots([...LEFT_UP, ...RIGHT_UP]) + dots([...LEFT_UP, ...RIGHT_UP], GAP),
    dots([...LEFT_HIGH, ...RIGHT_HIGH]) + dots([...LEFT_HIGH, ...RIGHT_HIGH], GAP),
  ],
} as const;

/** thelocalcode is two people. This is how the computer draws us. */
export function PixelDuo({ pose, className }: { pose: keyof typeof POSES; className?: string }) {
  const [still, a, b] = POSES[pose];
  return (
    <svg viewBox="-1 -10 31 26" className={`duo ${className ?? ""}`} shapeRendering="crispEdges" aria-hidden>
      <path d={still} />
      <path d={a} className="duo-a" />
      <path d={b} className="duo-b" />
    </svg>
  );
}

const FLOPPY = [
  "xxxxxxxxxxx.",
  "x..x....x..x",
  "x..x..x.x..x",
  "x..x..x.x..x",
  "x..xxxxxx..x",
  "x..........x",
  "x.xxxxxxxx.x",
  "x.x......x.x",
  "x.x......x.x",
  "x.x......x.x",
  "x.x......x.x",
  "xxxxxxxxxxxx",
];

/** The disk icon the computer shows while it boots. */
export function PixelFloppy() {
  return (
    <svg viewBox="0 0 12 12" className="pixel-floppy" shapeRendering="crispEdges" aria-hidden>
      <path d={pixels(FLOPPY)} />
    </svg>
  );
}

// Desky's widget icons, copied from its iPhone app (8×8, drawn in the widget's accent).
export const DESKY_ICONS = {
  clock: ["..xxxx..", ".x....x.", ".x..x.x.", ".x..xx..", ".x....x.", ".x....x.", "..xxxx..", "........"],
  weather: ["..x..x..", "........", "x..xx..x", "..xxxx..", "..xxxx..", "x..xx..x", "........", "..x..x.."],
  music: ["..xxxxx.", "..x...x.", "..x...x.", "..x...x.", "..x...x.", "xxx..xx.", "xx...xx.", "........"],
  timer: ["xxxxxxxx", ".xxxxxx.", "..xxxx..", "...xx...", "...xx...", "..xxxx..", ".xxxxxx.", "xxxxxxxx"],
  gif: ["xx....xx", "xx....xx", "..x.....", "..xx....", "..xxx...", "..xx....", "..x.....", "xx....xx"],
  quote: [".xx.xx..", ".xx.xx..", ".xx.xx..", "..x..x..", "........", "........", "........", "........"],
  pet: [".x....x.", "xx....xx", "........", "..x..x..", ".xx..xx.", "........", "..xxxx..", ".xxxxxx."],
} as const;
export type DeskyWidget = keyof typeof DESKY_ICONS;

export function DeskyIcon({ name }: { name: DeskyWidget }) {
  return (
    <svg viewBox="0 0 8 8" className={`d-icon d-${name}`} shapeRendering="crispEdges" aria-hidden>
      <path d={pixels(DESKY_ICONS[name])} />
    </svg>
  );
}

const PET = ["..xxxxx..", ".xxxxxxx.", "xxxxxxxxx", "xx.xxx.xx", "xxxxxxxxx", "xxxx.xxxx", ".xxxxxxx.", "..x...x.."];

/** Desky's pixel pet, as drawn on its screen. */
export function PixelPet() {
  return (
    <svg viewBox="0 0 9 8" className="pixel-pet" shapeRendering="crispEdges" aria-hidden>
      <path d={pixels(PET)} />
    </svg>
  );
}

function blobPath(seed: number, n = 9) {
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const r = 100 * (1 + 0.2 * Math.sin(i * 2.3 + seed) + 0.1 * Math.cos(i * 4.1 + seed * 2));
    return [Math.cos(a) * r, Math.sin(a) * r] as const;
  });
  const mid = (a: readonly [number, number], b: readonly [number, number]) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] as const;
  const f = (v: number) => v.toFixed(1);
  const [sx, sy] = mid(pts[n - 1], pts[0]);
  let d = `M${f(sx)} ${f(sy)}`;
  for (let i = 0; i < n; i++) {
    const [qx, qy] = pts[i];
    const [ex, ey] = mid(pts[i], pts[(i + 1) % n]);
    d += ` Q${f(qx)} ${f(qy)} ${f(ex)} ${f(ey)}`;
  }
  return `${d}Z`;
}

export function Blob({ seed }: { seed: number }) {
  return (
    <svg viewBox="-140 -140 280 280" aria-hidden>
      <path d={blobPath(seed)} />
    </svg>
  );
}

export function Burst({ text }: { text: string }) {
  const pts = Array.from({ length: 28 }, (_, i) => {
    const a = (i / 28) * Math.PI * 2;
    const r = i % 2 ? 80 : 100;
    return `${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`;
  }).join(" ");
  return (
    <svg viewBox="-112 -112 224 224" aria-hidden>
      <polygon points={pts} className="burst-shape" strokeWidth="8" strokeLinejoin="round" />
      <text x="0" y="16" textAnchor="middle" className="burst-text">
        {text}
      </text>
    </svg>
  );
}

/** Three hand-drawn arrows pointing up at what's coming, drawn in as `draw` goes 0 → 1. */
export function Arrows({ draw }: { draw: MotionValue<number> }) {
  const pen = { strokeWidth: 12, strokeLinecap: "round", strokeLinejoin: "round", fill: "none", style: { pathLength: draw } } as const;
  return (
    <svg viewBox="0 0 520 210" className="arrows" aria-hidden>
      <g className="s-yellow">
        <motion.path d="M40 200 C80 160 120 120 170 74" {...pen} />
        <motion.path d="M120 70 L172 70 L168 122" {...pen} />
      </g>
      <g className="s-purple">
        <motion.path d="M260 204 V44" {...pen} />
        <motion.path d="M222 86 L260 40 L298 86" {...pen} />
      </g>
      <g className="s-mint">
        <motion.path d="M480 200 C440 160 400 120 350 74" {...pen} />
        <motion.path d="M400 70 L348 70 L352 122" {...pen} />
      </g>
    </svg>
  );
}

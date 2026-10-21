"use client";

import { motion, type MotionStyle, type MotionValue, useTransform } from "motion/react";
import { TANGLE } from "@/lib/content";
import { useChapter } from "@/lib/story";
import { at, length, mix, seg, stops, type Range } from "@/lib/stops";
import { Chapter } from "./ui";

const BEATS = [
  ["draw", 1.3],
  ["look", 0.25],
  ["pull", 1],
  ["signal", 0.8],
  ["flood", 1.1],
  ["rest", 0.1],
] as const;
const B = stops(BEATS);

// The drawing, in its own units: plug on the left, cable, switch, bulb on the right.
const X0 = 110;
const X1 = 800;
const Y = 190;
const BULB = { x: 985, y: 190 };
const N = 220;
const TAGS = [0.16, 0.33, 0.5, 0.67, 0.84] as const; // where each vendor hangs off the cable

/** The cable at `t` (0 plug → 1 switch): knotted when u = 0, straight when u = 1. */
function cable(t: number, u: number) {
  const env = Math.sin(Math.PI * t) ** 0.6; // the ends stay put; the middle is the mess
  const k = 1 - u;
  return {
    x: X0 + (X1 - X0) * t + 58 * Math.sin(2 * Math.PI * 4.5 * t) * env * k,
    y: Y + (92 * Math.sin(2 * Math.PI * 3.2 * t + 0.8) + 30 * Math.sin(2 * Math.PI * 7.3 * t)) * env * k,
  };
}
const path = (u: number) =>
  Array.from({ length: N + 1 }, (_, i) => {
    const { x, y } = cable(i / N, u);
    return `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join("");

// Green chapter: the usual way online is one cable knotted through five vendors. Pull it
// straight, the vendors drop off, a signal runs down it and the light comes on, flooding the page.
export function TangleChapter() {
  const { ref, p } = useChapter();
  const pull = useTransform(p, (v) => seg(v, [B.pull[0], at(B.pull, 0.8)]));
  const d = useTransform(pull, path);
  const drawn = useTransform(p, [at(B.draw, 0.05), at(B.draw, 0.9)], [0, 1]);
  // It opens on the plain green the last chapter dissolved into: the title fades up and the
  // plug and the bulb slide in from either side before the cable draws between them.
  const before = useTransform(p, [0, at(B.draw, 0.12), B.pull[0], at(B.pull, 0.4)], [0, 1, 1, 0]);
  const plugX = useTransform(p, [0, at(B.draw, 0.1)], [-180, 0]);
  const endX = useTransform(p, [0.01, at(B.draw, 0.14)], [180, 0]);
  const arrive = useTransform(p, [0, at(B.draw, 0.08)], [0, 1]);
  const after = useTransform(p, [at(B.pull, 0.4), at(B.pull, 0.8)], [0, 1]);
  const dot = useTransform(p, (v) => seg(v, [B.signal[0], at(B.signal, 0.7)]));
  const dotX = useTransform(dot, (t) => mix(X0, X1, t));
  const dotO = useTransform(p, [B.signal[0], at(B.signal, 0.05), at(B.signal, 0.68), at(B.signal, 0.74)], [0, 1, 1, 0]);
  const lever = useTransform(p, [at(B.signal, 0.68), at(B.signal, 0.8)], [-28, 28]);
  const light = useTransform(p, [at(B.signal, 0.75), at(B.signal, 0.9)], [0, 1]);
  const glow = useTransform(light, [0, 1], [0.6, 1]);
  // On a phone the drawing is wider than the screen: the view follows the cable as it's drawn,
  // then the signal to the bulb (vw; CSS zeroes it on wider screens).
  const pan = useTransform(p, [0, B.draw[1], B.pull[0], B.pull[1], at(B.signal, 0.75)], [45, 0, 0, -20, -52]);

  return (
    <Chapter len={length(BEATS) * 0.6} tone="green" chapterRef={ref} label="The usual way and our way">
      <div className="tangle-title">
        <motion.p style={{ opacity: before }}>{TANGLE.before}</motion.p>
        <motion.p style={{ opacity: after }}>
          {TANGLE.after}
          <span className="caret" />
        </motion.p>
      </div>
      <motion.div className="tangle-pan" style={{ "--pan": pan } as MotionStyle}>
        <svg viewBox="0 0 1060 380" className="tangle" aria-hidden>
          <motion.g style={{ opacity: light, scale: glow }} className="bulb-glow">
            <circle cx={BULB.x} cy={BULB.y} r="110" className="f-yellow-check" />
            {Array.from({ length: 10 }, (_, i) => {
              const a = (i / 10) * Math.PI * 2;
              return (
                <path
                  key={i}
                  d={`M${(BULB.x + Math.cos(a) * 70).toFixed(1)} ${(BULB.y + Math.sin(a) * 70).toFixed(1)}L${(BULB.x + Math.cos(a) * 100).toFixed(1)} ${(BULB.y + Math.sin(a) * 100).toFixed(1)}`}
                  className="s-ink"
                  strokeWidth="7"
                  strokeLinecap="round"
                />
              );
            })}
          </motion.g>
          <motion.path d={d} className="cable-ink" style={{ pathLength: drawn }} />
          <motion.path d={d} className="cable" style={{ pathLength: drawn }} />
          {TAGS.map((t, i) => (
            <VendorTag key={t} t={t} i={i} label={TANGLE.vendors[i]} p={p} drawn={drawn} />
          ))}
          <motion.g style={{ x: plugX, opacity: arrive }}>
            <path d="M100 172H124M100 208H124" className="s-ink" strokeWidth="8" strokeLinecap="round" />
            <rect x="30" y="160" width="74" height="60" rx="14" className="ln f-paper" strokeWidth="6" />
            <text x="67" y="198" textAnchor="middle" className="tangle-you">
              {TANGLE.you}
            </text>
          </motion.g>
          <motion.circle cx={dotX} cy={Y} r="13" className="ln f-mint" strokeWidth="5" style={{ opacity: dotO }} />
          <motion.g style={{ x: endX, opacity: arrive }}>
            <path d={`M${X1} ${Y}H900`} className="cable-ink" />
            <path d={`M${X1} ${Y}H900`} className="cable" />
            <rect x="800" y="150" width="62" height="80" rx="12" className="ln f-cream" strokeWidth="6" />
            <motion.rect x="823" y="142" width="16" height="48" rx="8" className="ln f-ink lever" strokeWidth="4" style={{ rotate: lever }} />
            <rect x="900" y="166" width="40" height="48" rx="6" className="ln f-silver" strokeWidth="6" />
            <path d="M908 166V214M920 166V214M932 166V214" className="s-steel" strokeWidth="4" />
            <circle cx={BULB.x} cy={BULB.y} r="48" className="ln f-cream" strokeWidth="6" />
            <motion.circle cx={BULB.x} cy={BULB.y} r="48" className="ln f-yellow" strokeWidth="6" style={{ opacity: light }} />
            <path d={`M940 180Q965 160 ${BULB.x} 190T1012 190`} className="s-ink" strokeWidth="5" fill="none" strokeLinecap="round" />
          </motion.g>
        </svg>
        <Flood p={p} range={B.flood} />
      </motion.div>
    </Chapter>
  );
}

/** A vendor's paper tag, hanging off the knot; it drops when the cable is pulled straight. */
function VendorTag({ t, i, label, p, drawn }: { t: number; i: number; label: string; p: MotionValue<number>; drawn: MotionValue<number> }) {
  const { x, y } = cable(t, 0);
  const shown = useTransform(drawn, [t - 0.05, t], [0, 1]);
  const drop = useTransform(p, (v) => seg(v, [at(B.pull, 0.05 + i * 0.1), at(B.pull, 0.45 + i * 0.1)]));
  const opacity = useTransform(() => shown.get() * (1 - drop.get()));
  const ty = useTransform(drop, (f) => f * f * 260);
  const rotate = useTransform(drop, (f) => (i % 2 ? 1 : -1) * f * 40);
  const w = label.length * 11 + 26;
  return (
    <motion.g style={{ opacity, y: ty, rotate }}>
      <path d={`M${x} ${y}V${y - 34}`} className="s-cream" strokeWidth="3" />
      <rect x={x - w / 2} y={y - 70} width={w} height="36" rx="6" className="ln f-paper" strokeWidth="4" />
      <text x={x} y={y - 46} textAnchor="middle" className="tangle-tag">
        {label}
      </text>
    </motion.g>
  );
}

/** The light floods out from the bulb in rings until the page is cream: the next chapter's colour. */
function Flood({ p, range }: { p: MotionValue<number>; range: Range }) {
  const rings = ["yellow", "lavender", "cream"].map((tone, i) => ({ tone, r: [at(range, i * 0.16), at(range, 0.6 + i * 0.17)] as Range }));
  return (
    <svg viewBox="0 0 1060 380" className="tangle tangle-flood" aria-hidden>
      {rings.map(({ tone, r }) => (
        <Ring key={tone} tone={tone} p={p} range={r} />
      ))}
    </svg>
  );
}

function Ring({ tone, p, range }: { tone: string; p: MotionValue<number>; range: Range }) {
  // ponytail: 2600 units reaches the far corner from the bulb even on a tall phone; raise it if a corner peeks through
  const r = useTransform(p, (v) => 2600 * seg(v, range) ** 1.6);
  return <motion.circle cx={BULB.x} cy={BULB.y} r={r} className={`ln f-${tone}`} strokeWidth="6" />;
}

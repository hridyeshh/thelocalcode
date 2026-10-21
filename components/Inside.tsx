"use client";

import { motion, type MotionValue, useTransform } from "motion/react";
import type { ReactNode } from "react";
import { INSIDE, STUDIO } from "@/lib/content";
import { useChapter } from "@/lib/story";
import { at, length, stops, type Range } from "@/lib/stops";
import { Chapter } from "./ui";

const BEATS = [
  ["enter", 0.9],
  ["s1", 1],
  ["s2", 1],
  ["s3", 1],
  ["s4", 1.2],
] as const;
const B = stops(BEATS);
const RANGES: Range[] = [B.s1, B.s2, B.s3, B.s4];
// Tag spots (% of the board) and tilts: around the board's edge, a little different each step.
const SPOTS = [
  [16, -6],
  [62, -9],
  [92, 22],
  [6, 56],
  [46, 94],
  [86, 78],
] as const;
const TILTS = [
  [-6, 4, 7, -3, 2, -5],
  [5, -4, 3, -7, -2, 6],
  [-3, 6, -6, 4, 7, -2],
  [4, -6, 2, 6, -4, 3],
] as const;

// The board, in its own units (1000 × 760): our chip in the middle, one chip per step around it.
const MCU = { x: 370, y: 280, w: 260, h: 200 };
const CHIPS = [
  { x: 130, y: 120, up: true, left: true },
  { x: 650, y: 120, up: true, left: false },
  { x: 130, y: 510, up: false, left: true },
  { x: 650, y: 510, up: false, left: false },
] as const;
const CW = 220;
const CH = 130;
/** Four traces from our chip to step i's chip, nested so they never cross: the pin nearest a chip goes to its nearest pin. */
const traces = (i: number) =>
  [0, 1, 2, 3].map((j) => {
    const c = CHIPS[i];
    const y = c.up ? 300 + 20 * j : 460 - 20 * j;
    const x = c.x + 26 + (c.left ? 3 - j : j) * 28;
    return `M${c.left ? MCU.x : MCU.x + MCU.w} ${y}H${x}V${c.up ? c.y + CH : c.y}`;
  });

/**
 * Opacity of step `i`: in at its start, out at its end (the last stays). `shown` keeps the
 * first one on from the very start, for things that arrive with the board instead.
 */
function useStep(p: MotionValue<number>, i: number, shown = false) {
  const [a, b] = RANGES[i];
  const last = RANGES.length - 1;
  return useTransform(p, [a - 0.03, a + 0.03, b - 0.03, b + 0.03], [i === 0 && shown ? 1 : 0, 1, 1, i === last ? 1 : 0]);
}

// "Here's how we're wired": our circuit board. It opens on the empty cream the light flooded the
// page with: the title sticks on, the board rises in with its colour behind it, and then each
// step lights one chip, sends a signal down its traces and swaps the note and the colour.
export function InsideChapter() {
  const { ref, p } = useChapter();
  const rise = useTransform(p, [0.01, at(B.enter, 0.75)], ["75svh", "0svh"]);
  const settle = useTransform(p, [0.01, at(B.enter, 0.75)], [-7, 0]);
  const sunrise = useTransform(p, [0, at(B.enter, 0.85)], ["70svh", "0svh"]);
  return (
    <Chapter id="different" len={length(BEATS) * 0.7} tone="cream" chapterRef={ref} label={`How ${STUDIO} works`}>
      <div className="inside-title">
        <StuckOn p={p} range={[at(B.enter, 0.05), at(B.enter, 0.3)]}>
          <span className="tape">Here&apos;s how</span>
        </StuckOn>
        <StuckOn p={p} range={[at(B.enter, 0.2), at(B.enter, 0.45)]}>
          <span className="tape">
            we&apos;re <em>wired</em>.
          </span>
        </StuckOn>
      </div>
      {INSIDE.map((step, i) => (
        <Note key={step.tone} text={step.note} p={p} i={i} />
      ))}
      <motion.div className="inside-suns" style={{ y: sunrise }}>
        {INSIDE.map((step, i) => (
          <Sun key={step.tone} tone={step.tone} p={p} i={i} />
        ))}
      </motion.div>
      <motion.div className="inside-board" style={{ y: rise, rotate: settle }}>
        <Board />
        {INSIDE.map((step, i) => (
          <Lit key={step.tone} i={i} tone={step.tone} p={p} />
        ))}
        {INSIDE.map((step, i) => (
          <Tags key={step.tone} tags={step.tags} tone={step.tone} p={p} i={i} />
        ))}
      </motion.div>
    </Chapter>
  );
}

/** A title strip pressed onto the page: it drops a little, settles and sticks. */
function StuckOn({ p, range, children }: { p: MotionValue<number>; range: Range; children: ReactNode }) {
  const opacity = useTransform(p, [range[0], range[1]], [0, 1]);
  const y = useTransform(p, [range[0], range[1]], ["-0.5em", "0em"]);
  const scale = useTransform(p, [range[0], range[1]], [1.12, 1]);
  return <motion.p style={{ opacity, y, scale }}>{children}</motion.p>;
}

const pins = (x: number, y: number, n: number, gap: number, w: number, h: number) =>
  Array.from({ length: n }, (_, k) => <rect key={k} x={x + k * gap} y={y} width={w} height={h} className="f-gold" />);

/** The board at rest: traces dim, chips dark. */
function Board() {
  return (
    <svg viewBox="0 0 1000 760" className="part" role="img" aria-label={`A circuit board: the ${STUDIO} chip wired to four others`}>
      <rect x="20" y="20" width="960" height="720" rx="48" className="ln f-board" strokeWidth="8" />
      <rect x="54" y="54" width="892" height="652" rx="30" className="s-silk" strokeWidth="3" strokeDasharray="10 12" fill="none" />
      {[
        [76, 76],
        [924, 76],
        [76, 684],
        [924, 684],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="18" className="f-cavity s-gold" strokeWidth="6" />
      ))}
      {INSIDE.map((_, i) => traces(i).map((d) => <path key={d} d={d} className="trace" fill="none" />))}
      <rect x={MCU.x} y={MCU.y} width={MCU.w} height={MCU.h} rx="16" className="ln f-ink" strokeWidth="5" />
      {pins(MCU.x + 18, MCU.y - 14, 12, 20, 10, 14)}
      {pins(MCU.x + 18, MCU.y + MCU.h, 12, 20, 10, 14)}
      <text x="500" y="378" textAnchor="middle" className="board-name">
        {STUDIO}
      </text>
      <text x="500" y="420" textAnchor="middle" className="silk">
        TWO PEOPLE · BENGALURU
      </text>
      {CHIPS.map((c, i) => (
        <g key={INSIDE[i].chip}>
          <rect x={c.x} y={c.y} width={CW} height={CH} rx="12" className="ln f-ink" strokeWidth="5" />
          {pins(c.x + 20, c.y - 12, 7, 28, 12, 12)}
          {pins(c.x + 20, c.y + CH, 7, 28, 12, 12)}
          <text x={c.x + CW / 2} y={c.y + CH / 2 + 12} textAnchor="middle" className="chip-name">
            {INSIDE[i].chip}
          </text>
          <text x={c.x + 14} y={c.y + 26} className="silk">
            U{i + 2}
          </text>
          <circle cx={c.x + CW - 22} cy={c.y + 24} r="11" className="f-steel" />
        </g>
      ))}
    </svg>
  );
}

/** Step `i` switched on: its chip outlined in its colour, its light on, signal down its traces. */
function Lit({ i, tone, p }: { i: number; tone: string; p: MotionValue<number> }) {
  const c = CHIPS[i];
  return (
    <motion.svg viewBox="0 0 1000 760" className={`part lit lit-${tone}`} style={{ opacity: useStep(p, i) }} aria-hidden>
      {traces(i).map((d) => (
        <path key={d} d={d} className="trace-on" fill="none" />
      ))}
      {traces(i).map((d) => (
        <path key={`s${d}`} d={d} className="signal" strokeWidth="4" fill="none" />
      ))}
      <rect x={c.x - 6} y={c.y - 6} width={CW + 12} height={CH + 12} rx="16" className="lit-ring" fill="none" strokeWidth="8" />
      <circle cx={c.x + CW - 22} cy={c.y + 24} r="24" className="lit-glow" />
      <circle cx={c.x + CW - 22} cy={c.y + 24} r="11" className="lit-led" />
    </motion.svg>
  );
}

function Sun({ tone, p, i }: { tone: string; p: MotionValue<number>; i: number }) {
  const o = useStep(p, i, true); // the first colour rises in with the board
  const scale = useTransform(o, [0, 1], [0.86, 1 + i * 0.05]);
  return <motion.div className={`inside-sun sun-${tone}`} style={{ opacity: o, scale }} />;
}

function Note({ text, p, i }: { text: string; p: MotionValue<number>; i: number }) {
  return (
    <motion.p className="inside-note" style={{ opacity: useStep(p, i) }}>
      {text}
    </motion.p>
  );
}

function Tags({ tags, tone, p, i }: { tags: readonly string[]; tone: string; p: MotionValue<number>; i: number }) {
  const o = useStep(p, i);
  const y = useTransform(o, [0, 1], ["3%", "0%"]);
  return (
    <motion.ul className={`inside-tags tag-${tone}`} style={{ opacity: o, y }}>
      {tags.map((c, k) => (
        <li key={c} style={{ left: `${SPOTS[k][0]}%`, top: `${SPOTS[k][1]}%`, rotate: `${TILTS[i][k]}deg` }}>
          {c}
        </li>
      ))}
    </motion.ul>
  );
}

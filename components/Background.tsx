"use client";

import { motion, type MotionValue, useMotionValueEvent, useTransform } from "motion/react";
import { useRef } from "react";
import { NOTES } from "@/lib/content";
import { DISSOLVE, rand } from "@/lib/pixel";
import { useChapter } from "@/lib/story";
import { at, length, seg, stops, type Range } from "@/lib/stops";
import { Mac, useMacScene } from "./Mac";
import { Chapter, Typer, usePast } from "./ui";

const BEATS = [["zoom", 1.4], ["type", 0.6], ["notes", 1.6], ["dissolve", 1]] as const;
const B = stops(BEATS);

// Back out of the screen: the computer sits on its own while the work gets done, the
// notifications pop up on it, then the page dissolves pixel by pixel into green.
export function BackgroundChapter() {
  const { ref, p } = useChapter();
  const style = useMacScene(() => 1 - seg(p.get(), B.zoom));
  const typing = usePast(p, at(B.zoom, 0.85));
  const glow = useTransform(p, [0, at(B.zoom, 0.4)], [1, 0]); // white to the edges, like the last chapter's end
  return (
    <Chapter len={length(BEATS) * 0.6} tone="purple" chapterRef={ref} label="What happens after you hire us">
      <p className="bg-title">
        <Typer text="We handle the boring parts and come back with a live site" on={typing} />
      </p>
      <Mac className="scene-mac" style={style} alt="The computer, getting your site live">
        <motion.div className="screen-glow" style={{ opacity: glow }} />
        <ol className="notes">
          {NOTES.map((note, i) => (
            <Note key={note.title} note={note} p={p} range={[at(B.notes, i / NOTES.length), at(B.notes, (i + 0.5) / NOTES.length)]} />
          ))}
        </ol>
      </Mac>
      <PixelDissolve p={p} range={B.dissolve} />
    </Chapter>
  );
}

function Note({ note, p, range }: { note: (typeof NOTES)[number]; p: MotionValue<number>; range: Range }) {
  const o = useTransform(p, [range[0], range[1]], [0, 1]);
  const y = useTransform(p, [range[0], range[1]], ["30%", "0%"]);
  return (
    <motion.li className="note" style={{ opacity: o, y }}>
      <span className="note-icon" aria-hidden>
        {note.icon}
      </span>
      <span>
        <b>{note.title}</b>
        <br />
        {note.sub}
      </span>
    </motion.li>
  );
}

/** Green rises from the bottom in chunky pixels, with a sparkly edge (Parker's transition). */
function PixelDissolve({ p, range }: { p: MotionValue<number>; range: Range }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useMotionValueEvent(p, "change", (v) => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const rows = 30;
    const cols = Math.round((rows * window.innerWidth) / window.innerHeight);
    if (canvas.width !== cols) {
      canvas.width = cols;
      canvas.height = rows;
    }
    const q = Math.max(0, (v - range[0]) / (range[1] - range[0])) * 1.1;
    ctx.clearRect(0, 0, cols, rows);
    if (q <= 0) return;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const threshold = (1 - r / (rows - 1)) * 0.7 + rand(i) * 0.3; // bottom rows go first
        if (threshold < q) ctx.fillStyle = DISSOLVE.fill;
        else if (threshold < q + 0.07) ctx.fillStyle = DISSOLVE.sparks[i % 3];
        else continue;
        ctx.fillRect(c, r, 1, 1);
      }
    }
  });
  return <canvas ref={ref} className="dissolve" aria-hidden />;
}

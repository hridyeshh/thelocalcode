"use client";

import { motion, type MotionValue, useTransform } from "motion/react";
import { STEPS } from "@/lib/content";
import { useChapter } from "@/lib/story";
import { at, length, seg, stops, type Range } from "@/lib/stops";
import { Arrows } from "./svg";
import { Chapter, Typer, usePast } from "./ui";

const BEATS = [["intro", 1.1], ["s1", 1.2], ["s2", 1.2], ["s3", 1.3], ["fade", 0.6]] as const;
const B = stops(BEATS);
const RANGES: Range[] = [B.s1, B.s2, B.s3];

// "Let us show you how" on white, then three folders slide up and stack, tabs side by side,
// like Parker's steps. The page warms to cream behind them.
export function ProcessChapter() {
  const { ref, p } = useChapter();
  const draw = useTransform(p, [at(B.intro, 0.3), at(B.intro, 0.85)], [0, 1]);
  const arrows = useTransform(draw, [0, 0.04], [0, 1]); // round caps would show as dots before the stroke starts
  const intro = useTransform(p, [at(B.s1, 0.2), at(B.s1, 0.6)], [1, 0]);
  const introY = useTransform(p, [B.s1[0], at(B.s1, 0.7)], ["0svh", "-10svh"]);
  const cream = useTransform(p, [at(B.s1, 0.1), at(B.s1, 0.6)], [0, 1]);
  const white = useTransform(p, [B.fade[0], at(B.fade, 0.85)], [0, 1]); // all white a moment before the cut
  const typing = usePast(p, 0.02);
  return (
    <Chapter id="process" len={length(BEATS) * 0.62} tone="paper" chapterRef={ref} label="How we work">
      <motion.div className="wash wash-cream" style={{ opacity: cream }} />
      <motion.div className="process-intro" style={{ opacity: intro, y: introY }}>
        <p className="process-title">
          <Typer text="Let us show you how" on={typing} />
        </p>
        <motion.div style={{ opacity: arrows }}>
          <Arrows draw={draw} />
        </motion.div>
      </motion.div>
      {STEPS.map((step, i) => (
        <Folder key={step.tab} step={step} i={i} p={p} range={RANGES[i]} />
      ))}
      <motion.div className="white-layer" style={{ opacity: white }} />
    </Chapter>
  );
}

function Folder({ step, i, p, range }: { step: (typeof STEPS)[number]; i: number; p: MotionValue<number>; range: Range }) {
  const y = useTransform(p, (v) => `${(1 - seg(v, [range[0], at(range, 0.72)])) * 100}svh`);
  return (
    <motion.article className={`folder folder-${step.tone}`} style={{ y }}>
      <h2 className="folder-tab">
        <span className="folder-n">{step.n}</span>
        {step.tab}
      </h2>
      <div className="folder-body">
        <div className="folder-copy">
          <p className="folder-lead">{step.lead}</p>
          <p>
            {step.lines.map((l) => (
              <span key={l}>
                {l}
                <br />
              </span>
            ))}
          </p>
          <p>
            {step.close.map((l) => (
              <span key={l}>
                {l}
                <br />
              </span>
            ))}
          </p>
        </div>
        <div className={`folder-visual check-${step.tone}`} aria-hidden>
          <Visual i={i} />
        </div>
      </div>
    </motion.article>
  );
}

/** A small picture of each step, drawn as UI rather than as illustration. */
function Visual({ i }: { i: number }) {
  if (i === 0)
    return (
      <div className="mock">
        <p className="mock-head">
          Discovery call <span className="mock-pill">45 min</span>
        </p>
        <ul className="mock-checks">
          <li>Who buys from you</li>
          <li>Why they pick you</li>
          <li>What isn&apos;t working</li>
          <li>Who you&apos;re up against</li>
        </ul>
        <div className="mock-notes">
          <span className="sticky sticky-yellow">“Most people find us on Instagram.”</span>
          <span className="sticky sticky-pink">Rivals&apos; sites, side by side</span>
        </div>
      </div>
    );
  if (i === 1)
    return (
      <div className="mock mock-brand">
        <div className="mock-logo">Yb</div>
        <div>
          <p className="mock-label">Colours</p>
          <div className="mock-swatches">
            <span />
            <span />
            <span />
            <span />
          </div>
          <p className="mock-label">Type</p>
          <p className="mock-type">
            <span className="mock-serif">Aa</span>
            <span>Aa</span>
          </p>
        </div>
        <div className="mock-page">
          <span className="mock-bar mock-bar-lg" />
          <span className="mock-bar" />
          <span className="mock-btn">Book a table</span>
        </div>
      </div>
    );
  return (
    <div className="mock mock-live">
      <p className="mock-url">
        <span className="mock-lock" />
        yourbusiness.in
        <span className="mock-live-pill">● Live</span>
      </p>
      <div className="mock-page">
        <span className="mock-bar mock-bar-lg" />
        <span className="mock-bar" />
        <span className="mock-bar mock-bar-sm" />
        <span className="mock-btn">Get in touch</span>
      </div>
      <p className="mock-toast">
        <b>New enquiry on WhatsApp</b>
        <br />
        “Can we start next week?”
      </p>
    </div>
  );
}

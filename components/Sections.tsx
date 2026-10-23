"use client";

import { motion, type MotionValue, useTransform } from "motion/react";
import { PLANS, QUOTES } from "@/lib/content";
import { useChapter, useViewport } from "@/lib/story";
import { at, length, seg, stops, type Range } from "@/lib/stops";
import { FloppyRig } from "./Floppy";
import { Mac, useMacScene } from "./Mac";
import { Burst, PixelDuo, PixelFloppy } from "./svg";
import { Chapter, Marquee, Typer, usePast } from "./ui";

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.3 },
} as const;
const ease = [0.22, 1, 0.36, 1] as const;

export function Ribbon() {
  return (
    <div className="ribbon" aria-hidden>
      <Marquee>
        {Array.from({ length: 4 }, (_, i) => (
          <span key={i} className="ribbon-item">
            Built by two people who actually ship <span className="ribbon-star">✸</span>
          </span>
        ))}
      </Marquee>
    </div>
  );
}

export function Plans() {
  return (
    <section id="plans" className="plans" aria-labelledby="plans-title">
      <div className="plans-panel">
        <div className="plans-head">
          <h2 id="plans-title">
            <span className="tape">Packages built for</span>
            <br />
            <span className="tape">
              <em>founders</em> and <em>local businesses</em>.
            </span>
          </h2>
          <p>Every project is different, so there&apos;s no price list. Tell us what you need and we&apos;ll quote it on a call.</p>
        </div>
        <div className="plans-grid">
          <motion.div className="plan plan-included" {...reveal} transition={{ duration: 0.6, ease }}>
            <p className="plan-for">In every package</p>
            <h3>What&apos;s included</h3>
            <ul className="ticks">
              {PLANS.included.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </motion.div>
          {PLANS.tiers.map((t, i) => (
            <motion.div key={t.name} className={`plan plan-${t.tone}`} {...reveal} transition={{ duration: 0.6, ease, delay: 0.08 * (i + 1) }}>
              <p className="plan-for">{t.for}</p>
              <h3>{t.name}</h3>
              <p className="plan-line">{t.line}</p>
              <a href="#contact" className="btn btn-ink plan-cta">
                Book a call →
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Proof() {
  const half = Math.ceil(QUOTES.length / 2);
  const card = (q: (typeof QUOTES)[number], i: number) => (
    <figure key={q.text} className={i % 3 === 1 ? "quote quote-cream" : "quote"}>
      <blockquote>“{q.text}”</blockquote>
      <figcaption>
        <b>{q.who}</b>
        <span>{q.role}</span>
      </figcaption>
    </figure>
  );
  return (
    <section className="proof" aria-labelledby="proof-title">
      <div className="proof-head">
        <h2 id="proof-title">
          <span className="tape">Don&apos;t take our</span>
          <br />
          <span className="tape">
            <em>word for it.</em>
          </span>
        </h2>
        <p>
          What people say after
          <br />
          we&apos;ve worked together.
        </p>
      </div>
      <Marquee>{QUOTES.slice(0, half).map(card)}</Marquee>
      <Marquee reverse>{QUOTES.slice(half).map((q, i) => card(q, i + 1))}</Marquee>
    </section>
  );
}

const CTA = [
  ["rise", 1],
  ["hold", 0.5],
  ["eject", 1.5],
  ["rest", 0.3],
] as const;
const C = stops(CTA);
const STICKERS = [
  { text: "OK!", tone: "yellow", left: "18%", top: "70%", tilt: -14, at: 0.2 },
  { text: "WOW", tone: "lavender", left: "80%", top: "74%", tilt: 12, at: 0.35 },
  { text: "</>", tone: "mint", left: "74%", top: "44%", tilt: -6, at: 0.5 },
  { text: "✦", tone: "pink", left: "27%", top: "46%", tilt: 8, at: 0.65 },
] as const;

// Green finale: the computer rises with the two of us cheering on its screen. Then the hand
// from the start comes back and takes the floppy out, and the computer asks for yours.
export function Cta() {
  const { ref, p } = useChapter();
  const { h: vh } = useViewport();
  const style = useMacScene(
    () => 0,
    () => (1 - seg(p.get(), [0, at(C.rise, 0.9)])) * 0.85 * vh.get(),
  );
  const copy = useTransform(p, [0, at(C.rise, 0.4)], [0, 1]);
  const eject = useTransform(p, [C.eject[0], at(C.eject, 0.94)], [1, 0]);
  const cheer = useTransform(p, [at(C.eject, 0.08), at(C.eject, 0.14)], [1, 0]);
  const empty = useTransform(p, [at(C.eject, 0.14), at(C.eject, 0.2)], [0, 1]);
  const asking = usePast(p, at(C.eject, 0.18));
  return (
    <Chapter id="hire" len={length(CTA) * 0.8} tone="green" chapterRef={ref} label="Work with us" first>
      <motion.div className="cta-left" style={{ opacity: copy }}>
        <p>
          <span className="tape">Ready for a website</span>
        </p>
        <p>
          <span className="tape">
            <em>people trust?</em>
          </span>
        </p>
      </motion.div>
      <motion.div className="cta-right" style={{ opacity: copy }}>
        <p>Three websites shipped. A desk gadget that works. Two more on the bench.</p>
        <p>Now your business gets the same care.</p>
        <a href="#contact" className="btn btn-mint">
          Work with us ↓
        </a>
      </motion.div>
      {STICKERS.map((s) => (
        <Sticker key={s.text} s={s} p={p} range={[at(C.rise, s.at), at(C.rise, s.at + 0.25)]} />
      ))}
      <Mac className="scene-mac" style={style} alt="The computer, with the two of us cheering on its screen" outside={<FloppyRig t={eject} eject />}>
        <motion.div className="mac-center" style={{ opacity: cheer }}>
          <PixelDuo pose="cheer" />
        </motion.div>
        <motion.div className="mac-center insert-disk" style={{ opacity: empty }}>
          <span className="insert-icon">
            <PixelFloppy />
            <span className="insert-q">?</span>
          </span>
          <p>
            <Typer text="Your turn." on={asking} />
          </p>
        </motion.div>
      </Mac>
    </Chapter>
  );
}

function Sticker({ s, p, range }: { s: (typeof STICKERS)[number]; p: MotionValue<number>; range: Range }) {
  const scale = useTransform(p, [range[0], range[1]], [0, 1]);
  const rotate = useTransform(p, [range[0], range[1]], [s.tilt - 40, s.tilt]);
  return (
    <motion.div className={`sticker sticker-${s.tone}`} style={{ left: s.left, top: s.top, scale, rotate }} aria-hidden>
      <Burst text={s.text} />
    </motion.div>
  );
}

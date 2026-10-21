"use client";

import { type CSSProperties, type ReactNode, type RefObject, useEffect, useState } from "react";
import { motion, type MotionStyle, type MotionValue, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import { rand } from "@/lib/pixel";

/**
 * A tall section whose stage stays pinned while `len` screens of scrolling play it.
 * Back-to-back chapters overlap by a screen (.joined), so there's no screen of scrolling
 * where one stage pushes the other off: the next stage stays hidden until it pins, then
 * cuts in over the last frame of this one, which is drawn to match it.
 */
export function Chapter({
  id,
  len,
  tone,
  chapterRef,
  label,
  first,
  children,
}: {
  id?: string;
  len: number;
  tone: "cream" | "paper" | "purple" | "green";
  chapterRef: RefObject<HTMLElement | null>;
  label: string;
  /** Not straight after another chapter: scrolls in like a normal section. */
  first?: boolean;
  children: ReactNode;
}) {
  const { scrollYProgress } = useScroll({ target: chapterRef, offset: ["start start", "end end"] });
  const visibility = useTransform(scrollYProgress, (v) => (first || v > 0 ? "visible" : "hidden"));
  return (
    <section
      id={id}
      ref={chapterRef}
      aria-label={label}
      className={`chapter tone-${tone}${first ? "" : " joined"}`}
      style={{ "--len": len } as CSSProperties}
    >
      <motion.div className="stage" style={{ visibility }}>
        {children}
      </motion.div>
    </section>
  );
}

/** True once the story passes `at`; false again if you scroll back above it. */
export function usePast(p: MotionValue<number>, at: number) {
  const [past, setPast] = useState(false);
  useMotionValueEvent(p, "change", (v) => setPast(v >= at));
  useEffect(() => setPast(p.get() >= at), [p, at]);
  return past;
}

// A typist's rhythm: quick letters, a beat after a space, a breath after punctuation.
const pause = (c: string, i: number) => (/[.,?!]/.test(c) ? 260 : c === " " ? 80 : 34 + 30 * rand(i));

/** How many letters of `text` are typed so far: counts up while `on`, back to 0 when not. */
function useTyped(text: string, on: boolean) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!on) return setN(0);
    let i = 0;
    let id = 0;
    const next = () => {
      setN(++i);
      if (i < text.length) id = window.setTimeout(next, pause(text[i - 1], i));
    };
    id = window.setTimeout(next, 140);
    return () => clearTimeout(id);
  }, [text, on]);
  return n;
}

/**
 * Types itself out like a typewriter while `on`: letters land one at a time and the caret
 * rides after the last one. Untyped letters are laid out but hidden, so lines never reflow.
 */
export function Typer({ text, on }: { text: string; on: boolean }) {
  const n = useTyped(text, on);
  return (
    <span className={on ? "typer on" : "typer"}>
      <span className="sr">{text}</span>
      <span aria-hidden>
        {text.slice(0, n)}
        <span className="caret" />
        <span className="typer-rest">{text.slice(n)}</span>
      </span>
    </span>
  );
}

export function Rotator({ words }: { words: readonly string[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % words.length), 1800);
    return () => clearInterval(id);
  }, [words.length]);
  return (
    <span className="chip-rot" key={i}>
      {words[i]}
    </span>
  );
}

export function Marquee({ children, reverse }: { children: ReactNode; reverse?: boolean }) {
  return (
    <div className="marquee">
      <div className={reverse ? "marquee-track rev" : "marquee-track"}>
        <div className="marquee-set">{children}</div>
        <div className="marquee-set" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}

export const pct = (f: number) => `${f * 100}%`;

/**
 * An engineering callout: a numbered dot on the part, a leader line, and what it is.
 * Place it with motion x/y at the part's point on screen.
 */
export function Callout({ n, title, detail, style }: { n: number; title: string; detail: string; style: MotionStyle }) {
  return (
    <motion.p className="callout" style={style}>
      <span className="callout-dot" aria-hidden>
        {n}
      </span>
      <span className="callout-text">
        <b>{title}</b> {detail}
      </span>
    </motion.p>
  );
}

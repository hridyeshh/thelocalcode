"use client";

import { useEffect, useRef } from "react";
import { useMotionValue, useScroll, useSpring } from "motion/react";

/** Scroll progress (0–1) through a tall chapter, spring-smoothed the way Framer sites feel. */
export function useChapter() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  // ponytail: one spring for every chapter; raise stiffness if scrubbing feels laggy
  const p = useSpring(scrollYProgress, { stiffness: 170, damping: 34, mass: 0.35, restDelta: 0.00005 });
  return { ref, p };
}

/** Viewport size as motion values, for transforms that depend on it. */
export function useViewport() {
  const w = useMotionValue(1440);
  const h = useMotionValue(900);
  useEffect(() => {
    const set = () => {
      w.set(window.innerWidth);
      h.set(window.innerHeight);
    };
    set();
    window.addEventListener("resize", set);
    return () => window.removeEventListener("resize", set);
  }, [w, h]);
  return { w, h };
}

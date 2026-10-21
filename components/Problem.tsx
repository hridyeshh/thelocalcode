"use client";

import { motion, useTransform } from "motion/react";
import { INTRO, ORBIT_ICONS, PROBLEM_ROTATOR } from "@/lib/content";
import { useChapter, useViewport } from "@/lib/story";
import { seg } from "@/lib/stops";
import { introType, Mac, useMacScene } from "./Mac";
import { PixelDuo } from "./svg";
import { Chapter, Marquee, Rotator, Typer, usePast } from "./ui";

// Purple chapter: the problem, while the computer rises and puzzles over it. Then the camera
// leans in and dives through its screen, which types the next chapter's first line as it
// comes; that chapter opens on the same line, so the dive and the cut read as one shot.
export function Problem() {
  const { ref, p } = useChapter();
  const { w: vw, h: vh } = useViewport();
  const style = useMacScene(
    () => 0.14 * seg(p.get(), [0.28, 0.44]) + 0.86 * seg(p.get(), [0.44, 0.96]),
    () => (1 - seg(p.get(), [0, 0.14])) * 0.8 * vh.get(),
  );
  const left = useTransform(p, [0.005, 0.05, 0.38, 0.44], [0, 1, 1, 0]);
  const right = useTransform(p, [0.02, 0.07, 0.38, 0.44], [0, 1, 1, 0]);
  const orbit = useTransform(p, [0.01, 0.07, 0.38, 0.44], [0, 1, 1, 0]);
  const think = useTransform(p, [0.42, 0.48], [1, 0]);
  const glow = useTransform(p, [0.6, 0.94], [0, 1]); // the screen's inner shadow fades as it fills the view
  const fontSize = useTransform(() => {
    const t = introType(vw.get(), vh.get());
    return `${(t.F / t.Z) * 100}cqw`;
  });
  const width = useTransform(() => {
    const t = introType(vw.get(), vh.get());
    return `${(t.W / t.Z) * 100}cqw`;
  });
  const typing = usePast(p, 0.47);

  return (
    <Chapter len={4} tone="purple" chapterRef={ref} label="Why trust is hard">
      <motion.div className="orbit" style={{ opacity: orbit }} aria-hidden>
        <Marquee>
          {ORBIT_ICONS.map((icon) => (
            <span key={icon} className="icon-tile">
              {icon}
            </span>
          ))}
        </Marquee>
      </motion.div>
      <motion.div className="problem-left" style={{ opacity: left }}>
        <p>
          <span className="tape">Getting a website is easy.</span>
        </p>
        <p>
          <span className="tape">
            Getting one people <em>trust</em>
          </span>
        </p>
        <p>
          <span className="tape">is hard.</span>
        </p>
      </motion.div>
      <motion.div className="problem-right" style={{ opacity: right }}>
        <p>Trust doesn&apos;t come from templates.</p>
        <p>
          It comes from <Rotator words={PROBLEM_ROTATOR} />
        </p>
        <p>
          That&apos;s called branding.
          <br />
          And most people skip it.
        </p>
      </motion.div>
      <Mac className="scene-mac" style={style} alt="A beige computer, thinking">
        <motion.div className="mac-center" style={{ opacity: think }}>
          <PixelDuo pose="think" />
        </motion.div>
        <motion.div className="screen-glow" style={{ opacity: glow }} />
        <div className="mac-center">
          <motion.p className="intro-line" style={{ fontSize, width }}>
            <Typer text={INTRO} on={typing} />
          </motion.p>
        </div>
      </Mac>
    </Chapter>
  );
}

"use client";

import { motion, type MotionStyle, useTransform } from "motion/react";
import type { ReactNode } from "react";
import art from "@/lib/art.json";
import { useViewport } from "@/lib/story";
import { type Box, intoScreen, OVERSHOOT } from "@/lib/stops";
import { pct } from "./ui";

export const MAC = art.mac;
export const MAC_SCREEN = art.mac.screens[0];
/** transform-origin at the screen's centre, for zooming into it. */
export const MAC_ORIGIN = `${pct(MAC_SCREEN.x + MAC_SCREEN.w / 2)} ${pct(MAC_SCREEN.y + MAC_SCREEN.h / 2)}`;
const SCREEN_ASPECT = (MAC_SCREEN.w * MAC.w) / (MAC_SCREEN.h * MAC.h);

/**
 * The line the camera dives into on the computer's screen ("Here's what we've built"): F px
 * type wrapping at W px once zoomed all the way in, where the screen is Z px wide. The next
 * chapter opens on the same line at F and W, so the cut between them can't be seen.
 */
export function introType(vw: number, vh: number) {
  const F = Math.min(70, Math.max(34, 0.048 * vw));
  return { F, W: Math.min(0.86 * vw, 15 * F), Z: OVERSHOOT * Math.max(vw, vh * SCREEN_ASPECT) };
}

/** The beige computer that tells the story, with live content laid over its screen. */
export function Mac({ className, style, alt = "", children, outside }: {
  className?: string;
  style?: MotionStyle;
  alt?: string;
  children?: ReactNode;
  /** Things drawn on the case rather than the screen (the floppy, the hint). */
  outside?: ReactNode;
}) {
  return (
    <motion.div className={`mac ${className ?? ""}`} style={style}>
      <img src="/art/mac.webp" alt={alt} className="mac-img" width={MAC.w} height={MAC.h} />
      <div className="mac-screen" style={{ left: pct(MAC_SCREEN.x), top: pct(MAC_SCREEN.y), width: pct(MAC_SCREEN.w), height: pct(MAC_SCREEN.h) }}>
        {children}
      </div>
      {outside}
    </motion.div>
  );
}

/** Where the computer rests when it's a scene's subject: centred, its base just past the fold. */
function rest(vw: number, vh: number): Box {
  const h = Math.min(0.64 * vh, (0.86 * vw * MAC.h) / MAC.w);
  const w = (h * MAC.w) / MAC.h;
  return { x: (vw - w) / 2, y: vh - 0.93 * h, w, h };
}

/**
 * Style for the computer at rest, pushed into its screen by `zoom()` (0 rest, 1 screen fills
 * the view) and raised by `lift()` px. Both are read inside motion's tracking, so pass
 * closures over chapter progress.
 */
export function useMacScene(zoom: () => number, lift: () => number = () => 0): MotionStyle {
  const { w: vw, h: vh } = useViewport();
  // One value from the viewport and progress; everything below reads only it (reading both a
  // source and something derived from it goes stale when the viewport changes).
  const m = useTransform(() => {
    const box = rest(vw.get(), vh.get());
    return { box, z: intoScreen(box, MAC_SCREEN, vw.get(), vh.get(), zoom()), lift: lift() };
  });
  return {
    left: useTransform(() => m.get().box.x),
    top: useTransform(() => m.get().box.y),
    width: useTransform(() => m.get().box.w),
    height: useTransform(() => m.get().box.h),
    x: useTransform(() => m.get().z.x),
    y: useTransform(() => m.get().z.y + m.get().lift),
    scale: useTransform(() => m.get().z.scale),
    transformOrigin: MAC_ORIGIN,
  };
}

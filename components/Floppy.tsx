"use client";

import { motion, type MotionValue, useTransform } from "motion/react";
import art from "@/lib/art.json";
import { DISK, EYE, floppyPose, MAC_H, SLOT } from "@/lib/floppy";
import { FloppyDisk } from "./parts";

const HAND = art.hand;
const HAND_W = 50; // in the computer's units (it is 100 wide); a hand about twice the disk
const cq = (v: number) => `${v}cqw`;

/**
 * The hand feeding the computer its floppy (t 0 → 1), or taking it back out (1 → 0), as one
 * continuous move: the disk is a real plane tipped in CSS 3D and clipped where it passes the
 * slot; the hand is pinned to the spot its thumb presses. Goes in <Mac outside>, so every
 * length is in the computer's units (1cqw = 1% of its width).
 */
export function FloppyRig({ t }: { t: MotionValue<number> }) {
  const pose = useTransform(t, floppyPose);
  const transform = useTransform(() => {
    const q = pose.get();
    return `translate3d(${cq(q.x)}, ${cq(q.y)}, ${cq(q.z)}) rotateZ(${q.rz}deg) rotateX(${q.rx}deg)`;
  });
  const clipPath = useTransform(() => (pose.get().clip ? `inset(${(SLOT.top / MAC_H) * 100}% 0 0 0)` : "none"));
  const seated = useTransform(() => pose.get().seated);
  const x = useTransform(() => cq(pose.get().hand.x));
  const y = useTransform(() => cq(pose.get().hand.y));
  const scale = useTransform(() => pose.get().hand.s);
  const rotate = useTransform(() => pose.get().hand.r);
  return (
    <div className="floppy-rig" aria-hidden>
      <motion.div className="disk-view" style={{ clipPath, perspective: cq(EYE.d), perspectiveOrigin: `${cq(EYE.x)} ${cq(EYE.y)}` }}>
        <motion.div className="disk" style={{ transform, left: cq(-DISK.w / 2), top: cq(-DISK.h), width: cq(DISK.w), height: cq(DISK.h) }}>
          <FloppyDisk />
        </motion.div>
      </motion.div>
      <motion.span
        className="disk-seated"
        style={{ opacity: seated, left: cq(SLOT.x + SLOT.w / 2 - DISK.w / 2), top: cq(SLOT.mid - 0.3), width: cq(DISK.w) }}
      />
      <motion.img
        src="/art/hand.webp"
        alt=""
        className="hand"
        width={HAND.w}
        height={HAND.h}
        style={{
          x,
          y,
          scale,
          rotate,
          width: cq(HAND_W),
          left: cq(-HAND.grip.x * HAND_W),
          top: cq((-HAND.grip.y * HAND_W * HAND.h) / HAND.w),
          transformOrigin: `${HAND.grip.x * 100}% ${HAND.grip.y * 100}%`,
        }}
      />
    </div>
  );
}

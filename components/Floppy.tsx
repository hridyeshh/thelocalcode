"use client";

import { motion, type MotionValue, useTransform } from "motion/react";
import art from "@/lib/art.json";
import { CX, DISK, EYE, floppyPose, MAC_H, type Pose, type PoseName, POSES, SLOT } from "@/lib/floppy";
import { FloppyDisk } from "./parts";

const HANDS = art.hands;
const K = DISK.w / HANDS.disk; // the computer's units per pixel of the hand drawings: their disk is the size of ours
const cq = (v: number) => `${v}cqw`;

/**
 * The hand feeding the computer its floppy (t 0 → 1), or taking it back out (`eject`, 1 → 0).
 * The hand is three drawings swapped mid-move, each pinned where it touches the disk; at the
 * slot the disk is a real plane tipped in CSS 3D and clipped where it passes the slot. Goes in
 * <Mac outside>, so every length is in the computer's units (1cqw = 1% of its width).
 */
export function FloppyRig({ t, eject = false }: { t: MotionValue<number>; eject?: boolean }) {
  const pose = useTransform(t, (v) => floppyPose(v, eject));
  const transform = useTransform(() => `translate3d(${cq(CX)}, ${cq(SLOT.mid)}, ${cq(pose.get().z)}) rotateX(${pose.get().rx}deg)`);
  const disk = useTransform(() => (pose.get().disk ? 1 : 0));
  const clipPath = useTransform(() => (pose.get().clip ? `inset(${(SLOT.top / MAC_H) * 100}% 0 0 0)` : "none"));
  const seated = useTransform(() => pose.get().seated);
  const x = useTransform(() => cq(pose.get().hand.x));
  const y = useTransform(() => cq(pose.get().hand.y));
  const rotate = useTransform(() => pose.get().hand.r);
  const scale = useTransform(() => pose.get().hand.s);
  return (
    <div className="floppy-rig" aria-hidden>
      <motion.div className="disk-view" style={{ opacity: disk, clipPath, perspective: cq(EYE.d), perspectiveOrigin: `${cq(EYE.x)} ${cq(EYE.y)}` }}>
        <motion.div className="disk" style={{ transform, left: cq(-DISK.w / 2), top: cq(-DISK.h), width: cq(DISK.w), height: cq(DISK.h) }}>
          <FloppyDisk />
        </motion.div>
      </motion.div>
      <motion.span className="disk-seated" style={{ opacity: seated, left: cq(CX - DISK.w / 2), top: cq(SLOT.mid - 0.3), width: cq(DISK.w) }} />
      <motion.div className="hand" style={{ x, y, rotate, scale }}>
        {POSES.map((name) => (
          <Drawing key={name} name={name} pose={pose} />
        ))}
      </motion.div>
    </div>
  );
}

/** One drawing of the hand, its pin on the hand's origin. Its sleeve runs on out of view. */
function Drawing({ name, pose }: { name: PoseName; pose: MotionValue<Pose> }) {
  const d = HANDS[name];
  const w = d.w * K;
  const h = d.h * K;
  const opacity = useTransform(() => (pose.get().hand.pose === name ? 1 : 0));
  return (
    <motion.div className="hand-pose" style={{ opacity, left: cq(-d.pin.x * w), top: cq(-d.pin.y * h), width: cq(w) }}>
      <img src={`/art/hand-${name}.webp`} alt="" width={d.w} height={d.h} />
      <span
        className="sleeve"
        style={{ top: cq(d.sleeve.top * h), height: cq((d.sleeve.bottom - d.sleeve.top) * h), borderWidth: `${cq(d.sleeve.line * h)} 0` }}
      />
    </motion.div>
  );
}

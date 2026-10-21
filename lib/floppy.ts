// The hand that feeds the computer its floppy, frame by frame. Pure numbers (no React), so
// `node --test` can check them. Units: the computer's own box, 100 wide; z comes out of its
// front toward you. The disk is a flat card tipped in CSS 3D; the hand is a 2D cut-out
// pinned to where its thumb presses the disk.

import { mix, seg } from "./stops.ts";

/** The computer's height in these units (art.json mac h / w). */
export const MAC_H = (100 * 1825) / 1419;
/** The floppy slot on the computer's front, measured off the photo. */
export const SLOT = { x: 57.65, w: 25.55, top: 0.7052 * MAC_H, mid: 0.7107 * MAC_H };
/** A 3.5" disk, 90 × 94 mm, a little narrower than the slot. */
export const DISK = { w: 22.5, h: 23.5 };
/** Where you're looking from: the perspective origin and distance. */
export const EYE = { x: 50, y: 45, d: 150 };
/** Where the thumb presses: right of centre, just above the disk's back edge (face-on). */
export const GRIP = { x: 6, y: 4 };
const CX = SLOT.x + SLOT.w / 2;
const STOP = 1.5; // how close the thumb gets to the case before it lets go

/** Points in front of the computer (z > 0) look bigger and further from the eye. */
export function project(x: number, y: number, z: number) {
  const s = EYE.d / (EYE.d - z);
  return { x: EYE.x + (x - EYE.x) * s, y: EYE.y + (y - EYE.y) * s, s };
}

export type Pose = {
  /** The disk's back edge (centre): the edge it pivots on. */
  x: number;
  y: number;
  z: number;
  /** Tilt in the picture plane, and how far it has tipped forward (90 = flat, heading in). */
  rz: number;
  rx: number;
  /** Hide whatever has gone through the slot. */
  clip: boolean;
  /** The disk's edge showing in the slot once it's in (0–1). */
  seated: number;
  hand: { x: number; y: number; s: number; r: number };
};

/**
 * 0 = the hand is off to the right holding the disk upright; it brings it to the slot,
 * tips it flat, pushes it in, lets go and leaves; 1 = disk in the drive. Played backwards,
 * the hand takes the disk out again.
 */
export function floppyPose(t: number): Pose {
  const come = seg(t, [0, 0.36]);
  const tip = seg(t, [0.34, 0.58]);
  const push = seg(t, [0.58, 0.84]);
  const leave = seg(t, [0.84, 1]);

  const rz = mix(-16, 0, come);
  const rx = mix(6, 90, tip);
  const x = mix(CX + 170, CX, come); // far enough to clear the view even beside a small computer
  const y = mix(SLOT.mid + 40, SLOT.mid, come);
  // Flat (90°), the leading edge reaches the slot exactly when the back edge is one disk
  // length out (z = DISK.h). The push stops with the thumb just short of the case, and the
  // drive pulls the rest in by itself.
  const z = push < 1 ? mix(DISK.h, GRIP.y + STOP, push) : mix(GRIP.y + STOP, 0.6, leave);

  // The thumb, carried through the same tip, tilt and move as the disk; once it lets go it
  // stays where the push ended (z = STOP) and backs off from there.
  const a = (rx * Math.PI) / 180;
  const b = (rz * Math.PI) / 180;
  const ly = -GRIP.y * Math.cos(a);
  const gx = x + GRIP.x * Math.cos(b) - ly * Math.sin(b);
  const gy = y + GRIP.x * Math.sin(b) + ly * Math.cos(b);
  const held = project(gx, gy, Math.max(z - GRIP.y * Math.sin(a), STOP));
  const hand = {
    x: held.x + leave * 70,
    y: held.y + leave * 40,
    s: held.s * (1 + leave * 0.25),
    r: rz - 7 * tip + leave * 16,
  };
  return { x, y, z, rz, rx, clip: tip >= 1, seated: seg(t, [0.92, 1]), hand };
}

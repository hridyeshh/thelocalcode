// The hand that feeds the computer its floppy, frame by frame. Pure numbers (no React), so
// `node --test` can check them. Units: the computer's own box, 100 wide; z comes out of its
// front toward you. Like a flipbook, the hand is three drawings (holding the disk, pinching
// it, pointing) swapped mid-move, the way an animator works pose to pose; between swaps each
// drawing travels on an arc. Once the disk reaches the slot it's the page's own disk, tipped
// flat in CSS 3D and pushed in.

import { bezier, mix, type Pt, type Range, seg } from "./stops.ts";

/** The computer's height in these units (art.json mac h / w). */
export const MAC_H = (100 * 1825) / 1419;
/** The floppy slot on the computer's front, measured off the photo. */
export const SLOT = { x: 57.65, w: 25.55, top: 0.7052 * MAC_H, mid: 0.7107 * MAC_H };
/** A 3.5" disk, 90 × 94 mm, a little narrower than the slot. */
export const DISK = { w: 22.5, h: 23.5 };
/** Where you're looking from: the perspective origin and distance. */
export const EYE = { x: 50, y: 45, d: 150 };
/** The slot's centre: the disk's back edge stays on this line while it goes in. */
export const CX = SLOT.x + SLOT.w / 2;
/** The hand's drawings, in the order of art.json's hand sheet. */
export const POSES = ["hold", "pinch", "poke"] as const;
export type PoseName = (typeof POSES)[number];

const STOP = 1.5; // how close the fingertip gets to the case before it lets go
const HANDOVER = 9; // how far out the disk still is when the pinch lets go and the finger takes over

// The beats, on t. The drawing swaps where they join: hold → pinch at the tip, pinch → poke at the poke.
const B = {
  enter: [0, 0.2],
  show: [0.2, 0.3],
  swoop: [0.3, 0.44],
  tip: [0.44, 0.52],
  push: [0.52, 0.7],
  poke: [0.7, 0.84],
  leave: [0.84, 1],
} as const satisfies Record<string, Range>;

// Holding it: where the disk's centre goes (as you see it, so no z), how far the drawing turns
// from how it was drawn, and how big it is (bigger = nearer you). It comes in low from the
// right, shows you the disk (below the screen's words), then dips (a small lift first) to
// stand it on the slot's lip, upright, just where the page's disk takes over (READY is that
// disk's centre at the first frame of the tip).
// ponytail: tuned by eye on rendered frames; retune if the hand sheet is redrawn
const SHOW: Pt = [70, 77];
const SHOWN: Pt = [68, 75];
const READY: Pt = [73, 86];
const ENTER = [[CX + 170, SLOT.mid + 30], [CX + 90, SLOT.mid + 40], [SHOW[0] + 22, SHOW[1] + 12], SHOW] as const;
const SWOOP = [SHOWN, [SHOWN[0] + 3, SHOWN[1] - 5], [READY[0] + 5, READY[1] - 14], READY] as const;
/**
 * Where each empty-handed drawing touches the disk: across its back edge from the centre, and
 * up its face. The pinch takes it up the face, where the holding thumb was (so the arm hardly
 * jumps at the swap), and slides to the back edge as it tips it flat.
 */
const PIN = { grab: { x: -1, y: 4 }, pinch: { x: 1, y: 1.5 }, poke: { x: -4, y: 0 } };

/** Points in front of the computer (z > 0) look bigger and further from the eye. */
export function project(x: number, y: number, z: number) {
  const s = EYE.d / (EYE.d - z);
  return { x: EYE.x + (x - EYE.x) * s, y: EYE.y + (y - EYE.y) * s, s };
}

export type Pose = {
  /** Which drawing shows, and where its pin goes: turned r degrees from how it was drawn, scaled s. */
  hand: { pose: PoseName; x: number; y: number; r: number; s: number };
  /** The page's disk, once the drawn one is stood on the slot. Its back edge stays on the slot's centre line. */
  disk: boolean;
  /** How far it's tipped back (90 = flat, heading in), and how far its back edge is out of the case. */
  rx: number;
  z: number;
  /** Hide whatever has gone through the slot (only once it's flat: until then it's all in front). */
  clip: boolean;
  /** The disk's edge showing in the slot once it's in (0–1). */
  seated: number;
};

/** The hand holding the disk, on its way to the slot. */
function held(t: number): Pose["hand"] {
  if (t < B.show[0]) {
    const e = seg(t, B.enter);
    const p = bezier(ENTER, e);
    return { pose: "hold", x: p.x, y: p.y, r: mix(-24, 2, e), s: mix(1.55, 1.28, e) };
  }
  if (t < B.swoop[0]) {
    const e = seg(t, B.show);
    return { pose: "hold", x: mix(SHOW[0], SHOWN[0], e), y: mix(SHOW[1], SHOWN[1], e), r: mix(2, 4, e), s: mix(1.28, 1.26, e) };
  }
  // The wrist swings the disk over on the way down and rights it to stand it on the slot.
  const e = seg(t, B.swoop);
  const p = bezier(SWOOP, e);
  return { pose: "hold", x: p.x, y: p.y, r: mix(4, 8, e) - 10 * Math.sin(Math.PI * e), s: mix(1.26, 1.12, e) };
}

/**
 * 0 = the hand is off to the right holding the disk; it brings it in, shows it, stands it on
 * the slot, tips it flat, pushes it in, pokes it home and leaves; 1 = disk in the drive. Played
 * backwards (`eject`), the hand takes it out again: then the pinch pulls it all the way, since
 * a fingertip can't.
 */
export function floppyPose(t: number, eject = false): Pose {
  const tip = seg(t, B.tip);
  const push = seg(t, B.push);
  const poke = seg(t, B.poke);
  const leave = seg(t, B.leave);
  const rx = mix(30, 90, tip);
  // Flat (90°), the leading edge reaches the slot exactly when the back edge is one disk
  // length out (z = DISK.h). The finger stops just short of the case, and the drive pulls
  // the rest in by itself.
  const z = t < B.poke[0] ? mix(DISK.h, HANDOVER, push) : leave > 0 ? mix(STOP, 0.6, leave) : mix(HANDOVER, STOP, poke);
  const disk = { disk: t >= B.tip[0], rx, z, clip: tip >= 1, seated: seg(t, [0.92, 1]) };
  if (t < B.tip[0]) return { hand: held(t), ...disk };

  // Pinned where it touches the disk, carried through the same tip and push; once it lets
  // go it stays where the push ended (z = STOP) and backs off from there.
  const pose = t < B.poke[0] || eject ? "pinch" : "poke";
  const g = pose === "pinch" ? { x: mix(PIN.grab.x, PIN.pinch.x, tip), y: mix(PIN.grab.y, PIN.pinch.y, tip) } : PIN.poke;
  const a = (rx * Math.PI) / 180;
  const at = project(CX + g.x, SLOT.mid - g.y * Math.cos(a), Math.max(z - g.y * Math.sin(a), STOP));
  const r = t < B.poke[0] ? mix(-4, 6, tip) : pose === "poke" ? mix(6, 12, poke) : 6;
  return {
    hand: { pose, x: at.x + leave * 110, y: at.y + leave * 45, r: r + leave * 12, s: at.s * (1 + leave * 0.3) },
    ...disk,
  };
}

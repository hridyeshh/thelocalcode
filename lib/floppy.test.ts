import assert from "node:assert/strict";
import test from "node:test";
import { DISK, floppyPose, SLOT } from "./floppy.ts";

/** The disk's leading edge (the shutter end): one disk length up its face from the back edge. */
const lead = (t: number) => {
  const q = floppyPose(t);
  const a = (q.rx * Math.PI) / 180;
  return { y: SLOT.mid - DISK.h * Math.cos(a), z: q.z - DISK.h * Math.sin(a) };
};

/** The drawings the hand shows over a whole move, in order, each once. */
const drawings = (eject: boolean) =>
  Array.from({ length: 401 }, (_, i) => floppyPose(i / 400, eject).hand.pose).filter((p, i, all) => p !== all[i - 1]);

test("the hand starts off to the right and ends with the disk in the drive", () => {
  const start = floppyPose(0);
  assert.ok(start.hand.x - (DISK.w / 2) * start.hand.s > 100, "disk starts clear of the computer");
  assert.ok(!start.disk && !start.clip && start.seated === 0);
  const end = floppyPose(1);
  assert.equal(end.rx, 90);
  assert.ok(end.disk && end.clip && end.seated === 1);
  assert.ok(end.z < 1, "only a sliver left outside");
  assert.ok(end.hand.x > floppyPose(0.84).hand.x + 50, "the hand has let go and left");
});

test("the disk never goes through the case: it only enters at the slot", () => {
  for (let t = 0.44; t <= 0.52; t += 0.005) assert.ok(lead(t).z >= -1e-9, `t=${t.toFixed(3)}: in front of the case`);
  const at = lead(0.52);
  assert.ok(Math.abs(at.z) < 1e-9 && Math.abs(at.y - SLOT.mid) < 1e-9, "flat, leading edge at the slot");
  for (let t = 0.54; t <= 1; t += 0.02) assert.ok(floppyPose(t).z <= floppyPose(t - 0.02).z + 1e-9, "only ever goes in");
});

test("the hand flips drawings like a flipbook: hold, pinch, then a finger; taking it out, the pinch pulls", () => {
  assert.deepEqual(drawings(false), ["hold", "pinch", "poke"]);
  assert.deepEqual(drawings(true), ["hold", "pinch"]);
});

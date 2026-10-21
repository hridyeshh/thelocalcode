import assert from "node:assert/strict";
import test from "node:test";
import { DISK, floppyPose, SLOT } from "./floppy.ts";

/** The disk's leading edge (the shutter end): one disk length up its face from the back edge. */
const lead = (t: number) => {
  const q = floppyPose(t);
  const a = (q.rx * Math.PI) / 180;
  return { y: q.y - DISK.h * Math.cos(a), z: q.z - DISK.h * Math.sin(a) };
};

test("the hand starts off to the right and ends with the disk in the drive", () => {
  const start = floppyPose(0);
  assert.ok(start.x - DISK.w / 2 > 100, "disk starts clear of the computer");
  assert.ok(!start.clip && start.seated === 0);
  const end = floppyPose(1);
  assert.equal(end.rx, 90);
  assert.ok(end.clip && end.seated === 1);
  assert.ok(end.z < 1, "only a sliver left outside");
  assert.ok(end.hand.x > floppyPose(0.84).hand.x + 50, "the hand has let go and left");
});

test("the disk never goes through the case: it only enters at the slot", () => {
  for (let t = 0; t <= 0.58; t += 0.01) assert.ok(lead(t).z >= -1e-9, `t=${t.toFixed(2)}: in front of the case`);
  const at = lead(0.58);
  assert.ok(Math.abs(at.z) < 1e-9 && Math.abs(at.y - SLOT.mid) < 1e-9, "flat, leading edge at the slot");
  for (let t = 0.6; t <= 1; t += 0.05) assert.ok(floppyPose(t).z <= floppyPose(t - 0.05).z + 1e-9, "only ever goes in");
});

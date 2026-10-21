import assert from "node:assert/strict";
import test from "node:test";
import { at, bezier, intoScreen, length, seg, stops, tipped } from "./stops.ts";

test("stops tiles 0..1 in order with no gaps", () => {
  const s = stops([["a", 1], ["b", 2], ["c", 1]] as const);
  assert.deepEqual(s.a, [0, 0.25]);
  assert.deepEqual(s.b, [0.25, 0.75]);
  assert.deepEqual(s.c, [0.75, 1]);
  assert.equal(length([["a", 1], ["b", 2.5]]), 3.5);
});

test("seg clamps outside its range and eases inside it", () => {
  assert.equal(seg(-1, [0.2, 0.4]), 0);
  assert.equal(seg(2, [0.2, 0.4]), 1);
  assert.ok(Math.abs(seg(0.3, [0.2, 0.4]) - 0.5) < 1e-9);
  assert.ok(seg(0.25, [0.2, 0.4]) < 0.25, "eased: starts slow");
  assert.equal(at([0.2, 0.6], 0.5), 0.4);
});

test("intoScreen rests at t=0 and covers the whole view at t=1", () => {
  const box = { x: 500, y: 300, w: 400, h: 520 };
  const screen = { x: 0.12, y: 0.12, w: 0.75, h: 0.45 };
  const rest = intoScreen(box, screen, 1440, 900, 0);
  assert.ok(rest.x === 0 && rest.y === 0 && rest.scale === 1, "no movement at rest");
  const { x, y, scale } = intoScreen(box, screen, 1440, 900, 1);
  // The screen's corners, scaled about its centre and moved by (x, y), land outside the view.
  const cx = box.x + (screen.x + screen.w / 2) * box.w + x;
  const cy = box.y + (screen.y + screen.h / 2) * box.h + y;
  assert.equal(cx, 720);
  assert.equal(cy, 450);
  assert.ok((screen.w * box.w * scale) / 2 >= 720 && (screen.h * box.h * scale) / 2 >= 450);
});

test("tipped: flat drawings only scale; tipped back, raised layers move up the screen", () => {
  const flat = tipped(100, 50, 0, { rx: 0, rz: 0, s: 0.5, d: 1000 });
  assert.deepEqual(flat, { x: 50, y: 25 });
  const o = { rx: 60, rz: 0, s: 1, d: 1000 };
  assert.ok(tipped(0, 0, 200, o).y < tipped(0, 0, 0, o).y, "a lifted layer rises");
  assert.ok(Math.abs(tipped(0, 100, 0, o).y - 50 * (1000 / (1000 - 86.6))) < 0.1, "depth foreshortens with perspective");
});

test("bezier starts and ends on its end points, heading along the handles", () => {
  const path = [[0, 0], [1, 0], [2, 1], [2, 2]] as const;
  assert.deepEqual([bezier(path, 0).x, bezier(path, 0).y], [0, 0]);
  assert.deepEqual([bezier(path, 1).x, bezier(path, 1).y], [2, 2]);
  assert.ok(bezier(path, 0).dx > 0 && bezier(path, 0).dy === 0, "leaves along +x");
  assert.ok(bezier(path, 1).dy > 0 && bezier(path, 1).dx === 0, "arrives along +y");
});

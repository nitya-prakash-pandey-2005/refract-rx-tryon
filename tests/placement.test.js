import { test } from "node:test";
import assert from "node:assert/strict";
import { placeFrame, warpSource } from "../src/engine/placement.js";
import { FRAMES } from "../src/engine/frames.js";

const W = 1000, H = 800;
const lm = Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
const set = (i, x, y) => (lm[i] = { x: x / W, y: y / H, z: 0 });
set(468, 400, 350); set(473, 600, 350); set(168, 500, 350); set(127, 300, 360); set(356, 700, 360); set(234, 290, 420); set(454, 710, 420);
const mmPerPx = 0.32; // 200 px between pupils = 64 mm

test("lenses sit on the pupils with the box centre 2 mm lower", () => {
  const p = placeFrame({ landmarks: lm, W, H, mmPerPx, frame: FRAMES[0] });
  assert.ok(Math.abs(p.lenses.od.oc.x - 400) < 1e-6 && Math.abs(p.lenses.os.oc.x - 600) < 1e-6);
  const boxY = (l) => (Math.min(...l.poly.map((q) => q[1])) + Math.max(...l.poly.map((q) => q[1]))) / 2;
  assert.ok(Math.abs(boxY(p.lenses.os) - (350 + 2 / mmPerPx)) < 0.5);
});

test("the two lens boxes are mirror images about the nose", () => {
  const p = placeFrame({ landmarks: lm, W, H, mmPerPx, frame: FRAMES[2] });
  const cx = (l) => (Math.min(...l.poly.map((q) => q[0])) + Math.max(...l.poly.map((q) => q[0]))) / 2;
  assert.ok(Math.abs((cx(p.lenses.od) + cx(p.lenses.os)) / 2 - 500) < 0.5);
  const width = (l) => Math.max(...l.poly.map((q) => q[0])) - Math.min(...l.poly.map((q) => q[0]));
  assert.ok(Math.abs(width(p.lenses.os) - FRAMES[2].A / mmPerPx) < 1);
});

test("minus power pulls samples from farther out; zero power is identity", () => {
  const lens = { oc: { x: 600, y: 350 }, axis: { x: 1, y: 0 } };
  const id = warpSource(650, 360, lens, { sph: 0, cyl: 0 }, mmPerPx);
  assert.ok(Math.abs(id.x - 650) < 1e-9 && Math.abs(id.y - 360) < 1e-9);
  const minus = warpSource(650, 350, lens, { sph: -6, cyl: 0 }, mmPerPx);
  assert.ok(minus.x > 650);
  const plus = warpSource(650, 350, lens, { sph: 4, cyl: 0 }, mmPerPx);
  assert.ok(plus.x < 650);
});

test("cylinder only distorts across its axis", () => {
  const lens = { oc: { x: 600, y: 350 }, axis: { x: 1, y: 0 } };
  const along = warpSource(650, 350, lens, { sph: 0, cyl: -3 }, mmPerPx);
  const across = warpSource(600, 400, lens, { sph: 0, cyl: -3 }, mmPerPx);
  assert.ok(Math.abs(along.x - 650) < 1e-9);
  assert.ok(across.y > 400);
});

import { lensUniforms } from "../src/engine/placement.js";

test("lens uniforms carry exactly what warpSource uses, scaled by t", () => {
  const p = placeFrame({ landmarks: lm, W, H, mmPerPx, frame: FRAMES[0], rx: { od: { sph: -6, cyl: -1, axis: 30 }, os: { sph: -5, cyl: 0, axis: 0 } } });
  const u = lensUniforms(p, { od: { sph: -6, cyl: -1, axis: 30 }, os: { sph: -5, cyl: 0, axis: 0 } }, 0.5);
  assert.deepEqual(u.od.oc, [p.lenses.od.oc.x, p.lenses.od.oc.y]);
  assert.deepEqual(u.od.axis, [p.lenses.od.axis.x, p.lenses.od.axis.y]);
  assert.equal(u.od.fa, -3);
  assert.equal(u.od.fp, -3.5);
  assert.equal(u.os.fa, -2.5);
  assert.equal(u.mmPerPx, mmPerPx);
  const z = lensUniforms(p, { od: { sph: -6, cyl: -1, axis: 30 }, os: { sph: -5, cyl: 0, axis: 0 } }, 0);
  assert.equal(z.od.fa, 0);
  assert.equal(z.os.fp, 0);
});

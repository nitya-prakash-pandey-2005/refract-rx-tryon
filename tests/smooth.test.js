import { test } from "node:test";
import assert from "node:assert/strict";
import { smoother } from "../src/vision/smooth.js";

const pts = (x) => [{ x, y: x, z: 0 }, { x: x + 1, y: 0, z: 0 }];

test("first frame passes through, later frames move part of the way", () => {
  const s = smoother(0.5, 300);
  assert.equal(s(pts(0), 0)[0].x, 0);
  assert.equal(s(pts(10), 16)[0].x, 5);
  assert.equal(s(pts(10), 32)[0].x, 7.5);
});

test("converges to a steady input", () => {
  const s = smoother(0.5, 300);
  let out;
  for (let i = 0; i < 40; i++) out = s(pts(3), i * 16);
  assert.ok(Math.abs(out[0].x - 3) < 1e-6);
});

test("resets after a gap (face lost) instead of sliding from stale points", () => {
  const s = smoother(0.5, 300);
  s(pts(0), 0);
  assert.equal(s(pts(10), 1000)[0].x, 10);
});

test("null input (no face) resets", () => {
  const s = smoother(0.5, 300);
  s(pts(0), 0);
  assert.equal(s(null, 16), null);
  assert.equal(s(pts(8), 32)[0].x, 8);
});

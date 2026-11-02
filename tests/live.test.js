import { test } from "node:test";
import assert from "node:assert/strict";
import { faceTurned, widestFace } from "../src/engine/measure.js";

const face = (lx, rx) => {
  const f = Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
  f[168] = { x: 0.5, y: 0.45, z: 0 };
  f[127] = { x: lx, y: 0.45, z: 0 };
  f[356] = { x: rx, y: 0.45, z: 0 };
  return f;
};

test("a frontal face is not turned; a strongly turned one is", () => {
  assert.equal(faceTurned(face(0.3, 0.7)), false);
  assert.equal(faceTurned(face(0.42, 0.7)), true);
});

test("widestFace picks the largest face, null when none", () => {
  const small = face(0.45, 0.55), big = face(0.2, 0.8);
  assert.equal(widestFace([small, big]), big);
  assert.equal(widestFace([]), null);
  assert.equal(widestFace(undefined), null);
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { INDICES, spherEq, meridianPower, eyeMagnification, sag, lensProfile, recommendIndex } from "../src/engine/optics.js";

const rect = (w, h, dx = 0, dy = 0, steps = 64) => {
  const pts = [];
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const c = Math.cos(a), s = Math.sin(a);
    const k = Math.min(w / 2 / Math.abs(c || 1e-9), h / 2 / Math.abs(s || 1e-9));
    pts.push([c * k + dx, s * k + dy]);
  }
  return pts;
};
const idx = (n) => INDICES.find((i) => i.n === n);

test("spherical equivalent adds half the cylinder", () => {
  assert.equal(spherEq({ sph: -6, cyl: -1, axis: 180 }), -6.5);
});

test("meridian power at 90° from the axis is sphere plus cylinder", () => {
  assert.equal(meridianPower({ sph: -2, cyl: -1, axis: 90 }, 0), -3);
  assert.equal(meridianPower({ sph: -2, cyl: -1, axis: 90 }, 90), -2);
});

test("minus lens shrinks the eye about 6.7% at -6 D", () => {
  assert.ok(Math.abs(eyeMagnification(-6) - 0.933) < 0.001);
  assert.ok(eyeMagnification(3) > 1);
  assert.equal(eyeMagnification(0), 1);
});

test("sag follows the circle formula", () => {
  assert.ok(Math.abs(sag(25, -6, 1.5) - 3.84) < 0.05);
  assert.equal(sag(25, 0, 1.5), 0);
});

test("minus lens is thicker at the edge and thinner in a higher index", () => {
  const contour = rect(50, 40, 3, 0);
  const rx = { sph: -6, cyl: 0, axis: 0 };
  const p150 = lensProfile({ rx, contour, n: idx(1.5) });
  const p167 = lensProfile({ rx, contour, n: idx(1.67) });
  assert.ok(p150.maxEdge > p150.centre);
  assert.ok(p167.maxEdge < p150.maxEdge);
  assert.ok(p150.weightG > 0);
  assert.ok(p150.magnification.mean < 1);
});

test("plano lens has an even edge", () => {
  const p = lensProfile({ rx: { sph: 0, cyl: 0, axis: 0 }, contour: rect(50, 40), n: idx(1.5) });
  assert.ok(Math.abs(p.maxEdge - p.minEdge) < 1e-9);
  assert.equal(p.magnification.mean, 1);
});

test("mixed-sign astigmatism gives finite thicknesses", () => {
  const p = lensProfile({ rx: { sph: 1, cyl: -3, axis: 30 }, contour: rect(52, 38, 2, 1), n: idx(1.6) });
  for (const e of p.edges) assert.ok(Number.isFinite(e.t) && e.t >= 0.99);
  assert.ok(Number.isFinite(p.centre) && Number.isFinite(p.weightG));
});

test("recommends a high index for -8 and the basic index for -1", () => {
  assert.ok(recommendIndex({ rx: { sph: -8, cyl: 0, axis: 0 }, contour: rect(52, 40, 3) }).best.n >= 1.67);
  assert.equal(recommendIndex({ rx: { sph: -1, cyl: 0, axis: 0 }, contour: rect(52, 40, 3) }).best.n, 1.5);
});

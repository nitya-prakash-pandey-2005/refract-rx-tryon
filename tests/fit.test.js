import { test } from "node:test";
import assert from "node:assert/strict";
import { FRAMES, frameContour } from "../src/engine/frames.js";
import { fitFrame, rankFrames } from "../src/engine/fit.js";

const both = (sph, cyl = 0, axis = 0) => ({ od: { sph, cyl, axis }, os: { sph, cyl, axis } });
const ctx = (rx, extra = {}) => ({ rx, pd: { left: 31.5, right: 31.5 }, faceWidthMm: 138, faceShape: "oval", ...extra });

test("catalogue has 12 frames with real dimensions", () => {
  assert.equal(FRAMES.length, 12);
  for (const f of FRAMES) assert.ok(f.A >= 44 && f.A <= 58 && f.B > 25 && f.DBL >= 14 && f.priceUsd > 0, f.id);
});

test("every contour stays inside its A×B box", () => {
  for (const f of FRAMES) {
    const c = frameContour(f);
    assert.ok(c.length >= 32, f.id);
    for (const [x, y] of c) {
      assert.ok(Number.isFinite(x) && Number.isFinite(y), f.id);
      assert.ok(Math.abs(x) <= f.A / 2 + 1e-6 && Math.abs(y) <= f.B / 2 + 1e-6, f.id);
    }
  }
});

test("for -7 D the best frame is a small one", () => {
  const ranked = rankFrames(ctx(both(-7)));
  assert.ok(ranked[0].frame.A <= 52, ranked[0].frame.id);
  assert.ok(ranked[0].fit.score >= ranked[ranked.length - 1].fit.score);
});

test("score equals 95 plus the drivers", () => {
  for (const { fit } of rankFrames(ctx(both(-4.5, -1, 170)))) {
    const sum = fit.drivers.reduce((a, d) => a + d.contribution, 0);
    const expect = Math.max(0, Math.min(100, Math.round(95 + 100 * sum)));
    assert.equal(fit.score, expect);
  }
});

test("plano ranking ignores lens thickness", () => {
  for (const { fit } of rankFrames(ctx(both(0)))) {
    const t = fit.drivers.find((d) => d.feature === "thickness");
    assert.ok(!t || t.contribution > -0.001);
  }
});

test("very high Rx still returns a full ranking with advice", () => {
  const ranked = rankFrames(ctx(both(-12)));
  assert.equal(ranked.length, 12);
  assert.equal(ranked[0].fit.lens.best.n, 1.74);
});

test("fitFrame reports both lenses and the frame's total width", () => {
  const fit = fitFrame({ frame: FRAMES[0], ...ctx(both(-3)) });
  assert.ok(fit.lens.od.maxEdge > 0 && fit.lens.os.maxEdge > 0);
  assert.equal(fit.totalWidth, 2 * FRAMES[0].A + FRAMES[0].DBL + 8);
});

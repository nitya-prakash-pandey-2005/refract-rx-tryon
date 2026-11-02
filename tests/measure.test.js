import { test } from "node:test";
import assert from "node:assert/strict";
import { IRIS_MM, measureFace, cropForAnalysis, qualityChecks } from "../src/engine/measure.js";

const W = 1280, H = 720;
// Synthetic frontal face: eyes level, irises 60 px wide, pupils 330 px apart, face 520 px wide.
function face({ cx = 640, cy = 360, irisPx = 60, pupilGap = 330, faceW = 520, noseDx = 0 } = {}) {
  const lm = Array.from({ length: 478 }, () => ({ x: cx / W, y: cy / H, z: 0 }));
  const set = (i, x, y) => (lm[i] = { x: x / W, y: y / H, z: 0 });
  const ey = cy - 40;
  const od = cx - pupilGap / 2, os = cx + pupilGap / 2;
  set(468, od, ey); set(469, od + irisPx / 2, ey); set(470, od, ey - irisPx / 2); set(471, od - irisPx / 2, ey); set(472, od, ey + irisPx / 2);
  set(473, os, ey); set(474, os + irisPx / 2, ey); set(475, os, ey - irisPx / 2); set(476, os - irisPx / 2, ey); set(477, os, ey + irisPx / 2);
  set(168, cx, ey); set(1, cx + noseDx, cy + 30); set(152, cx, cy + 260); set(10, cx, cy - 300);
  set(234, cx - faceW / 2, cy); set(454, cx + faceW / 2, cy); set(127, cx - faceW / 2 + 6, ey); set(356, cx + faceW / 2 - 6, ey);
  return lm;
}

test("iris width sets the millimetre scale and near PD", () => {
  const m = measureFace(face(), W, H);
  assert.ok(Math.abs(m.mmPerPx - IRIS_MM / 60) < 1e-6);
  assert.ok(Math.abs(m.pd.near - 64.35) < 0.05);
  assert.ok(m.pd.far > m.pd.near);
  assert.ok(Math.abs(m.pd.left - m.pd.right) < 0.01);
  assert.ok(Math.abs(m.pd.left + m.pd.right - m.pd.far) < 0.01);
  assert.ok(m.pd.plusMinus > 2 && m.pd.plusMinus < 3.5);
  assert.ok(m.faceWidthMm > 90 && m.faceWidthMm < 110);
  assert.ok(Math.abs(m.eyeLine.angleDeg) < 1e-6);
});

test("analysis crop gives the face 70% of the width and stays in the photo", () => {
  const box = { x: 500, y: 150, w: 280, h: 360 };
  const c = cropForAnalysis(box, W, H);
  assert.ok(Math.abs(box.w / c.w - 0.7) < 0.02);
  assert.ok(c.x >= 0 && c.y >= 0 && c.x + c.w <= W && c.y + c.h <= H);
  assert.ok(Math.abs(c.h / c.w - 4 / 3) < 0.02 || c.h === H);
});

test("crop near the edge is clamped inside the image", () => {
  const c = cropForAnalysis({ x: 0, y: 0, w: 300, h: 380 }, W, H);
  assert.ok(c.x >= 0 && c.y >= 0 && c.x + c.w <= W && c.y + c.h <= H);
});

test("quality checks pass for a good frontal face", () => {
  const checks = qualityChecks({ landmarks: face(), W, H, luma: { mean: 140, left: 138, right: 142 } });
  assert.ok(checks.every((c) => c.ok), JSON.stringify(checks.filter((c) => !c.ok)));
});

test("quality checks ask to move closer, turn and fix light", () => {
  const ids = (cs) => cs.filter((c) => !c.ok).map((c) => c.id);
  assert.ok(ids(qualityChecks({ landmarks: face({ faceW: 200, irisPx: 24, pupilGap: 130 }), W, H, luma: { mean: 140, left: 140, right: 140 } })).includes("size"));
  assert.ok(ids(qualityChecks({ landmarks: face({ noseDx: 60 }), W, H, luma: { mean: 140, left: 140, right: 140 } })).includes("pose"));
  assert.ok(ids(qualityChecks({ landmarks: face(), W, H, luma: { mean: 140, left: 100, right: 180 } })).includes("light"));
  assert.ok(ids(qualityChecks({ landmarks: null, W, H, luma: null })).includes("face"));
});

test("nose width at pad height comes from the iris-scaled photo", () => {
  const lm = face();
  lm[193] = { x: 633 / W, y: 330 / H, z: 0 };
  lm[417] = { x: 703 / W, y: 330 / H, z: 0 };
  const m = measureFace(lm, W, H);
  assert.ok(Math.abs(m.noseWidthMm - 70 * (IRIS_MM / 60)) < 1e-6);
});

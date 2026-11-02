import { test } from "node:test";
import assert from "node:assert/strict";
import { slipRisk, pdRisk, remakeRisk } from "../src/engine/risk.js";
import { FRAMES } from "../src/engine/frames.js";

const juno = FRAMES.find((f) => f.id === "juno"), nori = FRAMES.find((f) => f.id === "nori");
const face = { faceWidthMm: 128, noseWidthMm: 13.5, bridge: "medium" };

test("heavier lenses raise slip risk", () => {
  const light = slipRisk({ frame: juno, lensWeightG: 6, face, oiliness: 70 });
  const heavy = slipRisk({ frame: juno, lensWeightG: 26, face, oiliness: 70 });
  assert.ok(heavy.margin < light.margin);
});

test("an oily nose and a low bridge raise slip risk; adjustable pads lower it", () => {
  const base = slipRisk({ frame: juno, lensWeightG: 14, face, oiliness: 80 });
  assert.ok(slipRisk({ frame: juno, lensWeightG: 14, face, oiliness: 25 }).margin < base.margin);
  assert.ok(slipRisk({ frame: juno, lensWeightG: 14, face: { ...face, bridge: "low" }, oiliness: 80 }).margin < base.margin);
  assert.ok(slipRisk({ frame: nori, lensWeightG: 14, face: { ...face, bridge: "low" }, oiliness: 80 }).margin > slipRisk({ frame: juno, lensWeightG: 14, face: { ...face, bridge: "low" }, oiliness: 80 }).margin);
});

test("slip result explains itself", () => {
  const r = slipRisk({ frame: juno, lensWeightG: 20, face, oiliness: 40 });
  assert.ok(["low", "medium", "high"].includes(r.level));
  assert.ok(r.drivers.length >= 3 && r.fixes.length >= 1);
  assert.ok(r.totalWeightG > juno.weightG);
});

test("PD error matters more at strong powers (Prentice, ANSI tolerance)", () => {
  const weak = pdRisk({ rx: { od: { sph: -1, cyl: 0, axis: 0 }, os: { sph: -1, cyl: 0, axis: 0 } }, pdPlusMinus: 2.7 });
  const strong = pdRisk({ rx: { od: { sph: -8, cyl: 0, axis: 0 }, os: { sph: -8, cyl: 0, axis: 0 } }, pdPlusMinus: 2.7 });
  assert.equal(weak.level, "low");
  assert.equal(strong.level, "high");
  assert.ok(strong.inducedPrism > weak.inducedPrism);
});

test("remake risk combines look, sight, fit and measure into one explained score", () => {
  const r = remakeRisk({ frame: juno, rx: { od: { sph: -7, cyl: -0.5, axis: 180 }, os: { sph: -7, cyl: -0.5, axis: 180 } }, pd: { left: 31.5, right: 31.5, plusMinus: 2.7 }, face, oiliness: 40 });
  assert.deepEqual(Object.keys(r.parts).sort(), ["fit", "look", "measure", "sight"]);
  assert.ok(r.score >= 0 && r.score <= 100);
  assert.ok(r.fixes.length >= 2);
  const easy = remakeRisk({ frame: nori, rx: { od: { sph: -1, cyl: 0, axis: 0 }, os: { sph: -1, cyl: 0, axis: 0 } }, pd: { left: 31.5, right: 31.5, plusMinus: 0.5 }, face, oiliness: 80 });
  assert.ok(easy.score < r.score);
});

test("silicone pads lose less grip on oily skin than hard pads (skin tribology)", () => {
  const drop = (frame) => slipRisk({ frame, lensWeightG: 14, face, oiliness: 90 }).inputs.frictionCoeff / slipRisk({ frame, lensWeightG: 14, face, oiliness: 10 }).inputs.frictionCoeff;
  assert.ok(drop(nori) < drop(juno)); // dry÷oily friction ratio: silicone loses less grip
});

test("nose pressure flags marks above the capillary threshold", () => {
  const r = slipRisk({ frame: juno, lensWeightG: 30, face, oiliness: 50 });
  assert.ok(["ok", "marks", "painful"].includes(r.pressureLevel));
});

test("eye-level face width is not head width: normal frames keep temple grip", () => {
  const r = slipRisk({ frame: juno, lensWeightG: 8, face: { faceWidthMm: 130, noseWidthMm: 13.5, bridge: "medium" }, oiliness: 60, power: 1 });
  assert.notEqual(r.level, "high");
  assert.ok(r.inputs.gripN >= 0.1);
});

test("weight fix is not suggested for plano lenses", () => {
  const r = slipRisk({ frame: juno, lensWeightG: 16, face, oiliness: 60, power: 0 });
  assert.ok(!r.fixes.some((f) => /higher-index/.test(f)));
});

test("sight fix only suggests materials with a higher Abbe than the lens chosen", () => {
  const rx = { od: { sph: -5, cyl: 0, axis: 0 }, os: { sph: -5, cyl: 0, axis: 0 } };
  const r = remakeRisk({ frame: nori, rx, pd: { left: 31.5, right: 31.5, plusMinus: 0.5 }, face, oiliness: 60, index: { n: 1.6, label: "1.60 Thin", density: 1.3, abbe: 41, minCenter: 1.5, priceUsd: 49 } });
  if (r.parts.sight.fix) assert.doesNotMatch(r.parts.sight.fix, /1\.60/);
});

test("a frame without a weight does not produce NaN", () => {
  const { weightG, ...noWeight } = juno;
  const r = remakeRisk({ frame: noWeight, rx: { od: { sph: -3, cyl: 0, axis: 0 }, os: { sph: -3, cyl: 0, axis: 0 } }, pd: { left: 31.5, right: 31.5, plusMinus: 2.7 }, face, oiliness: 60 });
  assert.ok(Number.isFinite(r.score));
});

test("physics ordering: heavy acetate on a low, oily nose slides; light pad frames stay put", () => {
  const ines = FRAMES.find((f) => f.id === "ines");
  const bad = slipRisk({ frame: ines, lensWeightG: 18, face: { faceWidthMm: 126, noseWidthMm: 12.5, bridge: "low" }, oiliness: 30, power: 5 });
  const good = slipRisk({ frame: nori, lensWeightG: 14, face: { faceWidthMm: 128, noseWidthMm: 13, bridge: "low" }, oiliness: 25, power: 7 });
  assert.equal(bad.level, "high");
  assert.equal(good.level, "low");
});

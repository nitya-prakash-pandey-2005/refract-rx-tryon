import { test } from "node:test";
import assert from "node:assert/strict";
import { project, rateAt, INTERVENTIONS, maculopathyRR, axialMm } from "../src/engine/myopia.js";

const at = (r, age) => r.points.find((p) => Math.abs(p.age - age) < 1e-6);

test("progression rates match the meta-analysis at age 9.3 and slow with age", () => {
  assert.ok(Math.abs(rateAt(9.3, { group: "asian" }) - 0.82) < 1e-9);
  assert.ok(Math.abs(rateAt(9.3, { group: "european" }) - 0.55) < 1e-9);
  assert.ok(rateAt(7, { group: "asian" }) > rateAt(11, { group: "asian" }));
  assert.ok(rateAt(18, { group: "asian" }) < 0.12, "most children have stopped by 18");
});

test("a European 9-year-old at -2 lands near COMET's mean at stabilization (-4.87 D)", () => {
  const r = project({ age: 9, rx: -2, group: "european" });
  assert.ok(r.at18 < -4.2 && r.at18 > -5.6, `${r.at18}`);
  const a = project({ age: 9, rx: -2, group: "asian" });
  assert.ok(a.at18 < r.at18, "Asian children progress further");
  assert.ok(at(a, 10).rx - at(a, 11).rx > at(a, 15).rx - at(a, 16).rx, "faster when younger");
});

test("the uncertainty band brackets the projection", () => {
  const r = project({ age: 8, rx: -1.5, group: "asian" });
  for (const p of r.points) assert.ok(p.worse <= p.rx + 1e-9 && p.rx <= p.better + 1e-9);
});

test("two myopic parents add about a dioptre by adulthood", () => {
  const base = project({ age: 9, rx: -2, group: "european" }).at18;
  const two = project({ age: 9, rx: -2, group: "european", parents: 2 }).at18;
  assert.ok(base - two > 0.6 && base - two < 1.4, `${base - two}`);
});

test("myopia-control options slow progression by their trial effect", () => {
  const sv = project({ age: 9, rx: -2, group: "asian" }), dims = project({ age: 9, rx: -2, group: "asian", intervention: "dims" });
  const ratio = (dims.at18 + 2) / (sv.at18 + 2);
  assert.ok(Math.abs(ratio - INTERVENTIONS.dims.factor) < 1e-6);
  assert.ok(axialMm(dims.at18) < axialMm(sv.at18));
});

test("each dioptre less lowers myopic maculopathy risk by about 40%", () => {
  assert.ok(Math.abs(maculopathyRR(1) - 0.6) < 0.01);
  assert.ok(maculopathyRR(2) < maculopathyRR(1));
});

test("a 16-year-old has little progression left", () => {
  const r = project({ age: 16, rx: -4, group: "asian" });
  assert.ok(r.at18 > -4.6, `${r.at18}`);
});

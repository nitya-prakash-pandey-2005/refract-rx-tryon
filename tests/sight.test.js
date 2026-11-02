import { test } from "node:test";
import assert from "node:assert/strict";
import { prismAt, tca, cleanZoneRadiusMm, fringeArcmin, materialSight, TCA_THRESHOLD } from "../src/engine/sight.js";
import { INDICES } from "../src/engine/optics.js";

test("Prentice: 1 cm off-centre through a −7 D lens is 7 prism dioptres", () => {
  assert.ok(Math.abs(prismAt(-7, 10) - 7) < 1e-9);
  assert.ok(Math.abs(prismAt(4, 5) - 2) < 1e-9);
});

test("colour split is prism over Abbe", () => {
  assert.ok(Math.abs(tca(-7, 10, 30) - 7 / 30) < 1e-9);
  assert.ok(Math.abs(fringeArcmin(1) - 34.38) < 0.01);
});

test("clean zone grows with Abbe and shrinks with power", () => {
  const poly = cleanZoneRadiusMm(-7, 30), crown = cleanZoneRadiusMm(-7, 58);
  assert.ok(crown > poly);
  assert.ok(cleanZoneRadiusMm(-3, 30) > poly);
  assert.ok(Math.abs(poly - (TCA_THRESHOLD * 30 / 7) * 10) < 1e-9);
  assert.equal(cleanZoneRadiusMm(0, 30), Infinity);
});

test("materialSight ranks every index for a prescription", () => {
  const rows = materialSight({ sph: -7, cyl: 0, axis: 0 });
  assert.equal(rows.length, INDICES.length);
  const poly = rows.find((r) => r.index.n === 1.59), crown = rows.find((r) => r.index.n === 1.5);
  assert.ok(poly.cleanZoneMm < crown.cleanZoneMm);
  assert.ok(poly.tcaAt10mm > crown.tcaAt10mm);
  assert.ok(rows.every((r) => typeof r.verdict === "string"));
});

import { perceivedArcmin, acuityLossLines } from "../src/engine/sight.js";
test("perceived fringe and acuity cost follow Winter et al. 2015", () => {
  assert.ok(Math.abs(perceivedArcmin(1) - 0.49) < 1e-9);
  // 0.2 Δ of TCA ≈ 1 chart line lost (Meslin & Obrecht: 5–7.5 arcmin per line)
  const lines = acuityLossLines(0.2 * 30, 30); // prism 6 Δ through Abbe 30
  assert.ok(lines > 0 && lines < 1.5);
});

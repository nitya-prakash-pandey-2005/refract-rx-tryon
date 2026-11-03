import { test } from "node:test";
import assert from "node:assert/strict";
import { oilinessAt, dayTemps, slipDay } from "../src/engine/climate.js";
import { getFrame } from "../src/engine/frames.js";

test("skin gets oilier as it warms and drier as it cools", () => {
  assert.equal(Math.round(oilinessAt(60, 22)), 60, "unchanged at the scan temperature");
  assert.ok(oilinessAt(60, 36) < 55 && oilinessAt(60, 6) > 65);
  assert.ok(oilinessAt(5, 40) >= 1 && oilinessAt(98, 0) <= 100, "stays a valid score");
});

test("a day warms from dawn to mid-afternoon", () => {
  const t = dayTemps(28, 8);
  assert.equal(t.length, 24);
  assert.ok(t[15] > t[6] + 7 && Math.abs(t[15] - 32) < 0.5 && Math.abs(t[6] - 24) < 0.5);
});

test("a borderline frame creeps more hours on a hot day than on a cold one", () => {
  const ctx = { frame: getFrame("halden"), lensWeightG: 16, face: { bridge: "medium" }, score: 55 };
  const hot = slipDay({ ...ctx, temps: dayTemps(34, 8) }), cold = slipDay({ ...ctx, temps: dayTemps(6, 6) });
  assert.equal(hot.hours.length, 24);
  assert.ok(hot.expectedHours > cold.expectedHours + 0.5, `${hot.expectedHours} vs ${cold.expectedHours}`);
  assert.deepEqual(slipDay({ ...ctx, temps: dayTemps(34, 8) }).hours.map((h) => h.p), hot.hours.map((h) => h.p), "seeded: repeatable");
  const light = slipDay({ frame: getFrame("lumen"), lensWeightG: 8, face: { bridge: "medium" }, score: 55, temps: dayTemps(34, 8) });
  assert.ok(light.expectedHours < hot.expectedHours);
});

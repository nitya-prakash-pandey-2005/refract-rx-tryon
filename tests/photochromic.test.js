import { test } from "node:test";
import assert from "node:assert/strict";
import { kFade, equilibrium, transmission, simulate, summary, UV } from "../src/engine/photochromic.js";

test("the thermal fade-back follows Arrhenius: slower in the cold, faster in the heat", () => {
  assert.ok(kFade(5) < kFade(25) && kFade(25) < kFade(35));
  assert.ok(kFade(5) / kFade(25) < 0.2, "fading takes several times longer near freezing");
});

test("hot sun darkens less, cold sun darkens more, a windshield barely tints", () => {
  const T = (uv, t) => transmission(equilibrium(uv, t));
  assert.ok(T(UV.sun, 35) > T(UV.sun, 25) && T(UV.sun, 25) > T(UV.sun, 5));
  assert.ok(T(UV.sun, 23) < 0.3, "sunglass-dark on a sunny street");
  assert.ok(T(UV.car, 23) > 0.7, "almost clear behind a windshield");
});

test("the simulation darkens outdoors and clears indoors, matching the closed form", () => {
  const run = simulate({ uv: UV.sun, tempC: 23, outdoorS: 300, indoorS: 600 });
  const atOutEnd = run.find((p) => p.t === 300), last = run[run.length - 1];
  assert.ok(Math.abs(atOutEnd.c - equilibrium(UV.sun, 23)) < 0.01);
  assert.ok(last.T > 0.85, `clear again after 10 minutes indoors: ${last.T}`);
  const s = summary({ uv: UV.sun, tempC: 23 });
  assert.ok(s.darkenS < 90 && s.clearS > 60 && s.clearS < 600, JSON.stringify(s));
  assert.ok(summary({ uv: UV.sun, tempC: 5 }).clearS > 2 * s.clearS);
});

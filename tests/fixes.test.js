import { test } from "node:test";
import assert from "node:assert/strict";
import { rankFrames } from "../src/engine/fit.js";
import { recommendIndex } from "../src/engine/optics.js";
import { parseDiopter } from "../src/engine/rxinput.js";
import { allow, buildParams } from "../server/limits.js";
import { POLL_TIMEOUT_MS } from "../server/youcam.js";

const both = (sph, cyl = 0, axis = 0) => ({ od: { sph, cyl, axis }, os: { sph, cyl, axis } });
const rect = (w, h, dx = 0) => Array.from({ length: 64 }, (_, i) => { const a = (i / 64) * 2 * Math.PI, c = Math.cos(a), s = Math.sin(a); const k = Math.min(w / 2 / Math.abs(c || 1e-9), h / 2 / Math.abs(s || 1e-9)); return [c * k + dx, s * k]; });

for (const sph of [-9, -12]) {
  test(`at ${sph} D on a 135 mm face the thinnest frames rank first`, () => {
    const ranked = rankFrames({ rx: both(sph, -1.25, 10), pd: { left: 31.5, right: 31.5 }, faceWidthMm: 135, faceShape: "oval" });
    const byThin = [...ranked].sort((a, b) => a.fit.thick - b.fit.thick).map((r) => r.frame.id);
    assert.ok(byThin.slice(0, 3).includes(ranked[0].frame.id), `top ${ranked[0].frame.id} (${ranked[0].fit.thick.toFixed(1)} mm) not among thinnest ${byThin.slice(0, 3)}`);
    assert.ok(!ranked.slice(0, 3).some((r) => r.frame.id === byThin[byThin.length - 1]), "thickest frame in top 3");
  });
}

test("index note never claims negative or zero savings", () => {
  for (const sph of [-1, -2.5, -4, -6, 2, 4]) {
    const { note } = recommendIndex({ rx: { sph, cyl: 0, axis: 0 }, contour: rect(52, 40, 3) });
    const m = /save[s]?(?: only)? (-?[\d.]+) mm/.exec(note);
    if (m) assert.ok(parseFloat(m[1]) > 0, note);
  }
});

test("plano prescription gets no lens upsell", () => {
  const r = recommendIndex({ rx: { sph: 0, cyl: 0, axis: 0 }, contour: rect(52, 40, 3) });
  assert.equal(r.best.n, 1.5);
  assert.doesNotMatch(r.note, /saves/);
});

test("diopter text parses minus signs, commas and clamps", () => {
  const sph = { min: -20, max: 12 };
  assert.equal(parseDiopter("-", sph), null);
  assert.equal(parseDiopter("", sph), null);
  assert.equal(parseDiopter("-6.5", sph), -6.5);
  assert.equal(parseDiopter("−6,50", sph), -6.5);
  assert.equal(parseDiopter("+3", sph), 3);
  assert.equal(parseDiopter("83", sph), 12);
  assert.equal(parseDiopter("abc", sph), null);
});

test("rate limiter blocks after the limit within the window", () => {
  const k = "ip-" + Math.random();
  for (let i = 0; i < 3; i++) assert.equal(allow(k, { limit: 3, windowMs: 60000 }), true);
  assert.equal(allow(k, { limit: 3, windowMs: 60000 }), false);
});

test("YouCam params are built on the server from presets, not taken from the client", () => {
  const p = buildParams("face-attr-analysis", { params: { features: ["x", "y"], evil: 1 } });
  assert.equal(p.features.length, 9);
  assert.equal(p.evil, undefined);
  const s = buildParams("skin-analysis", { hd: true });
  assert.ok(s.dst_actions.every((a) => a.startsWith("hd_")));
  const m = buildParams("makeup-vto", { look: { kind: "rx", rx: both(-6) } });
  assert.ok(m.effects.some((e) => e.category === "eye_shadow"));
  assert.throws(() => buildParams("makeup-vto", { look: { kind: "nope" } }));
});

test("poll timeout leaves headroom under the 120 s function limit", () => {
  assert.ok(POLL_TIMEOUT_MS <= 100000);
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { parseFrameSize, customFrame, setCustomFrame, getFrame, frameContour } from "../src/engine/frames.js";
import { remakeRisk } from "../src/engine/risk.js";
import { lensPair } from "../src/engine/fit.js";
import { handle } from "../server/router.js";

const rx = { od: { sph: -6, cyl: -0.5, axis: 180 }, os: { sph: -6, cyl: -0.5, axis: 180 } };
const pd = { left: 31.5, right: 31.5, plusMinus: 0.5 };

test("parseFrameSize reads the size printed inside a temple arm", () => {
  assert.deepEqual(parseFrameSize("52□18 140"), { A: 52, DBL: 18, temple: 140 });
  assert.deepEqual(parseFrameSize("52-18-140"), { A: 52, DBL: 18, temple: 140 });
  assert.deepEqual(parseFrameSize(" 49 [] 21 - 145 "), { A: 49, DBL: 21, temple: 145 });
  assert.deepEqual(parseFrameSize("54/17"), { A: 54, DBL: 17, temple: null });
  assert.equal(parseFrameSize("hello"), null);
  assert.equal(parseFrameSize("18-52-140"), null, "bridge first is not a valid size");
  assert.equal(parseFrameSize("90-18-140"), null, "lens width out of range");
});

test("customFrame builds a catalogue-compatible frame from its printed size", () => {
  const f = customFrame({ A: 52, DBL: 18, temple: 140, shape: "rect", material: "metal" });
  assert.equal(f.id, "custom");
  assert.equal(f.pads, "adjustable");
  assert.ok(f.B > 30 && f.B < 40, `rect lens height ${f.B}`);
  assert.ok(f.weightG > 10 && f.weightG < 20);
  const ac = customFrame({ A: 52, DBL: 18, shape: "rect", material: "acetate" });
  assert.equal(ac.pads, "fixed");
  assert.ok(ac.weightG > f.weightG, "acetate weighs more than metal");
  assert.equal(customFrame({ A: 52, DBL: 18, B: 41, shape: "round" }).B, 41, "a listed lens height wins");
  assert.equal(frameContour(f).length, 96);
});

test("a bigger frame from any store gets thicker lenses and a higher risk", () => {
  const small = customFrame({ A: 48, DBL: 20, shape: "round", material: "metal" });
  const big = customFrame({ A: 58, DBL: 16, shape: "square", material: "acetate" });
  const e = (fr) => { const p = lensPair({ frame: fr, rx, pd }); return Math.max(p.od.maxEdge, p.os.maxEdge); };
  assert.ok(e(big) > e(small) + 1);
  const r = (fr) => remakeRisk({ frame: fr, rx, pd, face: { bridge: "medium" }, oiliness: 60 }).score;
  assert.ok(r(big) > r(small));
});

test("getFrame('custom') returns the frame the shopper typed in", () => {
  setCustomFrame({ A: 50, DBL: 19, shape: "oval", material: "metal" });
  assert.equal(getFrame("custom").A, 50);
  setCustomFrame(null);
  assert.equal(getFrame("custom"), undefined);
});

const call = (body) => new Promise((ok) => {
  const res = { statusCode: 0, setHeader() {}, end(s) { ok({ status: this.statusCode, json: JSON.parse(s) }); } };
  handle({ method: "POST", url: "/api/v1/risk", body, headers: { "x-forwarded-for": `t-${Math.random()}` } }, res);
});

test("POST /api/v1/risk scores any frame by its printed size", async () => {
  const r = await call({ rx, frame: { size: "56-18-145", shape: "square", material: "acetate" } });
  assert.equal(r.status, 200);
  assert.equal(r.json.frameId, "custom");
  assert.ok(r.json.score > 0);
  const bad = await call({ rx, frame: { size: "nope" } });
  assert.equal(bad.status, 400);
});

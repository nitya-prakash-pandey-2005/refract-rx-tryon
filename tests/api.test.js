import { test } from "node:test";
import assert from "node:assert/strict";
import { handle } from "../server/router.js";

const call = (method, url, body) => new Promise((ok) => {
  const res = { statusCode: 0, setHeader() {}, end(s) { ok({ status: this.statusCode, json: JSON.parse(s) }); } };
  handle({ method, url, body, headers: { "x-forwarded-for": `t-${Math.random()}` } }, res);
});
const rx = { od: { sph: -7, cyl: -0.5, axis: 180 }, os: { sph: -6.75, cyl: -0.5, axis: 175 } };

test("GET /api/v1/frames lists the catalogue with dimensions", async () => {
  const r = await call("GET", "/api/v1/frames");
  assert.equal(r.status, 200);
  assert.equal(r.json.frames.length, 12);
  assert.ok(r.json.frames[0].A && r.json.frames[0].weightG);
});

test("POST /api/v1/risk scores a frame for a prescription", async () => {
  const r = await call("POST", "/api/v1/risk", { rx, frameId: "juno", pd: { left: 31.5, right: 31.5, plusMinus: 2.7 }, face: { faceWidthMm: 128, noseWidthMm: 13.5, bridge: "low" }, oiliness: 40 });
  assert.equal(r.status, 200);
  assert.ok(r.json.score >= 0 && r.json.score <= 100);
  assert.deepEqual(Object.keys(r.json.parts).sort(), ["fit", "look", "measure", "sight"]);
  assert.equal(r.json.parts.fit.detail, undefined);
  assert.ok(Array.isArray(r.json.fixes));
});

test("POST /api/v1/risk with no frame ranks the whole catalogue, lowest risk first", async () => {
  const r = await call("POST", "/api/v1/risk", { rx, pd: { left: 31.5, right: 31.5, plusMinus: 2.7 } });
  assert.equal(r.status, 200);
  assert.equal(r.json.ranked.length, 12);
  assert.ok(r.json.ranked[0].score <= r.json.ranked[11].score);
});

test("POST /api/v1/risk rejects a bad prescription", async () => {
  const r = await call("POST", "/api/v1/risk", { rx: "minus seven" });
  assert.equal(r.status, 400);
});

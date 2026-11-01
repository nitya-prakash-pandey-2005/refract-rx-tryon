import { test } from "node:test";
import assert from "node:assert/strict";
import { runAgent } from "../server/agent.js";

delete process.env.ANTHROPIC_API_KEY;
const profile = { rx: { od: { sph: -7, cyl: -0.5, axis: 180 }, os: { sph: -6.75, cyl: -0.5, axis: 175 } }, pd: { left: 31.5, right: 31.5 }, faceWidthMm: 136, faceAttr: { faceShape: "Oval", eyeColorName: "Brown" } };
const ask = (q) => runAgent({ messages: [{ role: "user", content: q }], profile });

test("planner answers a style question with a pick, numbers and buttons", async () => {
  const r = await ask("I want round frames under $100");
  assert.equal(r.provider, "planner");
  assert.match(r.reply, /Rx-Fit \d+\/100/);
  assert.ok(r.trace.some((t) => t.tool === "search_frames"));
  assert.ok(r.actions.some((a) => a.type === "open_studio"));
});

test("planner warns about oversized frames with a strong minus Rx", async () => {
  const r = await ask("I love big oversized frames");
  assert.match(r.reply, /Big frames are the hardest/);
});

test("planner reports on a named frame and offers a thinner alternative", async () => {
  const r = await ask("Is Juno a good choice for me?");
  assert.ok(r.trace.some((t) => t.tool === "lens_report" && t.input.frame_id === "juno"));
  assert.match(r.reply, /Juno/);
});

test("makeup questions use the eye-look tool", async () => {
  const r = await ask("What eyeliner should I wear with my glasses?");
  assert.ok(r.trace.some((t) => t.tool === "plan_eye_look"));
  assert.match(r.reply, /smaller/);
});

test("empty conversation gets a prompt, not an error", async () => {
  const r = await runAgent({ messages: [], profile });
  assert.equal(r.actions.length, 0);
  assert.match(r.reply, /Ask me/);
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { pareto, knee, valueOptions, picks } from "../src/engine/value.js";

test("pareto keeps only options nothing beats on both price and risk", () => {
  const pts = [{ price: 100, risk: 50 }, { price: 120, risk: 40 }, { price: 130, risk: 45 }, { price: 90, risk: 70 }, { price: 200, risk: 10 }, { price: 210, risk: 10 }];
  const front = pareto(pts).map((p) => `${p.price}/${p.risk}`);
  assert.deepEqual(front, ["90/70", "100/50", "120/40", "200/10"]);
});

test("the knee is the corner of the frontier, not an end", () => {
  const front = [{ price: 0, risk: 100 }, { price: 10, risk: 20 }, { price: 100, risk: 0 }];
  assert.deepEqual(knee(front), front[1]);
});

test("every frame × lens combination is scored, and the picks come from the frontier", () => {
  const rx = { od: { sph: -6, cyl: -0.5, axis: 180 }, os: { sph: -6, cyl: -0.5, axis: 180 } };
  const opts = valueOptions({ rx, pd: { left: 31.5, right: 31.5, plusMinus: 2.7 }, face: { bridge: "medium" }, oiliness: 60 });
  assert.equal(opts.length, 12 * 5);
  const front = pareto(opts);
  const p = picks(opts);
  for (const k of ["lowestRisk", "bestValue", "cheapestOk"]) assert.ok(front.includes(p[k]) || k === "cheapestOk", k);
  assert.ok(p.lowestRisk.risk <= Math.min(...opts.map((o) => o.risk)));
  assert.ok(p.cheapestOk.level !== "high");
  assert.ok(p.bestValue.price <= p.lowestRisk.price);
});

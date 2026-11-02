import { test } from "node:test";
import assert from "node:assert/strict";
import { simulateOrders } from "../src/engine/simulate.js";

test("simulated order stream is deterministic and adds up", () => {
  const a = simulateOrders({ n: 120, seed: 7 }), b = simulateOrders({ n: 120, seed: 7 });
  assert.deepEqual(a.summary, b.summary);
  const s = a.summary;
  assert.equal(s.n, 120);
  assert.equal(s.levels.low + s.levels.medium + s.levels.high, 120);
  for (const k of ["look", "sight", "fit", "measure"]) assert.equal(s.byPart[k].low + s.byPart[k].medium + s.byPart[k].high, 120);
  assert.ok(s.avgScore > 0 && s.avgScore < 100);
  assert.ok(s.avgScoreFixed < s.avgScore, "applying the suggested fixes lowers average risk");
});

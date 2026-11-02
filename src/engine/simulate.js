// A synthetic, seeded order stream for the retailer dashboard: what share of a store's
// prescription orders the remake-risk engine would flag, and what the suggested fixes change.
// The mix is illustrative (labelled in the UI), weighted towards common low/moderate myopia.
import { FRAMES, getFrame } from "./frames.js";
import { INDICES } from "./optics.js";
import { remakeRisk } from "./risk.js";

function mulberry32(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const quarter = (v) => Math.round(v * 4) / 4;

// Spherical-equivalent bands (share of orders): plano-ish, low, moderate, high myopia, plus.
const BANDS = [[0.2, -0.5, 0.5], [0.38, -3, -0.5], [0.22, -6, -3], [0.08, -10, -6], [0.12, 0.75, 4]];

export function simulateOrders({ n = 300, seed = 7 } = {}) {
  const rnd = mulberry32(seed);
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const gauss = (m, s) => m + s * Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(2 * Math.PI * rnd());
  const orders = [];
  for (let i = 0; i < n; i++) {
    let u = rnd(), band = BANDS[0];
    for (const b of BANDS) { if ((u -= b[0]) <= 0) { band = b; break; } }
    const sph = quarter(band[1] + rnd() * (band[2] - band[1]));
    const cyl = -quarter(rnd() < 0.55 ? rnd() * 1.5 : 0);
    const eye = (d) => ({ sph: quarter(sph + d), cyl, axis: Math.round(rnd() * 180) });
    const rx = { od: eye(0), os: eye(rnd() < 0.7 ? 0 : (rnd() - 0.5)) };
    const pdKnown = rnd() < 0.35;
    const pd = { left: gauss(31.5, 1.6), right: gauss(31.5, 1.6), plusMinus: pdKnown ? 0.5 : 2.7 };
    const face = { faceWidthMm: gauss(130, 6), noseWidthMm: gauss(13.5, 1.5), bridge: rnd() < 0.25 ? "low" : rnd() < 0.8 ? "medium" : "high" };
    const oiliness = Math.max(5, Math.min(95, gauss(58, 18)));
    const frame = pick(FRAMES);
    const r = remakeRisk({ frame, rx, pd, face, oiliness });
    // The same order after Refract's suggestions: confirmed PD, clearer material when fringes
    // are the issue, and a pad frame of similar width when the fit is the issue.
    const fixedPd = r.parts.measure.level !== "low" ? { ...pd, plusMinus: 0.5 } : pd;
    const clearer = INDICES.filter((x) => x.abbe > r.lens.best.abbe).sort((a, b) => b.abbe - a.abbe);
    const index = r.parts.sight.level !== "low" && clearer.length ? clearer.find((x) => x.n === 1.6) || clearer[0] : undefined;
    const fixedFrame = r.parts.fit.level === "high" && frame.pads === "fixed"
      ? FRAMES.filter((f) => f.pads === "adjustable").reduce((a, b) => (Math.abs(b.A - frame.A) < Math.abs(a.A - frame.A) ? b : a))
      : frame;
    const fixed = remakeRisk({ frame: getFrame(fixedFrame.id), rx, pd: fixedPd, face, oiliness, index });
    orders.push({ id: i + 1, rx, frameId: frame.id, score: r.score, level: r.level, parts: Object.fromEntries(Object.entries(r.parts).map(([k, p]) => [k, p.level])), fixedScore: fixed.score });
  }
  const count = (key) => orders.reduce((a, o) => ({ ...a, [key(o)]: (a[key(o)] || 0) + 1 }), { low: 0, medium: 0, high: 0 });
  const summary = {
    n,
    levels: count((o) => o.level),
    byPart: Object.fromEntries(["look", "sight", "fit", "measure"].map((k) => [k, count((o) => o.parts[k])])),
    avgScore: orders.reduce((a, o) => a + o.score, 0) / n,
    avgScoreFixed: orders.reduce((a, o) => a + o.fixedScore, 0) / n,
    highAfterFix: orders.filter((o) => o.fixedScore >= 55).length,
  };
  return { orders, summary };
}

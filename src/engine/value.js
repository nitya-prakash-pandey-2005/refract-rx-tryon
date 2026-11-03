// Best value for a prescription: every frame × lens combination scored for price and remake
// risk, the Pareto frontier of choices nothing beats on both, and its knee (where paying more
// stops buying much less risk).
import { FRAMES } from "./frames.js";
import { INDICES } from "./optics.js";
import { remakeRisk } from "./risk.js";

export function valueOptions({ rx, pd, face, oiliness, frames = FRAMES }) {
  const out = [];
  for (const frame of frames) {
    for (const index of INDICES) {
      const r = remakeRisk({ frame, rx, pd, face, oiliness, index });
      out.push({ frame, index, price: frame.priceUsd + index.priceUsd, risk: r.score, level: r.level, fixes: r.fixes });
    }
  }
  return out;
}

// Options not dominated on (price, risk), cheapest first.
export function pareto(opts) {
  const sorted = [...opts].sort((a, b) => a.price - b.price || a.risk - b.risk);
  const front = [];
  for (const o of sorted) if (!front.length || o.risk < front[front.length - 1].risk) front.push(o);
  return front;
}

// The frontier point furthest from the straight line joining its two ends (axes normalised).
export function knee(front) {
  if (front.length < 3) return front[front.length - 1];
  const a = front[0], b = front[front.length - 1];
  const sx = b.price - a.price || 1, sy = a.risk - b.risk || 1;
  const dist = (p) => Math.abs(((p.price - a.price) / sx) + ((p.risk - a.risk) / sy));
  return front.slice(1, -1).reduce((best, p) => (dist(p) > dist(best) ? p : best), front[1]);
}

export function picks(opts) {
  const front = pareto(opts);
  return {
    front,
    lowestRisk: front[front.length - 1],
    bestValue: knee(front),
    cheapestOk: [...opts].filter((o) => o.level !== "high").sort((a, b) => a.price - b.price || a.risk - b.risk)[0] || front[front.length - 1],
  };
}

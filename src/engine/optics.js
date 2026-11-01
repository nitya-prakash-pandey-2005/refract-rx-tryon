// Ophthalmic optics for the try-on: lens powers, sag, edge thickness, weight and how big
// the wearer's eyes look through the lens. Units: dioptres (D), millimetres, grams.
// Coordinates: contour points in mm with the optical centre (the pupil) at 0,0,
// x to the right of the photo, y down. Axes follow TABO as seen facing the wearer.

export const INDICES = [
  { n: 1.5, label: "1.50 Standard", density: 1.32, abbe: 58, minCenter: 2.0, priceUsd: 0 },
  { n: 1.59, label: "1.59 Polycarbonate", density: 1.2, abbe: 30, minCenter: 1.0, priceUsd: 30 },
  { n: 1.6, label: "1.60 Thin", density: 1.3, abbe: 42, minCenter: 1.5, priceUsd: 49 },
  { n: 1.67, label: "1.67 Extra thin", density: 1.35, abbe: 32, minCenter: 1.5, priceUsd: 89 },
  { n: 1.74, label: "1.74 Ultra thin", density: 1.47, abbe: 33, minCenter: 1.5, priceUsd: 149 },
];
export const MIN_EDGE = 1.0;
export const EDGE_TARGET = 4.5; // mm: max edge a minus lens may show before it reads "thick"
export const CENTRE_TARGET = 4.5; // mm: max centre for a plus lens

const rad = (d) => (d * Math.PI) / 180;
const asIndex = (n) => (typeof n === "number" ? INDICES.find((i) => i.n === n) : n) || INDICES[0];

export const spherEq = (rx) => rx.sph + rx.cyl / 2;

export function meridianPower(rx, thetaDeg) {
  const s = Math.sin(rad(thetaDeg - rx.axis));
  return rx.sph + rx.cyl * s * s;
}

// Apparent size of the eye seen through the lens: the eye sits d metres behind it.
export const eyeMagnification = (F, d = 0.012) => 1 / (1 - d * F);

export function sag(r, F, n) {
  if (!F) return 0;
  const R = (1000 * (n - 1)) / Math.abs(F);
  if (r >= R) return R;
  return R - Math.sqrt(R * R - r * r);
}

const angleOf = (x, y) => (((Math.atan2(-y, x) * 180) / Math.PI) % 180 + 180) % 180;
const signedSag = (x, y, rx, n) => {
  const F = meridianPower(rx, angleOf(x, y));
  return Math.sign(F) * sag(Math.hypot(x, y), F, n);
};

export function insidePolygon(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function lensProfile({ rx, contour, n, weight = true }) {
  const ix = asIndex(n);
  const sags = contour.map(([x, y]) => signedSag(x, y, rx, ix.n));
  const centre = Math.max(ix.minCenter, MIN_EDGE + Math.max(...sags));
  const edges = contour.map(([x, y], i) => ({ x, y, t: centre - sags[i] }));
  const ts = edges.map((e) => e.t);

  const xs = contour.map((p) => p[0]), ys = contour.map((p) => p[1]);
  let volume = 0;
  const step = weight ? 2 : Infinity; // mm grid; each cell is step² mm²
  for (let x = Math.floor(Math.min(...xs)) + step / 2; x < Math.max(...xs); x += step)
    for (let y = Math.floor(Math.min(...ys)) + step / 2; y < Math.max(...ys); y += step)
      if (insidePolygon(x, y, contour)) volume += (centre - signedSag(x, y, rx, ix.n)) * step * step;

  return {
    index: ix,
    centre,
    maxEdge: Math.max(...ts),
    minEdge: Math.min(...ts),
    edges,
    weightG: (volume / 1000) * ix.density,
    magnification: {
      axis: eyeMagnification(rx.sph),
      perp: eyeMagnification(rx.sph + rx.cyl),
      mean: eyeMagnification(spherEq(rx)),
    },
    abbe: ix.abbe,
  };
}

export function recommendIndex({ rx, contour }) {
  const minus = spherEq(rx) <= 0;
  const target = minus ? EDGE_TARGET : CENTRE_TARGET;
  const metric = (p) => (minus ? p.maxEdge : p.centre);
  const rows = INDICES.map((index) => ({ index, profile: lensProfile({ rx, contour, n: index }) }));
  const best = rows.find((r) => metric(r.profile) <= target) || rows[rows.length - 1];
  const table = rows.map((r) => ({
    ...r,
    verdict: r === best ? "best" : metric(r.profile) <= target ? "fits" : "too-thick",
  }));

  const plano = Math.abs(rx.sph) + Math.abs(rx.cyl) < 0.25;
  const pricier = rows.filter((r) => r.index.priceUsd > best.index.priceUsd && metric(r.profile) < metric(best.profile) - 0.05);
  const next = pricier.length ? pricier.reduce((a, b) => (metric(a.profile) < metric(b.profile) ? a : b)) : null;
  const saved = next ? metric(best.profile) - metric(next.profile) : 0;
  let note;
  if (plano) note = "No lens power, so the standard lens is all you need.";
  else if (metric(best.profile) > target) note = `Even with ${best.index.label} lenses this frame shows ${/^(8|11|18)/.test(metric(best.profile).toFixed(1)) ? "an" : "a"} ${metric(best.profile).toFixed(1)} mm ${minus ? "edge" : "centre"}. Smaller, rounder frames keep a prescription this strong thinnest.`;
  else if (next && saved < 0.5) note = `${next.index.label} would save only ${saved.toFixed(1)} mm for $${next.index.priceUsd - best.index.priceUsd} more. Not worth it.`;
  else if (next) note = `${next.index.label} saves ${saved.toFixed(1)} mm for $${next.index.priceUsd - best.index.priceUsd} more.`;
  else note = "No pricier lens makes this one meaningfully thinner.";

  return { best: best.index, profile: best.profile, table, note, metric: minus ? "edge" : "centre", target };
}

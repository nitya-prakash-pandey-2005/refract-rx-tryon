// Lenient parsing for prescription fields: accepts "−6,50", "+3", "-6.5"; returns null while
// the user is still typing ("-", "") and clamps to the given range.
export const RANGES = { sph: { min: -20, max: 12 }, cyl: { min: -6, max: 6 }, axis: { min: 0, max: 180 } };

export function parseDiopter(text, { min, max }) {
  const t = String(text ?? "").trim().replace(/[−–—]/g, "-").replace(",", ".");
  if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(t)) return null;
  const v = parseFloat(t);
  return Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : null;
}

export function sanitizeRx(rx) {
  const eye = (e = {}) => ({
    sph: parseDiopter(e.sph, RANGES.sph) ?? 0,
    cyl: parseDiopter(e.cyl, RANGES.cyl) ?? 0,
    axis: Math.round(parseDiopter(e.axis, RANGES.axis) ?? 0),
  });
  return { od: eye(rx?.od), os: eye(rx?.os) };
}

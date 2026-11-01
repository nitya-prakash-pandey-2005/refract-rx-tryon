// Rx-Fit: how well a frame suits this face *and this prescription*.
// Score = 95 + 100 × Σ driver contributions, clamped to 0..100. Drivers explain the score.
import { FRAMES, frameContour } from "./frames.js";
import { INDICES, recommendIndex, lensProfile, spherEq, EDGE_TARGET, CENTRE_TARGET } from "./optics.js";

export const PUPIL_ABOVE_BOX_CENTRE = 2; // mm
export const ENDPIECE = 4; // mm per side

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const r1 = (v) => Math.round(v * 10) / 10;

// Contour of one eye's lens relative to its optical centre (the pupil), in image coordinates.
export function lensContourAtOC(frame, monoPd, side) {
  const dec = (frame.A + frame.DBL) / 2 - monoPd; // > 0: pupil sits nasal of the box centre
  const flip = side === "od" ? -1 : 1; // od = wearer's right eye = image-left lens
  return frameContour(frame).map(([x, y]) => [flip * x + flip * dec, y + PUPIL_ABOVE_BOX_CENTRE]);
}

export function lensPair({ frame, rx, pd, index, weight = true }) {
  const od = lensContourAtOC(frame, pd.right, "od");
  const os = lensContourAtOC(frame, pd.left, "os");
  if (index) return { best: index, od: lensProfile({ rx: rx.od, contour: od, n: index, weight }), os: lensProfile({ rx: rx.os, contour: os, n: index, weight }) };
  const recOd = recommendIndex({ rx: rx.od, contour: od });
  const recOs = recommendIndex({ rx: rx.os, contour: os });
  const lead = recOd.best.n >= recOs.best.n ? recOd : recOs;
  const best = lead.best;
  return {
    best,
    note: lead.note,
    table: lead.table,
    metric: lead.metric,
    target: lead.target,
    od: lensProfile({ rx: rx.od, contour: od, n: best }),
    os: lensProfile({ rx: rx.os, contour: os, n: best }),
  };
}

export function fitFrame({ frame, rx, pd, faceWidthMm, faceShape }) {
  const lens = lensPair({ frame, rx, pd });
  const strongest = Math.abs(spherEq(rx.od)) >= Math.abs(spherEq(rx.os)) ? rx.od : rx.os;
  const plano = Math.abs(rx.od.sph) + Math.abs(rx.od.cyl) + Math.abs(rx.os.sph) + Math.abs(rx.os.cyl) < 0.25;
  const minus = spherEq(strongest) <= 0;
  const thick = minus ? Math.max(lens.od.maxEdge, lens.os.maxEdge) : Math.max(lens.od.centre, lens.os.centre);
  const totalWidth = 2 * frame.A + frame.DBL + 2 * ENDPIECE;
  const dec = Math.max(Math.abs((frame.A + frame.DBL) / 2 - pd.left), Math.abs((frame.A + frame.DBL) / 2 - pd.right));
  const drivers = [];

  if (!plano) {
    drivers.push({ feature: "thickness", label: `${minus ? "Edge" : "Centre"} ${r1(thick)} mm at ${lens.best.label.split(" ")[0]}`, contribution: -clamp((thick - 3) * 9, 0, 90) / 100 });
    if (lens.best.priceUsd) drivers.push({ feature: "cost", label: `Needs ${lens.best.label} (+$${lens.best.priceUsd})`, contribution: -(lens.best.priceUsd / 149) * 0.08 });
    drivers.push({ feature: "decentration", label: `Lens centre moved ${r1(dec)} mm`, contribution: -clamp((dec - 4) * 2, 0, 12) / 100 });
  }
  if (faceWidthMm) {
    const d = totalWidth - faceWidthMm;
    const widthWeight = !plano && thick > (minus ? EDGE_TARGET : CENTRE_TARGET) ? 0.5 : 1; // thick lenses dominate the look
    drivers.push({ feature: "width", label: d > 0 ? `${r1(d)} mm wider than your face` : `${r1(-d)} mm narrower than your face`, contribution: (-clamp((Math.abs(d) - 3) * 3, 0, 25) / 100) * widthWeight });
  }
  if (faceShape) {
    const ok = frame.faceShapes.includes(faceShape.toLowerCase());
    drivers.push({ feature: "faceShape", label: ok ? `Flatters a ${faceShape.toLowerCase()} face` : `Less suited to a ${faceShape.toLowerCase()} face`, contribution: ok ? 0.05 : -0.06 });
  }

  const sum = drivers.reduce((a, d) => a + d.contribution, 0);
  const score = clamp(Math.round(95 + 100 * sum), 0, 100);
  const pdOk = pd.left > 0 && pd.right > 0;
  return { score, drivers, lens, totalWidth, decentration: dec, pdOk, thick, minus, plano };
}

export function rankFrames(ctx, frames = FRAMES) {
  return frames.map((frame) => ({ frame, fit: fitFrame({ frame, ...ctx }) })).sort((a, b) => b.fit.score - a.fit.score || a.fit.thick - b.fit.thick);
}

export { INDICES };

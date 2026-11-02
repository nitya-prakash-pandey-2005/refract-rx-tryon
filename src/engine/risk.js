// Remake-risk engine: will this pair of glasses fail after purchase? Four independent ways
// glasses get returned or remade, each from physics or a standard, each explained:
//   look    — lens edge/centre thickness and how much the eyes shrink or grow (optics.js)
//   sight   — colour fringing from the lens material at a normal side glance (sight.js)
//   fit     — sliding down the nose: weight vs friction on the nose pads and temple grip
//   measure — prism induced by PD uncertainty at this power (Prentice; ANSI Z80.1 tolerance)
import { lensPair } from "./fit.js";
import { spherEq, EDGE_TARGET, CENTRE_TARGET } from "./optics.js";
import { tca, TCA_THRESHOLD } from "./sight.js";

const G = 9.81;
export const FIT = {
  noseShare: 0.65, // share of spectacle weight carried by the nose (rest on the ears)
  slopeDeg: 30, // effective incline of the nasal surface the pads sit on
  mu: { adjustable: 0.61, fixed: 0.45 }, // in-vivo skin friction: silicone 0.61 (Zhang & Mak 1999); hard pads ~0.45
  oilLoss: { adjustable: 0.15, fixed: 0.4 }, // grip lost on the oiliest skin: lipid films lubricate hard, smooth pads most
  bridge: { low: 0.6, medium: 1, high: 1.1 }, // fixed bridges sit poorly on low nasal bridges
  gripPerMm: 0.08, // N of temple clamping per mm the head is wider than the frame front
  gripMax: 0.68, // 2 × 0.34 N, the most comfortable clamp per temple (Zhang, Chen & Luximon 2024)
  holdN: 0.08, // weight-independent hold: ear support and pad adhesion
  dynamicG: 0.3, // head movement (walking, nodding) adds ~0.3 g of tangential load
  padAreaMm2: { adjustable: 144, fixed: 80 }, // pad area × contact fraction (hard bridges touch only part of the nose)
  marksKPa: 4.3, // sustained pressure above capillary closure (~32 mmHg) leaves marks
  painKPa: 14.7, // design upper limit for nose pads (150 g/cm²)
};
export const PRISM_TOLERANCE = 0.67; // ANSI Z80.1 unwanted horizontal prism (Δ)

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const r1 = (v) => Math.round(v * 10) / 10;
const level = (x, med, high) => (x >= high ? "high" : x >= med ? "medium" : "low");

export function slipRisk({ frame, lensWeightG, face = {}, oiliness = 60 }) {
  const totalWeightG = frame.weightG + lensWeightG;
  const Wn = (totalWeightG / 1000) * G * FIT.noseShare;
  const th = (FIT.slopeDeg * Math.PI) / 180;
  const pads = frame.pads || "fixed";
  const oil = 1 - FIT.oilLoss[pads] * (1 - clamp(oiliness, 0, 100) / 100); // oiliness score: higher = less oily
  const bridgeKey = face.bridge || "medium";
  let bridge = FIT.bridge[bridgeKey] ?? 1;
  if (bridgeKey === "low" && (pads === "adjustable" || frame.lowBridgeFit)) bridge = 0.95; // pads/raised bridge reach the nose
  const gap = pads === "fixed" && face.noseWidthMm ? Math.max(0, frame.DBL - (face.noseWidthMm + 6)) : 0;
  const seat = clamp(1 - 0.06 * gap, 0.5, 1); // bridge wider than the nose: frame drops onto the cheeks
  const muEff = FIT.mu[pads] * oil * bridge * seat;
  const frontW = 2 * frame.A + frame.DBL + 8;
  const grip = face.faceWidthMm ? clamp((face.faceWidthMm - frontW + 4) * FIT.gripPerMm, 0, FIT.gripMax) : 0.2;
  // Static friction alone is weight-independent; real slips happen when head movement adds
  // inertial load (∝ mass) against holds that do not grow with mass (ears, pad adhesion, grip).
  const margin = (muEff * Wn * Math.cos(th) + FIT.holdN + grip) / (Wn * (Math.sin(th) + FIT.dynamicG));
  const pressureKPa = (Wn / FIT.padAreaMm2[pads]) * 1000;

  const drivers = [
    { label: `${r1(totalWeightG)} g on your face (lenses ${r1(lensWeightG)} g)`, contribution: -clamp((totalWeightG - 25) / 60, 0, 0.5) },
    { label: oiliness < 50 ? `Oily T-zone (YouCam oiliness ${Math.round(oiliness)}/100)` : `T-zone oiliness ${Math.round(oiliness)}/100`, contribution: -clamp((60 - oiliness) / 120, 0, 0.4) },
    { label: pads === "adjustable" ? "Adjustable silicone nose pads" : `Fixed acetate bridge${gap ? `, ${r1(gap)} mm wider than your nose` : ""}`, contribution: pads === "adjustable" ? 0.1 : -clamp(0.1 + gap * 0.04, 0, 0.4) },
    { label: grip > 0.05 ? "Temples grip your head" : "Frame wider than your head: no temple grip", contribution: grip > 0.05 ? clamp(grip / 2, 0, 0.3) : -0.15 },
  ];
  if (bridgeKey === "low") drivers.push({ label: frame.lowBridgeFit ? "Low-bridge fit: raised bridge" : "Low nasal bridge", contribution: frame.lowBridgeFit || pads === "adjustable" ? 0.05 : -0.3 });

  const fixes = [];
  if (pads === "fixed" && (bridgeKey === "low" || gap > 2)) fixes.push("Choose a frame with adjustable nose pads or a low-bridge fit");
  if (lensWeightG > 12) fixes.push("A higher-index lens cuts lens weight");
  if (oiliness < 50) fixes.push("Silicone pads hold better on an oily nose");
  if (grip <= 0.05) fixes.push("Ask for the temples to be adjusted for a snugger fit");

  return {
    margin,
    level: margin < 1.0 ? "high" : margin < 1.5 ? "medium" : "low",
    totalWeightG,
    pressureKPa,
    pressureLevel: pressureKPa > FIT.painKPa ? "painful" : pressureKPa > FIT.marksKPa ? "marks" : "ok",
    drivers,
    fixes,
    inputs: { pads, bridge: bridgeKey, oiliness, gapMm: gap, gripN: grip, frictionCoeff: muEff },
  };
}

// PD measured with uncertainty ±e mm puts the optical centres up to e/2 mm off per eye; the
// induced horizontal prism (Prentice) is (e / 10) × |F| in total for symmetric powers.
export function pdRisk({ rx, pdPlusMinus }) {
  const F = Math.max(Math.abs(rx.od.sph + rx.od.cyl * 0), Math.abs(rx.os.sph), Math.abs(rx.od.sph + rx.od.cyl), Math.abs(rx.os.sph + rx.os.cyl));
  const inducedPrism = (pdPlusMinus / 10) * F;
  return {
    inducedPrism,
    level: inducedPrism <= PRISM_TOLERANCE ? "low" : inducedPrism <= PRISM_TOLERANCE * 1.5 ? "medium" : "high",
    toleranceMm: F ? (PRISM_TOLERANCE * 10) / F : Infinity,
  };
}

export function remakeRisk({ frame, rx, pd, face = {}, oiliness = 60, index }) {
  const lens = lensPair({ frame, rx, pd, index, rowWeights: false });
  const se = [spherEq(rx.od), spherEq(rx.os)].reduce((a, b) => (Math.abs(b) > Math.abs(a) ? b : a));
  const minus = se <= 0;
  const thick = minus ? Math.max(lens.od.maxEdge, lens.os.maxEdge) : Math.max(lens.od.centre, lens.os.centre);
  const target = minus ? EDGE_TARGET : CENTRE_TARGET;
  const eyePct = Math.abs(((lens.od.magnification.mean + lens.os.magnification.mean) / 2 - 1) * 100);

  const lookX = clamp((thick - target) / 4, 0, 1) * 0.7 + clamp((eyePct - 4) / 8, 0, 1) * 0.3;
  const strongest = Math.max(Math.abs(rx.od.sph), Math.abs(rx.os.sph), Math.abs(rx.od.sph + rx.od.cyl), Math.abs(rx.os.sph + rx.os.cyl));
  const fringe = tca(strongest, 10, lens.best.abbe);
  const sightX = clamp((fringe - TCA_THRESHOLD * 0.8) / (TCA_THRESHOLD * 1.5), 0, 1);
  const slip = slipRisk({ frame, lensWeightG: lens.od.weightG + lens.os.weightG, face, oiliness });
  const fitX = clamp((1.8 - slip.margin) / 1.2, 0, 1);
  const pdr = pdRisk({ rx, pdPlusMinus: pd.plusMinus ?? 2.5 });
  const measureX = clamp((pdr.inducedPrism - PRISM_TOLERANCE * 0.6) / (PRISM_TOLERANCE * 1.4), 0, 1);

  const parts = {
    look: { x: lookX, level: level(lookX, 0.35, 0.65), headline: `${r1(thick)} mm ${minus ? "edge" : "centre"} · eyes ${minus ? "−" : "+"}${r1(eyePct)}%`, fix: thick > target ? "Smaller, rounder frame or a higher index" : null },
    sight: { x: sightX, level: level(sightX, 0.35, 0.65), headline: `${fringe.toFixed(2)} Δ colour split at a 10 mm glance (${lens.best.label})`, fix: fringe > TCA_THRESHOLD ? "A higher-Abbe material (1.60 or 1.50) keeps edges clean" : null },
    fit: { x: fitX, level: slip.level, headline: `slip margin ${r1(slip.margin)}× · ${r1(slip.totalWeightG)} g`, fix: slip.fixes[0] || null, detail: slip },
    measure: { x: measureX, level: pdr.level, headline: `${pdr.inducedPrism.toFixed(2)} Δ possible prism from PD ±${r1(pd.plusMinus ?? 2.5)} mm`, fix: pdr.level !== "low" ? `Confirm PD to ±${r1(Math.min(pdr.toleranceMm, 3))} mm (card or optician)` : null, detail: pdr },
  };
  const score = Math.round(100 * (0.25 * lookX + 0.2 * sightX + 0.3 * fitX + 0.25 * measureX));
  const fixes = Object.values(parts).map((p) => p.fix).filter(Boolean);
  return { score, level: score >= 55 ? "high" : score >= 30 ? "medium" : "low", parts, fixes, lens };
}

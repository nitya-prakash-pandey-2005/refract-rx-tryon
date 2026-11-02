// What the WEARER will see through a lens material: transverse chromatic aberration (colour
// fringes) when looking away from the optical centre.
//   Prentice's rule: prism P (Δ) = c (cm) × F (D)
//   Transverse chromatic aberration: TCA (Δ) = P / V   (V = Abbe number of the material)
// Fringes become noticeable at roughly 0.1 Δ of TCA (constant refined from the literature).
import { INDICES, spherEq } from "./optics.js";

export const TCA_THRESHOLD = 0.1; // prism dioptres
export const ARCMIN_PER_PRISM = 34.38; // 1 Δ = 1 cm per m = 0.573° = 34.38′
// Winter et al., JOSA A 2015: induced TCA is perceived as ~0.49 arcmin per prism dioptre of
// a V≈32 lens, and foveal acuity drops ~0.032 logMAR per arcmin (one chart line = 0.1 logMAR).
export const PERCEIVED_ARCMIN_PER_PRISM_V32 = 0.49;
export const LOGMAR_PER_ARCMIN = 0.032;
// Perceived colour split (arcmin) when looking through `prism` Δ of a material with Abbe `abbe`.
export const perceivedArcmin = (prism, abbe = 32) => PERCEIVED_ARCMIN_PER_PRISM_V32 * prism * (32 / abbe);
// Lines of letter-chart acuity lost at that point (0.1 logMAR per line).
export const acuityLossLines = (prism, abbe) => (perceivedArcmin(prism, abbe) * LOGMAR_PER_ARCMIN) / 0.1;

export const prismAt = (F, offsetMm) => Math.abs((offsetMm / 10) * F);
export const tca = (F, offsetMm, abbe) => prismAt(F, offsetMm) / abbe;
export const fringeArcmin = (tcaDelta) => tcaDelta * ARCMIN_PER_PRISM;

// Radius (mm from the optical centre) inside which colour fringes stay below the threshold.
export function cleanZoneRadiusMm(F, abbe, threshold = TCA_THRESHOLD) {
  if (!F) return Infinity;
  return ((threshold * abbe) / Math.abs(F)) * 10;
}

// Every lens material for one eye's prescription: clean-zone size, fringe at a typical
// 10 mm reading/side glance, and a plain-language verdict.
export function materialSight(rx, glanceMm = 10) {
  const F = Math.abs(spherEq(rx)) >= Math.abs(rx.sph + rx.cyl) ? spherEq(rx) : rx.sph + rx.cyl;
  const strongest = Math.max(Math.abs(rx.sph), Math.abs(rx.sph + rx.cyl));
  return INDICES.map((index) => {
    const r = cleanZoneRadiusMm(strongest, index.abbe);
    const t = tca(strongest, glanceMm, index.abbe);
    const verdict = !F || r === Infinity ? "No fringing at your power."
      : t < TCA_THRESHOLD ? "Clean: no visible colour fringes at a normal side glance."
      : t < TCA_THRESHOLD * 1.6 ? "Faint fringes when you look sideways through the lens edge."
      : "Visible rainbow edges when you glance sideways; many people notice this.";
    return { index, abbe: index.abbe, cleanZoneMm: r === Infinity ? Infinity : Math.min(2 * r, 99), tcaAt10mm: t, fringeArcmin: fringeArcmin(t), linesLost: acuityLossLines(prismAt(strongest, glanceMm), index.abbe), verdict };
  });
}

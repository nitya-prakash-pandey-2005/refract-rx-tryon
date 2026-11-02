// What the WEARER will see through a lens material: transverse chromatic aberration (colour
// fringes) when looking away from the optical centre.
//   Prentice's rule: prism P (Δ) = c (cm) × F (D)
//   Transverse chromatic aberration: TCA (Δ) = P / V   (V = Abbe number of the material)
// Fringes become noticeable at roughly 0.1 Δ of TCA (constant refined from the literature).
import { INDICES, spherEq } from "./optics.js";

export const TCA_THRESHOLD = 0.1; // prism dioptres
export const ARCMIN_PER_PRISM = 34.38; // 1 Δ = 1 cm per m = 0.573° = 34.38′

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
    return { index, abbe: index.abbe, cleanZoneMm: Math.min(2 * r, 99), tcaAt10mm: t, fringeArcmin: fringeArcmin(t), verdict };
  });
}

// Rx-tuned eye makeup. Minus lenses shrink the eyes for everyone looking at you, plus lenses
// magnify them (and every smudge). The rules follow optician / makeup-artist guidance
// (Zeiss, Make Up For Ever): brighten and open behind minus lenses; matte, fine and precise
// behind plus lenses. Output is a ready-to-send YouCam makeup-vto `effects` array.
import { spherEq, eyeMagnification } from "./optics.js";

// ---------- colour helpers ----------
const clampByte = (v) => Math.max(0, Math.min(255, Math.round(v)));
export const hexToRgb = (hex) => {
  const h = (hex || "#000000").replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};
export const rgbToHex = (rgb) => "#" + rgb.map((v) => clampByte(v).toString(16).padStart(2, "0")).join("").toUpperCase();
export function hexToLab(hex) {
  const lin = hexToRgb(hex).map((v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  const X = (lin[0] * 0.4124 + lin[1] * 0.3576 + lin[2] * 0.1805) / 0.95047;
  const Y = lin[0] * 0.2126 + lin[1] * 0.7152 + lin[2] * 0.0722;
  const Z = (lin[0] * 0.0193 + lin[1] * 0.1192 + lin[2] * 0.9505) / 1.08883;
  const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (841 / 108) * t + 4 / 29);
  return { L: 116 * f(Y) - 16, a: 500 * (f(X) - f(Y)), b: 200 * (f(Y) - f(Z)) };
}
export const mixHex = (a, b, t) => rgbToHex(hexToRgb(a).map((v, i) => v + (hexToRgb(b)[i] - v) * t));

// ---------- palettes by eye colour (complementary hues) ----------
const SHADES = {
  Brown: { name: "Champagne · Taupe · Bronze", light: "#F3E3D3", mid: "#C89B7B", deep: "#8A5A44" },
  Amber: { name: "Cream · Plum · Olive", light: "#F2E4DA", mid: "#B48A98", deep: "#6F6A3E" },
  Blue: { name: "Peach · Copper · Cinnamon", light: "#F6E1D3", mid: "#D49A7A", deep: "#A0603F" },
  Green: { name: "Pearl · Mauve · Plum", light: "#F1E0E6", mid: "#B98AA0", deep: "#7E4E66" },
  Gray: { name: "Ivory · Rose · Charcoal", light: "#EEE3E8", mid: "#A99AA8", deep: "#6E6470" },
};
const shadesFor = (eye) => SHADES[eye] || SHADES.Brown;

export function lensClass(rx) {
  const se = strongestSE(rx);
  return Math.abs(se) < 1 ? "neutral" : se < 0 ? "minus" : "plus";
}
const strongestSE = (rx) => [spherEq(rx.od), spherEq(rx.os)].reduce((a, b) => (Math.abs(b) > Math.abs(a) ? b : a));
const pct = (m) => Math.abs((m - 1) * 100).toFixed(1);
const fmtD = (v) => (v > 0 ? "+" : "") + v.toFixed(2);

const shimmer = (color, colorIntensity, shimmerIntensity) => ({ color, texture: "shimmer", shimmerColor: mixHex(color, "#FFFFFF", 0.6), shimmerIntensity, colorIntensity });
const matte = (color, colorIntensity) => ({ color, texture: "matte", colorIntensity });
const smooth = { category: "skin_smooth", skinSmoothStrength: 15, skinSmoothColorIntensity: 15 };
const browColor = (faceAttr) => (faceAttr?.eyebrowColor && /^#[0-9a-f]{6}$/i.test(faceAttr.eyebrowColor) ? faceAttr.eyebrowColor.toUpperCase() : "#4A3426");
const concealerColor = (skinHex) => mixHex(skinHex && /^#[0-9a-f]{6}$/i.test(skinHex) ? skinHex : "#C69C7E", "#FFF4E8", 0.12);

export function planLook({ rx, faceAttr = {}, skin = {}, skinHex }) {
  const cls = lensClass(rx);
  const se = strongestSE(rx);
  const m = eyeMagnification(se);
  const s = shadesFor(faceAttr.eyeColorName);
  const strength = Math.min(1, Math.abs(se) / 8);
  const reasons = [];
  let effects, products, name;

  if (cls === "minus") {
    name = "Open & Brighten";
    reasons.push(`Your ${fmtD(se)} D lenses make your eyes look about ${pct(m)}% smaller to everyone else.`);
    reasons.push("Light, shimmering lid shades catch light and visibly open the eye behind a minus lens.");
    reasons.push("A thin upper liner with a short tip defines without closing the eye; a heavy rim would shrink it further.");
    reasons.push("Volumising, lifted lashes add back the height the lens takes away.");
    if (faceAttr.eyelid === "Hooded-lid") reasons.push("Hooded lids: the shimmer stays on the mobile lid so it shows when your eyes are open.");
    reasons.push("Defined brows keep your face framed above the rim.");
    const k = Math.round(45 + 30 * strength);
    effects = [
      { category: "eye_shadow", pattern: { name: "3colors4" }, palettes: [shimmer(s.light, k, 60), shimmer(mixHex(s.light, s.mid, 0.55), k - 5, 45), matte(mixHex(s.mid, s.deep, 0.35), k - 15)] },
      { category: "eye_liner", pattern: { name: "HalfRim21" }, palettes: [matte("#3B2A22", Math.round(50 + 20 * strength))] },
      { category: "eyelashes", pattern: { name: "Upper&Lower5" }, palettes: [{ color: "#141414", colorIntensity: Math.round(60 + 25 * strength) }] },
      { category: "eyebrows", pattern: { type: "shape", name: "Original12", curvature: 0, thickness: 10, definition: 55 }, palettes: [matte(browColor(faceAttr), 55)] },
      { category: "concealer", palettes: [{ color: concealerColor(skinHex), colorIntensity: 40, colorUnderEyeIntensity: 45, coverageLevel: 40 }] },
      smooth,
    ];
    products = [
      { id: "lid-trio", name: "Bright Lid Trio", shade: s.name, hex: s.light, priceUsd: 24 },
      { id: "fine-liner", name: "Fine Line Liquid Liner", shade: "Espresso", hex: "#3B2A22", priceUsd: 16 },
      { id: "lift-mascara", name: "Lift & Volume Mascara", shade: "Black", hex: "#141414", priceUsd: 18 },
      { id: "brow-pencil", name: "Brow Definer", shade: "Matched to your brows", hex: browColor(faceAttr), priceUsd: 14 },
      { id: "brightener", name: "Inner-Corner Brightener", shade: "Light", hex: concealerColor(skinHex), priceUsd: 20 },
    ];
  } else if (cls === "plus") {
    name = "Soft & Precise";
    reasons.push(`Your ${fmtD(se)} D lenses magnify your eyes by about ${pct(m)}%, so every detail shows.`);
    reasons.push("Matte, neutral shades only: shimmer and fallout look bigger through a plus lens.");
    reasons.push("A fine, precise liner; anything heavier reads twice as heavy behind the lens.");
    reasons.push("Clean, separated lashes; clumps are magnified.");
    const dc = skin.darkCircle;
    const under = dc != null && dc < 50 ? 72 : 50;
    if (dc != null && dc < 50) reasons.push(`Your dark-circle score is ${dc}/100 and the lens enlarges that area by about ${pct(m * m)}%, so the concealer works harder there.`);
    if (skin.crowfeet != null && skin.crowfeet < 55) reasons.push("Fine lines at the outer corner are magnified too, so we keep shimmer away from them.");
    effects = [
      { category: "eye_shadow", pattern: { name: "2colors1" }, palettes: [matte(mixHex(s.light, s.mid, 0.35), 45), matte(s.deep, 45)] },
      { category: "eye_liner", pattern: { name: "HalfRim3" }, palettes: [matte("#4A3A33", 35)] },
      { category: "eyelashes", pattern: { name: "Natural17" }, palettes: [{ color: "#1E1A18", colorIntensity: 45 }] },
      { category: "eyebrows", pattern: { type: "shape", name: "Original2", curvature: 0, thickness: 0, definition: 35 }, palettes: [matte(browColor(faceAttr), 45)] },
      { category: "concealer", palettes: [{ color: concealerColor(skinHex), colorIntensity: 50, colorUnderEyeIntensity: under, coverageLevel: under > 60 ? 65 : 50 }] },
      smooth,
    ];
    products = [
      { id: "matte-duo", name: "Matte Lid Duo", shade: s.name.split(" · ").slice(0, 2).join(" · "), hex: s.deep, priceUsd: 20 },
      { id: "precision-liner", name: "Precision Liner", shade: "Soft brown", hex: "#4A3A33", priceUsd: 16 },
      { id: "define-mascara", name: "Clean Define Mascara", shade: "Brown-black", hex: "#1E1A18", priceUsd: 16 },
      { id: "brow-pencil", name: "Brow Definer", shade: "Matched to your brows", hex: browColor(faceAttr), priceUsd: 14 },
      { id: "under-eye", name: "Under-Eye Corrector", shade: "Light", hex: concealerColor(skinHex), priceUsd: 22 },
    ];
  } else {
    name = "Everyday Natural";
    reasons.push(`Your prescription is mild (${fmtD(se)} D): lenses change how your eyes look by only ${pct(m)}%, so no compensation is needed.`);
    reasons.push("A light, natural everyday look.");
    effects = [
      { category: "eye_shadow", pattern: { name: "2colors1" }, palettes: [matte(s.light, 40), matte(s.mid, 40)] },
      { category: "eye_liner", pattern: { name: "HalfRim21" }, palettes: [matte("#3B2A22", 45)] },
      { category: "eyelashes", pattern: { name: "Natural17" }, palettes: [{ color: "#1A1A1A", colorIntensity: 50 }] },
      { category: "eyebrows", pattern: { type: "shape", name: "Original2", curvature: 0, thickness: 0, definition: 40 }, palettes: [matte(browColor(faceAttr), 45)] },
      smooth,
    ];
    products = [
      { id: "lid-duo", name: "Everyday Lid Duo", shade: s.name.split(" · ").slice(0, 2).join(" · "), hex: s.mid, priceUsd: 18 },
      { id: "fine-liner", name: "Fine Line Liquid Liner", shade: "Espresso", hex: "#3B2A22", priceUsd: 16 },
      { id: "define-mascara", name: "Clean Define Mascara", shade: "Black", hex: "#1A1A1A", priceUsd: 16 },
    ];
  }
  return { id: "rx", name, lensClass: cls, reasons, effects, products };
}

// The look a generic tutorial would give you, not adjusted for lenses (used for A/B).
export function genericLook() {
  return {
    id: "generic",
    name: "Classic Smoky (not lens-aware)",
    lensClass: null,
    reasons: ["A standard smoky-eye look from a typical tutorial, not adjusted for your lenses."],
    effects: [
      { category: "eye_shadow", pattern: { name: "3colors8" }, palettes: [matte("#B9A49A", 60), matte("#5E4A44", 70), matte("#2B2120", 75)] },
      { category: "eye_liner", pattern: { name: "FullRim5" }, palettes: [matte("#101010", 80)] },
      { category: "eyelashes", pattern: { name: "Upper&Lower4" }, palettes: [{ color: "#0E0E0E", colorIntensity: 80 }] },
      { category: "eyebrows", pattern: { type: "shape", name: "Original10", curvature: 0, thickness: 20, definition: 70 }, palettes: [matte("#2E2420", 65)] },
      smooth,
    ],
    products: [
      { id: "smoky-trio", name: "Smoky Trio", shade: "Taupe · Cocoa · Black", hex: "#2B2120", priceUsd: 24 },
      { id: "kohl", name: "Kohl Liner", shade: "Black", hex: "#101010", priceUsd: 14 },
      { id: "drama-mascara", name: "Drama Mascara", shade: "Black", hex: "#0E0E0E", priceUsd: 18 },
    ],
  };
}

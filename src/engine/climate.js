// Fit through the day. YouCam measures nose oiliness once, indoors; skin makes more sebum as
// it warms (about 10% more per °C of local skin temperature: Cunliffe, Burton & Shuster 1970),
// so the same nose pads grip less on a hot afternoon. A seeded Monte Carlo samples head posture
// and local temperature for every hour of the day and counts how often the slip margin falls
// below 1 (the frame creeps down).
import { slipRisk, FIT } from "./risk.js";

export const SEBUM_PER_C = 0.1;
export const SKIN_PER_AIR = 0.3; // °C of nose-skin temperature per °C of air (model assumption)
export const SCAN_AIR_C = 22;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// Oiliness score (YouCam scale: 1-100, higher = less oily) at a given air temperature.
export function oilinessAt(score, airC, scanAirC = SCAN_AIR_C) {
  const oil = 100 - score;
  return clamp(100 - oil * (1 + SEBUM_PER_C) ** (SKIN_PER_AIR * (airC - scanAirC)), 1, 100);
}

// Hourly air temperature: coolest at 06:00, warmest at 15:00.
export function dayTemps(meanC, swingC) {
  return Array.from({ length: 24 }, (_, h) => {
    const phase = h >= 6 && h <= 15 ? ((h - 6) / 9) * Math.PI : h > 15 ? Math.PI + ((h - 15) / 15) * Math.PI : Math.PI + ((h + 9) / 15) * Math.PI;
    return meanC - (swingC / 2) * Math.cos(phase);
  });
}

function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// P(slip) for each hour. Head pitch: mostly looking down at a phone or desk (mean 20°, sd 12°,
// 0-55°); local skin temperature varies ±1.5 °C around the hour's air temperature.
export function slipDay({ frame, lensWeightG, face, score, temps, n = 300, seed = 7, wake = [7, 23] }) {
  const r = rng(seed);
  const gauss = () => Math.sqrt(-2 * Math.log(r() + 1e-9)) * Math.cos(2 * Math.PI * r());
  const hours = temps.map((airC, h) => {
    let slips = 0;
    for (let i = 0; i < n; i++) {
      const pitchDeg = clamp(FIT.phonePitchDeg + 12 * gauss(), 0, 55);
      const oiliness = oilinessAt(score, airC + 1.5 * gauss());
      if (slipRisk({ frame, lensWeightG, face, oiliness, pitchDeg }).margin < 1) slips++;
    }
    return { h, airC, oiliness: oilinessAt(score, airC), p: slips / n, awake: h >= wake[0] && h < wake[1] };
  });
  const awake = hours.filter((x) => x.awake);
  // Expected hours of creeping while awake (sum of hourly probabilities): heat matters most for
  // frames near the slip threshold, which a yes/no count per hour would hide.
  const expectedHours = awake.reduce((a, x) => a + x.p, 0);
  return { hours, expectedHours, slipHours: awake.filter((x) => x.p >= 0.5).length, wakingHours: awake.length, worst: awake.reduce((a, b) => (b.p > a.p ? b : a)) };
}

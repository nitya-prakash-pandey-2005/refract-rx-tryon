// Photochromic (light-reactive) lenses as photochemistry. UV light opens naphthopyran dye
// molecules into a coloured form; heat closes them again (thermal fade). With c the coloured
// fraction:
//   dc/dt = k_act · UV · (1 − c) − k_fade(T) · c,  k_fade(T) = k_ref · exp(−Ea/R · (1/T − 1/T_ref))
// so lenses darken less when hot, fade back slower when cold, and barely react behind glass
// that blocks UV. Transmission follows Beer-Lambert: T = T_clear · 10^(−OD_max · c).
// Calibration (measured lenses, Moon et al., PLoS ONE 2020, 12 lenses): fade half-lives of
// 38–198 s at 21 °C and 2.7–5.4× slower at 6 °C; darkening within 20–30 s. We model a fast
// current lens (half-life 45 s at 21 °C). Fading roughly triples per 10 °C, i.e. Ea ≈ 80 kJ/mol
// (naphthopyran and spiro-oxazine dyes measure 63–82 kJ/mol in solution).
export const PC = {
  kAct: 0.00348, // per second per UV-index unit: about 25% light in full sun at 21 °C
  kRef: Math.LN2 / 45, // thermal fade at 21 °C
  tRefC: 21,
  EaKJ: 80, // activation energy of the ring-closing reaction, kJ/mol
  odMax: 0.9, // optical density of the fully coloured dye
  clear: 0.95, // transmission when clear (AR-coated lens)
};
// UV index seen by the lens: open sky, overcast, and behind a windshield, which blocks about
// 96% of UVA (Boxer Wachler, JAMA Ophthalmol 2016).
export const UV = { sun: 8, cloud: 3, car: 8 * 0.04 };

const R = 8.314;
export const kFade = (tempC) => PC.kRef * Math.exp(-((PC.EaKJ * 1000) / R) * (1 / (tempC + 273.15) - 1 / (PC.tRefC + 273.15)));
export const equilibrium = (uv, tempC) => (PC.kAct * uv) / (PC.kAct * uv + kFade(tempC));
export const transmission = (c) => PC.clear * 10 ** (-PC.odMax * c);

// Closed-form solution, phase by phase: outdoors at `uv`, then indoors (no UV).
export function simulate({ uv, tempC, outdoorS = 300, indoorS = 600, dt = 5 }) {
  const out = [];
  const kOut = PC.kAct * uv + kFade(tempC), cEq = equilibrium(uv, tempC), kIn = kFade(tempC);
  let cEnd = 0;
  for (let t = 0; t <= outdoorS + indoorS; t += dt) {
    let c;
    if (t <= outdoorS) { c = cEq * (1 - Math.exp(-kOut * t)); cEnd = c; }
    else c = cEnd * Math.exp(-kIn * (t - outdoorS));
    out.push({ t, c, T: transmission(c) });
  }
  return out;
}

// Seconds to reach 90% of the final darkness, and to fade back to 90% of clear transmission.
export function summary({ uv, tempC }) {
  const cEq = equilibrium(uv, tempC), kOut = PC.kAct * uv + kFade(tempC), kIn = kFade(tempC);
  const cClear = -Math.log10(0.9) / PC.odMax; // coloured fraction where T is 90% of clear
  return {
    darkest: transmission(cEq),
    darkenS: Math.log(10) / kOut,
    clearS: cEq > cClear ? Math.log(cEq / cClear) / kIn : 0,
  };
}

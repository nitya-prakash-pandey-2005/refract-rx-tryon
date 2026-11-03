// Photochromic (light-reactive) lenses as photochemistry. UV light opens naphthopyran dye
// molecules into a coloured form; heat closes them again (thermal fade). With c the coloured
// fraction:
//   dc/dt = k_act · UV · (1 − c) − k_fade(T) · c,  k_fade(T) = k_25 · exp(−Ea/R · (1/T − 1/298 K))
// so lenses darken less when hot, fade back slower when cold, and barely react behind glass
// that blocks UV. Transmission follows Beer-Lambert: T = T_clear · 10^(−OD_max · c).
// Rate constants are calibrated to typical published behaviour of current lenses (category 3
// darkness in full sun at room temperature, back to clear in a few minutes indoors).
export const PC = {
  kAct: 0.0077, // per second per UV-index unit
  k25: Math.LN2 / 45, // thermal fade at 25 °C: half-life about 45 s
  EaKJ: 90, // activation energy of the ring-closing reaction, kJ/mol
  odMax: 0.9, // optical density of the fully coloured dye
  clear: 0.95, // transmission when clear (AR-coated lens)
};
// UV index seen by the lens: open sky, overcast, and behind a laminated windshield (which
// absorbs nearly all UV below about 380 nm).
export const UV = { sun: 8, cloud: 3, car: 0.15 };

const R = 8.314;
export const kFade = (tempC) => PC.k25 * Math.exp(-((PC.EaKJ * 1000) / R) * (1 / (tempC + 273.15) - 1 / 298.15));
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

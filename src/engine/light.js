// Light and lens materials, from first principles:
//   Fresnel reflection, thin-film interference (characteristic-matrix method), an AR-coating
//   designer, CIE 1931 colour of any spectrum, Cauchy dispersion and Lorentz-Lorenz
//   polarizability. Wavelengths in nm.

// Lens materials: index n_d, Abbe V_d, density (g/cm³) and the chemistry behind them.
export const MATERIALS = [
  { n: 1.5, abbe: 58, density: 1.32, label: "1.50 CR-39", chem: "Allyl diglycol carbonate", why: "Light C–O and C–H bonds: low polarizability, so low index and very little dispersion." },
  { n: 1.586, abbe: 30, density: 1.2, label: "1.59 Polycarbonate", chem: "Bisphenol-A polycarbonate", why: "Aromatic rings add easily polarized π electrons: a higher index, but strong dispersion." },
  { n: 1.6, abbe: 41, density: 1.3, label: "1.60 MR-8", chem: "Thiourethane", why: "Sulfur atoms raise polarizability while keeping dispersion moderate." },
  { n: 1.67, abbe: 32, density: 1.35, label: "1.67 MR-7", chem: "Thiourethane, more sulfur", why: "More sulfur per volume: thinner lenses, more colour split." },
  { n: 1.74, abbe: 32, density: 1.47, label: "1.74 Episulfide", chem: "Episulfide resin", why: "The most sulfur: the thinnest lens, and as much colour split as polycarbonate." },
];

export const fresnelR = (n1, n2) => ((n1 - n2) / (n1 + n2)) ** 2;
// Both surfaces of an uncoated lens, summing incoherent multiple reflections.
export const lensReflectance = (n) => { const R = fresnelR(1, n); return (2 * R) / (1 + R); };

// --- thin films: characteristic matrix at normal incidence, non-absorbing layers ---
const mul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const div = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
const mat = (A, B) => [
  [add(mul(A[0][0], B[0][0]), mul(A[0][1], B[1][0])), add(mul(A[0][0], B[0][1]), mul(A[0][1], B[1][1]))],
  [add(mul(A[1][0], B[0][0]), mul(A[1][1], B[1][0])), add(mul(A[1][0], B[0][1]), mul(A[1][1], B[1][1]))],
];

// Reflectance of a layer stack (listed from the air side) on a substrate of index ns.
export function stackR(layers, ns, lambda, n0 = 1) {
  let M = [[[1, 0], [0, 0]], [[0, 0], [1, 0]]];
  for (const { n, d } of layers) {
    const delta = (2 * Math.PI * n * d) / lambda, c = Math.cos(delta), s = Math.sin(delta);
    M = mat(M, [[[c, 0], [0, s / n]], [[0, n * s], [c, 0]]]);
  }
  const B = add(M[0][0], mul(M[0][1], [ns, 0])), C = add(M[1][0], mul(M[1][1], [ns, 0]));
  const r = div(add(mul([n0, 0], B), [-C[0], -C[1]]), add(mul([n0, 0], B), C));
  return r[0] * r[0] + r[1] * r[1];
}

// --- colour: CIE 1931 2° observer (multi-lobe fit of Wyman, Sloan & Shirley 2013) ---
const g = (x, mu, s1, s2) => { const t = (x - mu) / (x < mu ? s1 : s2); return Math.exp(-0.5 * t * t); };
export const cmf = (l) => [
  1.056 * g(l, 599.8, 37.9, 31.0) + 0.362 * g(l, 442.0, 16.0, 26.7) - 0.065 * g(l, 501.1, 20.4, 26.2),
  0.821 * g(l, 568.8, 46.9, 40.5) + 0.286 * g(l, 530.9, 16.3, 31.1),
  1.217 * g(l, 437.0, 11.8, 36.0) + 0.681 * g(l, 459.0, 26.0, 13.8),
];
// Daylight as a 6504 K black body (Planck); only relative values matter.
const planck = (l, T = 6504) => { const m = l * 1e-9; return 1 / (m ** 5 * (Math.exp(0.014388 / (m * T)) - 1)); };
const LAMBDAS = Array.from({ length: 81 }, (_, i) => 380 + i * 5);
const WHITE = LAMBDAS.reduce((a, l) => a + planck(l) * cmf(l)[1], 0);
const gamma = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

// Colour of light with spectral factor f(λ) (a reflectance or a transmittance) under daylight.
// `rgb` keeps the true brightness; `hue` is scaled so its brightest channel is 1 (for display).
export function spectrumColor(f) {
  const xyz = [0, 0, 0];
  for (const l of LAMBDAS) { const w = planck(l) * f(l), c = cmf(l); xyz[0] += w * c[0]; xyz[1] += w * c[1]; xyz[2] += w * c[2]; }
  const [X, Y, Z] = xyz.map((v) => v / WHITE);
  const lin = [3.2406 * X - 1.5372 * Y - 0.4986 * Z, -0.9689 * X + 1.8758 * Y + 0.0415 * Z, 0.0557 * X - 0.204 * Y + 1.057 * Z].map((v) => Math.max(0, v));
  const top = Math.max(...lin) || 1;
  return { Y, rgb: lin.map((v) => gamma(Math.min(1, v))), hue: lin.map((v) => gamma(v / top)) };
}
const css = (c) => `rgb(${c.map((v) => Math.round(v * 255)).join(" ")})`;
export const toCss = css;

// Reflectance as the eye judges it (ISO 13666 luminous reflectance, daylight-weighted).
export const luminousR = (R) => spectrumColor(R).Y;

// --- anti-reflective coatings ---
export const SIO2 = 1.46, ZRO2 = 2.05, MGF2 = 1.38;
export const SINGLE_MGF2 = [{ n: MGF2, d: 550 / (4 * MGF2), name: "MgF₂" }];
const designs = new Map();
// A four-layer SiO₂/ZrO₂ stack (air side first) whose thicknesses are tuned by coordinate
// descent to minimise daylight-weighted reflectance, 420–680 nm, on substrate index ns.
export function designAR(ns) {
  if (designs.has(ns)) return designs.get(ns);
  const ns_ = [SIO2, ZRO2, SIO2, ZRO2], names = ["SiO₂", "ZrO₂", "SiO₂", "ZrO₂"];
  let d = [92, 118, 28, 14];
  const band = LAMBDAS.filter((l) => l >= 420 && l <= 680);
  const cost = (dd) => band.reduce((a, l) => a + stackR(ns_.map((n, i) => ({ n, d: dd[i] })), ns, l) * (cmf(l)[1] + 0.15), 0);
  let best = cost(d);
  for (let step = 16; step >= 0.25; step /= 2) {
    for (let improved = true; improved;) {
      improved = false;
      for (let i = 0; i < d.length; i++) {
        for (const dir of [1, -1]) {
          const t = d.slice(); t[i] = Math.min(280, Math.max(5, t[i] + dir * step));
          const c = cost(t);
          if (c < best - 1e-12) { best = c; d = t; improved = true; }
        }
      }
    }
  }
  const layers = ns_.map((n, i) => ({ n, d: +d[i].toFixed(1), name: names[i] }));
  const R = (l) => stackR(layers, ns, l);
  const out = { layers, R, luminous: luminousR(R), color: spectrumColor(R) };
  designs.set(ns, out);
  return out;
}

// --- dispersion and chemistry ---
const LD = 587.6, LF = 486.1, LC = 656.3;
// Cauchy n(λ) = A + B/λ², fitted to n_d and the Abbe number V = (n_d − 1)/(n_F − n_C).
export function cauchy(nd, V) {
  const B = (nd - 1) / (V * (1 / LF ** 2 - 1 / LC ** 2)), A = nd - B / LD ** 2;
  return (l) => A + B / (l * l);
}
// Lorentz-Lorenz: (n² − 1)/(n² + 2) is the polarizability packed into each unit of volume.
export const polarizability = (n) => (n * n - 1) / (n * n + 2);

// White light through a blue-light filter that removes `block` of 400–450 nm light.
export function filterTint(block) {
  const T = (l) => 1 - block / (1 + Math.exp((l - 452) / 9));
  return { ...spectrumColor(T), T };
}

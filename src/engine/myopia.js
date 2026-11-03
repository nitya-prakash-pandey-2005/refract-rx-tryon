// Children's myopia forecast from published population data (education, not a diagnosis).
//   Rate at age 9.3 wearing single-vision glasses: −0.82 D/yr in Asian and −0.55 D/yr in
//   European-descent children (Donovan et al., Optom Vis Sci 2012, 20 studies).
//   Progression slows by about 9.7% per year of age (Smotherman et al., IOVS 2023 meta-regression).
//   It stops for most children between 13 and 18: 48% stabilized by 15 and 77% by 18
//   (COMET, Hardy et al., IOVS 2013), fitted as a logistic and applied from age 13.
//   Two myopic parents meant about 1 D more myopia at stabilization (COMET), here 13.5% faster
//   progression per myopic parent.
//   Myopia-control options scale progression by their trial effect (see INTERVENTIONS).
export const BASE_RATE = { asian: 0.82, european: 0.55, other: 0.68 };
export const RATE_CI = { asian: [0.71, 0.93], european: [0.39, 0.72], other: [0.55, 0.82] };
export const AGE_SLOWING = 0.097;
export const PARENT_FACTOR = 0.135;
export const GROUPS = { asian: "East or South-East Asian", european: "European descent", other: "Other or mixed" };

export const INTERVENTIONS = {
  none: { label: "Regular single-vision glasses", short: "Regular glasses", factor: 1 },
  dims: { label: "DIMS myopia-control spectacle lenses", short: "DIMS lenses", factor: 0.48, kind: "glasses", evidence: "52% slower over 2 years vs single vision (Lam et al., BJO 2020); no rebound in 6-year follow-up." },
  hal: { label: "HAL myopia-control spectacle lenses", short: "HAL lenses", factor: 0.45, kind: "glasses", evidence: "55% slower over 2 years; 67% when worn 12+ hours a day (Bao et al., JAMA Ophthalmol 2022)." },
  orthok: { label: "Orthokeratology (overnight lenses)", short: "Ortho-k", factor: 0.57, kind: "contacts", evidence: "43% less eye growth over 2 years (ROMIO, Cho & Cheung, IOVS 2012)." },
  atropine: { label: "Low-dose atropine 0.05% drops", short: "Atropine 0.05%", factor: 0.33, kind: "drops", evidence: "67% slower over 1 year (LAMP, Yam et al., Ophthalmology 2019). Prescribed by an eye doctor." },
};

// Share of children still progressing (COMET stabilization ages).
export const stillProgressing = (age) => 1 / (1 + Math.exp((age - 15.19) / 2.33));
const TAPER_FROM = 13;

// Expected progression rate (D per year, positive = more myopic) at an age.
export function rateAt(age, { group = "asian", parents = 0, intervention = "none", base } = {}) {
  const r0 = base ?? BASE_RATE[group];
  const taper = age > TAPER_FROM ? stillProgressing(age) / stillProgressing(TAPER_FROM) : 1;
  return r0 * (1 - AGE_SLOWING) ** (age - 9.3) * taper * (1 + PARENT_FACTOR * parents) * INTERVENTIONS[intervention].factor;
}

// Spherical-equivalent projection to `toAge` in quarter-year steps, with a band from the
// meta-analysis confidence interval of the base rate.
export function project({ age, rx, group = "asian", parents = 0, intervention = "none", toAge = 18 }) {
  const dt = 0.25, [lo, hi] = RATE_CI[group];
  let mid = rx, worse = rx, better = rx;
  const points = [{ age, rx, worse, better }];
  for (let a = age; a < toAge - 1e-9; a += dt) {
    const o = { group, parents, intervention };
    mid -= rateAt(a + dt / 2, o) * dt;
    worse -= rateAt(a + dt / 2, { ...o, base: hi }) * dt;
    better -= rateAt(a + dt / 2, { ...o, base: lo }) * dt;
    points.push({ age: +(a + dt).toFixed(2), rx: mid, worse, better });
  }
  return { points, at18: mid, worseAt18: worse, betterAt18: better };
}

// Eye length: emmetropic adult ~23.5 mm; about 2.5 D of myopia per extra mm (adults ~2.9 D/mm,
// children nearer 2 D/mm: Atchison 2004, COMET).
export const axialMm = (rx) => 23.5 + Math.max(0, -rx) / 2.5;
// Each additional dioptre raises myopic maculopathy prevalence by 67% (Bullimore & Brennan,
// Optom Vis Sci 2019), so the relative risk for `d` dioptres less myopia is 1.67^−d.
export const maculopathyRR = (d) => 1.67 ** -d;

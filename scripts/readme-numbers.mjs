// Every number in the README's tables, computed by the same engine the app uses.
// Run: node scripts/readme-numbers.mjs
import { INDICES, eyeMagnification } from "../src/engine/optics.js";
import { FRAMES, customFrame } from "../src/engine/frames.js";
import { lensPair } from "../src/engine/fit.js";
import { remakeRisk, slipRisk } from "../src/engine/risk.js";
import { tca } from "../src/engine/sight.js";
import { MATERIALS, fresnelR, stackR, luminousR, designAR, cauchy, polarizability, SINGLE_MGF2, filterTint } from "../src/engine/light.js";
import { summary, UV } from "../src/engine/photochromic.js";
import { project, INTERVENTIONS, axialMm, maculopathyRR } from "../src/engine/myopia.js";
import { valueOptions, picks } from "../src/engine/value.js";
import { slipDay, dayTemps } from "../src/engine/climate.js";

const PD = { left: 31.5, right: 31.5, plusMinus: 2.7 };
const both = (sph, cyl = 0, axis = 180) => ({ od: { sph, cyl, axis }, os: { sph, cyl, axis } });
const pct = (x, d = 1) => `${(x * 100).toFixed(d)}%`;
const row = (cells) => console.log(`| ${cells.join(" | ")} |`);
const table = (title, head, rows) => { console.log(`\n### ${title}\n`); row(head); row(head.map(() => "---")); rows.forEach(row); };

// 1. What a thinner lens buys, in a 52□19 frame
const tate = FRAMES.find((f) => f.id === "tate");
for (const sph of [-4, -6.5]) {
  table(`${sph} D in Tate (52□19)`, ["Lens", "Edge (mm)", "Pair weight (g)", "Colour split at 10 mm (Δ)", "Extra cost"],
    INDICES.map((ix) => { const p = lensPair({ frame: tate, rx: both(sph), pd: PD, index: ix }); return [ix.label, p.od.maxEdge.toFixed(1), (p.od.weightG + p.os.weightG).toFixed(1), tca(Math.abs(sph), 10, ix.abbe).toFixed(3), `$${ix.priceUsd}`]; }));
}

// 2. Frame size vs lens index at -6.5 (1.60 lens)
const ix160 = INDICES.find((i) => i.n === 1.6), ix174 = INDICES.find((i) => i.n === 1.74);
table("-6.5 D: frame size vs ultra-thin lens", ["Frame", "1.60 edge (mm)", "1.74 edge (mm)"],
  [46, 50, 52, 54, 56].map((A) => { const frame = customFrame({ A, DBL: 18, shape: "rect", material: "acetate" }); const e = (ix) => lensPair({ frame, rx: both(-6.5), pd: PD, index: ix }).od.maxEdge.toFixed(1); return [`${A}□18`, e(ix160), e(ix174)]; }));

// 3. Eye size through the lens
table("Eye size seen through the lens", ["Prescription", "Eyes look"], [-8, -6, -4, -2, 2, 4, 6].map((F) => [`${F > 0 ? "+" : ""}${F} D`, `${eyeMagnification(F) >= 1 ? "+" : ""}${pct(eyeMagnification(F) - 1)}`]));

// 4. Whole catalogue for Lena (-6.50/-6.00)
const lena = { od: { sph: -6.5, cyl: -0.75, axis: 180 }, os: { sph: -6.0, cyl: -0.5, axis: 175 } };
const PD_KNOWN = { ...PD, plusMinus: 0.5 };
table("Lena (−6.50 / −6.00): every catalogue frame", ["Frame", "Size", "Material", "Price", "Edge (mm)", "Weight (g)", "Risk, webcam PD ±2.7", "Risk, PD known ±0.5"],
  FRAMES.map((frame) => ({ frame, r: remakeRisk({ frame, rx: lena, pd: PD_KNOWN }), w: remakeRisk({ frame, rx: lena, pd: PD }) })).sort((a, b) => a.r.score - b.r.score)
    .map(({ frame, r, w }) => [frame.name, `${frame.A}□${frame.DBL} ${frame.temple}`, frame.material, `$${frame.priceUsd}`, Math.max(r.lens.od.maxEdge, r.lens.os.maxEdge).toFixed(1), r.parts.fit.detail.totalWeightG.toFixed(0), `${w.score} ${w.level}`, `${r.score} ${r.level}`]));

// 5. Reflections and coatings
table("Light reflected by a pair of lenses", ["Material", "Uncoated", "Single MgF₂", "Refract's 4-layer AR"],
  MATERIALS.map((m) => { const pair = (s) => (2 * s) / (1 + s); return [m.label, pct((2 * fresnelR(1, m.n)) / (1 + fresnelR(1, m.n))), pct(pair(luminousR((l) => stackR(SINGLE_MGF2, m.n, l))), 2), pct(pair(designAR(m.n).luminous), 2)]; }));
console.log(`\n4-layer design on 1.60: ${designAR(1.6).layers.map((l) => `${l.name} ${l.d} nm`).join(" / ")}`);

// 6. Dispersion and chemistry
table("Dispersion and polarizability", ["Material", "n blue (486 nm)", "n red (656 nm)", "Abbe", "(n²−1)/(n²+2)"],
  MATERIALS.map((m) => { const n = cauchy(m.n, m.abbe); return [m.label, n(486.1).toFixed(4), n(656.3).toFixed(4), m.abbe, polarizability(m.n).toFixed(3)]; }));

// 7. Blue-light filter
table("Blue-light filter", ["Blue removed", "Light passed (Y)"], [0.1, 0.2, 0.4, 0.6].map((b) => [pct(b, 0), pct(filterTint(b).Y)]));

// 8. Photochromic
table("Photochromic lenses", ["Scene", "Air", "Darkest (light passed)", "Darkens in", "Clears in"],
  [["Sun", "sun", 6], ["Sun", "sun", 21], ["Sun", "sun", 35], ["Cloud", "cloud", 21], ["In a car", "car", 21]]
    .map(([name, k, t]) => { const s = summary({ uv: UV[k], tempC: t }); return [name, `${t} °C`, pct(s.darkest, 0), s.darkenS == null ? "—" : `${Math.round(s.darkenS)} s`, s.clearS == null ? "—" : `${Math.round(s.clearS)} s`]; }));

// 9. Myopia forecast
for (const group of ["european", "asian"]) {
  const base = project({ age: 9, rx: -2, group }).at18;
  table(`Myopia forecast: ${group} 9-year-old at −2.00`, ["Option", "At 18", "Eye length", "Maculopathy risk vs regular glasses"],
    Object.entries(INTERVENTIONS).map(([k, v]) => { const at = project({ age: 9, rx: -2, group, intervention: k }).at18; return [v.short, `${at.toFixed(2)} D`, `${axialMm(at).toFixed(1)} mm`, k === "none" ? "—" : `${pct(1 - maculopathyRR(at - base), 0)} lower`]; }));
}

// 10. Best value for Lena
const opts = valueOptions({ rx: lena, pd: PD_KNOWN, face: { bridge: "medium" }, oiliness: 60 }), pk = picks(opts);
table("Best value for Lena", ["Pick", "Frame", "Lens", "Price", "Risk"],
  [["Lowest risk", pk.lowestRisk], ["Best value (knee)", pk.bestValue], ["Cheapest not high-risk", pk.cheapestOk]].map(([n, o]) => [n, o.frame.name, o.index.label, `$${o.price}`, o.risk]));
console.log(`\n${opts.length} options, ${pk.front.length} on the frontier`);

// 11. Fit through the day
table("Expected hours the frame creeps (awake, 07:00–23:00)", ["Frame", "Oiliness score", "Cold (6 °C)", "Mild (22 °C)", "Hot (34 °C)"],
  [["halden", 40], ["juno", 40], ["tate", 40]].map(([id, score]) => {
    const frame = FRAMES.find((f) => f.id === id), lp = lensPair({ frame, rx: lena, pd: PD });
    const lensWeightG = slipRisk({ frame, lensWeightG: lp.od.weightG + lp.os.weightG, oiliness: score }).totalWeightG - frame.weightG;
    const h = (m, s) => slipDay({ frame, lensWeightG, face: {}, score, temps: dayTemps(m, s) }).expectedHours.toFixed(1);
    return [frame.name, score, h(6, 6), h(22, 8), h(34, 8)];
  }));

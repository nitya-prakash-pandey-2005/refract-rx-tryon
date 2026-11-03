import { test } from "node:test";
import assert from "node:assert/strict";
import { fresnelR, lensReflectance, stackR, designAR, luminousR, cmf, spectrumColor, cauchy, polarizability, MATERIALS, SINGLE_MGF2, filterTint } from "../src/engine/light.js";

const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg ?? ""} ${a} vs ${b}`);

test("Fresnel reflection at normal incidence", () => {
  near(fresnelR(1, 1.5), 0.04, 1e-9);
  near(fresnelR(1, 1.74), 0.0730, 1e-4);
  // two surfaces with multiple incoherent reflections: 2R / (1 + R)
  near(lensReflectance(1.5), 0.0769, 1e-4);
  assert.ok(lensReflectance(1.74) > 0.135, "an uncoated 1.74 lens reflects about 14% of light");
});

test("thin-film transfer matrix matches closed forms", () => {
  // no layers: bare substrate
  near(stackR([], 1.6, 550), fresnelR(1, 1.6), 1e-12);
  // a half-wave layer is absent at its design wavelength
  near(stackR([{ n: 1.38, d: 550 / (2 * 1.38) }], 1.6, 550), fresnelR(1, 1.6), 1e-9);
  // a quarter-wave layer: R = ((ns - nc^2) / (ns + nc^2))^2
  const nc = 1.38, ns = 1.74;
  near(stackR([{ n: nc, d: 550 / (4 * nc) }], ns, 550), ((ns - nc * nc) / (ns + nc * nc)) ** 2, 1e-9);
});

test("colour matching functions peak where the CIE observer does", () => {
  near(cmf(555)[1], 1.0, 0.03, "y-bar at 555 nm");
  near(cmf(600)[0], 1.06, 0.03, "x-bar at 600 nm");
  near(cmf(445)[2], 1.75, 0.15, "z-bar near 445 nm");
});

test("a perfect white reflector under daylight comes out white", () => {
  const { rgb } = spectrumColor(() => 1);
  const [r, g, b] = rgb;
  assert.ok(Math.max(r, g, b) - Math.min(r, g, b) < 0.06, rgb.join(","));
});

test("a designed multilayer AR coating beats the classic single MgF2 layer", () => {
  for (const n of [1.5, 1.6, 1.74]) {
    const ar = designAR(n);
    const single = luminousR((l) => stackR(SINGLE_MGF2, n, l));
    const bare = fresnelR(1, n);
    assert.ok(ar.luminous < 0.008, `multilayer on ${n}: ${ar.luminous}`);
    assert.ok(ar.luminous < single && single < bare, `${ar.luminous} < ${single} < ${bare}`);
    assert.ok(ar.layers.every((l) => l.d > 0 && l.d < 300));
  }
});

test("Cauchy dispersion reproduces each material's Abbe number", () => {
  for (const m of MATERIALS) {
    const n = cauchy(m.n, m.abbe);
    const V = (n(587.6) - 1) / (n(486.1) - n(656.3));
    near(V, m.abbe, 1e-6, m.label);
    near(n(587.6), m.n, 1e-9);
  }
});

test("Lorentz-Lorenz: higher-index plastics pack more polarizability per volume", () => {
  const p = MATERIALS.map((m) => polarizability(m.n));
  for (let i = 1; i < p.length; i++) if (MATERIALS[i].n > MATERIALS[i - 1].n) assert.ok(p[i] > p[i - 1]);
});

test("a blue-light filter tints white light yellow", () => {
  const { rgb } = filterTint(0.3);
  assert.ok(rgb[2] < rgb[0] && rgb[2] < rgb[1], rgb.join(","));
});

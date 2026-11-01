import { test } from "node:test";
import assert from "node:assert/strict";
import { lensClass, planLook, genericLook, hexToLab } from "../src/engine/makeup.js";

const both = (sph, cyl = 0) => ({ od: { sph, cyl, axis: 0 }, os: { sph, cyl, axis: 0 } });
const faceAttr = { eyeColorName: "Brown", eyebrowColor: "#3a2a22", eyeSize: "Average" };
const textures = (look) => look.effects.flatMap((e) => (e.palettes || []).map((p) => p.texture).filter(Boolean));

test("lens class follows the spherical equivalent", () => {
  assert.equal(lensClass(both(-6)), "minus");
  assert.equal(lensClass(both(3)), "plus");
  assert.equal(lensClass(both(-0.5, -0.5)), "neutral");
});

test("minus look brightens: shimmer light lid and volumising lashes", () => {
  const look = planLook({ rx: both(-6), faceAttr, skin: {}, skinHex: "#b9947c" });
  const shadow = look.effects.find((e) => e.category === "eye_shadow");
  assert.equal(shadow.palettes[0].texture, "shimmer");
  assert.ok(hexToLab(shadow.palettes[0].color).L > 60);
  assert.equal(look.effects.find((e) => e.category === "eyelashes").pattern.name, "Upper&Lower5");
  assert.ok(look.reasons[0].includes("smaller"));
});

test("plus look is matte and covers dark circles harder when they score low", () => {
  const low = planLook({ rx: both(3), faceAttr, skin: { darkCircle: 38 }, skinHex: "#b9947c" });
  const high = planLook({ rx: both(3), faceAttr, skin: { darkCircle: 80 }, skinHex: "#b9947c" });
  assert.ok(!textures(low).some((t) => t === "shimmer" || t === "metallic"));
  const conc = (l) => l.effects.find((e) => e.category === "concealer").palettes[0].colorUnderEyeIntensity;
  assert.ok(conc(low) > conc(high));
});

test("mild prescriptions get no compensation", () => {
  const look = planLook({ rx: both(-0.5), faceAttr, skin: {}, skinHex: "#b9947c" });
  assert.match(look.reasons[0], /no compensation/i);
});

test("every effect is a valid YouCam makeup-vto effect", () => {
  for (const look of [planLook({ rx: both(-6), faceAttr, skin: {}, skinHex: "#c08e6e" }), planLook({ rx: both(2.5), faceAttr: {}, skin: {}, skinHex: null }), genericLook(faceAttr)]) {
    assert.ok(look.effects.length >= 4);
    for (const e of look.effects) {
      assert.ok(typeof e.category === "string");
      for (const p of e.palettes || []) assert.match(p.color, /^#[0-9A-F]{6}$/i);
      if (e.category === "eye_shadow") assert.equal(e.palettes.length, { "3colors4": 3, "2colors1": 2, "3colors8": 3 }[e.pattern.name]);
    }
    assert.ok(look.products.every((p) => p.priceUsd > 0));
  }
});

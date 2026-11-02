import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeFaceAttr, normalizeSkin, unitCost, skinParams } from "../src/engine/youcam.js";

test("face attributes flatten into one profile", () => {
  const p = normalizeFaceAttr({
    faceshape: "Oval",
    eyelid: { left_shape: "Almond", size: "Small", setting: "Wide-Set", left_eyelid: "Hooded-lid", left_angle: "Upturned" },
    eyebrow: { left_shape: "Soft Angled" },
    color: { eye_color: "#3B2A20", eye_color_name: "Brown", eyebrow_color: "#2E2018", hair_color: "#000000", hair_color_name: "Black" },
  });
  assert.deepEqual(
    { faceShape: p.faceShape, eyeShape: p.eyeShape, eyeSize: p.eyeSize, eyeSetting: p.eyeSetting, eyelid: p.eyelid, browShape: p.browShape, eyeColorName: p.eyeColorName, eyebrowColor: p.eyebrowColor, hairColorName: p.hairColorName },
    { faceShape: "Oval", eyeShape: "Almond", eyeSize: "Small", eyeSetting: "Wide-Set", eyelid: "Hooded-lid", browShape: "Soft Angled", eyeColorName: "Brown", eyebrowColor: "#2E2018", hairColorName: "Black" },
  );
});

test("face attributes also parse when nested under result", () => {
  assert.equal(normalizeFaceAttr({ result: { faceshape: "Round" } }).faceShape, "Round");
  assert.equal(normalizeFaceAttr({}).faceShape, null);
});

test("skin output maps HD and SD concern names to one shape", () => {
  const hd = normalizeSkin({ output: [
    { type: "hd_dark_circle", region: "whole", ui_score: 42, raw_score: 40.1, mask_urls: ["https://x/dc.jpg"] },
    { type: "hd_wrinkle", region: "crowfeet", ui_score: 61, mask_urls: ["https://x/cf.jpg"] },
    { type: "hd_wrinkle", region: "whole", ui_score: 70 },
    { type: "hd_eye_bag", region: "whole", ui_score: 55 },
    { type: "hd_droopy_upper_eyelid", ui_score: 80 },
    { type: "hd_tear_trough", ui_score: 66 },
    { type: "skin_age", score: 29 },
  ] });
  assert.equal(hd.darkCircle, 42);
  assert.equal(hd.crowfeet, 61);
  assert.equal(hd.wrinkle, 70);
  assert.equal(hd.eyeBag, 55);
  assert.equal(hd.droopyUpper, 80);
  assert.equal(hd.tearTrough, 66);
  assert.equal(hd.skinAge, 29);
  assert.equal(hd.masks.darkCircle, "https://x/dc.jpg");
  assert.equal(hd.hd, true);

  const sd = normalizeSkin({ output: [{ type: "dark_circle_v2", ui_score: 50 }, { type: "eye_bag", ui_score: 48 }] });
  assert.equal(sd.darkCircle, 50);
  assert.equal(sd.hd, false);
});

test("unit cost matches the published tiers", () => {
  assert.equal(unitCost("face-attr-analysis", { features: new Array(9).fill("x") }), 20);
  assert.equal(unitCost("skin-analysis", { dst_actions: ["hd_eye_bag", "hd_dark_circle", "hd_wrinkle", "hd_droopy_upper_eyelid", "hd_droopy_lower_eyelid", "hd_tear_trough"] }), 16);
  assert.equal(unitCost("skin-analysis", { dst_actions: ["eye_bag", "dark_circle_v2", "wrinkle", "droopy_upper_eyelid", "droopy_lower_eyelid", "tear_trough"] }), 12);
  assert.equal(unitCost("makeup-vto", {}), 1);
});

test("skin analysis asks for oiliness (nose pad grip) at no extra unit tier", () => {
  assert.ok(skinParams(true).dst_actions.includes("hd_oiliness"));
  assert.ok(skinParams(false).dst_actions.includes("oiliness"));
  assert.equal(unitCost("skin-analysis", skinParams(false)), 12);
  assert.equal(normalizeSkin({ output: [{ type: "hd_oiliness", region: "whole", ui_score: 41 }] }).oiliness, 41);
});

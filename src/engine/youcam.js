// YouCam API helpers shared by the browser and the server: request presets, unit costs
// (from the published unit tables) and result normalisers.

export const FACE_FEATURES = ["faceShape", "eyeShape", "eyeSize", "eyeDistance", "eyelid", "eyebrowShape", "eyeColor", "hairColor", "eyebrowColor"];
// Eye-area concerns (what a lens sits in front of) + oiliness (how well nose pads grip).
export const SKIN_EYE_CONCERNS_HD = ["hd_dark_circle", "hd_eye_bag", "hd_wrinkle", "hd_droopy_upper_eyelid", "hd_droopy_lower_eyelid", "hd_tear_trough", "hd_oiliness"];
export const SKIN_EYE_CONCERNS_SD = ["dark_circle_v2", "eye_bag", "wrinkle", "droopy_upper_eyelid", "droopy_lower_eyelid", "tear_trough", "oiliness"];
export const HD_MIN_SHORT_SIDE = 1080;

export const skinParams = (hd) => ({
  dst_actions: hd ? SKIN_EYE_CONCERNS_HD : SKIN_EYE_CONCERNS_SD,
  format: "json",
  miniserver_args: { enable_mask_overlay: true },
});
export const faceParams = () => ({ features: FACE_FEATURES, face_angle_strictness_level: "medium" });
export const makeupParams = (effects) => ({ version: "1.0", effects });

const tier = (n, steps, costs) => costs[steps.findIndex((s) => n <= s)] ?? costs[costs.length - 1];
export function unitCost(feature, params = {}) {
  switch (feature) {
    case "face-attr-analysis": return tier((params.features || []).length, [5, 14, 28], [10, 20, 30]);
    case "skin-analysis": {
      const a = params.dst_actions || [];
      const hd = a.some((x) => x.startsWith("hd_"));
      return tier(a.length, [4, 8, 12, 16], hd ? [12, 16, 20, 22] : [9, 12, 14, 16]);
    }
    case "skin-tone-analysis": return 20;
    case "makeup-vto": return 1;
    default: return 0;
  }
}

const pick = (o, ...keys) => keys.reduce((v, k) => v ?? o?.[k], undefined) ?? null;

export function normalizeFaceAttr(results) {
  const r = results?.faceshape !== undefined ? results : results?.result || results?.results || results || {};
  const lid = r.eyelid || {}, brow = r.eyebrow || {}, c = r.color || {};
  return {
    faceShape: r.faceshape ?? null,
    eyeShape: pick(lid, "left_shape", "right_shape"),
    eyeSize: lid.size ?? null,
    eyeAngle: pick(lid, "left_angle", "right_angle"),
    eyeSetting: lid.setting ?? null,
    eyelid: pick(lid, "left_eyelid", "right_eyelid"),
    browShape: pick(brow, "left_shape", "right_shape"),
    eyeColor: c.eye_color ?? null,
    eyeColorName: c.eye_color_name ?? null,
    eyebrowColor: c.eyebrow_color ?? null,
    hairColor: c.hair_color ?? null,
    hairColorName: c.hair_color_name ?? null,
    age: r.agegender?.age ?? null,
  };
}

const CONCERN = {
  dark_circle: "darkCircle", eye_bag: "eyeBag", droopy_upper_eyelid: "droopyUpper", droopy_lower_eyelid: "droopyLower",
  tear_trough: "tearTrough", wrinkle: "wrinkle", oiliness: "oiliness", pore: "pore", texture: "texture", acne: "acne", redness: "redness",
};

export function normalizeSkin(results) {
  const out = results?.output || results?.results?.output || [];
  const skin = { masks: {}, hd: false, raw: out };
  for (const o of out) {
    if (o.type === "skin_age") { skin.skinAge = o.score; continue; }
    if (o.type === "all") { skin.overall = o.score; continue; }
    if (o.type?.startsWith("hd_")) skin.hd = true;
    const base = (o.type || "").replace(/^hd_/, "").replace(/_v2$/, "");
    let key = CONCERN[base];
    if (!key) continue;
    if (base === "wrinkle" && o.region && o.region !== "whole") key = o.region; // crowfeet, periocular, forehead…
    skin[key] = o.ui_score ?? Math.round(o.raw_score ?? 0);
    if (o.mask_urls?.[0]) skin.masks[key] = o.mask_urls[0];
  }
  return skin;
}

// Spend protection for a public demo: per-IP rate limits, a daily YouCam unit budget,
// and YouCam params built on the server from fixed presets (never taken from the client).
import { faceParams, skinParams, makeupParams } from "../src/engine/youcam.js";
import { planLook, genericLook } from "../src/engine/makeup.js";
import { sanitizeRx } from "../src/engine/rxinput.js";
import { YouCamError } from "./youcam.js";

const hits = new Map();
export function allow(key, { limit, windowMs }) {
  const now = Date.now();
  const list = (hits.get(key) || []).filter((t) => now - t < windowMs);
  if (list.length >= limit) { hits.set(key, list); return false; }
  list.push(now);
  hits.set(key, list);
  return true;
}

let day = new Date().toISOString().slice(0, 10), spent = 0;
const dailyCap = () => Number(process.env.YOUCAM_DAILY_UNITS || 400);
export function budgetLeft() {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== day) { day = today; spent = 0; }
  return dailyCap() - spent;
}
export const spend = (units) => { budgetLeft(); spent += units; };

const clip = (o, keys) => Object.fromEntries(keys.filter((k) => o?.[k] != null).map((k) => [k, o[k]]));

export function buildParams(feature, body = {}) {
  if (feature === "face-attr-analysis") return faceParams();
  if (feature === "skin-analysis") return skinParams(body.hd === true);
  if (feature === "makeup-vto") {
    const look = body.look || {};
    if (look.kind === "generic") return makeupParams(genericLook().effects);
    if (look.kind === "rx") {
      const faceAttr = clip(look.faceAttr, ["eyeColorName", "eyebrowColor", "eyelid", "eyeSize"]);
      const skin = clip(look.skin, ["darkCircle", "crowfeet", "eyeBag"]);
      const skinHex = /^#[0-9a-f]{6}$/i.test(look.skinHex || "") ? look.skinHex : null;
      return makeupParams(planLook({ rx: sanitizeRx(look.rx), faceAttr, skin, skinHex }).effects);
    }
    throw new YouCamError("Unknown look.", "BadLook", 400);
  }
  throw new YouCamError(`Unsupported feature: ${feature}`, "BadFeature", 400);
}

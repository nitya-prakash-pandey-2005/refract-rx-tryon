// The YouCam pipeline for one person: Face Analyzer + Skin Analysis on a face crop, then
// two Makeup VTO renders (Rx-tuned and a generic look for comparison).
import { getStore, setStore } from "../state/store";
import { runYouCam } from "./api";
import { loadImage, cropDataUrl } from "../vision/image";
import { cropForAnalysis } from "../engine/measure";
import { normalizeFaceAttr, normalizeSkin, HD_MIN_SHORT_SIDE } from "../engine/youcam";

export const rxKey = (rx) => JSON.stringify(rx);

export async function analyseFace({ label, onStep } = {}) {
  const s = getStore();
  if (!s.photo || !s.measure) throw new Error("Scan your face first.");
  const img = await loadImage(s.photo.src);
  const crop = cropForAnalysis(s.measure.faceBox, s.photo.w, s.photo.h);
  const url = cropDataUrl(img, crop, 2048);
  const hd = Math.min(crop.w, crop.h) >= HD_MIN_SHORT_SIDE;
  onStep?.("analyse");
  const [fa, sk] = await Promise.allSettled([
    runYouCam("face-attr-analysis", url, {}, { label }),
    runYouCam("skin-analysis", url, { hd }, { label }),
  ]);
  if (fa.status === "rejected" && sk.status === "rejected") throw fa.reason;
  setStore({
    faceAttr: fa.status === "fulfilled" ? normalizeFaceAttr(fa.value.results) : getStore().faceAttr,
    skin: sk.status === "fulfilled" ? normalizeSkin(sk.value.results) : getStore().skin,
    persona: null,
  });
  const failed = [fa, sk].find((r) => r.status === "rejected");
  if (failed) throw failed.reason;
}

export async function renderLooks({ label, onStep } = {}) {
  const s = getStore();
  if (!s.photo) throw new Error("Scan your face first.");
  onStep?.("looks");
  const [a, b] = await Promise.allSettled([
    runYouCam("makeup-vto", s.photo.src, { look: { kind: "rx", rx: s.rx, faceAttr: s.faceAttr, skin: s.skin, skinHex: s.skinHex } }, { label: label && `${label}-rx` }),
    runYouCam("makeup-vto", s.photo.src, { look: { kind: "generic" } }, { label: label && `${label}-generic` }),
  ]);
  const looks = { ...getStore().looks };
  if (a.status === "fulfilled") looks.rx = { image: a.value.results.image, rxKey: rxKey(s.rx), at: Date.now() };
  if (b.status === "fulfilled") looks.generic = { image: b.value.results.image, at: Date.now() };
  setStore({ looks });
  const failed = [a, b].find((r) => r.status === "rejected");
  if (failed) throw failed.reason;
}

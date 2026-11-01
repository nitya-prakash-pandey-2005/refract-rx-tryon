// Demo profiles: YouCam documentation sample portraits plus real, recorded YouCam responses
// (labelled "Sample data" in the UI). If a recording is missing, the profile still works
// for measurement, frames and the Studio; only the YouCam cards stay empty.
import { setStore } from "../state/store";
import { replay } from "./api";
import { acceptPhoto } from "./capture";
import { loadImage } from "../vision/image";
import { normalizeFaceAttr, normalizeSkin } from "../engine/youcam";

export const PERSONAS = [
  {
    id: "lena", name: "Lena", photo: "/demo/lena.jpg",
    blurb: "−6.50 shortsighted, loves big frames",
    rx: { od: { sph: -6.5, cyl: -0.75, axis: 180 }, os: { sph: -6.0, cyl: -0.5, axis: 175 } },
  },
  {
    id: "helen", name: "Helen", photo: "/demo/helen.png",
    blurb: "+2.75 longsighted, glasses all day",
    rx: { od: { sph: 2.75, cyl: -0.5, axis: 90 }, os: { sph: 3.0, cyl: -0.25, axis: 85 } },
  },
];

const tryReplay = (label, feature) => replay(label, feature).catch(() => null);

export async function loadPersona(id) {
  const p = PERSONAS.find((x) => x.id === id);
  await acceptPhoto(await loadImage(p.photo), "demo");
  const [fa, sk, lr, lg] = await Promise.all([tryReplay(id, "face-attr-analysis"), tryReplay(id, "skin-analysis"), tryReplay(`${id}-rx`, "makeup-vto"), tryReplay(`${id}-generic`, "makeup-vto")]);
  const looks = {};
  if (lr?.results?.image) looks.rx = { image: lr.results.image, recordedAt: lr.recordedAt, replay: true, rxKey: JSON.stringify(p.rx) };
  if (lg?.results?.image) looks.generic = { image: lg.results.image, recordedAt: lg.recordedAt, replay: true };
  setStore({
    persona: id, rx: p.rx, rxConfirmed: true, looks,
    faceAttr: fa ? normalizeFaceAttr(fa.results) : null,
    skin: sk ? normalizeSkin(sk.results) : null,
    recordedAt: fa?.recordedAt || null,
  });
  return { ...p, recorded: Boolean(fa || lr) };
}

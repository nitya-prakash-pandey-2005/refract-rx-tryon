// Demo profiles built from real, recorded YouCam responses (labelled "Sample data" in the UI).
import { setStore } from "../state/store";
import { replay } from "./api";
import { acceptPhoto } from "./capture";
import { loadImage } from "../vision/image";
import { normalizeFaceAttr, normalizeSkin } from "../engine/youcam";

export const PERSONAS = [
  {
    id: "ananya", name: "Ananya", photo: "/demo/ananya.jpg",
    blurb: "−6.50 myope who loves big frames",
    rx: { od: { sph: -6.5, cyl: -0.75, axis: 180 }, os: { sph: -6.0, cyl: -0.5, axis: 175 } },
  },
  {
    id: "ravi", name: "Ravi", photo: "/demo/ravi.jpg",
    blurb: "+2.75 hyperope, reading glasses all day",
    rx: { od: { sph: 2.75, cyl: -0.5, axis: 90 }, os: { sph: 3.0, cyl: -0.25, axis: 85 } },
  },
];

export async function loadPersona(id) {
  const p = PERSONAS.find((x) => x.id === id);
  await acceptPhoto(await loadImage(p.photo), "demo");
  const [fa, sk] = await Promise.all([replay(id, "face-attr-analysis"), replay(id, "skin-analysis")]);
  const looks = {};
  for (const kind of ["rx", "generic"]) {
    try {
      const r = await replay(`${id}-${kind}`, "makeup-vto");
      if (r.results?.image) looks[kind] = { image: r.results.image, recordedAt: r.recordedAt, replay: true };
    } catch { /* look not recorded */ }
  }
  setStore({ persona: id, rx: p.rx, rxConfirmed: true, faceAttr: normalizeFaceAttr(fa.results), skin: normalizeSkin(sk.results), looks, recordedAt: fa.recordedAt });
  return p;
}

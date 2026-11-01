// Turn any photo (camera frame, upload, demo) into the stored profile basics:
// landmarks → measurements (PD, face width, mm/px) → cheek colour.
import { setStore } from "../state/store";
import { detectImage } from "../vision/landmarker";
import { fit, jpeg, cheekHex } from "../vision/image";
import { measureFace } from "../engine/measure";

export async function acceptPhoto(source, origin) {
  const { canvas, w, h } = fit(source, 1600);
  const { landmarks, faces } = await detectImage(canvas);
  if (!landmarks) throw new Error("We couldn't find a face. Use a clear, front-facing photo.");
  if (faces > 1) throw new Error("We found more than one face. Use a photo with just you.");
  const measure = measureFace(landmarks, w, h);
  if (measure.faceBox.w < 220) throw new Error("Your face is too small in this photo. Use a closer photo.");
  setStore({
    photo: { src: jpeg(canvas, 0.88), w, h, source: origin, at: Date.now() },
    landmarks,
    measure,
    skinHex: cheekHex(canvas, landmarks, w, h),
    faceAttr: null,
    skin: null,
    looks: {},
    persona: origin === "demo" ? undefined : null,
  });
  return measure;
}

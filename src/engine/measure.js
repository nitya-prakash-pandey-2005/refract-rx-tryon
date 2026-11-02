// Face measurements from MediaPipe Face Landmarker (478 points, normalised 0..1).
// The human iris is ~11.7 mm wide in almost everyone, so it works as a ruler in the photo.
export const IRIS_MM = 11.7;
export const IRIS_SD = 0.043; // relative spread of iris width across adults
export const CAMERA_HFOV = 60; // degrees, typical phone/laptop camera
const ROTATION_CENTRE = 13.5; // mm behind the cornea

const LM = { odCentre: 468, odRing: [469, 470, 471, 472], osCentre: 473, osRing: [474, 475, 476, 477], nasion: 168, noseTip: 1, chin: 152, top: 10, cheekL: 234, cheekR: 454, templeL: 127, templeR: 356 };

const px = (lm, i, W, H) => ({ x: lm[i].x * W, y: lm[i].y * H });
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const ringWidth = (lm, ring, W) => {
  const xs = ring.map((i) => lm[i].x * W);
  return Math.max(...xs) - Math.min(...xs);
};

export function measureFace(landmarks, W, H) {
  const P = (i) => px(landmarks, i, W, H);
  const od = P(LM.odCentre), os = P(LM.osCentre), nasion = P(LM.nasion);
  const irisPx = (ringWidth(landmarks, LM.odRing, W) + ringWidth(landmarks, LM.osRing, W)) / 2;
  const mmPerPx = IRIS_MM / irisPx;

  const gap = dist(od, os);
  const u = { x: (os.x - od.x) / gap, y: (os.y - od.y) / gap };
  const proj = (p) => (p.x - nasion.x) * u.x + (p.y - nasion.y) * u.y;
  const near = gap * mmPerPx;

  const fPx = W / (2 * Math.tan(((CAMERA_HFOV / 2) * Math.PI) / 180));
  const distanceMm = (fPx * IRIS_MM) / irisPx;
  const k = (distanceMm + ROTATION_CENTRE) / distanceMm; // eyes converge on the camera; undo it
  const right = -proj(od) * mmPerPx * k, left = proj(os) * mmPerPx * k;

  const xs = landmarks.map((p) => p.x * W), ys = landmarks.map((p) => p.y * H);
  const faceBox = { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };

  return {
    mmPerPx,
    irisPx,
    distanceMm,
    pd: { near, far: left + right, left, right, plusMinus: (left + right) * IRIS_SD },
    faceWidthMm: dist(P(LM.templeL), P(LM.templeR)) * mmPerPx,
    eyeLine: { angleDeg: (Math.atan2(os.y - od.y, os.x - od.x) * 180) / Math.PI, od, os, nasion },
    faceBox,
  };
}

// 3:4 portrait crop where the face takes `faceShare` of the width (YouCam needs > 60 %).
export function cropForAnalysis(faceBox, W, H, faceShare = 0.7) {
  let w = faceBox.w / faceShare, h = (w * 4) / 3;
  if (h > H) { h = H; w = Math.min(w, (h * 3) / 4); }
  if (w > W) { w = W; h = Math.min(H, (w * 4) / 3); }
  const cx = faceBox.x + faceBox.w / 2, cy = faceBox.y + faceBox.h / 2;
  const x = Math.min(Math.max(0, cx - w / 2), W - w);
  const y = Math.min(Math.max(0, cy - h / 2), H - h);
  return { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) };
}

export function qualityChecks({ landmarks, W, H, luma }) {
  if (!landmarks) return [{ id: "face", ok: false, hint: "Look at the camera so we can find your face." }];
  const P = (i) => px(landmarks, i, W, H);
  const cheekL = P(LM.cheekL), cheekR = P(LM.cheekR), nose = P(LM.noseTip), chin = P(LM.chin);
  const od = P(LM.odCentre), os = P(LM.osCentre);
  const faceW = dist(cheekL, cheekR);
  const mid = { x: (cheekL.x + cheekR.x) / 2, y: (od.y + os.y) / 2 };
  const yaw = (nose.x - mid.x) / faceW;
  const pitch = (nose.y - mid.y) / Math.max(1, chin.y - mid.y);
  const roll = (Math.atan2(os.y - od.y, os.x - od.x) * 180) / Math.PI;

  const checks = [{ id: "face", ok: true, hint: "Face found." }];
  checks.push(faceW < 340 ? { id: "size", ok: false, hint: "Move a little closer." }
    : faceW > W * 0.8 ? { id: "size", ok: false, hint: "Move back a little." }
    : { id: "size", ok: true, hint: "Good distance." });
  const centred = mid.x > W * 0.33 && mid.x < W * 0.67 && mid.y > H * 0.2 && mid.y < H * 0.7;
  checks.push({ id: "centre", ok: centred, hint: centred ? "Centred." : "Centre your face in the frame." });
  const poseOk = Math.abs(yaw) < 0.06 && Math.abs(roll) < 6 && pitch > 0.18 && pitch < 0.58;
  checks.push({
    id: "pose", ok: poseOk,
    hint: poseOk ? "Looking straight." : Math.abs(roll) >= 6 ? "Keep your head level." : Math.abs(yaw) >= 0.06 ? (yaw > 0 ? "Turn slightly to your right." : "Turn slightly to your left.") : "Look straight at the camera.",
  });
  if (luma) {
    const lightOk = luma.mean > 70 && luma.mean < 215 && Math.abs(luma.left - luma.right) < 28;
    checks.push({
      id: "light", ok: lightOk,
      hint: lightOk ? "Light is even." : luma.mean <= 70 ? "Find brighter light." : luma.mean >= 215 ? "Too bright — step away from the light." : "Light is uneven — face the window or lamp.",
    });
  }
  return checks;
}

// Head turned too far for a frontal frame overlay (about 30°+): temples become lopsided
// around the nose bridge.
export function faceTurned(landmarks, limit = 0.35) {
  const d = (a, b) => Math.hypot(landmarks[a].x - landmarks[b].x, landmarks[a].y - landmarks[b].y);
  const l = d(LM.templeL, LM.nasion), r = d(LM.templeR, LM.nasion);
  return Math.abs(l - r) / (l + r) > limit;
}

// With several faces in view, follow the biggest (closest) one.
export function widestFace(faces) {
  if (!faces?.length) return null;
  const width = (f) => Math.max(...f.map((p) => p.x)) - Math.min(...f.map((p) => p.x));
  return faces.reduce((a, b) => (width(b) > width(a) ? b : a));
}

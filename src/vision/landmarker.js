// MediaPipe Face Landmarker (478 landmarks incl. irises), served from /mediapipe and /models.
import { FilesetResolver, FaceLandmarker } from "@mediapipe/tasks-vision";

let fileset = null;
const cache = {};

async function create(runningMode) {
  fileset ||= await FilesetResolver.forVisionTasks("/mediapipe");
  const opts = (delegate) => ({
    baseOptions: { modelAssetPath: "/models/face_landmarker.task", delegate },
    runningMode,
    numFaces: 2,
    minFaceDetectionConfidence: 0.5,
    minFacePresenceConfidence: 0.5,
  });
  try {
    return await FaceLandmarker.createFromOptions(fileset, opts("GPU"));
  } catch {
    return await FaceLandmarker.createFromOptions(fileset, opts("CPU"));
  }
}

export function getLandmarker(mode = "VIDEO") {
  cache[mode] ||= create(mode);
  return cache[mode];
}

// Detect on a still image/canvas. Returns { landmarks, faces } (landmarks of the largest face).
export async function detectImage(source) {
  const lm = await getLandmarker("IMAGE");
  const res = lm.detect(source);
  const faces = res.faceLandmarks || [];
  if (!faces.length) return { landmarks: null, faces: 0 };
  const width = (f) => Math.max(...f.map((p) => p.x)) - Math.min(...f.map((p) => p.x));
  const biggest = faces.reduce((a, b) => (width(b) > width(a) ? b : a));
  return { landmarks: biggest.map(({ x, y, z }) => ({ x, y, z })), faces: faces.length };
}

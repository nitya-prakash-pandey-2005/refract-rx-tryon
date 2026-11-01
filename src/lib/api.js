// Browser → our server. The YouCam key lives on the server; replay mode reads recorded
// real YouCam responses from /replay so judges can try everything without a key.
import { logCall } from "../state/store";

export class ApiError extends Error {
  constructor(message, code) { super(message); this.code = code; }
}

const FRIENDLY = {
  error_src_face_too_small: "Your face is too small in the photo. Move closer and retake.",
  error_src_face_out_of_bound: "Part of your face is outside the photo. Centre it and retake.",
  error_lighting_dark: "The photo is too dark. Find brighter, even light.",
  error_no_face: "We couldn't find a face. Look straight at the camera.",
  CreditInsufficiency: "The YouCam account is out of units. Switch to the demo profile.",
  InvalidApiKey: "The server's YouCam key isn't valid. Try a sample profile instead.",
  RateLimited: "Too many requests from this device. Try again in a few minutes, or use a sample profile.",
  DailyBudget: "Today's live YouCam demo budget is used up. Try a sample profile.",
  NoApiKey: "Live YouCam calls aren't set up on this server. Use the demo profile.",
};

async function post(url, body) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.status === "error") throw new ApiError(FRIENDLY[json.code] || json.error || `Request failed (${res.status})`, json.code);
  return json;
}

export const health = () => fetch("/api/health").then((r) => r.json()).catch(() => ({ youcam: false, llm: null }));

// The server builds the YouCam params from presets; we only send what to run.
export async function runYouCam(feature, image, extra = {}, { label } = {}) {
  const out = await post("/api/youcam/run", { feature, image, ...extra, label });
  logCall({ feature, units: out.units, ms: out.ms, source: "live" });
  return out;
}

export async function replay(persona, feature) {
  const res = await fetch(`/replay/${persona}-${feature}.json`);
  if (!res.ok) throw new ApiError("Recorded sample is missing.", "NoReplay");
  const json = await res.json();
  logCall({ feature, units: 0, ms: 0, source: "replay" });
  return { status: "success", feature, results: json.results, recordedAt: json.recordedAt, replay: true };
}

export const askAgent = (messages, profile) => post("/api/agent", { messages, profile });

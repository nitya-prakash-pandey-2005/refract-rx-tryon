// Server-side YouCam client: File API upload → task → poll. The API key never leaves the server.
const BASE = () => process.env.YOUCAM_BASE || "https://yce-api-01.makeupar.com";
const KEY = () => process.env.YOUCAM_API_KEY;
const VERSION = { "skin-analysis": "v2.1" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export class YouCamError extends Error {
  constructor(message, code, status) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function call(path, { method = "GET", body } = {}) {
  if (!KEY()) throw new YouCamError("YouCam API key is not configured on the server.", "NoApiKey", 503);
  const res = await fetch(BASE() + path, {
    method,
    headers: { Authorization: `Bearer ${KEY()}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || (json.status && json.status !== 200)) {
    throw new YouCamError(json.error || `YouCam request failed (${res.status})`, json.error_code || "HttpError", res.status);
  }
  return json;
}

export async function uploadImage(buf, mime = "image/jpeg") {
  const json = await call("/s2s/v2.0/file", {
    method: "POST",
    body: { files: [{ content_type: mime, file_name: `refract-${Date.now()}.${mime === "image/png" ? "png" : "jpg"}`, file_size: buf.length }] },
  });
  const file = json.data.files[0];
  const req = file.requests[0];
  const headers = Object.fromEntries(Object.entries(req.headers || {}).filter(([k]) => k.toLowerCase() !== "content-length"));
  const put = await fetch(req.url, { method: req.method || "PUT", headers, body: buf });
  if (!put.ok) throw new YouCamError(`Image upload failed (${put.status})`, "UploadFailed", 502);
  return file.file_id;
}

export async function createTask(feature, body) {
  const v = VERSION[feature] || "v2.0";
  const json = await call(`/s2s/${v}/task/${feature}`, { method: "POST", body });
  return json.data.task_id;
}

// Never re-create a task because polling ran out: that would charge units twice.
export const POLL_TIMEOUT_MS = 100000; // stays under the 120 s serverless limit
export async function pollTask(feature, taskId, { intervalMs = 3000, timeoutMs = POLL_TIMEOUT_MS } = {}) {
  const v = VERSION[feature] || "v2.0";
  const t0 = Date.now();
  await sleep(1500);
  while (Date.now() - t0 < timeoutMs) {
    const json = await call(`/s2s/${v}/task/${feature}/${taskId}`);
    const d = json.data || {};
    if (d.task_status === "success") return d;
    if (d.task_status === "error") throw new YouCamError(d.error_message || d.error || "Task failed", d.error || "TaskError", 422);
    await sleep(intervalMs);
  }
  throw new YouCamError("YouCam is taking longer than usual. Please try again in a minute.", "PollTimeout", 504);
}

export async function credit() {
  const json = await call("/s2s/v1.0/client/credit");
  const list = json.results || json.data?.results || [];
  return list.reduce((a, r) => a + Number(r.amount_dec ?? r.amount ?? 0), 0);
}

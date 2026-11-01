// One handler for every /api route; used by the local dev server and the Vercel function.
import { uploadImage, createTask, pollTask, credit, YouCamError } from "./youcam.js";
import { unitCost } from "../src/engine/youcam.js";
import { runAgent, llmProvider } from "./agent.js";

const FEATURES = new Set(["face-attr-analysis", "skin-analysis", "makeup-vto", "skin-tone-analysis"]);
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

const send = (res, status, body) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
};

function decodeImage(dataUrl) {
  const m = /^data:(image\/(?:jpeg|png));base64,(.+)$/.exec(dataUrl || "");
  if (!m) throw new YouCamError("Send the photo as a JPEG or PNG data URL.", "BadImage", 400);
  const buf = Buffer.from(m[2], "base64");
  if (buf.length > MAX_IMAGE_BYTES) throw new YouCamError("Photo is too large (max 8 MB).", "BadImage", 413);
  return { buf, mime: m[1] };
}

async function toDataUrl(url) {
  const r = await fetch(url);
  if (!r.ok) throw new YouCamError("Could not download the try-on result.", "ResultDownload", 502);
  const type = r.headers.get("content-type") || "image/jpeg";
  return `data:${type};base64,${Buffer.from(await r.arrayBuffer()).toString("base64")}`;
}

async function record(feature, label, params, results) {
  if (process.env.RECORD !== "1") return;
  const { writeFile, mkdir } = await import("node:fs/promises");
  await mkdir("public/replay/img", { recursive: true });
  const name = `${label || feature}-${feature}.json`.replace(/[^a-z0-9.\-]/gi, "_");
  // Save mask overlays locally: YouCam result URLs expire after 2 hours.
  for (const [i, o] of (results?.output || []).entries()) {
    if (!o.mask_urls?.[0]) continue;
    const r = await fetch(o.mask_urls[0]);
    if (!r.ok) continue;
    const file = `img/${label || feature}-${o.type}-${o.region || "whole"}-${i}.jpg`.replace(/[^a-z0-9.\-/]/gi, "_");
    await writeFile(`public/replay/${file}`, Buffer.from(await r.arrayBuffer()));
    o.mask_urls = [`/replay/${file}`];
  }
  await writeFile(`public/replay/${name}`, JSON.stringify({ feature, params, results, recordedAt: new Date().toISOString() }, null, 2));
}

export async function handle(req, res) {
  const path = (req.url || "").split("?")[0].replace(/\/+$/, "");
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  try {
    if (path === "/api/health") return send(res, 200, { youcam: Boolean(process.env.YOUCAM_API_KEY), llm: llmProvider() });

    if (path === "/api/youcam/credit") return send(res, 200, { units: await credit() });

    if (path === "/api/youcam/run" && req.method === "POST") {
      const { feature, image, params = {}, label } = body;
      if (!FEATURES.has(feature)) throw new YouCamError(`Unsupported feature: ${feature}`, "BadFeature", 400);
      const t0 = Date.now();
      const { buf, mime } = decodeImage(image);
      const fileId = await uploadImage(buf, mime);
      const taskId = await createTask(feature, { ...params, src_file_id: fileId });
      const data = await pollTask(feature, taskId);
      // Result URLs expire in 2 h and need CORS for canvas use, so inline the try-on image.
      if (feature === "makeup-vto" && data.results?.url) data.results.image = await toDataUrl(data.results.url);
      await record(feature, label, params, data.results);
      return send(res, 200, { status: "success", feature, results: data.results, units: unitCost(feature, params), ms: Date.now() - t0, taskId });
    }

    if (path === "/api/agent" && req.method === "POST") return send(res, 200, await runAgent(body));

    return send(res, 404, { error: "Not found" });
  } catch (e) {
    const status = e instanceof YouCamError ? e.status || 500 : 500;
    if (!(e instanceof YouCamError)) console.error(e);
    return send(res, status, { status: "error", error: e.message, code: e.code || "ServerError" });
  }
}

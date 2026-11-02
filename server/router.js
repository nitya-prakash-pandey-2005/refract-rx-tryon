// One handler for every /api route; used by the local dev server and the Vercel function.
import { uploadImage, createTask, pollTask, credit, imageMime, YouCamError } from "./youcam.js";
import { unitCost } from "../src/engine/youcam.js";
import { runAgent, llmProvider } from "./agent.js";
import { allow, buildParams, budgetLeft, spend } from "./limits.js";
import { FRAMES, getFrame, parseFrameSize, customFrame } from "../src/engine/frames.js";
import { remakeRisk } from "../src/engine/risk.js";
import { sanitizeRx, parseDiopter, RANGES } from "../src/engine/rxinput.js";

const FEATURES = new Set(["face-attr-analysis", "skin-analysis", "makeup-vto"]);
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

// Result files live on S3; connections occasionally drop mid-download, so retry a few times.
async function download(url, tries = 3) {
  for (let i = 1; ; i++) {
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return { buf: Buffer.from(await r.arrayBuffer()), type: r.headers.get("content-type") };
    } catch (e) {
      if (i >= tries) throw e;
      await new Promise((res) => setTimeout(res, 600 * i));
    }
  }
}

async function toDataUrl(url) {
  try {
    const { buf, type } = await download(url);
    return `data:${imageMime(buf, type)};base64,${buf.toString("base64")}`;
  } catch {
    throw new YouCamError("Could not download the try-on result.", "ResultDownload", 502);
  }
}

// Recording for the sample profiles is best effort: it must never fail a paid YouCam call.
async function record(feature, label, params, results) {
  if (process.env.RECORD !== "1") return;
  try {
    const { writeFile, mkdir } = await import("node:fs/promises");
    await mkdir("public/replay/img", { recursive: true });
    const name = `${label || feature}-${feature}.json`.replace(/[^a-z0-9.\-]/gi, "_");
    const copy = structuredClone(results);
    // Save mask overlays locally: YouCam result URLs expire after 2 hours.
    for (const [i, o] of (copy?.output || []).entries()) {
      if (!o.mask_urls?.[0]) continue;
      try {
        const { buf } = await download(o.mask_urls[0]);
        const file = `img/${label || feature}-${o.type}-${o.region || "whole"}-${i}.jpg`.replace(/[^a-z0-9.\-/]/gi, "_");
        await writeFile(`public/replay/${file}`, buf);
        o.mask_urls = [`/replay/${file}`];
      } catch (e) {
        console.warn(`record: skipped mask ${o.type}: ${e.message}`);
      }
    }
    await writeFile(`public/replay/${name}`, JSON.stringify({ feature, params, results: copy, recordedAt: new Date().toISOString() }, null, 2));
  } catch (e) {
    console.warn(`record: could not save ${feature}: ${e.message}`);
  }
}

// Public optics API (v1): the same engine the app uses, for stores and AI agents.
const publicRisk = (r) => ({ score: r.score, level: r.level, fixes: r.fixes, lensIndex: r.lens.best.label, parts: Object.fromEntries(Object.entries(r.parts).map(([k, p]) => [k, { level: p.level, headline: p.headline, fix: p.fix }])) });
function riskApi(body) {
  const eyeOk = (e) => e && typeof e === "object" && !Array.isArray(e) && parseDiopter(e.sph, RANGES.sph) !== null && (e.cyl == null || parseDiopter(e.cyl, RANGES.cyl) !== null);
  if (!body.rx || typeof body.rx !== "object" || !eyeOk(body.rx.od) || !eyeOk(body.rx.os)) throw new YouCamError("Send rx as { od: { sph, cyl, axis }, os: { sph, cyl, axis } } with numeric powers in dioptres.", "BadRx", 400);
  const rx = sanitizeRx(body.rx);
  const pd = { left: Number(body.pd?.left) || 31.5, right: Number(body.pd?.right) || 31.5, plusMinus: Number(body.pd?.plusMinus) || 2.5 };
  const face = { faceWidthMm: Number(body.face?.faceWidthMm) || undefined, noseWidthMm: Number(body.face?.noseWidthMm) || undefined, bridge: ["low", "medium", "high"].includes(body.face?.bridge) ? body.face.bridge : "medium" };
  const oil = Number(body.oiliness);
  const oiliness = body.oiliness != null && Number.isFinite(oil) ? Math.max(0, Math.min(100, oil)) : 60;
  if (body.frame && typeof body.frame === "object") {
    const size = body.frame.size != null ? parseFrameSize(body.frame.size) : parseFrameSize(`${body.frame.A}-${body.frame.DBL}`);
    if (!size) throw new YouCamError("Send frame as { size: \"52-18-140\", shape, material } (lens width 33-66 mm, bridge 12-26 mm).", "BadFrame", 400);
    const frame = customFrame({ ...size, B: body.frame.B, shape: body.frame.shape, material: body.frame.material });
    return { frameId: "custom", size: `${frame.A}-${frame.DBL}-${frame.temple}`, ...publicRisk(remakeRisk({ frame, rx, pd, face, oiliness })) };
  }
  if (body.frameId) {
    const frame = body.frameId === "custom" ? undefined : getFrame(body.frameId);
    if (!frame) throw new YouCamError(`Unknown frameId: ${body.frameId}`, "BadFrame", 400);
    return { frameId: frame.id, ...publicRisk(remakeRisk({ frame, rx, pd, face, oiliness })) };
  }
  const ranked = FRAMES.map((frame) => ({ frameId: frame.id, name: frame.name, ...publicRisk(remakeRisk({ frame, rx, pd, face, oiliness })) })).sort((a, b) => a.score - b.score);
  return { ranked };
}

const ipOf = (req) => String(req.headers?.["x-forwarded-for"] || "").split(",")[0].trim() || req.socket?.remoteAddress || "local";
const TOO_MANY = () => new YouCamError("Too many requests from this device. Try again in a few minutes.", "RateLimited", 429);

export async function handle(req, res) {
  const path = (req.url || "").split("?")[0].replace(/\/+$/, "");
  try {
    let body;
    try { body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {}; } catch { throw new YouCamError("Invalid JSON body.", "BadJson", 400); }
    if (path === "/api/health") return send(res, 200, { youcam: Boolean(process.env.YOUCAM_API_KEY), llm: llmProvider() });

    if (path === "/api/v1/frames" && req.method === "GET") return send(res, 200, { frames: FRAMES.map(({ id, name, shape, A, B, DBL, temple, weightG, pads, material, priceUsd }) => ({ id, name, shape, A, B, DBL, temple, weightG, pads, material, priceUsd })) });

    if (path === "/api/v1/risk" && req.method === "POST") {
      if (!allow(`api:${ipOf(req)}`, { limit: 120, windowMs: 10 * 60 * 1000 })) throw TOO_MANY();
      return send(res, 200, riskApi(body));
    }

    if (path === "/api/youcam/credit") return send(res, 200, { units: await credit() });

    if (path === "/api/youcam/run" && req.method === "POST") {
      const { feature, image, label } = body;
      if (!FEATURES.has(feature)) throw new YouCamError(`Unsupported feature: ${feature}`, "BadFeature", 400);
      if (!allow(`yc:${ipOf(req)}`, { limit: 24, windowMs: 10 * 60 * 1000 })) throw TOO_MANY();
      const params = buildParams(feature, body);
      if (budgetLeft() < unitCost(feature, params)) throw new YouCamError("Today's demo budget for live YouCam calls is used up. Try a sample profile.", "DailyBudget", 429);
      const t0 = Date.now();
      const { buf, mime } = decodeImage(image);
      const fileId = await uploadImage(buf, mime);
      const taskId = await createTask(feature, { ...params, src_file_id: fileId });
      const data = await pollTask(feature, taskId);
      // Result URLs expire in 2 h and need CORS for canvas use, so inline the try-on image.
      if (feature === "makeup-vto" && data.results?.url) data.results.image = await toDataUrl(data.results.url);
      spend(unitCost(feature, params));
      await record(feature, process.env.RECORD === "1" ? label : null, params, data.results);
      return send(res, 200, { status: "success", feature, results: data.results, units: unitCost(feature, params), ms: Date.now() - t0, taskId });
    }

    if (path === "/api/agent" && req.method === "POST") {
      if (!allow(`ag:${ipOf(req)}`, { limit: 30, windowMs: 10 * 60 * 1000 })) throw TOO_MANY();
      return send(res, 200, await runAgent(body));
    }

    return send(res, 404, { error: "Not found" });
  } catch (e) {
    const status = e instanceof YouCamError ? e.status || 500 : 500;
    if (!(e instanceof YouCamError)) console.error(e);
    return send(res, status, { status: "error", error: e.message, code: e.code || "ServerError" });
  }
}

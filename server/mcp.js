#!/usr/bin/env node
// Refract MCP server: prescription-aware eyewear tools for AI shopping agents (Claude, ChatGPT,
// any MCP client). Same optics/physics engine as the app.
//   { "mcpServers": { "refract": { "command": "node", "args": ["server/mcp.js"] } } }
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { FRAMES, getFrame, SHAPES, parseFrameSize, customFrame } from "../src/engine/frames.js";
import { lensPair } from "../src/engine/fit.js";
import { remakeRisk } from "../src/engine/risk.js";
import { materialSight } from "../src/engine/sight.js";
import { sanitizeRx } from "../src/engine/rxinput.js";

const server = new McpServer({ name: "refract-optics", version: "1.0.0" });

const rxShape = {
  sph_right: z.number().describe("Sphere of the right eye (OD) in dioptres, e.g. -6.5"),
  sph_left: z.number().describe("Sphere of the left eye (OS) in dioptres"),
  cyl: z.number().optional().describe("Cylinder (both eyes) in dioptres, e.g. -0.75"),
  axis: z.number().optional().describe("Cylinder axis in degrees (0-180)"),
  pd: z.number().optional().describe("Binocular pupillary distance in mm (default 63)"),
  pd_known: z.boolean().optional().describe("True if the PD was measured by an optician or with a card (±0.5 mm)"),
};
const faceShape = {
  bridge: z.enum(["low", "medium", "high"]).optional().describe("Nasal bridge: low if glasses usually rest on the cheeks"),
  face_width_mm: z.number().optional().describe("Face width at the temples in mm"),
  oiliness: z.number().optional().describe("YouCam Skin AI oiliness score 1-100 (higher = less oily)"),
};
const ctx = (a) => ({
  rx: sanitizeRx({ od: { sph: a.sph_right, cyl: a.cyl ?? 0, axis: a.axis ?? 0 }, os: { sph: a.sph_left, cyl: a.cyl ?? 0, axis: a.axis ?? 0 } }),
  pd: { left: (a.pd ?? 63) / 2, right: (a.pd ?? 63) / 2, plusMinus: a.pd_known ? 0.5 : 2.7 },
  face: { bridge: a.bridge ?? "medium", faceWidthMm: a.face_width_mm, noseWidthMm: 13.5 },
  oiliness: a.oiliness ?? 60,
});
const brief = (r) => ({ score: r.score, level: r.level, lens: r.lens.best.label, fixes: r.fixes, parts: Object.fromEntries(Object.entries(r.parts).map(([k, p]) => [k, { level: p.level, headline: p.headline }])) });
const json = (v) => ({ content: [{ type: "text", text: JSON.stringify(v) }] });

server.registerTool("rank_frames", {
  title: "Rank frames for a prescription",
  description: "Rank every frame in the catalogue by remake risk (lowest first) for this prescription: lens thickness and eye-size change, colour fringing of the lens material, slipping on the nose, and PD accuracy.",
  inputSchema: { ...rxShape, ...faceShape },
}, async (a) => {
  const c = ctx(a);
  return json(FRAMES.map((frame) => ({ frame_id: frame.id, name: frame.name, price_usd: frame.priceUsd, ...brief(remakeRisk({ frame, ...c })) })).sort((x, y) => x.score - y.score));
});

server.registerTool("remake_risk", {
  title: "Remake risk for one frame",
  description: "Predict whether this frame with this prescription is likely to be returned or remade, with the reason (look, sight, fit, measure) and concrete fixes.",
  inputSchema: { ...rxShape, ...faceShape, frame_id: z.string().describe(`One of: ${FRAMES.map((f) => f.id).join(", ")}`) },
}, async (a) => {
  const frame = getFrame(a.frame_id);
  if (!frame) return { isError: true, content: [{ type: "text", text: `Unknown frame_id ${a.frame_id}` }] };
  return json({ frame_id: frame.id, ...brief(remakeRisk({ frame, ...ctx(a) })) });
});

server.registerTool("lens_report", {
  title: "Lens report",
  description: "Edge/centre thickness, lens weight and how much smaller or bigger the eyes look to others, for a frame and prescription at the recommended lens index.",
  inputSchema: { ...rxShape, frame_id: z.string() },
}, async (a) => {
  const frame = getFrame(a.frame_id);
  if (!frame) return { isError: true, content: [{ type: "text", text: `Unknown frame_id ${a.frame_id}` }] };
  const { rx, pd } = ctx(a);
  const p = lensPair({ frame, rx, pd });
  return json({ frame_id: frame.id, index: p.best.label, edge_mm: +Math.max(p.od.maxEdge, p.os.maxEdge).toFixed(1), centre_mm: +Math.max(p.od.centre, p.os.centre).toFixed(1), lens_weight_g: +(p.od.weightG + p.os.weightG).toFixed(1), eye_size_change_pct: +(((p.od.magnification.mean + p.os.magnification.mean) / 2 - 1) * 100).toFixed(1), note: p.note });
});

server.registerTool("check_any_frame", {
  title: "Check any frame from any store",
  description: "Remake risk and lens thickness for ANY frame on the internet, from the size printed inside its temple arm (lens width, bridge, temple, e.g. \"52□18 140\") and its shape and material. Use it when the shopper is looking at a frame outside the Refract catalogue.",
  inputSchema: {
    ...rxShape, ...faceShape,
    size: z.string().describe("Frame size as printed on the arm or in the listing, e.g. \"52-18-140\""),
    shape: z.enum(SHAPES).optional().describe("Lens shape (default rect)"),
    material: z.enum(["acetate", "metal", "titanium"]).optional().describe("Frame material; metal and titanium frames have adjustable nose pads"),
    lens_height_mm: z.number().optional().describe("Lens height (B) if the listing gives it"),
  },
}, async (a) => {
  const size = parseFrameSize(a.size);
  if (!size) return { isError: true, content: [{ type: "text", text: `Could not read the frame size "${a.size}". Expected lens width 33-66 mm and bridge 12-26 mm, like "52-18-140".` }] };
  const frame = customFrame({ ...size, B: a.lens_height_mm, shape: a.shape, material: a.material });
  const c = ctx(a);
  const p = lensPair({ frame, rx: c.rx, pd: c.pd });
  return json({ size: `${frame.A}-${frame.DBL}-${frame.temple}`, lens_height_mm: frame.B, edge_mm: +Math.max(p.od.maxEdge, p.os.maxEdge).toFixed(1), ...brief(remakeRisk({ frame, ...c })) });
});

server.registerTool("sight_by_material", {
  title: "Colour fringing by lens material",
  description: "For a prescription, compare lens materials by colour-clean zone and the acuity lost when glancing 10 mm off-centre (Prentice's rule, Abbe number, Winter et al. 2015).",
  inputSchema: { power: z.number().describe("Strongest meridian power in dioptres") },
}, async ({ power }) => json(materialSight({ sph: power, cyl: 0, axis: 0 }).map((r) => ({ material: r.index.label, abbe: r.abbe, clean_zone_mm: +r.cleanZoneMm.toFixed(1), chart_lines_lost_at_10mm: +r.linesLost.toFixed(2), verdict: r.verdict }))));

await server.connect(new StdioServerTransport());

// "Ask Refract": an optician + makeup-artist agent. Every number it says comes from a tool
// that runs the same optics engine as the app. With ANTHROPIC_API_KEY it uses Claude
// (manual tool loop); without one, a deterministic planner answers from the same tools.
import Anthropic from "@anthropic-ai/sdk";
import { FRAMES, getFrame } from "../src/engine/frames.js";
import { rankFrames, lensPair } from "../src/engine/fit.js";
import { INDICES, spherEq } from "../src/engine/optics.js";
import { planLook } from "../src/engine/makeup.js";

export const llmProvider = () => (process.env.ANTHROPIC_API_KEY ? "claude" : null);
const MODEL = "claude-opus-5-5";
const MAX_STEPS = 6;

const r1 = (v) => Math.round(v * 10) / 10;
const an = (n) => (/^(8|11|18)/.test(String(n)) ? "an" : "a");
const SHAPES = ["round", "oval", "panto", "rect", "square", "browline", "geo", "cat", "butterfly", "aviator"];

// ---------- profile ----------
function ctxFrom(profile = {}) {
  const rx = profile.rx || { od: { sph: -6.5, cyl: -0.75, axis: 180 }, os: { sph: -6, cyl: -0.5, axis: 175 } };
  return {
    rx,
    pd: profile.pd || { left: 31.5, right: 31.5 },
    faceWidthMm: profile.faceWidthMm || null,
    faceShape: profile.faceAttr?.faceShape || null,
    faceAttr: profile.faceAttr || {},
    skin: profile.skin || {},
    skinHex: profile.skinHex || null,
  };
}

// ---------- tools ----------
const TOOLS = [
  {
    name: "search_frames",
    description: "Rank the store's frames for this shopper's prescription, PD and face. Returns each frame's Rx-Fit score (0-100), the thickest lens edge (minus Rx) or centre (plus Rx) in mm at the recommended lens index, lens weight, and price. Use filters only when the shopper asks for them.",
    input_schema: {
      type: "object",
      properties: {
        shapes: { type: "array", items: { type: "string", enum: SHAPES }, description: "Frame shapes to include. Empty array = all shapes." },
        max_lens_width_mm: { type: "number", description: "Largest lens width (A) in mm to include. Use 0 for no limit." },
        max_price_usd: { type: "number", description: "Highest frame price in USD. Use 0 for no limit." },
      },
      required: ["shapes", "max_lens_width_mm", "max_price_usd"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: "lens_report",
    description: "Full lens report for one frame with this prescription: edge/centre thickness per eye, weight, how much bigger or smaller the eyes look to others, Abbe value and price, at a chosen lens index (or the recommended one when index is 0). Also returns why the frame scores what it does.",
    input_schema: {
      type: "object",
      properties: {
        frame_id: { type: "string", enum: FRAMES.map((f) => f.id) },
        index: { type: "number", enum: [0, ...INDICES.map((i) => i.n)], description: "Lens index, or 0 for the recommended one." },
      },
      required: ["frame_id", "index"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: "plan_eye_look",
    description: "The eye makeup look Refract recommends for this shopper's lenses (minus lenses shrink the eyes, plus lenses magnify them), with the reasons and the products. Based on YouCam face and skin analysis when available.",
    input_schema: { type: "object", properties: {}, required: [], additionalProperties: false },
    strict: true,
  },
  {
    name: "suggest_action",
    description: "Show the shopper a button: open a frame in the prescription-true try-on studio, or add a frame with a lens index to their bag. The shopper always confirms; nothing is bought automatically.",
    input_schema: {
      type: "object",
      properties: {
        type: { type: "string", enum: ["open_studio", "add_to_bag"] },
        frame_id: { type: "string", enum: FRAMES.map((f) => f.id) },
        index: { type: "number", enum: [0, ...INDICES.map((i) => i.n)], description: "Lens index for add_to_bag, or 0 for the recommended one." },
      },
      required: ["type", "frame_id", "index"],
      additionalProperties: false,
    },
    strict: true,
  },
];

function runTool(name, input, ctx, actions) {
  if (name === "search_frames") {
    const ranked = rankFrames(ctx).filter(({ frame }) =>
      (!input.shapes?.length || input.shapes.includes(frame.shape)) &&
      (!input.max_lens_width_mm || frame.A <= input.max_lens_width_mm) &&
      (!input.max_price_usd || frame.priceUsd <= input.max_price_usd));
    return ranked.map(({ frame, fit }) => ({
      id: frame.id, name: frame.name, shape: frame.shape, colour: frame.colorway.name, lens_width_mm: frame.A, bridge_mm: frame.DBL,
      price_usd: frame.priceUsd, rx_fit: fit.score, [fit.minus ? "edge_mm" : "centre_mm"]: r1(fit.thick),
      recommended_index: fit.lens.best.n, lens_weight_g: r1(fit.lens.od.weightG + fit.lens.os.weightG),
    }));
  }
  if (name === "lens_report") {
    const frame = getFrame(input.frame_id);
    if (!frame) return { error: "Unknown frame" };
    const fit = rankFrames(ctx).find((r) => r.frame.id === frame.id).fit;
    const index = INDICES.find((i) => i.n === input.index) || fit.lens.best;
    const pair = lensPair({ frame, rx: ctx.rx, pd: ctx.pd, index });
    return {
      frame: `${frame.name} (${frame.A}□${frame.DBL}, ${frame.colorway.name})`, index: index.label, recommended_index: fit.lens.best.label,
      edge_mm: { right_eye: r1(pair.od.maxEdge), left_eye: r1(pair.os.maxEdge) }, centre_mm: r1(Math.max(pair.od.centre, pair.os.centre)),
      lens_weight_g: r1(pair.od.weightG + pair.os.weightG), eye_size_change_pct: r1(((pair.od.magnification.mean + pair.os.magnification.mean) / 2 - 1) * 100),
      abbe: index.abbe, frame_price_usd: frame.priceUsd, lens_price_usd: index.priceUsd, rx_fit: fit.score,
      why: fit.drivers.map((d) => `${d.label} (${d.contribution >= 0 ? "+" : ""}${Math.round(d.contribution * 100)})`), index_note: fit.lens.note,
    };
  }
  if (name === "plan_eye_look") {
    const look = planLook({ rx: ctx.rx, faceAttr: ctx.faceAttr, skin: ctx.skin, skinHex: ctx.skinHex });
    return { look: look.name, lens_class: look.lensClass, reasons: look.reasons, products: look.products.map((p) => `${p.name} (${p.shade}) $${p.priceUsd}`) };
  }
  if (name === "suggest_action") {
    const frame = getFrame(input.frame_id);
    if (!frame) return { error: "Unknown frame" };
    actions.push({ type: input.type, frameId: frame.id, index: input.index || null, label: input.type === "open_studio" ? `Try ${frame.name} on with my Rx` : `Add ${frame.name} to bag` });
    return { ok: true };
  }
  return { error: `Unknown tool ${name}` };
}

const summarise = (name, out) => {
  if (name === "search_frames") return `${out.length} frames ranked · top: ${out.slice(0, 3).map((f) => `${f.name} ${f.rx_fit}`).join(", ")}`;
  if (name === "lens_report") return out.error || `${out.frame} · ${out.index} · edge ${Math.max(out.edge_mm.right_eye, out.edge_mm.left_eye)} mm · eyes ${out.eye_size_change_pct}%`;
  if (name === "plan_eye_look") return `${out.look}: ${out.reasons[0]}`;
  if (name === "suggest_action") return "Button added";
  return "";
};

function systemPrompt(ctx) {
  const fmt = (e) => `${e.sph >= 0 ? "+" : ""}${e.sph.toFixed(2)} ${e.cyl.toFixed(2)} × ${e.axis}`;
  return `You are Refract, an optician and makeup artist inside an eyewear shop. You help one shopper choose frames, lens index and eye makeup that work with their real prescription.

Shopper profile (measured in the app):
- Prescription: right ${fmt(ctx.rx.od)}, left ${fmt(ctx.rx.os)} (spherical equivalent ${spherEq(ctx.rx.od).toFixed(2)} / ${spherEq(ctx.rx.os).toFixed(2)} D)
- PD: right ${r1(ctx.pd.right)} mm, left ${r1(ctx.pd.left)} mm${ctx.faceWidthMm ? `; face width ${Math.round(ctx.faceWidthMm)} mm` : ""}
- Face shape: ${ctx.faceShape || "unknown"}; eye colour: ${ctx.faceAttr.eyeColorName || "unknown"}; eyelid: ${ctx.faceAttr.eyelid || "unknown"}

How to work:
- Use the tools for every number you state (thickness, weight, eye size, price, score). Never estimate them yourself.
- Be honest about trade-offs: if a frame the shopper loves will look thick with their Rx, say so plainly, then offer the closest frame that keeps the look with thinner lenses.
- Don't upsell: if a thinner lens index saves little, say it isn't worth the money.
- This is a cosmetic shopping preview, not medical advice. The shopper's optician confirms the final lenses.
- End by offering one or two buttons with suggest_action (open the studio or add to bag). The shopper always decides.
- Keep replies short: 3 to 6 sentences, plain language, no markdown tables.`;
}

async function runClaude(messages, ctx) {
  const client = new Anthropic();
  const actions = [], trace = [];
  const convo = messages.map((m) => ({ role: m.role, content: m.content }));
  for (let step = 0; step < MAX_STEPS; step++) {
    const res = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium" },
      system: systemPrompt(ctx),
      tools: TOOLS,
      messages: convo,
    });
    if (res.stop_reason === "refusal") return { reply: "I can't help with that one. I can help you compare frames, lenses and eye makeup for your prescription.", trace, actions, provider: "claude" };
    const text = res.content.filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
    const calls = res.content.filter((b) => b.type === "tool_use");
    if (res.stop_reason !== "tool_use" || !calls.length) return { reply: text || "Done.", trace, actions, provider: "claude" };
    convo.push({ role: "assistant", content: res.content });
    const results = calls.map((c) => {
      let out;
      try { out = runTool(c.name, c.input, ctx, actions); } catch (e) { out = { error: e.message }; }
      trace.push({ tool: c.name, input: c.input, summary: summarise(c.name, out) });
      return { type: "tool_result", tool_use_id: c.id, content: JSON.stringify(out), ...(out?.error ? { is_error: true } : {}) };
    });
    convo.push({ role: "user", content: results });
  }
  return { reply: "I ran out of steps. Try asking about one or two frames at a time.", trace, actions, provider: "claude" };
}

// ---------- deterministic planner (no LLM key) ----------
function runPlanner(messages, ctx) {
  const q = String(messages.filter((m) => m.role === "user").pop()?.content || "").toLowerCase();
  const actions = [], trace = [];
  const call = (name, input) => { const out = runTool(name, input, ctx, actions); trace.push({ tool: name, input, summary: summarise(name, out) }); return out; };
  const se = spherEq(Math.abs(spherEq(ctx.rx.od)) > Math.abs(spherEq(ctx.rx.os)) ? ctx.rx.od : ctx.rx.os);
  const fmtSe = `${se > 0 ? "+" : ""}${se.toFixed(2)} D`;

  if (/makeup|eyeliner|liner|shadow|mascara|look|concealer|dark circle/.test(q)) {
    const look = call("plan_eye_look", {});
    return { reply: `${look.reasons[0]} That's why I'd go with the ${look.look} look. ${look.reasons.slice(1, 3).join(" ")} You can see it rendered on your own photo in the Studio.`, trace, actions: [{ type: "open_studio", frameId: null, label: "See the look in the Studio" }], provider: "planner" };
  }

  const named = FRAMES.find((f) => q.includes(f.name.toLowerCase()));
  const wantShapes = [];
  if (/round|circle/.test(q)) wantShapes.push("round", "panto", "oval");
  if (/square|rect|angular/.test(q)) wantShapes.push("square", "rect", "browline", "geo");
  if (/cat|butterfly|statement/.test(q)) wantShapes.push("cat", "butterfly");
  if (/aviator|pilot/.test(q)) wantShapes.push("aviator");
  const price = Number((/(?:under|below|less than|max)\s*\$?\s*(\d{2,4})/.exec(q) || [])[1] || 0);
  const big = /big|oversized|large|wide|bold/.test(q);

  const all = call("search_frames", { shapes: [], max_lens_width_mm: 0, max_price_usd: 0 });
  const metric = (f) => f.edge_mm ?? f.centre_mm;
  if (named) {
    const rep = call("lens_report", { frame_id: named.id, index: 0 });
    const best = all[0];
    call("suggest_action", { type: "open_studio", frame_id: named.id, index: 0 });
    const thick = Math.max(rep.edge_mm.right_eye, rep.edge_mm.left_eye);
    let reply = `With your ${fmtSe} prescription, the ${named.name} needs ${rep.recommended_index} lenses and still shows ${se < 0 ? `${an(thick)} ${thick} mm edge` : `${an(rep.centre_mm)} ${rep.centre_mm} mm centre`}; your eyes would look ${Math.abs(rep.eye_size_change_pct)}% ${rep.eye_size_change_pct < 0 ? "smaller" : "bigger"} to others. It scores ${rep.rx_fit}/100 for you.`;
    if (best.id !== named.id) { reply += ` If you want thinner lenses, the ${best.name} scores ${best.rx_fit} with ${an(metric(best))} ${metric(best)} mm ${se < 0 ? "edge" : "centre"}.`; call("suggest_action", { type: "open_studio", frame_id: best.id, index: 0 }); }
    return { reply: rep.index_note.startsWith("Even") ? reply : `${reply} ${rep.index_note}`, trace, actions, provider: "planner" };
  }

  const pool = wantShapes.length || price ? call("search_frames", { shapes: [...new Set(wantShapes)], max_lens_width_mm: 0, max_price_usd: price }) : all;
  const pick = pool[0] || all[0];
  const biggest = [...all].sort((a, b) => b.lens_width_mm - a.lens_width_mm)[0];
  call("suggest_action", { type: "open_studio", frame_id: pick.id, index: 0 });
  call("suggest_action", { type: "add_to_bag", frame_id: pick.id, index: 0 });
  let reply = `For your ${fmtSe} prescription, my pick${wantShapes.length ? " in that style" : ""}${price ? ` under $${price}` : ""} is the ${pick.name} (${pick.colour}): Rx-Fit ${pick.rx_fit}/100, ${metric(pick)} mm ${se < 0 ? "edge" : "centre"} with ${pick.recommended_index.toFixed(2)} lenses, ${pick.lens_weight_g} g of lens, $${pick.price_usd}.`;
  if (big && Math.abs(se) >= 3) reply += ` Big frames are the hardest with your Rx: the ${biggest.name} (${biggest.lens_width_mm} mm lens) would show ${metric(biggest)} mm even in the best lens. If you love the oversized look, keep the width under 52 mm and choose a rounder shape.`;
  else if (pool[1]) reply += ` Runner-up: ${pool[1].name} (${pool[1].rx_fit}/100, ${metric(pool[1])} mm).`;
  return { reply, trace, actions, provider: "planner" };
}

export async function runAgent({ messages = [], profile } = {}) {
  const ctx = ctxFrom(profile);
  const clean = messages.filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim()).slice(-12);
  if (!clean.length || clean[clean.length - 1].role !== "user") return { reply: "Ask me about a frame, your lenses or your eye makeup.", trace: [], actions: [], provider: null };
  if (llmProvider()) {
    try { return await runClaude(clean, ctx); } catch (e) { console.error("Claude agent failed, using planner:", e.message); }
  }
  return runPlanner(clean, ctx);
}

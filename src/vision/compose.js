// Prescription-true try-on compositor (Canvas 2D).
// 1) draw the photo (or a YouCam makeup render), 2) re-sample each lens area through the
// lens optics (warpSource), 3) add edge "power rings", glare and coating, 4) draw the frame.
import { warpSource } from "../engine/placement";

export function prepareSource(image, W, H) {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(image, 0, 0, W, H);
  return { canvas, data: ctx.getImageData(0, 0, W, H), W, H };
}

const pathOf = (poly) => {
  const p = new Path2D();
  poly.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
  p.closePath();
  return p;
};

function lensMask(lens, W, H) {
  if (lens._mask) return lens._mask;
  const xs = lens.poly.map((p) => p[0]), ys = lens.poly.map((p) => p[1]);
  const bx = Math.max(0, Math.floor(Math.min(...xs)) - 1), by = Math.max(0, Math.floor(Math.min(...ys)) - 1);
  const bw = Math.min(W, Math.ceil(Math.max(...xs)) + 1) - bx, bh = Math.min(H, Math.ceil(Math.max(...ys)) + 1) - by;
  if (bw <= 0 || bh <= 0) return (lens._mask = null);
  const c = document.createElement("canvas");
  c.width = bw;
  c.height = bh;
  const g = c.getContext("2d", { willReadFrequently: true });
  g.translate(-bx, -by);
  g.fill(pathOf(lens.poly));
  const a = g.getImageData(0, 0, bw, bh).data;
  const mask = new Uint8ClampedArray(bw * bh);
  for (let i = 0; i < mask.length; i++) mask[i] = a[i * 4 + 3];
  return (lens._mask = { bx, by, bw, bh, mask, path: pathOf(lens.poly) });
}

function warpLens(ctx, src, lens, power, mmPerPx, t) {
  const m = lensMask(lens, src.W, src.H);
  if (!m) return;
  const out = ctx.getImageData(m.bx, m.by, m.bw, m.bh);
  const o = out.data, s = src.data.data, W = src.W, H = src.H;
  for (let y = 0; y < m.bh; y++) {
    for (let x = 0; x < m.bw; x++) {
      const k = y * m.bw + x;
      const alpha = m.mask[k];
      if (!alpha) continue;
      const q = warpSource(m.bx + x + 0.5, m.by + y + 0.5, lens, power, mmPerPx, t);
      const fx = Math.min(W - 1.001, Math.max(0, q.x - 0.5)), fy = Math.min(H - 1.001, Math.max(0, q.y - 0.5));
      const x0 = fx | 0, y0 = fy | 0, ax = fx - x0, ay = fy - y0;
      const i00 = (y0 * W + x0) * 4, i10 = i00 + 4, i01 = i00 + W * 4, i11 = i01 + 4;
      const a = alpha / 255, j = k * 4;
      for (let c = 0; c < 3; c++) {
        const v = (s[i00 + c] * (1 - ax) + s[i10 + c] * ax) * (1 - ay) + (s[i01 + c] * (1 - ax) + s[i11 + c] * ax) * ay;
        o[j + c] = o[j + c] * (1 - a) + v * a;
      }
    }
  }
  ctx.putImageData(out, m.bx, m.by);
}

function scaledPath(poly, c, k) {
  return pathOf(poly.map(([x, y]) => [c.x + (x - c.x) * k, c.y + (y - c.y) * k]));
}

function lensEffects(ctx, lens, { edgeMm, minus, t, pxPerMm }) {
  const m = lens._mask;
  if (!m) return;
  ctx.save();
  ctx.clip(m.path);
  // Edge thickness shows as concentric "power rings" near the rim of strong minus lenses.
  if (minus && edgeMm > 2.5 && t > 0.01) {
    const n = Math.min(6, Math.round((edgeMm - 2) / 1.2));
    const step = (0.9 * pxPerMm) / Math.max(1, Math.hypot(m.bw, m.bh) / 2);
    ctx.lineWidth = Math.max(1, pxPerMm * 0.22);
    for (let i = 1; i <= n; i++) {
      ctx.strokeStyle = `rgba(255,255,255,${(0.16 - i * 0.02) * t})`;
      ctx.stroke(scaledPath(lens.poly, lens.oc, 1 - i * step * (1 + edgeMm / 6)));
    }
    ctx.strokeStyle = `rgba(20,24,36,${0.22 * t})`;
    ctx.lineWidth = Math.min(edgeMm, 9) * pxPerMm * 0.5;
    ctx.stroke(m.path);
  }
  // Glare and anti-reflective coating sheen.
  const g = ctx.createLinearGradient(m.bx, m.by, m.bx + m.bw, m.by + m.bh);
  g.addColorStop(0, "rgba(255,255,255,0.16)");
  g.addColorStop(0.32, "rgba(255,255,255,0.02)");
  g.addColorStop(0.75, "rgba(255,255,255,0)");
  g.addColorStop(1, "rgba(140,255,210,0.06)");
  ctx.fillStyle = g;
  ctx.fillRect(m.bx, m.by, m.bw, m.bh);
  ctx.restore();
}

// ---------- frame ----------
let tortoise = null;
function tortoisePattern(ctx, rim, accent) {
  if (!tortoise) {
    const c = document.createElement("canvas");
    c.width = c.height = 120;
    const g = c.getContext("2d");
    g.fillStyle = rim;
    g.fillRect(0, 0, 120, 120);
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 70; i++) {
      g.fillStyle = i % 3 ? `rgba(201,138,60,${0.25 + rnd() * 0.45})` : `rgba(30,14,6,${0.4 + rnd() * 0.4})`;
      g.beginPath();
      g.ellipse(rnd() * 120, rnd() * 120, 3 + rnd() * 10, 2 + rnd() * 6, rnd() * Math.PI, 0, Math.PI * 2);
      g.fill();
    }
    tortoise = c;
  }
  return ctx.createPattern(tortoise, "repeat");
}

function offsetPoly(poly, centre, d) {
  return poly.map(([x, y]) => {
    const dx = x - centre.x, dy = y - centre.y, r = Math.hypot(dx, dy) || 1;
    return [x + (dx / r) * d, y + (dy / r) * d];
  });
}

function rimStyle(ctx, frame, lens, rimPx) {
  const { rim, accent, pattern } = frame.colorway;
  if (pattern === "tortoise") return tortoisePattern(ctx, rim, accent);
  const m = lens._mask || { bx: lens.boxCentre.x, by: lens.boxCentre.y - 40, bh: 80 };
  const g = ctx.createLinearGradient(0, m.by - rimPx, 0, m.by + m.bh + rimPx);
  if (frame.material === "metal") {
    g.addColorStop(0, accent); g.addColorStop(0.45, rim); g.addColorStop(0.55, accent); g.addColorStop(1, rim);
  } else {
    g.addColorStop(0, accent); g.addColorStop(0.35, rim); g.addColorStop(1, rim);
  }
  return g;
}

export function drawFrame(ctx, place, frame) {
  const { pxPerMm, lenses, u, toPx } = place;
  const rimPx = Math.max(2, frame.rim * pxPerMm);
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.shadowColor = frame.colorway.pattern === "crystal" ? "rgba(0,0,0,0.12)" : "rgba(0,0,0,0.38)";
  ctx.shadowBlur = 2.2 * pxPerMm;
  ctx.shadowOffsetY = 1.4 * pxPerMm;

  for (const side of ["od", "os"]) {
    const L = lenses[side];
    const ring = pathOf(offsetPoly(L.poly, L.boxCentre, rimPx / 2));
    ctx.strokeStyle = rimStyle(ctx, frame, L, rimPx);
    ctx.lineWidth = rimPx;
    ctx.stroke(ring);
    if (frame.shape === "browline") {
      const top = offsetPoly(L.poly.filter(([, y]) => y < L.boxCentre.y - 2), L.boxCentre, rimPx * 0.9);
      ctx.lineWidth = rimPx * 1.7;
      ctx.beginPath();
      top.sort((a, b) => a[0] - b[0]).forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.stroke();
    }
    // End piece + temple stub toward the ear.
    const [hx, hy] = toPx(L.oc, L.flip * (frame.A / 2 + L.dec + frame.rim * 0.6), -frame.B * 0.28 + 2);
    const ex = hx + L.flip * u.x * 7 * pxPerMm, ey = hy + L.flip * u.y * 7 * pxPerMm;
    ctx.lineWidth = Math.max(2, rimPx * (frame.material === "metal" ? 1.1 : 0.85));
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
  }

  // Bridge between the lenses.
  const nasal = (L) => toPx(L.oc, L.flip * (-frame.A / 2 + L.dec - frame.rim * 0.3), -frame.B * 0.2 + 2);
  const [ax, ay] = nasal(lenses.od), [bx, by] = nasal(lenses.os);
  const mx = (ax + bx) / 2, my = (ay + by) / 2 - 2.2 * pxPerMm;
  ctx.strokeStyle = rimStyle(ctx, frame, lenses.os, rimPx);
  ctx.lineWidth = frame.material === "metal" ? Math.max(2, 1.3 * pxPerMm) : rimPx * 0.85;
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.quadraticCurveTo(mx, my, bx, by);
  ctx.stroke();
  if (frame.shape === "aviator") {
    const [cx1, cy1] = toPx(lenses.od.oc, lenses.od.flip * (-frame.A / 2 + lenses.od.dec + 2), -frame.B / 2 + 2);
    const [cx2, cy2] = toPx(lenses.os.oc, lenses.os.flip * (-frame.A / 2 + lenses.os.dec + 2), -frame.B / 2 + 2);
    ctx.beginPath();
    ctx.moveTo(cx1, cy1);
    ctx.lineTo(cx2, cy2);
    ctx.stroke();
  }

  // Nose pads (metal frames) and a specular highlight on the rims.
  ctx.shadowColor = "transparent";
  if (frame.material === "metal") {
    ctx.fillStyle = "rgba(235,240,248,0.45)";
    for (const L of [lenses.od, lenses.os]) {
      const [px, py] = toPx(L.oc, L.flip * (-frame.A / 2 + L.dec + 2.5), frame.B * 0.12 + 2);
      ctx.beginPath();
      ctx.ellipse(px, py, 1.6 * pxPerMm, 2.6 * pxPerMm, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.strokeStyle = "rgba(255,255,255,0.28)";
  ctx.lineWidth = Math.max(1, rimPx * 0.18);
  for (const L of [lenses.od, lenses.os]) {
    const top = offsetPoly(L.poly.filter(([, y]) => y < L.boxCentre.y - (L._mask?.bh || 40) * 0.25), L.boxCentre, rimPx * 0.75);
    if (top.length < 3) continue;
    ctx.beginPath();
    top.sort((a, b) => a[0] - b[0]).forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
  }
  ctx.restore();
}

// Full scene. `lens` = { od:{maxEdge}, os:{maxEdge}, minus } from the optics engine.
export function drawScene(ctx, { source, place, frame, rx, t, lens, showFrame = true }) {
  ctx.drawImage(source.canvas, 0, 0);
  for (const side of ["od", "os"]) {
    const L = place.lenses[side];
    lensMask(L, source.W, source.H);
    if (t > 0.001) warpLens(ctx, source, L, rx[side], place.mmPerPx, t);
    lensEffects(ctx, L, { edgeMm: lens?.[side]?.maxEdge ?? 0, minus: lens?.minus, t, pxPerMm: place.pxPerMm });
  }
  if (showFrame) drawFrame(ctx, place, frame);
}

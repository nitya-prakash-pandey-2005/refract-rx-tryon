// What you will SEE through the lens: transverse chromatic aberration grows with distance from
// the optical centre (Prentice) and shrinks with the material's Abbe number. Red and blue are
// displaced radially in opposite directions; the dashed circle is the colour-clean zone.
import { useEffect, useRef } from "react";
import { cleanZoneRadiusMm, TCA_THRESHOLD, ARCMIN_PER_PRISM } from "../engine/sight";

const W = 720, H = 380;
const LENS_MM_AT_EDGE = 16; // the scene's horizontal edge corresponds to a 16 mm glance off-centre
const PX_PER_ARCMIN = 0.75; // display scale: colour split drawn at about 2× its true angular size

let scene = null;
function drawScene() {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d");
  g.fillStyle = "#0b0e1a";
  g.fillRect(0, 0, W, H);
  // A high-contrast "street at night" scene: signage, window bars, a lit strip — where fringes show.
  g.fillStyle = "#f4f4f4";
  for (let x = 30; x < W; x += 92) g.fillRect(x, 40, 6, 300);
  g.fillRect(20, 300, W - 40, 6);
  g.fillStyle = "#0f8f5a";
  g.fillRect(250, 120, 220, 70);
  g.fillStyle = "#ffffff";
  g.font = "700 40px system-ui, sans-serif";
  g.textAlign = "center";
  g.fillText("EXIT →", 360, 170);
  g.font = "700 26px system-ui, sans-serif";
  g.fillText("PLATFORM 9", 140, 90);
  g.fillText("OPEN 24H", 590, 90);
  g.fillStyle = "#ffffff";
  g.fillRect(60, 240, 600, 4);
  g.font = "600 18px ui-monospace, monospace";
  g.fillStyle = "#e8e8e8";
  g.fillText("The quick brown fox reads small print at the edge", 360, 275);
  return g.getImageData(0, 0, W, H);
}

export default function SightSim({ power, abbe, label, glanceMm = 10 }) {
  const ref = useRef(null);
  useEffect(() => {
    scene ||= drawScene();
    const ctx = ref.current.getContext("2d");
    const out = ctx.createImageData(W, H);
    const s = scene.data, o = out.data;
    const cx = W / 2, cy = H / 2, mmPerPx = LENS_MM_AT_EDGE / (W / 2);
    const F = Math.abs(power);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const dx = x - cx, dy = y - cy, r = Math.hypot(dx, dy) || 1;
        const tcaDelta = ((r * mmPerPx) / 10) * F / abbe; // prism dioptres of colour split here
        const split = (tcaDelta * ARCMIN_PER_PRISM * PX_PER_ARCMIN) / 2;
        const ux = dx / r, uy = dy / r;
        const sample = (sx, sy, ch) => {
          const ix = Math.min(W - 1, Math.max(0, Math.round(sx))), iy = Math.min(H - 1, Math.max(0, Math.round(sy)));
          return s[(iy * W + ix) * 4 + ch];
        };
        const i = (y * W + x) * 4;
        o[i] = sample(x - ux * split, y - uy * split, 0);
        o[i + 1] = s[i + 1];
        o[i + 2] = sample(x + ux * split, y + uy * split, 2);
        o[i + 3] = 255;
      }
    }
    ctx.putImageData(out, 0, 0);
    // Clean zone and the glance point.
    const rz = cleanZoneRadiusMm(F, abbe, TCA_THRESHOLD) / mmPerPx;
    ctx.save();
    ctx.setLineDash([8, 6]);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(52,211,153,0.9)";
    if (Number.isFinite(rz)) { ctx.beginPath(); ctx.arc(cx, cy, Math.min(rz, W), 0, Math.PI * 2); ctx.stroke(); }
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(34,211,238,0.95)";
    ctx.beginPath();
    ctx.arc(cx + glanceMm / mmPerPx, cy, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = "600 13px ui-monospace, monospace";
    ctx.fillText(`${glanceMm} mm glance`, cx + glanceMm / mmPerPx + 9, cy - 8);
    ctx.fillStyle = "rgba(52,211,153,0.95)";
    if (Number.isFinite(rz) && rz < W) ctx.fillText(`colour-clean zone Ø ${(2 * rz * mmPerPx).toFixed(0)} mm`, cx - 80, Math.max(16, cy - rz - 8));
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillText(label, 12, H - 12);
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillText("colour split shown ~2× for visibility", W - 12, H - 12);
    ctx.restore();
  }, [power, abbe, label, glanceMm]);
  return <canvas ref={ref} width={W} height={H} className="sight-sim" aria-label={`Simulated view through ${label}`} />;
}

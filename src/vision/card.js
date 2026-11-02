// Shareable "Refract card" (1080×1350, Instagram portrait): your look through your lenses
// plus the numbers that matter. Drawn on a canvas from the Studio's rendered scene.
const W = 1080, H = 1350;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export async function renderCard({ source, crop, title, subtitle, stats, logo = "/icons/icon.svg" }) {
  await document.fonts?.ready;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d");
  const css = getComputedStyle(document.documentElement);
  const v = (n, d) => css.getPropertyValue(n).trim() || d;

  // Background: deep base + soft colour glows.
  ctx.fillStyle = v("--bg", "#05060f");
  ctx.fillRect(0, 0, W, H);
  for (const [x, y, r, col] of [[180, 140, 520, "rgba(255,77,157,0.22)"], [950, 420, 560, "rgba(34,211,238,0.16)"], [520, 1250, 600, "rgba(139,92,246,0.2)"]]) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, col);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  // Photo through the lenses.
  const px = 60, py = 150, pw = W - 120, ph = 760;
  ctx.save();
  roundRect(ctx, px, py, pw, ph, 36);
  ctx.clip();
  const k = Math.max(pw / crop.w, ph / crop.h);
  const sw = pw / k, sh = ph / k;
  ctx.drawImage(source, crop.x + (crop.w - sw) / 2, crop.y + (crop.h - sh) / 2, sw, sh, px, py, pw, ph);
  ctx.restore();
  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.lineWidth = 2;
  roundRect(ctx, px, py, pw, ph, 36);
  ctx.stroke();

  // Header.
  const icon = new Image();
  icon.src = logo;
  await icon.decode().catch(() => {});
  if (icon.complete && icon.naturalWidth) ctx.drawImage(icon, 60, 52, 56, 56);
  ctx.fillStyle = v("--text", "#e9ecf8");
  ctx.font = '700 40px "Space Grotesk Variable", system-ui, sans-serif';
  ctx.textBaseline = "middle";
  ctx.fillText("Refract", 132, 80);
  ctx.font = '500 22px "JetBrains Mono Variable", monospace';
  ctx.fillStyle = v("--cyan", "#22d3ee");
  ctx.textAlign = "right";
  ctx.fillText("THROUGH MY REAL LENSES", W - 60, 80);
  ctx.textAlign = "left";

  // Title + stats.
  ctx.fillStyle = v("--text", "#e9ecf8");
  ctx.font = '700 46px "Space Grotesk Variable", system-ui, sans-serif';
  ctx.fillText(title, 60, 980);
  ctx.fillStyle = v("--text-2", "#b7bdd8");
  ctx.font = '400 26px "Inter Variable", system-ui, sans-serif';
  ctx.fillText(subtitle, 60, 1030);
  const colW = (W - 120 - 30) / stats.length;
  stats.forEach(([label, value], i) => {
    const x = 60 + i * (colW + 10), y = 1080;
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    roundRect(ctx, x, y, colW, 150, 24);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.stroke();
    const g = ctx.createLinearGradient(x, 0, x + colW, 0);
    g.addColorStop(0, "#ff4d9d");
    g.addColorStop(0.5, "#a855f7");
    g.addColorStop(1, "#22d3ee");
    ctx.fillStyle = g;
    ctx.font = '700 44px "Space Grotesk Variable", system-ui, sans-serif';
    ctx.fillText(value, x + 22, y + 58);
    ctx.fillStyle = v("--muted", "#7d86a8");
    ctx.font = '500 20px "Inter Variable", system-ui, sans-serif';
    ctx.fillText(label, x + 22, y + 112);
  });

  ctx.fillStyle = v("--muted", "#7d86a8");
  ctx.font = '400 20px "Inter Variable", system-ui, sans-serif';
  ctx.fillText("Prescription-true try-on · YouCam AI · cosmetic preview, not medical advice", 60, H - 52);
  return new Promise((resolve) => c.toBlob(resolve, "image/png"));
}

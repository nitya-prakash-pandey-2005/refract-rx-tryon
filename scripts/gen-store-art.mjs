// Product images for the demo store: each frame drawn from its real contour (SVG, mm units).
import { writeFileSync } from "node:fs";
import { FRAMES, frameContour } from "../src/engine/frames.js";

for (const f of FRAMES) {
  const c = frameContour(f, 96);
  const half = f.A / 2 + f.DBL / 2;
  const pts = (flip) => c.map(([x, y]) => `${(flip * (x + half)).toFixed(2)},${y.toFixed(2)}`).join(" ");
  const w = 2 * f.A + f.DBL + 30, h = f.B + 30;
  const rim = Math.max(1.2, f.rim);
  const fill = f.colorway.pattern === "tortoise" ? "url(#t)" : "url(#g)";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-w / 2} ${-h / 2} ${w} ${h}">
<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${f.colorway.accent}"/><stop offset=".45" stop-color="${f.colorway.rim}"/><stop offset="1" stop-color="${f.material === "metal" ? f.colorway.accent : f.colorway.rim}"/></linearGradient>
<pattern id="t" width="9" height="9" patternUnits="userSpaceOnUse"><rect width="9" height="9" fill="${f.colorway.rim}"/><ellipse cx="2.5" cy="3" rx="2.2" ry="1.3" fill="${f.colorway.accent}" opacity=".55"/><ellipse cx="7" cy="6.5" rx="1.6" ry="1" fill="#1a0d05" opacity=".6"/></pattern>
<radialGradient id="l" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#ffffff" stop-opacity=".35"/><stop offset="1" stop-color="#cfe3ff" stop-opacity=".08"/></radialGradient></defs>
${[-1, 1].map((s) => `<polygon points="${pts(s)}" fill="url(#l)" stroke="${fill}" stroke-width="${rim}" stroke-linejoin="round"/>`).join("")}
<path d="M${-f.DBL / 2 - 0.5},${-f.B * 0.2} Q0,${-f.B * 0.2 - 3} ${f.DBL / 2 + 0.5},${-f.B * 0.2}" fill="none" stroke="${fill}" stroke-width="${f.material === "metal" ? 1.2 : rim * 0.85}" stroke-linecap="round"/>
<path d="M${-(f.A + f.DBL / 2) - rim / 2},${-f.B * 0.3} l-9,-1.5 M${f.A + f.DBL / 2 + rim / 2},${-f.B * 0.3} l9,-1.5" stroke="${fill}" stroke-width="${rim * 0.8}" stroke-linecap="round"/>
</svg>`;
  writeFileSync(`public/store/img/${f.id}.svg`, svg);
}
console.log(`wrote ${FRAMES.length} frame images`);

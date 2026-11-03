// Why thinner lenses split colour more: white light ray-traced through a 60° prism of each
// lens material (Snell's law at both faces, Cauchy dispersion fitted to n_d and the Abbe
// number). Switching material springs every coloured ray to its new exit angle.
import { useEffect, useMemo, useRef } from "react";
import { animate, spring, stagger } from "animejs";
import { reduced } from "../../lib/anim";
import { MATERIALS, cauchy, polarizability, spectrumColor, toCss } from "../../engine/light";

const WAVES = [420, 460, 500, 540, 580, 620, 660];
const SHOW = 4; // angular spread is drawn ×4 so it is visible at this size
// Light meets the first face at about 55° so that even 1.74 refracts out of the second face
// (at shallower angles it would be totally internally reflected: its critical angle is 35°).
const APEX = [260, 40], BL = [170, 210], BR = [350, 210], ORIGIN = [32.6, 212.2];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const unit = (a) => { const l = Math.hypot(a[0], a[1]); return [a[0] / l, a[1] / l]; };
// Vector Snell's law; N points back towards the incident side.
function refract(I, N, n1, n2) {
  const eta = n1 / n2, cosi = -dot(N, I), k = 1 - eta * eta * (1 - cosi * cosi);
  return k < 0 ? null : unit([eta * I[0] + (eta * cosi - Math.sqrt(k)) * N[0], eta * I[1] + (eta * cosi - Math.sqrt(k)) * N[1]]);
}
// Where the ray p + t·d meets segment a→b.
function hit(p, d, a, b) {
  const e = sub(b, a), den = d[0] * e[1] - d[1] * e[0];
  const t = ((a[0] - p[0]) * e[1] - (a[1] - p[1]) * e[0]) / den;
  return [p[0] + t * d[0], p[1] + t * d[1]];
}
const ENTRY = [BL[0] + 0.55 * (APEX[0] - BL[0]), BL[1] + 0.55 * (APEX[1] - BL[1])];
const N_LEFT = unit([-170, -90]), N_RIGHT_IN = unit([-170, 90]);

function trace(mat) {
  const n = cauchy(mat.n, mat.abbe), d0 = unit(sub(ENTRY, ORIGIN));
  const rays = WAVES.map((l) => {
    const inside = refract(d0, N_LEFT, 1, n(l)), exit = hit(ENTRY, inside, APEX, BR), out = refract(inside, N_RIGHT_IN, n(l), 1);
    return { l, exit, angle: Math.atan2(out[1], out[0]) };
  });
  const mid = rays[3].angle;
  return rays.map((r) => {
    const a = mid + SHOW * (r.angle - mid);
    return { ...r, end: [r.exit[0] + 170 * Math.cos(a), r.exit[1] + 170 * Math.sin(a)] };
  });
}
const COLORS = WAVES.map((l) => toCss(spectrumColor((x) => Math.exp(-0.5 * ((x - l) / 9) ** 2)).hue));

export default function Prism({ mat }) {
  const svgRef = useRef(null), barRef = useRef(null);
  const rays = useMemo(() => trace(mat), [mat]);
  const first = useRef(rays);
  const base = MATERIALS[0];
  const spread = (mat.n - 1) / mat.abbe / ((base.n - 1) / base.abbe);
  useEffect(() => {
    const root = svgRef.current;
    if (!root) return;
    const ins = root.querySelectorAll(".pr-in"), outs = root.querySelectorAll(".pr-out");
    const set = (els, k, v) => els.forEach((el, i) => el.setAttribute(k, v(i)));
    if (reduced()) {
      set(ins, "x2", (i) => rays[i].exit[0]); set(ins, "y2", (i) => rays[i].exit[1]);
      ["x1", "y1", "x2", "y2"].forEach((k, j) => set(outs, k, (i) => [rays[i].exit[0], rays[i].exit[1], rays[i].end[0], rays[i].end[1]][j]));
      return;
    }
    const ease = spring({ bounce: 0.35, duration: 700 });
    const a = animate(ins, { x2: (_, i) => rays[i].exit[0], y2: (_, i) => rays[i].exit[1], ease });
    const b = animate(outs, { x1: (_, i) => rays[i].exit[0], y1: (_, i) => rays[i].exit[1], x2: (_, i) => rays[i].end[0], y2: (_, i) => rays[i].end[1], ease, delay: stagger(25) });
    const c = animate(barRef.current, { width: `${(polarizability(mat.n) / 0.45) * 100}%`, ease });
    return () => { a.pause(); b.pause(); c.pause(); };
  }, [rays, mat]);

  const f = first.current;
  return (
    <div className="prism">
      <svg ref={svgRef} viewBox="0 0 520 260" className="lab-svg" role="img" aria-label={`White light split by a ${mat.label} prism`}>
        <defs><linearGradient id="pr-glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="var(--cyan)" stopOpacity=".28" /><stop offset="1" stopColor="var(--violet)" stopOpacity=".18" /></linearGradient></defs>
        <line x1={ORIGIN[0]} y1={ORIGIN[1]} x2={ENTRY[0]} y2={ENTRY[1]} stroke="#fff" strokeWidth="3" />
        {f.map((r, i) => <line key={`i${r.l}`} className="pr-in" x1={ENTRY[0]} y1={ENTRY[1]} x2={r.exit[0]} y2={r.exit[1]} stroke={COLORS[i]} strokeWidth="1.4" opacity=".7" />)}
        <polygon points={`${APEX} ${BL} ${BR}`} fill="url(#pr-glass)" stroke="var(--cyan)" strokeWidth="1.5" />
        {f.map((r, i) => <line key={`o${r.l}`} className="pr-out" x1={r.exit[0]} y1={r.exit[1]} x2={r.end[0]} y2={r.end[1]} stroke={COLORS[i]} strokeWidth="2.6" strokeLinecap="round" />)}
        <text x="30" y="236" className="lab-cap">white light</text>
        <text x="510" y="250" textAnchor="end" className="lab-cap">colour spread drawn ×{SHOW}</text>
      </svg>
      <div className="prism-stats">
        <div><span className="tiny muted">Refractive index n<sub>d</sub></span><b className="num">{mat.n.toFixed(3)}</b></div>
        <div><span className="tiny muted">Abbe number V</span><b className="num">{mat.abbe}</b></div>
        <div><span className="tiny muted">Colour split vs CR-39</span><b className={`num ${spread > 1.5 ? "bad" : spread > 1.1 ? "ok" : "good"}`}>×{spread.toFixed(2)}</b></div>
        <div className="prism-ll">
          <span className="tiny muted">Polarizability per volume, (n²−1)/(n²+2)</span>
          <span className="ll-bar"><i ref={barRef} style={{ width: `${(polarizability(f === rays ? mat.n : base.n) / 0.45) * 100}%` }} /></span>
          <span className="tiny num">{polarizability(mat.n).toFixed(3)}</span>
        </div>
      </div>
    </div>
  );
}

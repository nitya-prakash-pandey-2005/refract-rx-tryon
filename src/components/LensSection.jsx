// True-scale cross-section of a lens along the horizontal meridian (nasal → temporal).
// Ghost outline = 1.50 standard lens; solid = the chosen index. Same scale on both axes.
import { useEffect, useRef } from "react";
import { INDICES, sag, MIN_EDGE } from "../engine/optics";
import { drawStroke } from "../lib/anim";

function profile(F, n, minCenter, nasal, temporal, steps = 60) {
  const xs = Array.from({ length: steps + 1 }, (_, i) => -nasal + ((nasal + temporal) * i) / steps);
  const s = xs.map((x) => Math.sign(F) * sag(Math.abs(x), F, n));
  const tc = Math.max(minCenter, MIN_EDGE + Math.max(...s));
  return xs.map((x, i) => ({ x, t: tc - s[i] }));
}

export default function LensSection({ power, index = INDICES[0], nasal = 22, temporal = 30, height = 120 }) {
  const solid = useRef(null);
  const ghost = profile(power, INDICES[0].n, INDICES[0].minCenter, nasal, temporal);
  const real = profile(power, index.n, index.minCenter, nasal, temporal);
  const width = nasal + temporal;
  const maxT = Math.max(...ghost.map((p) => p.t), ...real.map((p) => p.t), 6);
  const pad = 4;
  const vbW = width + pad * 2, vbH = Math.max(maxT + pad * 2 + 6, 18);
  const front = (x) => 0.004 * x * x; // gentle base curve for the drawing
  const path = (pts) => {
    const top = pts.map((p) => `${(p.x + nasal + pad).toFixed(2)},${(pad + front(p.x)).toFixed(2)}`);
    const bot = pts.slice().reverse().map((p) => `${(p.x + nasal + pad).toFixed(2)},${(pad + front(p.x) + p.t).toFixed(2)}`);
    return `M${top.join(" L")} L${bot.join(" L")} Z`;
  };
  const edgeN = real[0].t, edgeT = real[real.length - 1].t, centre = real.reduce((a, b) => (Math.abs(b.x) < Math.abs(a.x) ? b : a)).t;
  useEffect(() => { drawStroke(solid.current, { duration: 900 }); }, [power, index.n]);
  return (
    <figure className="lens-section">
      <svg viewBox={`0 0 ${vbW} ${vbH}`} style={{ height }} role="img" aria-label={`Lens cross-section: edges ${edgeN.toFixed(1)} and ${edgeT.toFixed(1)} mm, centre ${centre.toFixed(1)} mm`}>
        <path d={path(ghost)} className="ghost" />
        <path d={path(real)} className="solid" ref={solid} />
        <line x1={pad + nasal} x2={pad + nasal} y1={0} y2={vbH} className="axis" />
      </svg>
      <figcaption className="row between tiny mono">
        <span>nasal {edgeN.toFixed(1)} mm</span>
        <span>centre {centre.toFixed(1)} mm</span>
        <span>temple {edgeT.toFixed(1)} mm</span>
      </figcaption>
    </figure>
  );
}

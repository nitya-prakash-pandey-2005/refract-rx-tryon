// Animated hero: one lens, three states. The numbers are computed by the optics engine.
import { useEffect, useRef, useState } from "react";
import { createTimeline } from "animejs";
import { eyeMagnification, lensProfile, INDICES } from "../engine/optics";
import { reduced } from "../lib/anim";

const circle = (r, n = 48) => Array.from({ length: n }, (_, i) => [Math.cos((i / n) * 2 * Math.PI) * r, Math.sin((i / n) * 2 * Math.PI) * r]);
const edge = (sph) => lensProfile({ rx: { sph, cyl: 0, axis: 0 }, contour: circle(26), n: INDICES.find((i) => i.n === 1.6) });
const STATES = [
  { key: "show", label: "Showroom try-on", sub: "frames only · no lens power", scale: 1, ring: 2.5 },
  { key: "minus", label: "Your −6.50 D lenses", sub: `eyes ${((eyeMagnification(-6.5) - 1) * 100).toFixed(1)}% to others · ${edge(-6.5).maxEdge.toFixed(1)} mm edge`, scale: eyeMagnification(-6.5), ring: 14 },
  { key: "plus", label: "Your +3.00 D lenses", sub: `eyes +${((eyeMagnification(3) - 1) * 100).toFixed(1)}% · ${edge(3).centre.toFixed(1)} mm centre`, scale: eyeMagnification(3), ring: 4 },
];

export default function HeroLens() {
  const eye = useRef(null), ring = useRef(null);
  const [state, setState] = useState(1);
  useEffect(() => {
    if (reduced()) return;
    const tl = createTimeline({ loop: true, defaults: { duration: 1100, ease: "inOutCubic" } });
    const seq = [1, 0, 2, 0];
    seq.forEach((s, i) => {
      tl.call(() => setState(s), i === 0 ? 0 : "+=1500");
      tl.add(eye.current, { scale: STATES[s].scale * (s === 1 ? 0.97 : s === 2 ? 1.03 : 1) }, "<<");
      tl.add(ring.current, { strokeWidth: STATES[s].ring }, "<<");
    });
    return () => tl.revert();
  }, []);
  const st = STATES[state];
  return (
    <figure className="hero-lens" aria-label="A lens changing how big the eye looks">
      <svg viewBox="0 0 400 300">
        <defs>
          <linearGradient id="hl-frame" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="var(--pink)" /><stop offset=".5" stopColor="var(--violet)" /><stop offset="1" stopColor="var(--cyan)" /></linearGradient>
          <radialGradient id="hl-skin" cx=".5" cy=".45" r=".6"><stop offset="0" stopColor="#e6bfa4" /><stop offset="1" stopColor="#b98a6c" /></radialGradient>
          <radialGradient id="hl-iris" cx=".45" cy=".4" r=".6"><stop offset="0" stopColor="#9a6a3c" /><stop offset=".7" stopColor="#5a3518" /><stop offset="1" stopColor="#2b170a" /></radialGradient>
          <clipPath id="hl-clip"><circle cx="200" cy="150" r="104" /></clipPath>
        </defs>
        <circle cx="200" cy="150" r="104" fill="url(#hl-skin)" />
        <g clipPath="url(#hl-clip)">
          <g ref={eye} style={{ transformOrigin: "200px 150px", transformBox: "view-box" }}>
            <path d="M118 150 Q200 92 282 150 Q200 204 118 150 Z" fill="#f6efe9" />
            <circle cx="200" cy="150" r="31" fill="url(#hl-iris)" />
            <circle cx="200" cy="150" r="13" fill="#0c0705" />
            <circle cx="190" cy="140" r="6" fill="#fff" opacity=".85" />
            <path d="M118 150 Q200 92 282 150" fill="none" stroke="#2a1a14" strokeWidth="5" strokeLinecap="round" />
            <path d="M126 118 Q200 78 276 112" fill="none" stroke="#5a3c2c" strokeWidth="9" strokeLinecap="round" opacity=".8" />
          </g>
          <circle ref={ring} cx="200" cy="150" r="100" fill="none" stroke="rgba(20,24,40,0.35)" strokeWidth="14" />
          <ellipse cx="160" cy="105" rx="70" ry="26" fill="rgba(255,255,255,0.12)" transform="rotate(-25 160 105)" />
        </g>
        <circle cx="200" cy="150" r="108" fill="none" stroke="url(#hl-frame)" strokeWidth="10" />
        <path d="M308 132 L372 120" stroke="url(#hl-frame)" strokeWidth="8" strokeLinecap="round" />
        <path d="M92 132 L28 120" stroke="url(#hl-frame)" strokeWidth="8" strokeLinecap="round" />
      </svg>
      <figcaption>
        <b>{st.label}</b>
        <span className="mono tiny">{st.sub}</span>
      </figcaption>
    </figure>
  );
}

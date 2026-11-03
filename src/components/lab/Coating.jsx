// Anti-reflective coatings, computed: Fresnel reflection of the bare lens, a single MgF₂
// quarter-wave layer, and a four-layer SiO₂/ZrO₂ stack designed by the engine. The spectrum
// curve morphs between coatings, the window glare on the eye fades, the layers rebuild to scale.
import { useEffect, useMemo, useRef, useState } from "react";
import { animate, spring, stagger } from "animejs";
import { Seg } from "../../ui";
import { reduced } from "../../lib/anim";
import { fresnelR, stackR, designAR, luminousR, spectrumColor, toCss, SINGLE_MGF2 } from "../../engine/light";

const L0 = 380, L1 = 780, W = 460, H = 130, X0 = 40, Y0 = 16, RMAX = 0.08;
const xs = (l) => X0 + ((l - L0) / (L1 - L0)) * W;
const ys = (r) => Y0 + H - (Math.min(r, RMAX) / RMAX) * H;
const LS = Array.from({ length: 81 }, (_, i) => L0 + i * 5);
const curve = (R) => `M${LS.map((l) => `${xs(l).toFixed(1)} ${ys(R(l)).toFixed(1)}`).join(" L")}`;
const area = (R) => `${curve(R)} L${xs(L1)} ${Y0 + H} L${xs(L0)} ${Y0 + H} Z`;
const RAINBOW = [400, 440, 480, 520, 560, 600, 640, 680, 720].map((l) => [((l - L0) / (L1 - L0)) * 100, toCss(spectrumColor((x) => Math.exp(-0.5 * ((x - l) / 12) ** 2)).hue)]);
const COATS = [{ value: "none", label: "No coating" }, { value: "single", label: "1 layer MgF₂" }, { value: "multi", label: "Multi-layer AR" }];

export default function Coating({ mat }) {
  const [coat, setCoat] = useState("multi");
  const root = useRef(null);
  const model = useMemo(() => {
    const n = mat.n;
    const design = designAR(n);
    const R = coat === "none" ? () => fresnelR(1, n) : coat === "single" ? (l) => stackR(SINGLE_MGF2, n, l) : design.R;
    const layers = coat === "none" ? [] : coat === "single" ? SINGLE_MGF2 : design.layers;
    const surface = luminousR(R), pair = (2 * surface) / (1 + surface);
    return { R, layers, surface, pair, color: spectrumColor(R), bare: (2 * fresnelR(1, n)) / (1 + fresnelR(1, n)) };
  }, [mat, coat]);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const line = el.querySelector(".ct-line"), fill = el.querySelector(".ct-fill"), glare = el.querySelectorAll(".ct-glare");
    const glareOp = Math.min(0.92, model.pair * 6.5);
    if (reduced()) { line.setAttribute("d", curve(model.R)); fill.setAttribute("d", area(model.R)); glare.forEach((g) => g.setAttribute("opacity", glareOp)); return; }
    const ease = spring({ bounce: 0.2, duration: 800 });
    const a = animate(line, { d: curve(model.R), ease });
    const b = animate(fill, { d: area(model.R), ease });
    const c = animate(glare, { opacity: glareOp, duration: 600, ease: "outQuad" });
    const d = animate(el.querySelectorAll(".ct-layer"), { scaleY: [0, 1], opacity: [0, 1], delay: stagger(90, { from: "last" }), ease: spring({ bounce: 0.4, duration: 500 }) });
    return () => { a.pause(); b.pause(); c.pause(); d.pause(); };
  }, [model]);

  const pct = (v) => `${(v * 100).toFixed(v < 0.01 ? 2 : 1)}%`;
  const swatch = coat === "none" ? "rgb(225 228 236)" : toCss(model.color.hue);
  return (
    <div className="coating" ref={root}>
      <Seg options={COATS} value={coat} onChange={setCoat} />
      <div className="ct-grid">
        <figure className="ct-eye">
          <svg viewBox="0 0 200 150" className="lab-svg" role="img" aria-label={`Glare on the lens: ${pct(model.pair)} of light reflected`}>
            <defs><clipPath id="ct-lens"><ellipse cx="100" cy="75" rx="78" ry="58" /></clipPath></defs>
            <rect width="200" height="150" fill="#2a2230" />
            <g clipPath="url(#ct-lens)">
              <rect width="200" height="150" fill="#e9c9b4" />
              <path d="M40 78 Q100 34 160 78 Q100 116 40 78Z" fill="#fff" />
              <circle cx="100" cy="76" r="24" fill="#6a4632" /><circle cx="100" cy="76" r="10" fill="#0b0b10" /><circle cx="108" cy="68" r="4" fill="#fff" />
              <g className="ct-glare" opacity={Math.min(0.92, model.pair * 6.5)}>
                <rect x="38" y="20" width="44" height="56" fill="#fff" transform="skewX(-14)" />
                <rect x="92" y="20" width="44" height="56" fill="#fff" transform="skewX(-14)" />
              </g>
            </g>
            <ellipse cx="100" cy="75" rx="78" ry="58" fill="none" stroke="#111" strokeWidth="7" />
          </svg>
          <figcaption className="tiny muted">Your eye on a video call, a window behind the camera</figcaption>
        </figure>
        <div className="ct-chart">
          <svg viewBox="0 0 520 186" className="lab-svg" role="img" aria-label="Reflectance by wavelength">
            <defs><linearGradient id="ct-rainbow" x1="0" x2="1">{RAINBOW.map(([o, c]) => <stop key={o} offset={`${o}%`} stopColor={c} />)}</linearGradient></defs>
            {[0, 0.02, 0.04, 0.06, 0.08].map((r) => <g key={r}><line x1={X0} x2={X0 + W} y1={ys(r)} y2={ys(r)} stroke="var(--line)" /><text x={X0 - 6} y={ys(r) + 3} textAnchor="end" className="lab-cap">{r * 100}%</text></g>)}
            <path className="ct-fill" d={area(model.R)} fill="var(--pink)" opacity=".14" />
            <path className="ct-line" d={curve(model.R)} fill="none" stroke="var(--pink)" strokeWidth="2.5" />
            <rect x={X0} y={Y0 + H + 6} width={W} height="8" rx="4" fill="url(#ct-rainbow)" />
            {[400, 500, 600, 700].map((l) => <text key={l} x={xs(l)} y={Y0 + H + 28} textAnchor="middle" className="lab-cap">{l} nm</text>)}
          </svg>
        </div>
        <div className="ct-stack" aria-label="Coating layers to scale">
          {model.layers.length ? model.layers.map((l, i) => (
            <div key={`${coat}${i}`} className={`ct-layer ${l.n > 1.8 ? "hi" : "lo"}`} style={{ height: `${Math.max(10, l.d * 0.42)}px` }}><span>{l.name} · {l.d.toFixed(0)} nm</span></div>
          )) : <div className="ct-none tiny muted">bare lens surface</div>}
          <div className="ct-substrate"><span>{mat.label} lens</span></div>
        </div>
      </div>
      <div className="ct-facts">
        <div><span className="tiny muted">Light bounced back by the pair</span><b className={`num ${model.pair > 0.05 ? "bad" : model.pair > 0.015 ? "ok" : "good"}`}>{pct(model.pair)}</b></div>
        <div><span className="tiny muted">Without any coating</span><b className="num">{pct(model.bare)}</b></div>
        <div><span className="tiny muted">Residual sheen</span><span className="ct-swatch" style={{ background: swatch }} /></div>
      </div>
    </div>
  );
}

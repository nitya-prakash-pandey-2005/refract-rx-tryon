// Blue-light filters: what they remove (transmission spectrum), the tint that follows (CIE
// colour of daylight through the lens), and what the evidence says they do for you.
import { useEffect, useRef, useState } from "react";
import { animate, spring } from "animejs";
import { reduced } from "../../lib/anim";
import { filterTint, spectrumColor, toCss } from "../../engine/light";

const L0 = 380, L1 = 780, W = 460, H = 110, X0 = 40, Y0 = 12;
const xs = (l) => X0 + ((l - L0) / (L1 - L0)) * W;
const ys = (t) => Y0 + H - t * H;
const LS = Array.from({ length: 81 }, (_, i) => L0 + i * 5);
const curve = (T) => `M${LS.map((l) => `${xs(l).toFixed(1)} ${ys(T(l)).toFixed(1)}`).join(" L")}`;
const RAINBOW = [400, 440, 480, 520, 560, 600, 640, 680, 720].map((l) => [((l - L0) / (L1 - L0)) * 100, toCss(spectrumColor((x) => Math.exp(-0.5 * ((x - l) / 12) ** 2)).hue)]);

export default function BlueLight() {
  const [block, setBlock] = useState(0.2);
  const root = useRef(null);
  const f = filterTint(block);
  const tint = toCss(f.rgb);
  useEffect(() => {
    const el = root.current?.querySelector(".bl-line");
    if (!el) return;
    if (reduced()) { el.setAttribute("d", curve(f.T)); return; }
    const a = animate(el, { d: curve(f.T), ease: spring({ bounce: 0.25, duration: 600 }) });
    return () => a.pause();
  }, [block]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="bluelight" ref={root}>
      <label className="field"><span className="small row between">Blue light removed (400–450 nm) <b className="num">{Math.round(block * 100)}%</b></span>
        <input className="slider" type="range" min="0.1" max="0.6" step="0.05" value={block} onChange={(e) => setBlock(+e.target.value)} />
      </label>
      <div className="bl-grid">
        <svg viewBox="0 0 520 150" className="lab-svg" role="img" aria-label={`Transmission with ${Math.round(block * 100)}% of blue removed`}>
          <defs><linearGradient id="bl-rainbow" x1="0" x2="1">{RAINBOW.map(([o, c]) => <stop key={o} offset={`${o}%`} stopColor={c} />)}</linearGradient></defs>
          {[0, 0.5, 1].map((t) => <g key={t}><line x1={X0} x2={X0 + W} y1={ys(t)} y2={ys(t)} stroke="var(--line)" /><text x={X0 - 6} y={ys(t) + 3} textAnchor="end" className="lab-cap">{t * 100}%</text></g>)}
          <path className="bl-line" d={curve(f.T)} fill="none" stroke="var(--cyan)" strokeWidth="2.5" />
          <rect x={X0} y={Y0 + H + 6} width={W} height="8" rx="4" fill="url(#bl-rainbow)" />
          <text x={xs(425)} y={Y0 + H - 6} textAnchor="middle" className="lab-cap">blocked</text>
        </svg>
        <div className="bl-paper">
          <div className="bl-sheet"><span>White paper</span><small>bare eye</small></div>
          <div className="bl-sheet" style={{ background: tint }}><span>Through the lens</span><small>{(f.Y * 100).toFixed(1)}% of light passes</small></div>
        </div>
      </div>
    </div>
  );
}

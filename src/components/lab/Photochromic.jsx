// Photochromic lenses as a time-lapse: five minutes outside, ten minutes back indoors. An
// anime.js timer drives simulated time; the lens tints, the curve draws itself, and the
// numbers come from the kinetic model (UV activation, Arrhenius thermal fade, Beer-Lambert).
import { useEffect, useMemo, useRef, useState } from "react";
import { Play, ThumbsUp, Scale, ThumbsDown } from "lucide-react";
import { animate, svg } from "animejs";
import { Seg } from "../../ui";
import { reduced } from "../../lib/anim";
import { simulate, summary, UV } from "../../engine/photochromic";

const OUT = 300, IN = 600, W = 460, H = 120, X0 = 40, Y0 = 12;
const xs = (t) => X0 + (t / (OUT + IN)) * W;
const ys = (T) => Y0 + H - T * H;
const SCENES = [{ value: "sun", label: "Sunny street" }, { value: "cloud", label: "Cloudy day" }, { value: "car", label: "Driving" }];
const mmss = (s) => (s < 90 ? `${Math.round(s)} s` : `${Math.floor(s / 60)} min ${String(Math.round(s % 60)).padStart(2, "0")} s`);

export default function Photochromic() {
  const [scene, setScene] = useState("sun");
  const [temp, setTemp] = useState(23);
  const root = useRef(null), tint = useRef(null), dot = useRef(null), clock = useRef(null);
  const run = useMemo(() => simulate({ uv: UV[scene], tempC: temp, outdoorS: OUT, indoorS: IN }), [scene, temp]);
  const sum = useMemo(() => summary({ uv: UV[scene], tempC: temp }), [scene, temp]);
  const path = `M${run.map((p) => `${xs(p.t).toFixed(1)} ${ys(p.T).toFixed(1)}`).join(" L")}`;
  const anim = useRef(null);

  function play() {
    const el = root.current;
    if (!el) return;
    anim.current?.pause();
    const line = el.querySelector(".pc-line");
    const at = (t) => run[Math.min(run.length - 1, Math.round(t / 5))];
    const show = (t) => {
      const p = at(t);
      tint.current?.setAttribute("opacity", ((0.95 - p.T) / 0.95).toFixed(3));
      dot.current?.setAttribute("cx", xs(p.t)); dot.current?.setAttribute("cy", ys(p.T));
      if (clock.current) clock.current.textContent = `${t <= OUT ? "outside" : "indoors"} · ${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")} · ${Math.round(p.T * 100)}% light`;
    };
    if (reduced()) { line.setAttribute("d", path); show(OUT); return; }
    const sim = { t: 0 };
    const [draw] = svg.createDrawable(line);
    anim.current = animate(sim, { t: OUT + IN, duration: 6000, ease: "linear", onUpdate: () => { show(sim.t); draw.setAttribute("draw", `0 ${sim.t / (OUT + IN)}`); } });
  }
  useEffect(() => { play(); return () => anim.current?.pause(); }, [run]); // eslint-disable-line react-hooks/exhaustive-deps

  const v = scene === "car"
    ? { tone: "bad", icon: ThumbsDown, text: <>Behind a windshield they reach only {Math.round(sum.darkest * 100)}% light, nowhere near sunglass-dark: windshield glass absorbs the UV that switches the dye. <b>Keep real sunglasses for driving.</b></> }
    : temp >= 30
      ? { tone: "ok", icon: Scale, text: <>At {temp} °C heat closes the dye as fast as sunlight opens it, so they stop at {Math.round(sum.darkest * 100)}% light. <b>In hot climates, expect medium tint, not sunglasses.</b></> }
      : temp <= 10
        ? { tone: "ok", icon: Scale, text: <>Cold makes them very dark ({Math.round(sum.darkest * 100)}% light) but slow to clear: about {mmss(sum.clearS)} indoors. <b>Fine outdoors; annoying if you go in and out often.</b></> }
        : { tone: "good", icon: ThumbsUp, text: <>Mild weather is where they shine: {Math.round(sum.darkest * 100)}% light outside within {mmss(sum.darkenS)}, clear again {mmss(sum.clearS)} after you go in. <b>Worth it if you walk outdoors a lot.</b></> };

  return (
    <div className="photochromic" ref={root}>
      <div className="row wrap between" style={{ gap: 12 }}>
        <Seg options={SCENES} value={scene} onChange={setScene} />
        <label className="field pc-temp"><span className="small row between">Temperature <b className="num">{temp} °C</b></span><input className="slider" type="range" min="0" max="40" value={temp} onChange={(e) => setTemp(+e.target.value)} /></label>
      </div>
      <div className="pc-grid">
        <svg viewBox="0 0 160 140" className="lab-svg pc-lens" role="img" aria-label="Lens tint over time">
          <rect width="160" height="140" rx="12" fill="url(#pc-sky)" />
          <defs><linearGradient id="pc-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7cc4ff" /><stop offset="1" stopColor="#f2e3c6" /></linearGradient></defs>
          <circle cx="128" cy="26" r="13" fill="#ffd34d" opacity={scene === "cloud" ? 0.35 : 1} />
          <ellipse cx="80" cy="76" rx="56" ry="44" fill="#fff" opacity=".18" stroke="#111" strokeWidth="5" />
          <ellipse ref={tint} cx="80" cy="76" rx="54" ry="42" fill="#3a2f2a" opacity="0" />
          {scene === "car" && <path d="M6 18 L154 6 L154 30 L6 44 Z" fill="#9fd3c7" opacity=".35" />}
        </svg>
        <svg viewBox="0 0 520 160" className="lab-svg" role="img" aria-label="Light through the lens over fifteen minutes">
          <rect x={X0} y={Y0} width={xs(OUT) - X0} height={H} fill="#ffd34d" opacity=".06" />
          {[0, 0.5, 1].map((T) => <g key={T}><line x1={X0} x2={X0 + W} y1={ys(T)} y2={ys(T)} stroke="var(--line)" /><text x={X0 - 6} y={ys(T) + 3} textAnchor="end" className="lab-cap">{T * 100}%</text></g>)}
          <line x1={xs(OUT)} x2={xs(OUT)} y1={Y0} y2={Y0 + H} stroke="var(--line-2)" strokeDasharray="4 4" />
          <text x={xs(OUT / 2)} y={Y0 + H + 18} textAnchor="middle" className="lab-cap">5 min outside</text>
          <text x={xs(OUT + IN / 2)} y={Y0 + H + 18} textAnchor="middle" className="lab-cap">10 min indoors</text>
          <path className="pc-line" d={path} fill="none" stroke="var(--amber)" strokeWidth="2.5" />
          <circle ref={dot} cx={xs(0)} cy={ys(0.95)} r="5" fill="#fff" />
        </svg>
      </div>
      <div className="row between wrap" style={{ gap: 8 }}>
        <span className="mono tiny muted" ref={clock}>outside · 0:00</span>
        <button className="btn sm ghost" onClick={play}><Play size={14} />Replay</button>
      </div>
      <div className="ct-facts">
        <div><span className="tiny muted">Darkest</span><b className="num">{Math.round(sum.darkest * 100)}% light</b></div>
        <div><span className="tiny muted">90% dark after</span><b className="num">{mmss(sum.darkenS)}</b></div>
        <div><span className="tiny muted">Clear again indoors</span><b className="num">{sum.clearS ? mmss(sum.clearS) : "never tinted"}</b></div>
      </div>
      <div className={`verdict ${v.tone}`}><v.icon size={17} /><span className="small">{v.text}</span></div>
    </div>
  );
}

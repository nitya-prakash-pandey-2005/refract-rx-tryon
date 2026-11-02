// Home hero: a 5-second check with no camera and no sign-up. Drag your prescription, pick a
// frame size and a lens; the real engine answers the four questions and the lens morphs.
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Zap } from "lucide-react";
import { animate, createDraggable, spring } from "animejs";
import { Hud, Badge, Seg } from "../ui";
import { reduced } from "../lib/anim";
import { customFrame } from "../engine/frames";
import { INDICES } from "../engine/optics";
import { lensPair } from "../engine/fit";
import { remakeRisk } from "../engine/risk";
import { materialSight } from "../engine/sight";

const MIN = -10, MAX = 6;
const SIZES = [
  { value: "s", label: "Small", spec: { A: 48, DBL: 20, shape: "round", material: "metal" }, note: "48□20 round, metal" },
  { value: "m", label: "Medium", spec: { A: 52, DBL: 18, shape: "rect", material: "metal" }, note: "52□18 rectangle, metal" },
  { value: "l", label: "Large", spec: { A: 56, DBL: 18, shape: "square", material: "acetate" }, note: "56□18 square, plastic" },
];
const LENSES = [1.5, 1.6, 1.67, 1.74];
const TONE = { low: "green", medium: "amber", high: "rose" };
const snap = (v) => Math.round(v * 4) / 4;
const fmtD = (v) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(2)}`;
const toneOf = (v, a, b) => (v < a ? "low" : v < b ? "medium" : "high");

// Lens cross-section: thickness c at the centre and e at the edge, half-width hw (px).
export function lensPath(c, e, hw, s = 7) {
  const half = (x) => ((c + (e - c) * (x / hw) ** 2) / 2) * s;
  const top = [], bot = [];
  for (let i = 0; i <= 24; i++) { const x = -hw + (2 * hw * i) / 24; top.push(`${x.toFixed(1)} ${(-half(x)).toFixed(1)}`); bot.unshift(`${x.toFixed(1)} ${half(x).toFixed(1)}`); }
  return `M${top.join(" L")} L${bot.join(" L")} Z`;
}

export default function QuickCheck() {
  const [power, setPower] = useState(-6);
  const [size, setSize] = useState("l");
  const [lensN, setLensN] = useState(1.74);
  const track = useRef(null), knob = useRef(null), drag = useRef(null);
  const lensEl = useRef(null), irisEl = useRef(null), edgeTxt = useRef(null);
  const shape = useRef({ c: 1.5, e: 6, m: 1, hw: 120 });

  const out = useMemo(() => {
    const sz = SIZES.find((x) => x.value === size);
    const frame = customFrame(sz.spec);
    const eye = { sph: power, cyl: 0, axis: 0 };
    const rx = { od: eye, os: eye };
    const pd = { left: 31.5, right: 31.5, plusMinus: 0.5 };
    const index = INDICES.find((i) => i.n === lensN);
    const lens = lensPair({ frame, rx, pd, index });
    const risk = remakeRisk({ frame, rx, pd, face: { bridge: "medium" }, oiliness: 60, index });
    const sight = materialSight(eye).find((r) => r.index.n === lensN);
    const minus = power <= 0;
    return {
      frame, risk, minus,
      edge: lens.od.maxEdge, centre: lens.od.centre, thinEdge: lens.od.minEdge,
      weight: lens.od.weightG + lens.os.weightG,
      eyePct: (lens.od.magnification.mean - 1) * 100,
      lines: sight.linesLost,
      slip: risk.parts.fit.detail.margin,
    };
  }, [power, size, lensN]);

  // Draggable power dial (anime.js), synced with the keyboard.
  useEffect(() => {
    const d = createDraggable(knob.current, {
      container: track.current, y: false, cursor: { onHover: "grab", onGrab: "grabbing" },
      velocityMultiplier: 0, // no throw: the prescription stays where the finger lifts
      onDrag: (self) => setPower(snap(MIN + self.progressX * (MAX - MIN))),
      onUpdate: (self) => setPower(snap(MIN + self.progressX * (MAX - MIN))),
    });
    d.progressX = (power - MIN) / (MAX - MIN);
    drag.current = d;
    const fit = () => { d.refresh(); d.progressX = (snapRef.current - MIN) / (MAX - MIN); };
    addEventListener("resize", fit);
    return () => { removeEventListener("resize", fit); d.revert(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const snapRef = useRef(power);
  snapRef.current = power;
  const setDial = (v) => {
    const to = Math.max(MIN, Math.min(MAX, v));
    setPower(to);
    const d = drag.current;
    if (!d) return;
    if (reduced()) { d.progressX = (to - MIN) / (MAX - MIN); return; }
    const o = { p: d.progressX };
    animate(o, { p: (to - MIN) / (MAX - MIN), ease: spring({ bounce: 0.35, duration: 500 }), onUpdate: () => { d.setX(o.p * (d.containerBounds[1] - d.containerBounds[3]) + d.containerBounds[3], true); } });
  };

  // Spring the lens cross-section and the eye to the new numbers.
  useEffect(() => {
    const hw = 70 + out.frame.A * 1.1;
    const target = { c: out.centre, e: out.minus ? out.edge : out.thinEdge, m: 1 + out.eyePct / 100, hw };
    const draw = () => {
      const s = shape.current;
      lensEl.current?.setAttribute("d", lensPath(s.c, s.e, s.hw));
      irisEl.current?.setAttribute("transform", `scale(${s.m.toFixed(4)})`);
      if (edgeTxt.current) edgeTxt.current.textContent = `${(out.minus ? s.e : s.c).toFixed(1)} mm`;
    };
    if (reduced()) { Object.assign(shape.current, target); draw(); return; }
    const a = animate(shape.current, { ...target, ease: spring({ bounce: 0.3, duration: 650 }), onUpdate: draw });
    return () => a.pause();
  }, [out]);

  const s = shape.current;
  const edgeMm = out.minus ? out.edge : out.centre;
  const tiles = [
    { k: out.minus ? "Lens edge" : "Lens centre", v: `${edgeMm.toFixed(1)} mm`, sub: `${out.weight.toFixed(0)} g for the pair`, level: toneOf(edgeMm, 4.6, 7) },
    { k: "Your eyes look", v: `${Math.abs(out.eyePct).toFixed(0)}% ${out.eyePct < 0 ? "smaller" : "bigger"}`, sub: "to everyone you meet", level: toneOf(Math.abs(out.eyePct), 4, 8) },
    { k: "Rainbow edges", v: out.lines < 0.05 ? "none" : `−${out.lines.toFixed(1)} lines`, sub: "of sharpness, glancing sideways", level: toneOf(out.lines, 0.4, 0.8) },
    { k: "Slides down?", v: `${out.slip.toFixed(1)}× grip`, sub: out.slip >= 1.5 ? "stays put" : out.slip >= 1 ? "creeps when you look down" : "slides", level: out.risk.parts.fit.level },
  ];
  const minusArrow = out.minus ? "thick edge" : "thick centre";

  return (
    <div className="qc card glow" data-tour="quick-check">
      <div className="row between wrap" style={{ gap: 8 }}>
        <Hud tone="cyan"><Zap size={12} /> 5-second check · no camera</Hud>
        <span className="tiny muted">the real engine, live</span>
      </div>

      <div className="qc-dial">
        <div className="row between" style={{ alignItems: "baseline" }}>
          <span className="small text-2">Your prescription (SPH)</span>
          <b className="qc-power num">{fmtD(power)}<small> D</small></b>
        </div>
        <div className="qc-track" ref={track}>
          <span className="qc-zero" style={{ left: `${((0 - MIN) / (MAX - MIN)) * 100}%` }} />
          <button ref={knob} className="qc-knob" role="slider" aria-label="Prescription sphere in dioptres" aria-valuemin={MIN} aria-valuemax={MAX} aria-valuenow={power} aria-valuetext={`${fmtD(power)} dioptres`}
            onKeyDown={(e) => { const k = { ArrowLeft: -0.25, ArrowDown: -0.25, ArrowRight: 0.25, ArrowUp: 0.25, PageDown: -1, PageUp: 1 }[e.key]; if (k) { e.preventDefault(); setDial(snap(power + k)); } }} />
        </div>
        <div className="row between tiny muted"><span>−10 short-sighted</span><span>0</span><span>+6 long-sighted</span></div>
        <div className="row wrap" style={{ gap: 6 }}>
          {[[-2, "−2 mild"], [-4, "−4"], [-6, "−6"], [-8, "−8 strong"], [3, "+3 reading"]].map(([v, l]) => <button key={v} className={`chip qc-preset ${power === v ? "on" : ""}`} onClick={() => setDial(v)}>{l}</button>)}
        </div>
      </div>

      <div className="qc-row">
        <label className="field"><span className="tiny">Frame size</span><Seg options={SIZES} value={size} onChange={setSize} /></label>
        <label className="field"><span className="tiny">Lens</span><Seg options={LENSES.map((n) => ({ value: n, label: n === 1.74 ? "1.74 ultra-thin" : n.toFixed(2) }))} value={lensN} onChange={setLensN} /></label>
      </div>

      <svg className="qc-stage" viewBox="0 0 400 150" role="img" aria-label={`Lens cross-section: ${edgeMm.toFixed(1)} mm ${minusArrow}; eyes look ${Math.abs(out.eyePct).toFixed(0)}% ${out.eyePct < 0 ? "smaller" : "bigger"}`}>
        <defs>
          <linearGradient id="qc-glass" x1="0" x2="1"><stop offset="0" stopColor="var(--cyan)" stopOpacity=".55" /><stop offset=".5" stopColor="var(--violet)" stopOpacity=".25" /><stop offset="1" stopColor="var(--pink)" stopOpacity=".55" /></linearGradient>
        </defs>
        <g transform="translate(140 75)">
          <line x1="-135" x2="135" y1="0" y2="0" stroke="var(--line)" strokeDasharray="3 5" />
          <path ref={lensEl} d={lensPath(s.c, s.e, s.hw)} fill="url(#qc-glass)" stroke="var(--cyan)" strokeWidth="1.5" />
          <text ref={edgeTxt} x="0" y="66" textAnchor="middle" className="qc-edge-txt">{edgeMm.toFixed(1)} mm</text>
          <text x="0" y="-58" textAnchor="middle" className="qc-cap">{SIZES.find((x) => x.value === size).note} · {minusArrow}</text>
        </g>
        <g transform="translate(330 75)">
          <path d="M-52 0 Q0 -40 52 0 Q0 40 -52 0Z" fill="rgba(255,255,255,.92)" stroke="var(--line-2)" />
          <g ref={irisEl}><circle r="19" fill="#5b3a2a" /><circle r="8" fill="#0b0b10" /><circle cx="6" cy="-6" r="3" fill="#fff" opacity=".85" /></g>
          <text y="56" textAnchor="middle" className="qc-cap">what others see</text>
        </g>
      </svg>

      <div className="qc-tiles">
        {tiles.map((t) => (
          <div key={t.k} className={`qc-tile ${t.level}`}>
            <span className="tiny muted">{t.k}</span>
            <b className="num">{t.v}</b>
            <span className="tiny text-2">{t.sub}</span>
          </div>
        ))}
      </div>

      <div className="row between wrap qc-verdict" style={{ gap: 10 }}>
        <span className="row" style={{ gap: 10 }}>
          <span className={`risk-num sm ${out.risk.level}`}>{out.risk.score}<small>/100</small></span>
          <span className="stack-xs"><Badge tone={TONE[out.risk.level]}>remake risk</Badge><span className="tiny muted">{out.risk.fixes[0] || "This pair should work for you."}</span></span>
        </span>
        <a className="btn primary sm" href="#/check">Check with my full prescription<ArrowRight size={14} /></a>
      </div>
    </div>
  );
}

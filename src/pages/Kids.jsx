// Kids' eyes: where a short-sighted child's prescription is heading, from published progression
// data, and how much each evidence-based option slows it. The eye grows on screen (axial
// elongation pushes the retina behind the focus), the forecast draws itself, and the glasses the
// child would wear at 18 come from the same lens engine.
import { useEffect, useMemo, useRef, useState } from "react";
import { Baby, Eye, Sun, ShieldCheck, Info, Glasses } from "lucide-react";
import { animate, createTimer, spring, svg } from "animejs";
import { Card, PageHead, Hud, Seg, Badge } from "../ui";
import { reduced, useReveal } from "../lib/anim";
import { project, INTERVENTIONS, GROUPS, axialMm, maculopathyRR } from "../engine/myopia";
import { customFrame } from "../engine/frames";
import { lensPair } from "../engine/fit";

const KID_FRAME = customFrame({ A: 46, DBL: 17, shape: "round", material: "acetate" });
const fmt = (v) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(2)}`;
const edgeAt = (rx) => { const eye = { sph: rx, cyl: 0, axis: 0 }; const p = lensPair({ frame: KID_FRAME, rx: { od: eye, os: eye }, pd: { left: 27.5, right: 27.5 } }); return p.od.maxEdge; };

// --- forecast chart ---
const CW = 560, CH = 290, CX0 = 52, CY0 = 14, PW = CW - CX0 - 70, PH = CH - CY0 - 40;
function Forecast({ base, opt, age }) {
  const root = useRef(null);
  const yMin = Math.min(-6, Math.floor(base.worseAt18) - 1);
  const x = (a) => CX0 + ((a - age) / (18 - age || 1)) * PW, y = (rx) => CY0 + (rx / yMin) * PH;
  const line = (r, k = "rx") => `M${r.points.map((p) => `${x(p.age).toFixed(1)} ${y(p[k]).toFixed(1)}`).join(" L")}`;
  const band = (r) => `${line(r, "worse")} L${[...r.points].reverse().map((p) => `${x(p.age).toFixed(1)} ${y(p.better).toFixed(1)}`).join(" L")} Z`;
  useEffect(() => {
    const el = root.current;
    if (!el || reduced()) return;
    const a = animate(svg.createDrawable(el.querySelectorAll(".fc-line")), { draw: ["0 0", "0 1"], duration: 1400, delay: (_, i) => i * 250, ease: "inOutCubic" });
    const b = animate(el.querySelectorAll(".fc-band, .fc-end"), { opacity: { from: 0 }, duration: 700, delay: 900 });
    return () => { a.revert(); b.revert(); };
  }, [base, opt, age]);
  const ticks = []; for (let r = 0; r >= yMin; r -= 2) ticks.push(r);
  return (
    <svg ref={root} viewBox={`0 0 ${CW} ${CH}`} className="lab-svg" role="img" aria-label={`Forecast: ${fmt(base.at18)} at 18 with regular glasses, ${fmt(opt.at18)} with the chosen option`}>
      {ticks.map((r) => <g key={r}><line x1={CX0} x2={CX0 + PW} y1={y(r)} y2={y(r)} stroke="var(--line)" /><text x={CX0 - 8} y={y(r) + 4} textAnchor="end" className="lab-cap">{r ? `${r} D` : "0"}</text></g>)}
      {[age, Math.round((age + 18) / 2), 18].map((a) => <text key={a} x={x(a)} y={CH - 14} textAnchor="middle" className="lab-cap">age {a}</text>)}
      <path className="fc-band" d={band(base)} fill="var(--rose)" opacity=".12" />
      {opt !== base && <path className="fc-band" d={band(opt)} fill="var(--green)" opacity=".14" />}
      <path className="fc-line" d={line(base)} fill="none" stroke="var(--rose)" strokeWidth="3" strokeLinecap="round" />
      {opt !== base && <path className="fc-line" d={line(opt)} fill="none" stroke="var(--green)" strokeWidth="3" strokeLinecap="round" />}
      <g className="fc-end"><circle cx={x(18)} cy={y(base.at18)} r="5" fill="var(--rose)" /><text x={x(18) + 10} y={y(base.at18) + 4} className="fc-lab" fill="var(--rose)">{fmt(base.at18)}</text></g>
      {opt !== base && <g className="fc-end"><circle cx={x(18)} cy={y(opt.at18)} r="5" fill="var(--green)" /><text x={x(18) + 10} y={y(opt.at18) + 4} className="fc-lab" fill="var(--green)">{fmt(opt.at18)}</text></g>}
      <circle cx={x(age)} cy={y(base.points[0].rx)} r="5" fill="#fff" />
    </svg>
  );
}

// --- the growing eye ---
const K = 9, FRONT = 30, FOCUS_MM = 23.5;
function GrowingEye({ stages }) {
  const root = useRef(null);
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduced()) return;
    const t = createTimer({ duration: 2600, loop: true, onLoop: () => setI((v) => (v + 1) % stages.length) });
    return () => t.revert();
  }, [stages.length]);
  const s = stages[Math.min(i, stages.length - 1)];
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const L = s.mm * K, back = FRONT + L, focus = FRONT + FOCUS_MM * K;
    const spread = ((back - focus) / (focus - FRONT - 30)) * 38; // rays diverge past the focus
    const set = { eye: { cx: FRONT + L / 2, rx: L / 2 }, retina: { x1: back - 2, x2: back - 2 } };
    const ease = spring({ bounce: 0.3, duration: 900 });
    const targets = [
      [el.querySelector(".ge-eye"), set.eye],
      [el.querySelector(".ge-retina"), { d: `M${back - 4} 52 Q${back + 6} 100 ${back - 4} 148` }],
      [el.querySelector(".ge-blur"), { cx: back - 3, ry: Math.max(2, spread) }],
      ...[...el.querySelectorAll(".ge-out")].map((ray, j) => [ray, { x2: back - 3, y2: 100 + (j - 1) * spread }]),
    ];
    if (reduced()) { targets.forEach(([t, v]) => Object.entries(v).forEach(([k, val]) => t.setAttribute(k, val))); return; }
    const anims = targets.map(([t, v]) => animate(t, { ...v, ease }));
    const c = animate(el.querySelector(".ge-eye"), { stroke: s.color, duration: 500 });
    return () => { anims.forEach((a) => a.pause()); c.pause(); };
  }, [s]);
  const focus = FRONT + FOCUS_MM * K;
  return (
    <figure className="ge">
      <svg ref={root} viewBox="0 0 320 200" className="lab-svg" role="img" aria-label={`${s.label}: eye ${s.mm.toFixed(1)} mm long`}>
        <ellipse className="ge-eye" cx={FRONT + (FOCUS_MM * K) / 2} cy="100" rx={(FOCUS_MM * K) / 2} ry="78" fill="rgba(255,255,255,.05)" stroke={stages[0].color} strokeWidth="2.5" />
        <path d={`M${FRONT + 4} 62 Q${FRONT - 14} 100 ${FRONT + 4} 138`} fill="none" stroke="var(--cyan)" strokeWidth="2.5" />
        <ellipse cx={FRONT + 34} cy="100" rx="9" ry="26" fill="rgba(34,211,238,.25)" stroke="var(--cyan)" />
        <path className="ge-retina" d={`M${focus - 4} 52 Q${focus + 6} 100 ${focus - 4} 148`} fill="none" stroke="var(--pink)" strokeWidth="4" strokeLinecap="round" />
        {[70, 100, 130].map((y0) => <g key={y0}><line x1="0" y1={y0} x2={FRONT + 34} y2={y0} stroke="#fff" strokeWidth="1.6" opacity=".8" /><line x1={FRONT + 34} y1={y0} x2={focus} y2="100" stroke="#fff" strokeWidth="1.6" opacity=".8" /></g>)}
        {[0, 1, 2].map((j) => <line key={j} className="ge-out" x1={focus} y1="100" x2={focus} y2="100" stroke="#fff" strokeWidth="1.6" opacity=".55" strokeDasharray="3 3" />)}
        <ellipse className="ge-blur" cx={focus - 3} cy="100" rx="4" ry="2" fill="var(--amber)" opacity=".7" />
        <circle cx={focus} cy="100" r="3.5" fill="#fff" />
        <text x={focus} y="186" textAnchor="middle" className="lab-cap">focus</text>
      </svg>
      <figcaption className="row between"><Badge tone={s.tone}>{s.label}</Badge><span className="mono small">{s.mm.toFixed(1)} mm · {fmt(s.rx)}</span></figcaption>
    </figure>
  );
}

export default function Kids() {
  const root = useRef(null);
  useReveal(root, []);
  const [age, setAge] = useState(9);
  const [rx, setRx] = useState(-1.5);
  const [group, setGroup] = useState("asian");
  const [parents, setParents] = useState(1);
  const [option, setOption] = useState("dims");
  const base = useMemo(() => project({ age, rx, group, parents }), [age, rx, group, parents]);
  const opt = useMemo(() => (option === "none" ? base : project({ age, rx, group, parents, intervention: option })), [base, option]); // eslint-disable-line react-hooks/exhaustive-deps
  const saved = opt.at18 - base.at18;
  const stages = useMemo(() => [
    { label: "Now", rx, mm: axialMm(rx), color: "#22d3ee", tone: "cyan" },
    { label: "18, regular glasses", rx: base.at18, mm: axialMm(base.at18), color: "#fb7185", tone: "rose" },
    ...(option === "none" ? [] : [{ label: `18, ${INTERVENTIONS[option].short}`, rx: opt.at18, mm: axialMm(opt.at18), color: "#34d399", tone: "green" }]),
  ], [rx, base, opt, option]);
  const I = INTERVENTIONS[option];

  return (
    <div className="stack-lg kids" ref={root}>
      <PageHead kicker="Kids' eyes · myopia forecast" title="Where is your child's prescription heading?"
        sub="Short-sightedness usually grows through childhood as the eye gets longer. Published data on thousands of children shows how fast, and which options slow it. Population averages, not a diagnosis."
        right={<Badge tone="violet"><Baby size={13} /> for parents</Badge>} />

      <Card className="kid-controls" data-reveal>
        <label className="field"><span className="small row between">Age now <b className="num">{age}</b></span><input className="slider" type="range" min="5" max="16" value={age} onChange={(e) => setAge(+e.target.value)} /></label>
        <label className="field"><span className="small row between">Prescription now (SPH) <b className="num">{fmt(rx)} D</b></span><input className="slider" type="range" min="-6" max="-0.5" step="0.25" value={rx} onChange={(e) => setRx(+e.target.value)} /></label>
        <label className="field"><span className="small">Family background</span><select className="select" value={group} onChange={(e) => setGroup(e.target.value)}>{Object.entries(GROUPS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
        <label className="field"><span className="small">Short-sighted parents</span><Seg options={[{ value: 0, label: "None" }, { value: 1, label: "One" }, { value: 2, label: "Both" }]} value={parents} onChange={setParents} /></label>
      </Card>

      <div className="kid-options" data-reveal>
        {Object.entries(INTERVENTIONS).map(([k, v]) => (
          <button key={k} className={`kid-opt ${option === k ? "on" : ""}`} onClick={() => setOption(k)}>
            <b>{v.short}</b><span className="tiny muted">{k === "none" ? "no slowing" : `${Math.round((1 - v.factor) * 100)}% slower`}</span>
          </button>
        ))}
      </div>

      <div className="grid g-12">
        <Card className="span-7" title="Forecast to age 18" icon={Eye} right={<Hud tone="cyan">Donovan 2012 · COMET</Hud>} data-reveal>
          <Forecast base={base} opt={opt} age={age} />
          <div className="row wrap" style={{ gap: 14 }}>
            <span className="small row" style={{ gap: 6 }}><i className="kid-key" style={{ background: "var(--rose)" }} />Regular glasses</span>
            {option !== "none" && <span className="small row" style={{ gap: 6 }}><i className="kid-key" style={{ background: "var(--green)" }} />{I.short}</span>}
            <span className="tiny muted">Shaded: range from the meta-analysis confidence interval. Individual children vary more.</span>
          </div>
        </Card>
        <Card className="span-5" title="The eye grows longer" icon={Glasses} right={<Hud tone="pink">axial elongation</Hud>} data-reveal>
          <GrowingEye stages={stages} />
          <p className="small text-2">Myopia is mostly the eyeball growing too long: light focuses in front of the retina and blurs. Each extra millimetre adds about 2.5 dioptres. Glasses refocus the light; myopia-control options slow the growth itself.</p>
        </Card>
      </div>

      <div className="grid g3">
        <Card className="kid-out" data-reveal>
          <Hud tone="rose">At 18, regular glasses</Hud>
          <b className="display-sm">{fmt(base.at18)} D</b>
          <span className="small text-2">Eye about {axialMm(base.at18).toFixed(1)} mm long; lenses {edgeAt(base.at18).toFixed(1)} mm thick at the edge in a small round frame.</span>
        </Card>
        <Card className="kid-out" data-reveal>
          <Hud tone="green">{option === "none" ? "Pick an option above" : `At 18, ${I.short}`}</Hud>
          <b className="display-sm">{option === "none" ? "—" : `${fmt(opt.at18)} D`}</b>
          <span className="small text-2">{option === "none" ? "Compare what each evidence-based option would change." : `${Math.abs(saved).toFixed(1)} D less myopia; lenses ${edgeAt(opt.at18).toFixed(1)} mm at the edge.`}</span>
        </Card>
        <Card className="kid-out glow" data-reveal>
          <Hud tone="violet">Why each dioptre matters</Hud>
          <b className="display-sm">{option === "none" ? "—" : `−${Math.round((1 - maculopathyRR(Math.abs(saved))) * 100)}%`}</b>
          <span className="small text-2">{option === "none" ? "Each dioptre of myopia avoided lowers the lifetime risk of myopic maculopathy by about 40%." : `lower lifetime risk of myopic maculopathy: each dioptre avoided cuts it by about 40% (Bullimore & Brennan, 2019).`}</span>
        </Card>
      </div>

      <div className="grid g-12">
        <Card className="span-7" title="What the trials found" icon={ShieldCheck} data-reveal>
          <div className="list">
            {Object.entries(INTERVENTIONS).filter(([k]) => k !== "none").map(([k, v]) => (
              <div key={k} className={`li ${option === k ? "on" : ""}`}><span className="grow" style={{ minWidth: 0 }}><span className="t">{v.label}</span><span className="s wrap-s">{v.evidence}</span></span></div>
            ))}
          </div>
          <p className="tiny muted" style={{ marginTop: 8 }}>Trials ran 1–3 years; the forecast assumes the effect holds until progression stops. Contact lenses and drops are prescribed and monitored by an eye-care professional.</p>
        </Card>
        <Card className="span-5" title="Not short-sighted yet?" icon={Sun} data-reveal>
          <p className="small text-2">Time outdoors protects before myopia starts. In a school trial in China, 40 extra minutes outdoors a day lowered the share of children who became short-sighted over three years from 39.5% to 30.4% (He et al., JAMA 2015). It has much less effect once a child is already short-sighted.</p>
          <div className="verdict ok"><Info size={17} /><span className="small">This forecast is for children who already wear glasses for distance. It uses population averages, so treat it as a conversation starter with your child's eye doctor, not a prediction for one child.</span></div>
        </Card>
      </div>
    </div>
  );
}

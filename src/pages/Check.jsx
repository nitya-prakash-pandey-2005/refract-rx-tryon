import { useEffect, useMemo, useRef, useState } from "react";
import { ShieldCheck, Eye, Glasses, Ruler, Gauge as GaugeIcon, Sparkles, AlertTriangle, CheckCircle2, Droplets, ArrowRight } from "lucide-react";
import { Card, PageHead, Hud, Badge, Seg, Toggle, Drivers } from "../ui";
import { useStore, setStore } from "../state/store";
import { navigate } from "../lib/router";
import { countUp, useReveal } from "../lib/anim";
import { FRAMES, getFrame } from "../engine/frames";
import { INDICES } from "../engine/optics";
import { remakeRisk } from "../engine/risk";
import { materialSight } from "../engine/sight";
import FrameArt from "../components/FrameArt";
import SightSim from "../components/SightSim";

const TONE = { low: "green", medium: "amber", high: "rose" };
const WORD = { low: "Low risk", medium: "Some risk", high: "High risk" };
const PART = [
  ["look", Eye, "Look", "How the lenses change your face"],
  ["sight", Sparkles, "Sight", "Colour fringes you'll see"],
  ["fit", Glasses, "Fit", "Will they slide down your nose?"],
  ["measure", Ruler, "Measure", "Is your PD accurate enough?"],
];

export default function Check({ parts }) {
  const s = useStore();
  const root = useRef(null), scoreEl = useRef(null);
  const frame = getFrame(parts[1]) || getFrame(s.lastFrame) || FRAMES[0];
  const [indexN, setIndexN] = useState("best");
  const [bridge, setBridge] = useState(s.bridge || "medium");
  const [oil, setOil] = useState(s.skin?.oiliness ?? 60);
  const [pdKnown, setPdKnown] = useState(false);
  const youcamOil = s.skin?.oiliness != null;
  const basePd = s.measure?.pd || { left: 31.5, right: 31.5, far: 63, plusMinus: 2.7 };
  const pd = { ...basePd, plusMinus: pdKnown ? 0.5 : basePd.plusMinus };
  const face = { faceWidthMm: s.measure?.faceWidthMm, noseWidthMm: s.measure?.noseWidthMm, bridge };
  const index = indexN === "best" ? undefined : INDICES.find((i) => i.n === indexN);
  const risk = useMemo(() => remakeRisk({ frame, rx: s.rx, pd, face, oiliness: oil, index }), [frame.id, JSON.stringify(s.rx), indexN, bridge, oil, pdKnown, s.measure]); // eslint-disable-line react-hooks/exhaustive-deps
  const asOrdered = useMemo(() => remakeRisk({ frame, rx: s.rx, pd: basePd, face: { ...face, bridge: s.bridge || "medium" }, oiliness: s.skin?.oiliness ?? 60 }), [frame.id, JSON.stringify(s.rx), s.measure]); // eslint-disable-line react-hooks/exhaustive-deps
  const ranked = useMemo(() => FRAMES.map((f) => ({ f, r: remakeRisk({ frame: f, rx: s.rx, pd, face, oiliness: oil, index }) })).sort((a, b) => a.r.score - b.r.score), [JSON.stringify(s.rx), indexN, bridge, oil, pdKnown, s.measure]); // eslint-disable-line react-hooks/exhaustive-deps
  const strongest = Math.max(Math.abs(s.rx.od.sph), Math.abs(s.rx.os.sph), Math.abs(s.rx.od.sph + s.rx.od.cyl), Math.abs(s.rx.os.sph + s.rx.os.cyl));
  const sightRows = materialSight({ sph: strongest, cyl: 0, axis: 0 }); // same power as the simulator
  useReveal(root, []);
  useEffect(() => { countUp(scoreEl.current, risk.score, { duration: 700 }); }, [risk.score]);
  useEffect(() => { setStore({ lastFrame: frame.id }); }, [frame.id]);
  const slip = risk.parts.fit.detail;

  return (
    <div className="stack-lg" ref={root}>
      <PageHead kicker="Remake-risk check" title={`Will ${frame.name} work for you?`} sub="Glasses fail after purchase in four ways. Refract predicts each one before you buy, from optics, physics and your YouCam skin scan." right={<Badge tone="violet"><ShieldCheck size={13} /> First on the web</Badge>} />

      <div className="frame-strip" data-reveal>
        {ranked.map(({ f, r }) => (
          <button key={f.id} className={`frame-chip ${f.id === frame.id ? "on" : ""}`} onClick={() => navigate(`/check/${f.id}`)}>
            <FrameArt frame={f} height={30} />
            <span className="row between"><b>{f.name}</b><span className={`num tiny ${r.level === "low" ? "good" : r.level === "medium" ? "ok" : "bad"}`}>{r.score}</span></span>
            <span className="tiny muted">{f.weightG} g · {f.pads === "adjustable" ? "pads" : "fixed bridge"}</span>
          </button>
        ))}
      </div>

      <div className="grid g-12">
        <Card className="span-5 glow risk-hero" data-reveal tour="risk-score">
          <Hud>Remake risk · {frame.name}</Hud>
          <div className="row" style={{ alignItems: "baseline", gap: 12 }}>
            <div className={`risk-num ${risk.level}`}><span ref={scoreEl}>{risk.score}</span><small>/100</small></div>
            <Badge tone={TONE[risk.level]}>{WORD[risk.level]}</Badge>
          </div>
          {asOrdered.score !== risk.score && <p className="small text-2">As first configured: <b>{asOrdered.score}</b>. Your changes moved it by <b className={risk.score < asOrdered.score ? "good" : "bad"}>{risk.score - asOrdered.score > 0 ? "+" : ""}{risk.score - asOrdered.score}</b>.</p>}
          <div className="divider" />
          <Hud>What if…</Hud>
          <label className="field"><span className="small">Lens material</span>
            <Seg options={[{ value: "best", label: "Thinnest" }, ...INDICES.map((i) => ({ value: i.n, label: i.n.toFixed(2) }))]} value={indexN} onChange={setIndexN} />
          </label>
          <label className="field"><span className="small">Your nose bridge: do glasses usually rest on your cheeks?</span>
            <Seg options={[{ value: "low", label: "Yes · low" }, { value: "medium", label: "Sometimes" }, { value: "high", label: "No · high" }]} value={bridge} onChange={(v) => { setBridge(v); setStore({ bridge: v }); }} />
          </label>
          <label className="field"><span className="small row between">Nose oiliness {youcamOil ? <Badge tone="violet">YouCam Skin AI: {s.skin.oiliness}/100</Badge> : <a className="tiny" href="#/profile">measure with YouCam</a>}</span>
            <input className="slider" type="range" min="1" max="100" value={oil} onChange={(e) => setOil(+e.target.value)} aria-label="Oiliness score (higher is less oily)" />
            <span className="tiny muted">{oil < 45 ? "Oily: pads grip less" : oil < 70 ? "Normal" : "Dry: pads grip well"} · higher score = less oily</span>
          </label>
          <label className="row between small"><span>I know my PD (optician or card measurement)</span><Toggle on={pdKnown} onChange={setPdKnown} label="PD known" /></label>
        </Card>

        <div className="span-7 grid g2">
          {PART.map(([key, Icon, title, sub]) => {
            const p = risk.parts[key];
            return (
              <Card key={key} className={`risk-card ${p.level}`} data-reveal>
                <div className="row between"><span className="row" style={{ gap: 8 }}><span className="step-ic"><Icon size={16} /></span><b>{title}</b></span><Badge tone={TONE[p.level]}>{p.level}</Badge></div>
                <span className="tiny muted">{sub}</span>
                <b className="mono small">{p.headline}</b>
                {p.fix ? <span className="small row-top" style={{ gap: 6 }}><AlertTriangle size={14} color="var(--amber)" style={{ flex: "none", marginTop: 2 }} />{p.fix}</span> : <span className="small row" style={{ gap: 6 }}><CheckCircle2 size={14} color="var(--green)" />Nothing to fix here.</span>}
              </Card>
            );
          })}
        </div>

        <Card className="span-7" title="Sight: what you'll see through the lens" icon={Eye} right={<Hud tone="cyan">Abbe · Prentice</Hud>} data-reveal>
          <SightSim power={strongest} abbe={(index || risk.lens.best).abbe} label={`${(index || risk.lens.best).label} · ${strongest.toFixed(2)} D`} />
          <div className="material-row">
            {sightRows.map((r) => (
              <button key={r.index.n} className={`index-chip ${(index || risk.lens.best).n === r.index.n ? "on" : ""}`} onClick={() => setIndexN(r.index.n)}>
                <b>{r.index.n.toFixed(2)}</b>
                <span className="tiny">Abbe {r.abbe}</span>
                <span className="tiny muted">Ø {Number.isFinite(r.cleanZoneMm) ? r.cleanZoneMm.toFixed(0) : "∞"} mm clean</span>
                <span className="tiny" style={{ color: r.linesLost >= 1 ? "var(--rose)" : r.linesLost >= 0.6 ? "var(--amber)" : "var(--green)" }}>−{r.linesLost.toFixed(1)} chart lines</span>
              </button>
            ))}
          </div>
          <p className="small text-2">Thinner is not always clearer: 1.67 and 1.74 split colours almost as much as polycarbonate. "Chart lines" is the sharpness you lose when you glance 10 mm off-centre, from measured colour-fringe perception (Winter et al., JOSA A 2015). The dashed circle is your colour-clean zone.</p>
        </Card>

        <Card className="span-5" title="Fit: will they slide?" icon={GaugeIcon} right={<Hud tone="pink">physics</Hud>} data-reveal>
          <SlipDiagram slip={slip} />
          <Drivers drivers={slip.drivers.map((d, i) => ({ ...d, feature: String(i) }))} max={0.5} />
          <p className="tiny muted" style={{ marginTop: 8 }}>Slip margin = grip ÷ load: friction on the nose pads (lower on oily skin) plus ear and temple hold, against weight on the nasal slope while you look down at your phone (30° + 20° head tilt), with head movement. Below 1× they creep down.</p>
          <div className="row wrap" style={{ gap: 8, marginTop: 8 }}>
            <Badge tone="cyan"><Droplets size={12} /> μ {slip.inputs.frictionCoeff.toFixed(2)}</Badge>
            <Badge tone="muted">{slip.pressureKPa.toFixed(1)} kPa on the nose</Badge>
          </div>
        </Card>
      </div>

      <div className="row wrap" style={{ gap: 10 }} data-reveal>
        <a className="btn primary" href={`#/live/${frame.id}`}>See {frame.name} live through your lenses<ArrowRight size={16} /></a>
        <a className="btn" href="#/retail">How retailers use this</a>
      </div>
    </div>
  );
}

// Side view of the glasses on the nose: arrows scale with the forces in the slip model.
function SlipDiagram({ slip }) {
  const m = Math.min(slip.margin, 3);
  const tone = slip.level === "low" ? "var(--green)" : slip.level === "medium" ? "var(--amber)" : "var(--rose)";
  const load = 26 + Math.min(40, slip.totalWeightG * 0.7);
  const hold = load * Math.min(m, 2.4) * 0.55;
  return (
    <svg viewBox="0 0 380 150" className="slip-svg" role="img" aria-label={`Slip margin ${slip.margin.toFixed(2)} times`}>
      <path d="M40 20 C 90 30, 120 70, 150 120 L 175 132" fill="none" stroke="var(--line-2)" strokeWidth="3" />
      <text x="34" y="14" className="tiny" fill="var(--muted)">nose</text>
      <g transform="translate(118 68) rotate(58)">
        <rect x="-18" y="-6" width="36" height="12" rx="4" fill="var(--surface-raised)" stroke={tone} strokeWidth="2" />
      </g>
      <line x1="118" y1="68" x2={118 + load * 0.5} y2={68 + load * 0.86} stroke="var(--rose)" strokeWidth="3" markerEnd="url(#arr)" />
      <line x1="118" y1="68" x2={118 - hold * 0.5} y2={68 - hold * 0.86} stroke="var(--green)" strokeWidth="3" markerEnd="url(#arr)" />
      <defs><marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="currentColor" /></marker></defs>
      <text x="200" y="40" fill="var(--text)" style={{ font: "700 26px var(--font-display)" }}>{slip.margin.toFixed(2)}×</text>
      <text x="200" y="60" style={{ font: "500 11px var(--font-mono)" }} fill="var(--muted)">slip margin (≥1.5× stays put)</text>
      <text x="200" y="92" style={{ font: "600 11px var(--font-mono)" }} fill="var(--rose)">load: {slip.totalWeightG.toFixed(0)} g + head movement</text>
      <text x="200" y="110" style={{ font: "600 11px var(--font-mono)" }} fill="var(--green)">grip: pads + ears + temples</text>
    </svg>
  );
}

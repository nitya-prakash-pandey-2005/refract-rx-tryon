import { useEffect, useRef, useState } from "react";
import { parseDiopter, RANGES } from "../engine/rxinput";
import { ArrowRight, Eye, Info, BookOpen } from "lucide-react";
import { Card, PageHead, Hud, Badge } from "../ui";
import { useStore, setStore } from "../state/store";
import { navigate } from "../lib/router";
import { useReveal } from "../lib/anim";
import { spherEq, eyeMagnification, INDICES } from "../engine/optics";
import LensSection from "../components/LensSection";
import RxGuide from "../components/RxGuide";

const PRESETS = [
  { label: "−2.50 everyday", rx: { od: { sph: -2.5, cyl: 0, axis: 0 }, os: { sph: -2.25, cyl: -0.25, axis: 180 } } },
  { label: "−6.50 strong", rx: { od: { sph: -6.5, cyl: -0.75, axis: 180 }, os: { sph: -6.0, cyl: -0.5, axis: 175 } } },
  { label: "−9.00 very strong", rx: { od: { sph: -9, cyl: -1.25, axis: 10 }, os: { sph: -8.75, cyl: -1, axis: 170 } } },
  { label: "+3.00 reading", rx: { od: { sph: 2.75, cyl: -0.5, axis: 90 }, os: { sph: 3, cyl: -0.25, axis: 85 } } },
];
const fmt = (v) => (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toFixed(2);

const fmtPower = (v) => (v > 0 ? "+" : "") + v.toFixed(2);

// Text field that lets people type "-", "−6,5" etc.; commits only valid, clamped numbers.
function NumField({ label, value, range, integer, onCommit, aria }) {
  const show = (v) => (integer ? String(Math.round(v)) : fmtPower(v));
  const [text, setText] = useState(show(value));
  useEffect(() => { setText((prev) => (parseDiopter(prev, range) === value ? prev : show(value))); }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <label className="field">
      <span>{label}</span>
      <input className="input mono" type="text" inputMode="decimal" value={text} aria-label={aria}
        onChange={(e) => { setText(e.target.value); const v = parseDiopter(e.target.value, range); if (v != null) onCommit(integer ? Math.round(v) : v); }}
        onBlur={() => setText(show(value))} />
    </label>
  );
}

function EyeFields({ eye, label, value, onChange }) {
  const set = (k) => (v) => onChange({ ...value, [k]: v });
  return (
    <div className="rx-eye">
      <Hud>{label}</Hud>
      <div className="rx-fields">
        <NumField label="SPH" value={value.sph} range={RANGES.sph} onCommit={set("sph")} aria={`${eye} sphere`} />
        <NumField label="CYL" value={value.cyl} range={RANGES.cyl} onCommit={set("cyl")} aria={`${eye} cylinder`} />
        <NumField label="AXIS" value={value.axis} range={RANGES.axis} integer onCommit={set("axis")} aria={`${eye} axis`} />
      </div>
    </div>
  );
}

export default function Rx() {
  const s = useStore();
  const root = useRef(null);
  useReveal(root, []);
  const rx = s.rx;
  const se = [spherEq(rx.od), spherEq(rx.os)].reduce((a, b) => (Math.abs(b) > Math.abs(a) ? b : a));
  const m = eyeMagnification(se);
  const change = (m - 1) * 100;
  const pd = s.measure?.pd;
  const setEye = (k) => (v) => setStore({ rx: { ...rx, [k]: v }, rxConfirmed: true });
  const hi = INDICES.find((i) => i.n === 1.67);

  return (
    <div className="stack-lg" ref={root}>
      <PageHead kicker="Step 2 of 3" title="Your prescription" sub="Copy the numbers from your prescription. Refract doesn't prescribe; it shows what your lenses will look like." />
      <div className="grid g-12">
        <Card className="span-7" title="Lens powers" icon={Eye} right={<Hud>dioptres</Hud>} data-reveal tour="rx-form">
          <div className="row wrap" style={{ gap: 8, marginBottom: 14 }}>
            {PRESETS.map((p) => <button key={p.label} className="chip" onClick={() => setStore({ rx: p.rx, rxConfirmed: true })}>{p.label}</button>)}
          </div>
          <div className="grid g2">
            <EyeFields eye="right eye" label="OD · right eye" value={rx.od} onChange={setEye("od")} />
            <EyeFields eye="left eye" label="OS · left eye" value={rx.os} onChange={setEye("os")} />
          </div>
          <div className="divider" />
          <div className="row between wrap">
            <div>
              <Hud>Pupillary distance</Hud>
              <div className="display-sm">{pd ? <>{pd.far.toFixed(1)} <small>± {pd.plusMinus.toFixed(1)} mm</small></> : "Scan to measure"}</div>
              {pd && <div className="small muted">Right {pd.right.toFixed(1)} · Left {pd.left.toFixed(1)} mm · measured with your iris as a ruler, corrected for looking at a near camera.</div>}
            </div>
            {Math.abs(se) >= 4 && pd && <Badge tone="amber">Strong Rx: confirm PD with your optician</Badge>}
          </div>
        </Card>
        <div className="span-5 stack">
          <Card title="What these lenses do" right={<Hud tone="cyan">live</Hud>} data-reveal>
            <div className="row" style={{ gap: 18, alignItems: "baseline" }}>
              <div className="display">{change > 0 ? "+" : ""}{change.toFixed(1)}<small>%</small></div>
              <div className="small text-2">{Math.abs(se) < 0.5 ? "Barely any change to how your eyes look." : change < 0 ? "Your eyes look this much smaller to everyone else." : "Your eyes look this much bigger to everyone else."}</div>
            </div>
            <LensSection power={se} index={hi} />
            <p className="tiny muted">Cross-section of a 52 mm lens at {fmt(se)} D, true scale. Outline: 1.50 standard. Filled: 1.67 thin.</p>
          </Card>
          <button className="btn primary lg block" onClick={() => navigate(s.photo ? "/profile" : "/scan")}>
            {s.photo ? "Measure my face with YouCam" : "Scan my face"}<ArrowRight size={18} />
          </button>
          <p className="tiny muted row" style={{ gap: 6 }}><Info size={13} />Cosmetic preview only. Your optician confirms the final lens.</p>
        </div>
        <Card className="span-12" title="How to read your prescription" icon={BookOpen} right={<Hud>tap a column</Hud>} data-reveal>
          <RxGuide onUse={(r) => setStore({ rx: r, rxConfirmed: true })} />
        </Card>
      </div>
    </div>
  );
}

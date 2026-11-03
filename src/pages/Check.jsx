import { useEffect, useMemo, useRef, useState } from "react";
import { ShieldCheck, Eye, Glasses, Ruler, Gauge as GaugeIcon, Sparkles, AlertTriangle, CheckCircle2, Droplets, ArrowRight, ScanSearch, Link2, Bookmark } from "lucide-react";
import { Card, PageHead, Hud, Badge, Seg, Toggle, Drivers, toast } from "../ui";
import { bookmarklet } from "../lib/bookmarklet";
import { useStore, setStore } from "../state/store";
import { navigate } from "../lib/router";
import { countUp, useReveal } from "../lib/anim";
import { FRAMES, SHAPES, getFrame, parseFrameSize, customFrame, normShape, normMaterial } from "../engine/frames";
import { lensPair } from "../engine/fit";
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

export default function Check({ parts, query = {} }) {
  const s = useStore();
  const root = useRef(null), scoreEl = useRef(null), strip = useRef(null);
  // A shared link or the bookmarklet: #/check/custom?size=52-18-140&shape=rect&material=metal&from=site
  const linked = parts[1] === "custom" && query.size != null ? parseFrameSize(query.size) : null;
  // The bookmarklet found no size: show only the form, never a frame from an earlier visit.
  const failed = parts[1] === "custom" && query.from != null && !linked;
  useEffect(() => {
    const B = Number(query.B);
    if (linked) setStore({ customFrame: { ...linked, B: B >= 20 && B <= 60 ? B : undefined, shape: normShape(query.shape) || "rect", material: normMaterial(query.material) || "acetate" } });
  }, [query.size, query.shape, query.material, query.B]); // eslint-disable-line react-hooks/exhaustive-deps
  const frame = (!failed && getFrame(parts[1])) || (s.lastFrame !== "custom" && getFrame(s.lastFrame)) || FRAMES[0];
  const [indexN, setIndexN] = useState(INDICES.some((i) => i.n === Number(query.index)) ? Number(query.index) : "best");
  const [bridge, setBridge] = useState(s.bridge || "medium");
  const [oil, setOil] = useState(s.skin?.oiliness ?? 60);
  const [pdKnown, setPdKnown] = useState(false);
  const youcamOil = s.skin?.oiliness != null;
  const basePd = s.measure?.pd || { left: 31.5, right: 31.5, far: 63, plusMinus: 2.7 };
  const pd = { ...basePd, plusMinus: pdKnown ? 0.5 : basePd.plusMinus };
  const face = { faceWidthMm: s.measure?.faceWidthMm, noseWidthMm: s.measure?.noseWidthMm, bridge };
  const index = indexN === "best" ? undefined : INDICES.find((i) => i.n === indexN);
  const risk = useMemo(() => remakeRisk({ frame, rx: s.rx, pd, face, oiliness: oil, index }), [frame, JSON.stringify(s.rx), indexN, bridge, oil, pdKnown, s.measure]); // eslint-disable-line react-hooks/exhaustive-deps
  const asOrdered = useMemo(() => remakeRisk({ frame, rx: s.rx, pd: basePd, face: { ...face, bridge: s.bridge || "medium" }, oiliness: s.skin?.oiliness ?? 60 }), [frame, JSON.stringify(s.rx), s.measure]); // eslint-disable-line react-hooks/exhaustive-deps
  const ranked = useMemo(() => FRAMES.map((f) => ({ f, r: remakeRisk({ frame: f, rx: s.rx, pd, face, oiliness: oil, index }) })).sort((a, b) => a.r.score - b.r.score), [JSON.stringify(s.rx), indexN, bridge, oil, pdKnown, s.measure]); // eslint-disable-line react-hooks/exhaustive-deps
  const mine = getFrame("custom");
  const mineRisk = useMemo(() => mine && remakeRisk({ frame: mine, rx: s.rx, pd, face, oiliness: oil, index }), [mine, JSON.stringify(s.rx), indexN, bridge, oil, pdKnown, s.measure]); // eslint-disable-line react-hooks/exhaustive-deps
  const strongest = Math.max(Math.abs(s.rx.od.sph), Math.abs(s.rx.os.sph), Math.abs(s.rx.od.sph + s.rx.od.cyl), Math.abs(s.rx.os.sph + s.rx.os.cyl));
  const sightRows = materialSight({ sph: strongest, cyl: 0, axis: 0 }); // same power as the simulator
  useReveal(root, []);
  useEffect(() => { countUp(scoreEl.current, risk.score, { duration: 700 }); }, [risk.score]);
  useEffect(() => { setStore({ lastFrame: frame.id }); }, [frame.id]);
  useEffect(() => { const el = strip.current, on = el?.querySelector(".on"); if (el && on) el.scrollLeft = Math.max(0, on.offsetLeft - el.offsetLeft - 8); }, [frame]);
  const slip = risk.parts.fit.detail;

  return (
    <div className="stack-lg" ref={root}>
      <PageHead kicker="Remake-risk check" title={failed ? "Which frame were you looking at?" : frame.custom ? `Will this ${frame.A}□${frame.DBL} frame work for you?` : `Will ${frame.name} work for you?`} sub="Glasses fail after purchase in four ways. Refract predicts each one before you buy, from optics, physics and your YouCam skin scan." right={<Badge tone="violet"><ShieldCheck size={13} /> First on the web</Badge>} />

      {query.from && <div className={`callout row ${linked ? "" : "warn"}`}>{linked ? <><ScanSearch size={17} color="var(--cyan)" /><span className="small">Checking the <b>{linked.A}□{linked.DBL}</b> frame you were looking at on <b>{query.from}</b>, against your prescription.</span></> : <><AlertTriangle size={17} color="var(--amber)" /><span className="small">Couldn't find a frame size on <b>{query.from}</b>. Select the size text on that page before tapping the bookmark, or type it below.</span></>}</div>}
      <AnyFrame key={JSON.stringify(s.customFrame)} spec={failed ? null : s.customFrame} active={Boolean(frame.custom)} />

      {!failed && <>
      <div className="frame-strip" ref={strip} data-reveal>
        {mine && (
          <button className={`frame-chip mine ${frame.custom ? "on" : ""}`} onClick={() => navigate("/check/custom")}>
            <FrameArt frame={mine} height={30} />
            <span className="row between"><b>{mine.A}□{mine.DBL}</b><span className={`num tiny ${mineRisk.level === "low" ? "good" : mineRisk.level === "medium" ? "ok" : "bad"}`}>{mineRisk.score}</span></span>
            <span className="tiny muted">your frame · {mine.material}</span>
          </button>
        )}
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
          <VsMine frame={frame} rx={s.rx} pd={pd} index={index || risk.lens.best} mine={s.myGlasses} />
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
        {frame.custom && <button className="btn" onClick={() => copyLink(s.customFrame)}><Link2 size={16} />Copy link to this check</button>}
        <a className="btn" href="#/retail">How stores use this</a>
      </div>
      </>}
    </div>
  );
}

// A link anyone can open with their own prescription; falls back to showing it where the
// clipboard API is unavailable (plain http, older browsers).
function copyLink(f) {
  const params = { size: `${f.A}-${f.DBL}-${f.temple || 140}`, shape: f.shape, material: f.material, ...(f.B ? { B: f.B } : {}) };
  const url = `${location.origin}/#/check/custom?${new URLSearchParams(params)}`;
  if (!navigator.clipboard) { toast(url); return; }
  navigator.clipboard.writeText(url).then(() => toast("Link copied: anyone can open this check with their own prescription.", "ok"), () => toast(url));
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

const SHAPE_LABEL = { round: "Round", oval: "Oval", rect: "Rectangle", square: "Square", browline: "Browline", panto: "Panto", cat: "Cat-eye", butterfly: "Butterfly", aviator: "Aviator", geo: "Geometric" };

// A frame from any store, checked by the size printed inside its arm.
function AnyFrame({ spec, active }) {
  const [size, setSize] = useState(spec ? `${spec.A}□${spec.DBL} ${spec.temple || 140}` : "");
  const [height, setHeight] = useState(spec?.B ? String(spec.B) : "");
  const [shape, setShape] = useState(spec?.shape || "rect");
  const [material, setMaterial] = useState(spec?.material || "acetate");
  const parsed = parseFrameSize(size);
  const heightOk = !height || (Number(height) >= 20 && Number(height) <= 60);
  const bm = useRef(null);
  useEffect(() => { bm.current?.setAttribute("href", bookmarklet(location.origin)); }, []); // React blocks javascript: URLs in props
  function go(e) {
    e.preventDefault();
    if (!parsed || !heightOk) return;
    setStore({ customFrame: { ...parsed, B: Number(height) || undefined, shape, material } });
    navigate("/check/custom");
  }
  return (
    <Card className={`any-frame ${active ? "glow" : ""}`} tour="any-frame">
      <div className="any-frame-head">
        <span className="step-ic"><ScanSearch size={17} /></span>
        <div className="grow">
          <b>Looking at glasses on another website or in a shop?</b>
          <p className="small text-2">Type the size printed inside the arm (or in the product listing). Refract checks that exact frame against your prescription.</p>
        </div>
        <TempleArm text={parsed ? `${parsed.A} □ ${parsed.DBL}  ${parsed.temple || 140}` : "52 □ 18  140"} />
      </div>
      <form className="any-frame-form" onSubmit={go}>
        <label className="field"><span className="tiny">Size: lens □ bridge arm</span><input className="input mono" value={size} onChange={(e) => setSize(e.target.value)} placeholder="52□18 140" aria-invalid={Boolean(size && !parsed)} /></label>
        <label className="field"><span className="tiny">Lens height (if listed)</span><input className="input mono" inputMode="numeric" value={height} onChange={(e) => setHeight(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="auto" aria-invalid={!heightOk} /></label>
        <label className="field"><span className="tiny">Shape</span><select className="select" value={shape} onChange={(e) => setShape(e.target.value)}>{SHAPES.map((k) => <option key={k} value={k}>{SHAPE_LABEL[k]}</option>)}</select></label>
        <label className="field"><span className="tiny">Material</span><Seg options={[{ value: "acetate", label: "Plastic" }, { value: "metal", label: "Metal" }, { value: "titanium", label: "Titanium" }]} value={material} onChange={setMaterial} /></label>
        <button className="btn primary" disabled={!parsed || !heightOk}><ShieldCheck size={16} />Check this frame</button>
      </form>
      {size && !parsed && <span className="tiny" style={{ color: "var(--amber)" }}>Type at least the lens width and bridge, like 52-18 (lens 33–66 mm, bridge 12–26 mm).</span>}
      {!heightOk && <span className="tiny" style={{ color: "var(--amber)" }}>Lens height is usually 20–60 mm; leave it empty and Refract estimates it from the shape.</span>}
      <div className="bm-row">
        <a ref={bm} className="btn sm bm-link" onClick={(e) => { e.preventDefault(); toast("Drag this button to your bookmarks bar, then tap it on any glasses product page.", "info"); }}><Bookmark size={14} />Check with Refract</a>
        <span className="tiny text-2"><b>One tap on any store:</b> drag this to your bookmarks bar. On any glasses product page, tap it and Refract opens with that frame's size, shape and material filled in.</span>
      </div>
    </Card>
  );
}

// Where the size lives: the inside of a temple arm.
function TempleArm({ text }) {
  return (
    <svg className="temple-arm desktop-only" viewBox="0 0 230 54" aria-hidden="true">
      <path d="M6 16 H186 C204 16 214 22 222 40" fill="none" stroke="var(--line-2)" strokeWidth="12" strokeLinecap="round" />
      <text x="20" y="20" fill="var(--cyan)" style={{ font: "600 11px var(--font-mono)" }}>{text}</text>
      <text x="20" y="46" fill="var(--muted)" style={{ font: "500 9px var(--font-mono)" }}>lens · bridge · arm (mm)</text>
    </svg>
  );
}

// "Better or worse than what I wear now?": the same prescription in the shopper's current frame.
const LENS_NOW = [{ value: "same", label: "Don't know" }, { value: 1.5, label: "Standard" }, { value: 1.67, label: "Thin" }, { value: 1.74, label: "Ultra-thin" }];
function VsMine({ frame, rx, pd, index, mine }) {
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState(mine ? `${mine.A}□${mine.DBL} ${mine.temple || 140}` : "");
  const [material, setMaterial] = useState(mine?.material || "acetate");
  const [n, setN] = useState(mine?.n ?? "same");
  const parsed = parseFrameSize(size);
  const cmp = useMemo(() => {
    if (!mine) return null;
    const cur = customFrame(mine);
    const curIndex = mine.n ? INDICES.find((i) => i.n === mine.n) : index;
    const a = lensPair({ frame, rx, pd, index }), b = lensPair({ frame: cur, rx, pd, index: curIndex });
    const minus = rx.od.sph + rx.od.cyl / 2 <= 0;
    const thick = (l) => (minus ? Math.max(l.od.maxEdge, l.os.maxEdge) : Math.max(l.od.centre, l.os.centre));
    const grams = (l, f) => l.od.weightG + l.os.weightG + f.weightG;
    return { minus, curIndex, edge: [thick(a), thick(b)], g: [grams(a, frame), grams(b, cur)] };
  }, [mine, frame, JSON.stringify(rx), pd.left, pd.right, index]); // eslint-disable-line react-hooks/exhaustive-deps

  function save(e) {
    e.preventDefault();
    if (!parsed) return;
    setStore({ myGlasses: { ...parsed, shape: "rect", material, n: n === "same" ? undefined : n } });
    setOpen(false);
  }
  if (open) {
    return (
      <form className="vs-form" onSubmit={save}>
        <span className="small"><b>The glasses you wear now:</b> type the size printed inside their arm</span>
        <div className="row wrap" style={{ gap: 8 }}>
          <input className="input mono" style={{ width: 130 }} value={size} onChange={(e) => setSize(e.target.value)} placeholder="52□18 140" aria-label="Size of your current glasses" />
          <Seg options={[{ value: "acetate", label: "Plastic" }, { value: "metal", label: "Metal" }]} value={material} onChange={setMaterial} />
        </div>
        <label className="field"><span className="tiny">Their lenses</span><Seg options={LENS_NOW} value={n} onChange={setN} /></label>
        <div className="row" style={{ gap: 8 }}><button className="btn sm primary" disabled={!parsed}>Compare</button><button type="button" className="btn sm ghost" onClick={() => setOpen(false)}>Cancel</button></div>
      </form>
    );
  }
  if (!cmp) return <button className="btn sm vs-open" onClick={() => setOpen(true)}><Glasses size={15} />Compare with the glasses I wear now</button>;

  const delta = (key, unit, dec, lowerIsBetter = true) => {
    const diff = cmp[key][0] - cmp[key][1];
    const tone = Math.abs(diff) < (dec ? 0.2 : 1) ? "" : (lowerIsBetter ? diff < 0 : diff > 0) ? "good" : "bad";
    return <b className={`num small ${tone}`}>{diff > 0 ? "+" : diff < 0 ? "−" : "±"}{Math.abs(diff).toFixed(dec)}{unit}</b>;
  };
  const dEdge = cmp.edge[0] - cmp.edge[1], dG = cmp.g[0] - cmp.g[1];
  const verdict = dEdge > 1 ? "Clearly thicker than what you wear now: you will notice." : dEdge > 0.3 ? "Slightly thicker than your current pair." : dEdge < -0.3 && dG < -1 ? "Thinner and lighter than what you wear now." : dEdge < -0.3 ? "Thinner than your current pair." : dG > 4 ? "About as thick, but heavier on your nose." : "About the same as what you wear now.";
  return (
    <div className="vs">
      <div className="row between"><Hud>vs your {mine.A}□{mine.DBL}{mine.n ? ` · ${cmp.curIndex.label.split(" ")[0]}` : ""}</Hud><button className="tiny link" onClick={() => setOpen(true)}>change</button></div>
      <div className="vs-grid">
        <span className="tiny muted">{cmp.minus ? "Edge" : "Centre"}</span><span className="num small">{cmp.edge[0].toFixed(1)} vs {cmp.edge[1].toFixed(1)} mm</span>{delta("edge", " mm", 1)}
        <span className="tiny muted">Weight</span><span className="num small">{cmp.g[0].toFixed(0)} vs {cmp.g[1].toFixed(0)} g</span>{delta("g", " g", 0)}
      </div>
      <span className="small">{verdict}{!mine.n && <span className="tiny muted"> Same lens assumed in both.</span>}</span>
    </div>
  );
}

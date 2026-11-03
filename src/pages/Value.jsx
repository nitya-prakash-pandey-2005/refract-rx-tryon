// Best value: all frame × lens combinations for the shopper's prescription on a price/risk
// plane, the Pareto frontier drawn through the ones nothing beats, and three honest picks.
import { useEffect, useMemo, useRef, useState } from "react";
import { Trophy, ShieldCheck, Wallet, ArrowRight } from "lucide-react";
import { animate, spring, stagger, svg } from "animejs";
import { Card, PageHead, Hud, Badge, Toggle } from "../ui";
import { useStore } from "../state/store";
import { reduced, useReveal } from "../lib/anim";
import { valueOptions, picks } from "../engine/value";
import FrameArt from "../components/FrameArt";

const W = 640, H = 330, X0 = 52, Y0 = 18, PW = W - X0 - 18, PH = H - Y0 - 42;
const TONE = { low: "var(--green)", medium: "var(--amber)", high: "var(--rose)" };
const fmt = (v) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(2)}`;

export default function Value() {
  const s = useStore();
  const root = useRef(null), plot = useRef(null);
  const [pdKnown, setPdKnown] = useState(false);
  const [hover, setHover] = useState(null);
  useReveal(root, []);
  const basePd = s.measure?.pd || { left: 31.5, right: 31.5, plusMinus: 2.7 };
  const data = useMemo(() => {
    const opts = valueOptions({ rx: s.rx, pd: { ...basePd, plusMinus: pdKnown ? 0.5 : basePd.plusMinus }, face: { faceWidthMm: s.measure?.faceWidthMm, noseWidthMm: s.measure?.noseWidthMm, bridge: s.bridge || "medium" }, oiliness: s.skin?.oiliness ?? 60 });
    return { opts, ...picks(opts) };
  }, [JSON.stringify(s.rx), pdKnown, s.measure, s.bridge, s.skin]); // eslint-disable-line react-hooks/exhaustive-deps
  const pMin = Math.min(...data.opts.map((o) => o.price)), pMax = Math.max(...data.opts.map((o) => o.price));
  // Zoom the risk axis to where the options are (risks cluster tightly for some prescriptions).
  const rLo = Math.max(0, Math.floor((Math.min(...data.opts.map((o) => o.risk)) - 8) / 5) * 5);
  const rHi = Math.min(100, Math.ceil((Math.max(...data.opts.map((o) => o.risk)) + 8) / 5) * 5);
  const x = (p) => X0 + ((p - pMin) / (pMax - pMin || 1)) * PW;
  const y = (r) => Y0 + PH - ((r - rLo) / (rHi - rLo || 1)) * PH;
  const frontPath = `M${data.front.map((o) => `${x(o.price).toFixed(1)} ${y(o.risk).toFixed(1)}`).join(" L")}`;
  const ticks = [...new Set([rLo, Math.round((rLo + rHi) / 2), rHi, ...[30, 55].filter((t) => t > rLo && t < rHi)])].sort((a, b) => a - b);

  // Entrance: dots spring up in price order. Reverted on cleanup, so React's dev double-mount
  // replays it instead of leaving the dots at scale 0.
  useEffect(() => {
    const el = plot.current;
    if (!el || reduced()) return;
    const a = animate(el.querySelectorAll(".vp-dot"), { scale: [0, 1], delay: stagger(14), ease: spring({ bounce: 0.5, duration: 600 }) });
    return () => a.revert();
  }, []);
  // On every change: the frontier draws itself and the picks pop in.
  useEffect(() => {
    const el = plot.current;
    if (!el || reduced()) return;
    const a = animate(svg.createDrawable(el.querySelector(".vp-front")), { draw: ["0 0", "0 1"], duration: 1100, delay: 450, ease: "inOutQuad" });
    const b = animate(el.querySelectorAll(".vp-pick"), { scale: [0.3, 1], opacity: [0, 1], delay: stagger(120, { start: 1300 }), ease: spring({ bounce: 0.55, duration: 600 }) });
    return () => { a.revert(); b.revert(); };
  }, [data]);

  const P = [
    { key: "bestValue", icon: Trophy, title: "Best value", why: "The corner of the frontier: past it, more money buys little less risk." },
    { key: "lowestRisk", icon: ShieldCheck, title: "Lowest risk", why: "The least likely to be remade, whatever it costs." },
    { key: "cheapestOk", icon: Wallet, title: "Cheapest that isn't high risk", why: "The lowest price that keeps the risk out of the red." },
  ];
  const extra = data.lowestRisk.price - data.bestValue.price, saved = data.bestValue.risk - data.lowestRisk.risk;

  return (
    <div className="stack-lg" ref={root}>
      <PageHead kicker="Best value · Pareto frontier" title="The most glasses for your money"
        sub={`Every frame and lens combination for your ${fmt(s.rx.od.sph)} / ${fmt(s.rx.os.sph)} prescription, priced and risk-scored by the same engine. The line joins the choices that nothing beats on both price and risk.`}
        right={<label className="row small" style={{ gap: 8 }}><Toggle on={pdKnown} onChange={setPdKnown} label="PD known" />I know my PD</label>} />
      <Card title={`${data.opts.length} combinations · ${data.front.length} on the frontier`} right={<Hud tone="cyan">lower and further left is better</Hud>} data-reveal>
        <div className="vp-wrap">
          <svg ref={plot} viewBox={`0 0 ${W} ${H}`} className="lab-svg" role="img" aria-label="Price against remake risk for every frame and lens">
            {ticks.map((r) => <g key={r}><line x1={X0} x2={X0 + PW} y1={y(r)} y2={y(r)} stroke="var(--line)" strokeDasharray={r === 30 || r === 55 ? "4 4" : ""} /><text x={X0 - 8} y={y(r) + 4} textAnchor="end" className="lab-cap">{r}</text></g>)}
            {55 > rLo && 55 < rHi && <text x={X0 + PW} y={y(55) - 6} textAnchor="end" className="lab-cap" fill="var(--rose)">high risk above</text>}
            {30 > rLo && 30 < rHi && <text x={X0 + PW} y={y(30) - 6} textAnchor="end" className="lab-cap">some risk above</text>}
            {[pMin, (pMin + pMax) / 2, pMax].map((p) => <text key={p} x={x(p)} y={H - 18} textAnchor="middle" className="lab-cap">${Math.round(p)}</text>)}
            <text x={X0 + PW / 2} y={H - 2} textAnchor="middle" className="lab-cap">frame + lens price</text>
            <text x="12" y={Y0 + PH / 2} transform={`rotate(-90 12 ${Y0 + PH / 2})`} textAnchor="middle" className="lab-cap">remake risk</text>
            {data.opts.map((o, i) => (
              <circle key={`${o.frame.id}-${o.index.n}`} className="vp-dot" cx={x(o.price)} cy={y(o.risk)} r={data.front.includes(o) ? 6 : 4.2}
                fill={TONE[o.level]} opacity={data.front.includes(o) ? 1 : 0.42} style={{ transformBox: "fill-box", transformOrigin: "center" }}
                onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />
            ))}
            <path className="vp-front" d={frontPath} fill="none" stroke="var(--cyan)" strokeWidth="2.5" />
            {[...new Set(P.map((p) => data[p.key]))].map((o) => {
              const label = P.filter((p) => data[p.key] === o).map((p) => p.title.replace(" that isn't high risk", " OK")).join(" · ");
              const right = x(o.price) > X0 + PW * 0.6;
              return <g key={`${o.frame.id}-${o.index.n}`} className="vp-pick" style={{ transformBox: "fill-box", transformOrigin: "center" }}><circle cx={x(o.price)} cy={y(o.risk)} r="11" fill="none" stroke="#fff" strokeWidth="2" /><text x={x(o.price) + (right ? -14 : 14)} y={y(o.risk) - 14} textAnchor={right ? "end" : "start"} className="lab-cap" fill="var(--text)">{label}</text></g>;
            })}
          </svg>
          {hover != null && (() => { const o = data.opts[hover]; return <div className="vp-tip" style={{ left: `${(x(o.price) / W) * 100}%`, top: `${(y(o.risk) / H) * 100}%` }}><b>{o.frame.name}</b> + {o.index.label}<br />${o.price} · risk {o.risk}</div>; })()}
        </div>
        <p className="small text-2" style={{ marginTop: 8 }}>{extra > 0 ? <>Going from the best-value pick to the lowest-risk one costs <b>${extra}</b> more and lowers the risk by only <b>{saved}</b> point{saved === 1 ? "" : "s"}.</> : <>The best-value pick is also the lowest-risk one for your prescription.</>} {!pdKnown && "Knowing your PD lowers every option's risk: try the switch."}</p>
      </Card>
      <div className="grid g3">
        {P.map((p) => { const o = data[p.key]; return (
          <Card key={p.key} className={`vp-card ${p.key === "bestValue" ? "glow" : ""}`} data-reveal>
            <div className="row between"><span className="row" style={{ gap: 8 }}><span className="step-ic"><p.icon size={16} /></span><b>{p.title}</b></span><Badge tone={o.level === "low" ? "green" : o.level === "medium" ? "amber" : "rose"}>risk {o.risk}</Badge></div>
            <FrameArt frame={o.frame} height={44} />
            <div className="row between"><span>{o.frame.name} + {o.index.label}</span><b className="display-sm" style={{ fontSize: 24 }}>${o.price}</b></div>
            <span className="tiny muted">{p.why}</span>
            <a className="btn sm" href={`#/check/${o.frame.id}?index=${o.index.n}`}>Check this pair<ArrowRight size={14} /></a>
          </Card>
        ); })}
      </div>
    </div>
  );
}

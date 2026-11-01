import { useMemo, useRef, useState } from "react";
import { Store, Download, Bot, Grid3x3 } from "lucide-react";
import { Card, PageHead, Hud, Seg, Stat } from "../ui";
import { useReveal } from "../lib/anim";
import { FRAMES } from "../engine/frames";
import { lensPair } from "../engine/fit";
import { INDICES, EDGE_TARGET, CENTRE_TARGET } from "../engine/optics";
import FrameArt from "../components/FrameArt";

const RX = Array.from({ length: 17 }, (_, i) => -10 + i); // −10 … +6 D
const PD = { left: 31.5, right: 31.5 };
const band = (t) => (t <= 3 ? "c-good" : t <= 4.5 ? "c-ok" : t <= 6 ? "c-warn" : "c-bad");
const lbl = (d) => (d > 0 ? `+${d}` : d < 0 ? `−${-d}` : "0");

function audit(n) {
  const index = INDICES.find((i) => i.n === n);
  return FRAMES.map((frame) => {
    const cells = RX.map((d) => {
      const rx = { od: { sph: d, cyl: 0, axis: 0 }, os: { sph: d, cyl: 0, axis: 0 } };
      const p = lensPair({ frame, rx, pd: PD, index, weight: false });
      return d <= 0 ? Math.max(p.od.maxEdge, p.os.maxEdge) : Math.max(p.od.centre, p.os.centre);
    });
    const okMinus = RX.filter((d, i) => d <= 0 && cells[i] <= EDGE_TARGET);
    const okPlus = RX.filter((d, i) => d > 0 && cells[i] <= CENTRE_TARGET);
    return { frame, cells, strongestMinus: Math.min(...okMinus, 0), strongestPlus: Math.max(...okPlus, 0) };
  });
}

export default function Retail() {
  const root = useRef(null);
  const [n, setN] = useState(1.67);
  const rows = useMemo(() => audit(n), [n]);
  useReveal(root, []);
  const at = (d) => rows.filter((r) => r.cells[RX.indexOf(d)] <= EDGE_TARGET).length;
  const feed = rows.map((r) => ({
    id: r.frame.id, name: r.frame.name, shape: r.frame.shape, lensWidthMm: r.frame.A, bridgeMm: r.frame.DBL, lensHeightMm: r.frame.B, priceUsd: r.frame.priceUsd,
    rxSuitability: { lensIndex: n, maxEdgeTargetMm: EDGE_TARGET, strongestMinusD: r.strongestMinus, strongestPlusD: r.strongestPlus },
  }));
  const download = () => {
    const blob = new Blob([JSON.stringify({ schema: "refract.rx-suitability/v1", generatedAt: new Date().toISOString(), assumptions: { pdMm: 63, pupilAboveBoxCentreMm: 2 }, frames: feed }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "rx-suitability-feed.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="stack-lg" ref={root}>
      <PageHead kicker="For retailers" title="Catalogue Rx audit" sub="Which of your frames still look good with strong prescriptions, computed from frame dimensions alone. No photos needed." right={<Seg options={INDICES.filter((i) => i.n >= 1.6).map((i) => ({ value: i.n, label: i.n.toFixed(2) }))} value={n} onChange={setN} />} />
      <div className="grid g4 keep-2" data-reveal>
        <Card className="tight"><Stat value={`${at(-2)}/12`} label="Frames under 4.5 mm at −2 D" tone="green" /></Card>
        <Card className="tight"><Stat value={`${at(-4)}/12`} label="… at −4 D" tone="cyan" /></Card>
        <Card className="tight"><Stat value={`${at(-6)}/12`} label="… at −6 D" tone="amber" /></Card>
        <Card className="tight"><Stat value={`${at(-8)}/12`} label="… at −8 D" tone="rose" /></Card>
      </div>
      <Card title={`Thickest edge (minus) or centre (plus), mm · ${INDICES.find((i) => i.n === n).label}`} icon={Grid3x3} right={<Hud>PD 63 mm</Hud>} data-reveal tour="retail-matrix">
        <div className="matrix-wrap">
          <table className="matrix">
            <thead><tr><th>Frame</th>{RX.map((d) => <th key={d}>{lbl(d)}</th>)}</tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.frame.id}>
                  <th><span className="row" style={{ gap: 8 }}><span style={{ width: 54 }}><FrameArt frame={r.frame} height={18} /></span>{r.frame.name} <span className="tiny muted">{r.frame.A}</span></span></th>
                  {r.cells.map((t, i) => <td key={i} className={band(t)}>{t.toFixed(1)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="row wrap tiny muted" style={{ gap: 14, marginTop: 10 }}>
          <span><i className="lg c-good" /> ≤ 3 mm</span><span><i className="lg c-ok" /> ≤ 4.5 mm</span><span><i className="lg c-warn" /> ≤ 6 mm</span><span><i className="lg c-bad" /> &gt; 6 mm</span>
        </div>
      </Card>
      <div className="grid g-12">
        <Card className="span-7" title="Rx-suitability feed for AI shopping agents" icon={Bot} data-reveal>
          <p className="small text-2">Shopping is moving into conversations with AI assistants, and they can only recommend what they can reason about. This feed tells any agent the strongest prescription each frame handles well, so it can stop recommending 58 mm aviators to −8 shoppers.</p>
          <pre className="json feed-preview">{JSON.stringify(feed.slice(0, 2), null, 2)}</pre>
          <button className="btn block" onClick={download}><Download size={16} />Download full feed (JSON)</button>
        </Card>
        <Card className="span-5" title="What this changes" icon={Store} data-reveal>
          <ul className="small text-2 how">
            <li>Merchandising: see at a glance which frames to badge "great for strong prescriptions".</li>
            <li>Fewer surprises: high-prescription shoppers see real edge thickness before they buy, not after.</li>
            <li>Honest upsell: recommend 1.74 only where it actually changes the result.</li>
            <li>Embed the Studio on product pages so every try-on uses the shopper's own Rx.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

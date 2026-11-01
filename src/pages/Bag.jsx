import { Fragment, useState } from "react";
import { ShoppingBag, Trash2, Download, CheckCircle2, Glasses, Sparkles, ShieldCheck } from "lucide-react";
import { Card, PageHead, Hud, Badge, Toggle, toast } from "../ui";
import { useStore, setStore } from "../state/store";

const INR = 84;
const COATINGS = [
  { id: "ar", label: "Anti-reflective coating", priceUsd: 0, note: "Included: keeps your eyes visible in photos and video calls", fixed: true },
  { id: "blue", label: "Blue-light filter", priceUsd: 20 },
  { id: "photo", label: "Light-reactive (photochromic)", priceUsd: 60 },
];
const money = (usd) => <><b>${usd.toFixed(0)}</b> <span className="tiny muted">₹{Math.round(usd * INR).toLocaleString("en-IN")}</span></>;
const fmt = (v, d = 2) => (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toFixed(d);

export default function Bag() {
  const s = useStore();
  const [coat, setCoat] = useState({ ar: true, blue: false, photo: false });
  const [placed, setPlaced] = useState(false);
  const frame = s.bag.find((b) => b.kind === "frame");
  const makeup = s.bag.filter((b) => b.kind === "makeup");
  const coatUsd = COATINGS.filter((c) => coat[c.id]).reduce((a, c) => a + c.priceUsd, 0);
  const total = (frame ? frame.priceUsd + frame.lens.priceUsd + coatUsd : 0) + makeup.reduce((a, p) => a + p.priceUsd, 0);
  const remove = (pred) => setStore((x) => ({ bag: x.bag.filter((b) => !pred(b)) }));

  const sheet = () => ({
    store: "Refract demo store",
    createdAt: new Date().toISOString(),
    frame: frame && { id: frame.id, name: frame.name, priceUsd: frame.priceUsd },
    lenses: frame && { index: frame.lens.n, label: frame.lens.label, coatings: COATINGS.filter((c) => coat[c.id]).map((c) => c.label), predictedMaxEdgeMm: +frame.lens.maxEdge.toFixed(1), predictedWeightG: +frame.lens.weightG.toFixed(1) },
    prescription: frame?.rx,
    pd: frame?.pd && { binocularMm: +frame.pd.far.toFixed(1), rightMm: +frame.pd.right.toFixed(1), leftMm: +frame.pd.left.toFixed(1), method: "iris-scaled photo measurement, convergence-corrected", toleranceMm: +frame.pd.plusMinus.toFixed(1) },
    makeup: makeup.map((p) => ({ id: p.id, name: p.name, shade: p.shade, hex: p.hex, priceUsd: p.priceUsd })),
    totalUsd: total,
    note: "Prescription and PD to be confirmed by a licensed optician before lenses are made.",
  });
  const download = () => {
    const blob = new Blob([JSON.stringify(sheet(), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "refract-order-sheet.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (!frame && !makeup.length)
    return (
      <div className="stack-lg">
        <PageHead kicker="Bag" title="Your bag is empty" sub="Try frames on through your own lenses, then add the frame, lens index and eye look you like." />
        <Card className="pad-lg"><div className="empty"><ShoppingBag size={34} /><p className="small muted">Nothing here yet.</p><a className="btn primary" href="#/studio">Open the Studio</a></div></Card>
      </div>
    );

  return (
    <div className="stack-lg">
      <PageHead kicker="Bag" title="Order sheet" sub="Everything a lab needs, plus the look that goes with it. You confirm; nothing is charged in this demo." />
      <div className="grid g-12">
        <div className="span-7 stack">
          {frame && (
            <Card title="Frame and lenses" icon={Glasses} right={<button className="btn sm ghost" onClick={() => remove((b) => b.kind === "frame")} aria-label="Remove frame"><Trash2 size={15} /></button>}>
              <div className="list">
                <div className="li"><span className="grow"><span className="t">{frame.name}</span><span className="s">Frame</span></span>{money(frame.priceUsd)}</div>
                <div className="li"><span className="grow"><span className="t">{frame.lens.label} lenses</span><span className="s">Predicted thickest edge {frame.lens.maxEdge.toFixed(1)} mm · {frame.lens.weightG.toFixed(1)} g for both</span></span>{money(frame.lens.priceUsd)}</div>
                {COATINGS.map((c) => (
                  <div className="li" key={c.id}>
                    <span className="grow"><span className="t">{c.label}</span><span className="s">{c.note || (c.priceUsd ? `+$${c.priceUsd}` : "")}</span></span>
                    <Toggle on={coat[c.id]} disabled={c.fixed} onChange={(v) => setCoat((x) => ({ ...x, [c.id]: v }))} label={c.label} />
                  </div>
                ))}
              </div>
              <div className="divider" />
              <Hud>Prescription & PD</Hud>
              <div className="rx-table">
                <span />{["SPH", "CYL", "AXIS"].map((h) => <b key={h} className="tiny muted mono">{h}</b>)}
                {[["OD right", frame.rx.od], ["OS left", frame.rx.os]].map(([l, e]) => (
                  <Fragment key={l}>
                    <span className="small">{l}</span>
                    <span className="num">{fmt(e.sph)}</span><span className="num">{fmt(e.cyl)}</span><span className="num">{e.axis}°</span>
                  </Fragment>
                ))}
              </div>
              {frame.pd && <p className="small text-2" style={{ marginTop: 8 }}>PD {frame.pd.far.toFixed(1)} mm (right {frame.pd.right.toFixed(1)}, left {frame.pd.left.toFixed(1)}) ± {frame.pd.plusMinus.toFixed(1)} mm, measured from your photo.</p>}
            </Card>
          )}
          {makeup.length > 0 && (
            <Card title="Eye look" icon={Sparkles} right={<button className="btn sm ghost" onClick={() => remove((b) => b.kind === "makeup")} aria-label="Remove look"><Trash2 size={15} /></button>}>
              <div className="list">
                {makeup.map((p) => (
                  <div className="li" key={p.id}><i className="swatch" style={{ background: p.hex, width: 22, height: 22 }} /><span className="grow"><span className="t">{p.name}</span><span className="s">{p.shade}</span></span>{money(p.priceUsd)}</div>
                ))}
              </div>
            </Card>
          )}
        </div>
        <div className="span-5 stack">
          <Card className="glow">
            <div className="row between"><span className="muted">Total</span><span className="display-sm">${total.toFixed(0)} <small>₹{Math.round(total * INR).toLocaleString("en-IN")}</small></span></div>
            <div className="stack-sm" style={{ marginTop: 14 }}>
              {placed ? (
                <div className="callout row"><CheckCircle2 size={18} color="var(--green)" /><span className="small">Order sheet confirmed. In a live store this goes to the lab after your optician checks it.</span></div>
              ) : (
                <button className="btn primary lg block" onClick={() => { setPlaced(true); toast("Demo store: order confirmed, no payment taken.", "ok"); }}>Confirm order</button>
              )}
              <button className="btn block" onClick={download}><Download size={16} />Download lab-ready order sheet</button>
            </div>
          </Card>
          <Card title="No surprises when it arrives" icon={ShieldCheck}>
            <ul className="small text-2 how">
              <li>You saw these frames with your real lens power, edge thickness and eye-size change.</li>
              <li>The lens index was chosen for your Rx and this frame, and we told you when a thinner one wasn't worth it.</li>
              <li>A licensed optician confirms your prescription and PD before anything is made.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

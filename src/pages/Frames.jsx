import { useMemo, useRef, useState } from "react";
import { Glasses, Info, Sparkles } from "lucide-react";
import { Card, PageHead, Hud, Badge, Sheet, Drivers } from "../ui";
import { MiniRing } from "../ui/charts";
import { useStore } from "../state/store";
import { useReveal } from "../lib/anim";
import { rankFrames } from "../engine/fit";
import { spherEq } from "../engine/optics";
import FrameArt from "../components/FrameArt";

const SHAPES = [
  { value: "all", label: "All" },
  { value: "round", label: "Round & oval", match: ["round", "oval", "panto"] },
  { value: "rect", label: "Rectangle & square", match: ["rect", "square", "browline", "geo"] },
  { value: "statement", label: "Cat-eye & statement", match: ["cat", "butterfly", "aviator"] },
];
const fmtD = (v) => (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toFixed(2);

export default function Frames() {
  const s = useStore();
  const root = useRef(null);
  const [shape, setShape] = useState("all");
  const [open, setOpen] = useState(null);
  const pd = s.measure ? { left: s.measure.pd.left, right: s.measure.pd.right } : { left: 31.5, right: 31.5 };
  const ranked = useMemo(
    () => rankFrames({ rx: s.rx, pd, faceWidthMm: s.measure?.faceWidthMm, faceShape: s.faceAttr?.faceShape }),
    [JSON.stringify(s.rx), pd.left, pd.right, s.measure?.faceWidthMm, s.faceAttr?.faceShape], // eslint-disable-line react-hooks/exhaustive-deps
  );
  useReveal(root, [shape]);
  const se = [spherEq(s.rx.od), spherEq(s.rx.os)].reduce((a, b) => (Math.abs(b) > Math.abs(a) ? b : a));
  const list = ranked.filter(({ frame }) => shape === "all" || SHAPES.find((x) => x.value === shape).match.includes(frame.shape));
  const thickest = ranked.reduce((a, b) => (b.fit.thick > a.fit.thick ? b : a));
  const thinnest = ranked.reduce((a, b) => (b.fit.thick < a.fit.thick ? b : a));
  const sel = open && ranked.find((r) => r.frame.id === open);

  return (
    <div className="stack-lg" ref={root}>
      <PageHead kicker="Frames" title="Ranked for your prescription" sub="Ranked by how they'll look with your actual lenses, not by how they look in a lensless photo." right={<a className="chip" href="#/rx">Rx {fmtD(s.rx.od.sph)} / {fmtD(s.rx.os.sph)} · change</a>} />
      {Math.abs(se) >= 1 && (
        <div className="callout row-top" data-reveal>
          <Info size={18} style={{ flex: "none", marginTop: 2 }} />
          <span className="small">At {fmtD(se)} D, the <b>{thickest.frame.name}</b> ({thickest.frame.A} mm lens) would show a <b>{thickest.fit.thick.toFixed(1)} mm</b> {thickest.fit.minus ? "edge" : "centre"} even in the recommended lens, while the <b>{thinnest.frame.name}</b> keeps it to <b>{thinnest.fit.thick.toFixed(1)} mm</b>. A lensless try-on can't show you that.{!s.measure && " Scan your face to personalise PD and width."}</span>
        </div>
      )}
      <div className="row wrap" style={{ gap: 8 }} data-reveal>
        {SHAPES.map((x) => <button key={x.value} className={`chip ${shape === x.value ? "on" : ""}`} onClick={() => setShape(x.value)}>{x.label}</button>)}
      </div>
      <div className="grid g3">
        {list.map(({ frame, fit }) => (
          <Card key={frame.id} className="interactive frame-card" data-reveal>
            <div className="row between">
              <Hud>#{ranked.findIndex((r) => r.frame.id === frame.id) + 1} for you</Hud>
              <MiniRing value={fit.score / 100} size={46} label={fit.score} color={fit.score >= 75 ? "var(--green)" : fit.score >= 55 ? "var(--amber)" : "var(--rose)"} />
            </div>
            <div className="frame-art"><FrameArt frame={frame} height={70} /></div>
            <div className="row between"><b className="display-sm" style={{ fontSize: 22 }}>{frame.name}</b><span className="num">${frame.priceUsd}</span></div>
            <div className="small muted">{frame.colorway.name} · {frame.A}□{frame.DBL} · {frame.material}</div>
            <div className="frame-facts">
              <span><b>{fit.thick.toFixed(1)} mm</b><i>{fit.minus ? "edge" : "centre"}</i></span>
              <span><b>{(fit.lens.od.weightG + fit.lens.os.weightG).toFixed(0)} g</b><i>lenses</i></span>
              <span><b>{fit.lens.best.n.toFixed(2)}</b><i>index</i></span>
            </div>
            <div className="row" style={{ gap: 8 }}>
              <a className="btn primary sm grow" href={`#/studio/${frame.id}`}><Sparkles size={15} />Try on</a>
              <button className="btn sm ghost" onClick={() => setOpen(frame.id)}>Why #{ranked.findIndex((r) => r.frame.id === frame.id) + 1}?</button>
            </div>
          </Card>
        ))}
      </div>
      <Sheet open={!!sel} onClose={() => setOpen(null)} title={sel ? `${sel.frame.name}: why this score` : ""}>
        {sel && (
          <div className="stack">
            <FrameArt frame={sel.frame} height={80} />
            <div className="row between"><span className="small muted">Rx-Fit score</span><Badge tone={sel.fit.score >= 75 ? "green" : sel.fit.score >= 55 ? "amber" : "rose"}>{sel.fit.score}/100</Badge></div>
            <Drivers drivers={sel.fit.drivers} max={0.5} />
            <div className="divider" />
            <Hud>Lens options for this frame</Hud>
            <div className="list">
              {sel.fit.lens.table.map((row) => (
                <div className="li" key={row.index.n}>
                  <span className="grow"><span className="t">{row.index.label}</span><span className="s">{(sel.fit.minus ? row.profile.maxEdge : row.profile.centre).toFixed(1)} mm · {(row.profile.weightG * 2).toFixed(0)} g · Abbe {row.index.abbe}</span></span>
                  <Badge tone={row.verdict === "best" ? "green" : row.verdict === "fits" ? "cyan" : "muted"}>{row.verdict === "best" ? "recommended" : row.verdict === "fits" ? "fits" : "thick"}</Badge>
                </div>
              ))}
            </div>
            <p className="small text-2">{sel.fit.lens.note}</p>
            <a className="btn primary block" href={`#/studio/${sel.frame.id}`}><Glasses size={16} />Try it on with your Rx</a>
          </div>
        )}
      </Sheet>
    </div>
  );
}

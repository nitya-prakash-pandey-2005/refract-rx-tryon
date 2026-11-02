import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, ShoppingBag, MessageCircle, ScanEye, Weight, Ruler, Eye } from "lucide-react";
import { Card, PageHead, Hud, Badge, Seg, Drivers, Toggle, toast } from "../ui";
import { useStore, setStore } from "../state/store";
import { navigate } from "../lib/router";
import { tween } from "../lib/anim";
import { FRAMES, getFrame } from "../engine/frames";
import { rankFrames, lensPair } from "../engine/fit";
import { INDICES, meridianPower } from "../engine/optics";
import { placeFrame } from "../engine/placement";
import { planLook } from "../engine/makeup";
import { prepareSource, drawScene, drawXray } from "../vision/compose";
import { loadImage } from "../vision/image";
import NeedPhoto from "../components/NeedPhoto";
import FrameArt from "../components/FrameArt";
import LensSection from "../components/LensSection";
import { rxKey } from "../lib/pipeline";

const fmtD = (v) => (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toFixed(2);
const usd = (v) => `$${v.toFixed(0)}`;

export default function Studio({ parts }) {
  const s = useStore();
  if (!s.photo || !s.landmarks) return <div className="stack-lg"><PageHead kicker="Studio" title="Prescription-true try-on" /><NeedPhoto to="/studio" /></div>;
  return <StudioInner s={s} frameId={parts[1]} />;
}

function StudioInner({ s, frameId }) {
  const canvas = useRef(null);
  const tRef = useRef(0);
  const anim = useRef(null);
  const [source, setSource] = useState(null);
  const [mode, setMode] = useState("rx");
  const [zoom, setZoom] = useState("face");
  const [xray, setXray] = useState(false);
  const [t, setT] = useState(0);
  const pd = { left: s.measure.pd.left, right: s.measure.pd.right };
  const ranked = useMemo(
    () => rankFrames({ rx: s.rx, pd, faceWidthMm: s.measure.faceWidthMm, faceShape: s.faceAttr?.faceShape }),
    [rxKey(s.rx), pd.left, pd.right, s.measure.faceWidthMm, s.faceAttr?.faceShape], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const frame = getFrame(frameId) || getFrame(s.lastFrame) || ranked[0].frame;
  const fit = ranked.find((r) => r.frame.id === frame.id).fit;
  const [indexN, setIndexN] = useState(fit.lens.best.n);
  useEffect(() => { setIndexN(fit.lens.best.n); setStore({ lastFrame: frame.id }); }, [frame.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const index = INDICES.find((i) => i.n === indexN) || fit.lens.best;
  const lens = useMemo(() => lensPair({ frame, rx: s.rx, pd, index }), [frame.id, index.n, rxKey(s.rx), pd.left, pd.right]); // eslint-disable-line react-hooks/exhaustive-deps
  const place = useMemo(() => placeFrame({ landmarks: s.landmarks, W: s.photo.w, H: s.photo.h, mmPerPx: s.measure.mmPerPx, frame, rx: s.rx }), [frame.id, s.landmarks, rxKey(s.rx)]); // eslint-disable-line react-hooks/exhaustive-deps
  const looks = { bare: s.photo.src, generic: s.looks.generic?.image, rx: s.looks.rx?.image };
  const [look, setLook] = useState(looks.rx ? "rx" : "bare");
  const rxLook = planLook({ rx: s.rx, faceAttr: s.faceAttr || {}, skin: s.skin || {}, skinHex: s.skinHex });

  // Load the base image (bare photo or a YouCam makeup render) into a pixel source.
  useEffect(() => {
    let live = true;
    loadImage(looks[look] || s.photo.src).then((img) => { if (live) setSource(prepareSource(img, s.photo.w, s.photo.h)); });
    return () => { live = false; };
  }, [look, looks[look]]); // eslint-disable-line react-hooks/exhaustive-deps

  const render = () => {
    const c = canvas.current;
    if (!c || !source) return;
    if (c.width !== s.photo.w) { c.width = s.photo.w; c.height = s.photo.h; }
    const ctx = c.getContext("2d", { willReadFrequently: true });
    drawScene(ctx, { source, place, frame, rx: s.rx, t: tRef.current, lens: { od: lens.od, os: lens.os, minus: fit.minus } });
    if (xrayRef.current) drawXray(ctx, place, { lens, rx: s.rx, t: tRef.current });
  };
  const xrayRef = useRef(false);
  xrayRef.current = xray;
  const renderRef = useRef(render);
  renderRef.current = render; // the morph always draws with the latest frame, index and look
  useEffect(render, [source, place, lens, xray]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => anim.current?.pause?.(), []);

  // Showroom (t=0, lensless) ↔ Your Rx (t=1). Plays once on arrival.
  useEffect(() => {
    if (!source) return;
    anim.current?.pause?.();
    const to = mode === "rx" ? 1 : 0;
    const go = () => { anim.current = tween(tRef.current, to, (v) => { tRef.current = v; setT(v); renderRef.current(); }, { duration: 1500 }); };
    const id = setTimeout(go, tRef.current === 0 && to === 1 ? 500 : 0);
    return () => clearTimeout(id);
  }, [mode, source, place]); // eslint-disable-line react-hooks/exhaustive-deps

  const crop = useMemo(() => {
    const L = place.lenses;
    const xs = [...L.od.poly, ...L.os.poly].map((p) => p[0]), ys = [...L.od.poly, ...L.os.poly].map((p) => p[1]);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    const spanW = Math.max(...xs) - Math.min(...xs);
    const w = Math.min(s.photo.w, zoom === "eyes" ? spanW * 1.25 : Math.max(spanW * 1.9, s.measure.faceBox.w * 1.35));
    const h = Math.min(s.photo.h, w * (zoom === "eyes" ? 0.5 : 1.05));
    return { x: Math.max(0, Math.min(s.photo.w - w, cx - w / 2)), y: Math.max(0, Math.min(s.photo.h - h, cy - h * (zoom === "eyes" ? 0.5 : 0.38))), w, h };
  }, [place, zoom, s.photo.w, s.photo.h]); // eslint-disable-line react-hooks/exhaustive-deps

  const eyeChange = ((lens.od.magnification.mean + lens.os.magnification.mean) / 2 - 1) * 100;
  const maxEdge = Math.max(lens.od.maxEdge, lens.os.maxEdge);
  const centre = Math.max(lens.od.centre, lens.os.centre);
  const weight = lens.od.weightG + lens.os.weightG;
  const strongEye = Math.abs(s.rx.od.sph) >= Math.abs(s.rx.os.sph) ? "od" : "os";
  const decOf = (side) => (frame.A + frame.DBL) / 2 - pd[side === "od" ? "right" : "left"];
  const total = frame.priceUsd + index.priceUsd;

  const addToBag = () => {
    setStore((st) => ({ bag: [...st.bag.filter((b) => b.kind !== "frame"), { kind: "frame", id: frame.id, name: `${frame.name} · ${frame.colorway.name}`, priceUsd: frame.priceUsd, lens: { n: index.n, label: index.label, priceUsd: index.priceUsd, maxEdge, weightG: weight }, rx: st.rx, pd: st.measure.pd }] }));
    toast(`${frame.name} with ${index.label} lenses added to your bag.`, "ok");
  };
  const addLook = () => {
    setStore((st) => ({ bag: [...st.bag.filter((b) => b.kind !== "makeup"), ...rxLook.products.map((p) => ({ kind: "makeup", ...p }))] }));
    toast(`${rxLook.name} look products added to your bag.`, "ok");
  };

  return (
    <div className="stack-lg">
      <PageHead kicker="Studio" title={`${frame.name} · through your lenses`} sub="Every other try-on shows frames with no lenses. This is what people will actually see." right={<Badge tone={fit.score >= 75 ? "green" : fit.score >= 55 ? "amber" : "rose"}>Rx-Fit {fit.score}</Badge>} />
      <div className="grid g-12">
        <div className="span-8 stack">
          <Card className="flush" tour="studio-stage">
            <div className="studio-stage" style={{ aspectRatio: `${crop.w} / ${crop.h}` }}>
              <canvas ref={canvas} style={{ width: `${(s.photo.w / crop.w) * 100}%`, left: `${(-crop.x / crop.w) * 100}%`, top: `${(-crop.y / crop.h) * 100}%` }} />
              <div className="stage-hud">
                <span className="mode-pill">{t < 0.5 ? "Showroom · no lenses" : `Your Rx · ${fmtD(s.rx.od.sph)} / ${fmtD(s.rx.os.sph)}`}</span>
                <span className="mode-pill mono">{Math.abs(eyeChange) < 1 ? "no visible lens effect" : `eyes ${(eyeChange * t >= 0 ? "+" : "") + (eyeChange * t).toFixed(1)}%`}</span>
              </div>
            </div>
            <div className="stage-controls">
              <Seg options={[{ value: "showroom", label: "Showroom" }, { value: "rx", label: "Your Rx" }]} value={mode} onChange={setMode} />
              <Seg options={[{ value: "bare", label: "Bare" }, { value: "generic", label: "Generic look" }, { value: "rx", label: "Rx-tuned look" }].filter((o) => looks[o.value])} value={look} onChange={setLook} />
              <Seg options={[{ value: "face", label: "Face" }, { value: "eyes", label: "Eyes" }]} value={zoom} onChange={setZoom} />
              <label className="row small" style={{ gap: 8 }}><Toggle on={xray} onChange={setXray} label="Optics X-ray" />Optics X-ray</label>
              <a className="btn sm ghost" href={`#/live/${frame.id}`}>Go live</a>
            </div>
          </Card>
          <Card title="Frames ranked for your prescription" icon={ScanEye} right={<Hud>tap to try</Hud>} tour="frame-strip">
            <div className="frame-strip">
              {ranked.map(({ frame: f, fit: ff }) => (
                <button key={f.id} className={`frame-chip ${f.id === frame.id ? "on" : ""}`} onClick={() => navigate(`/studio/${f.id}`)}>
                  <FrameArt frame={f} height={34} />
                  <span className="row between"><b>{f.name}</b><span className={`num tiny ${ff.score >= 75 ? "good" : ff.score >= 55 ? "ok" : "bad"}`}>{ff.score}</span></span>
                  <span className="tiny muted">{ff.minus ? "edge" : "centre"} {ff.thick.toFixed(1)} mm</span>
                </button>
              ))}
            </div>
          </Card>
        </div>

        <div className="span-4 stack">
          <Card title="Lens index" icon={Ruler} right={<Hud>{FRAMES.length} frames · 5 indices</Hud>} tour="index-chips">
            <div className="index-grid">
              {fit.lens.table.map((row) => {
                return (
                  <button key={row.index.n} className={`index-chip ${row.index.n === index.n ? "on" : ""}`} onClick={() => setIndexN(row.index.n)}>
                    <b>{row.index.n.toFixed(2)}</b>
                    <span className="tiny">{(fit.minus ? row.profile.maxEdge : row.profile.centre).toFixed(1)} mm</span>
                    <span className="tiny muted">{row.index.priceUsd ? `+$${row.index.priceUsd}` : "incl."}</span>
                    {row.index.n === fit.lens.best.n && <i className="best">best</i>}
                  </button>
                );
              })}
            </div>
            <p className="small text-2" style={{ marginTop: 10 }}>{fit.lens.note}</p>
          </Card>
          <Card title="Lens report" icon={Eye} right={<Hud tone="cyan">{index.label}</Hud>}>
            <div className="grid g2 keep-2">
              <div className="stat"><div className="v">{eyeChange >= 0 ? "+" : ""}{eyeChange.toFixed(1)}<small>%</small></div><div className="l">Eye size to others</div></div>
              <div className="stat"><div className="v">{(fit.minus ? maxEdge : centre).toFixed(1)}<small>mm</small></div><div className="l">{fit.minus ? "Thickest edge" : "Centre thickness"}</div></div>
              <div className="stat"><div className="v">{weight.toFixed(1)}<small>g</small></div><div className="l">Both lenses</div></div>
              <div className="stat"><div className="v">{index.abbe}</div><div className="l">Abbe (higher = less colour fringing)</div></div>
            </div>
            <LensSection power={meridianPower(s.rx[strongEye], 0)} index={index} nasal={frame.A / 2 - decOf(strongEye)} temporal={frame.A / 2 + decOf(strongEye)} height={96} />
          </Card>
          <Card title="Why this score" icon={Weight}>
            <Drivers drivers={fit.drivers} max={0.5} />
          </Card>
          <Card className="glow">
            <div className="row between"><span className="small muted">Frame {usd(frame.priceUsd)} + lenses {usd(index.priceUsd)}</span><b className="display-sm">{usd(total)}</b></div>
            <div className="stack-sm" style={{ marginTop: 12 }}>
              <button className="btn primary block" onClick={addToBag}><ShoppingBag size={17} />Add frame + lenses</button>
              {looks.rx && <button className="btn block" onClick={addLook}><Sparkles size={17} />Add the {rxLook.name} look</button>}
              {!looks.rx && <a className="btn block" href="#/profile"><Sparkles size={17} />Render my Rx-tuned look</a>}
              <a className="btn ghost block" href={`#/agent?frame=${frame.id}`}><MessageCircle size={17} />Ask Refract about this frame</a>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

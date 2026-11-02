import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, CameraOff, Aperture, ScanEye, Sparkles, FlipHorizontal2, Loader2, Cpu } from "lucide-react";
import { Card, PageHead, Hud, Badge, Seg, Toggle, toast } from "../ui";
import { useStore, setStore } from "../state/store";
import { navigate } from "../lib/router";
import { tween } from "../lib/anim";
import { getFrame } from "../engine/frames";
import { rankFrames } from "../engine/fit";
import { measureFace, faceTurned, widestFace } from "../engine/measure";
import { placeFrame, lensUniforms } from "../engine/placement";
import { getLandmarker } from "../vision/landmarker";
import { createWarper } from "../vision/glwarp";
import { smoother } from "../vision/smooth";
import { drawFrame, drawLensGloss, drawXray } from "../vision/compose";
import { acceptPhoto } from "../lib/capture";
import FrameArt from "../components/FrameArt";
import { isEmbed, sendToStore } from "../lib/embed";
import DemoPicker from "../components/DemoPicker";

const fmtD = (v) => (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toFixed(2);
const KEY_POINTS = [468, 473, 127, 356, 168]; // eyes, temples, nose bridge: all glasses need
const inFrame = (f) => KEY_POINTS.every((i) => f[i].x > 0.01 && f[i].x < 0.99 && f[i].y > 0.01 && f[i].y < 0.99);

export default function Live({ parts }) {
  const s = useStore();
  const video = useRef(null), glCanvas = useRef(null), overlay = useRef(null);
  const stream = useRef(null), raf = useRef(0), anim = useRef(null), warperRef = useRef(null);
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [mode, setMode] = useState("rx");
  const [xray, setXray] = useState(false);
  const [mirror, setMirror] = useState(true); // a mirror, like every selfie camera
  const [dims, setDims] = useState({ w: 16, h: 9 });
  const [hud, setHud] = useState({ fps: 0, pd: null, face: false, turned: false });

  const pd = s.measure ? { left: s.measure.pd.left, right: s.measure.pd.right } : { left: 31.5, right: 31.5 };
  const ranked = useMemo(() => rankFrames({ rx: s.rx, pd, faceWidthMm: s.measure?.faceWidthMm, faceShape: s.faceAttr?.faceShape }), [JSON.stringify(s.rx), pd.left, pd.right]); // eslint-disable-line react-hooks/exhaustive-deps
  const frame = getFrame(parts[1]) || getFrame(s.lastFrame) || ranked[0].frame;
  const fit = ranked.find((r) => r.frame.id === frame.id).fit;
  const eyeChange = ((fit.lens.od.magnification.mean + fit.lens.os.magnification.mean) / 2 - 1) * 100;

  // The render loop reads the latest choices from a ref, so the camera never restarts.
  const live = useRef({});
  live.current = { ...live.current, frame, fit, rx: s.rx, xray, mirror };

  const stop = () => {
    cancelAnimationFrame(raf.current);
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    setOn(false);
  };
  useEffect(() => () => { stop(); anim.current?.pause?.(); warperRef.current?.dispose(); }, []);
  useEffect(() => { setStore({ lastFrame: frame.id }); }, [frame.id]);

  useEffect(() => {
    if (!on) return;
    anim.current?.pause?.();
    const id = setTimeout(() => { anim.current = tween(live.current.t ?? 0, mode === "rx" ? 1 : 0, (v) => { live.current.t = v; }, { duration: 1400 }); }, live.current.t ? 0 : 900);
    return () => clearTimeout(id);
  }, [mode, on]);

  async function start() {
    setErr(null);
    setBusy(true);
    try {
      const st = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      stream.current = st;
      const v = video.current;
      v.srcObject = st;
      await v.play();
      warperRef.current ||= createWarper(glCanvas.current); // one GPU context per visit, reused across restarts
      const warper = warperRef.current;
      if (!warper) throw Object.assign(new Error("This browser can't run the GPU lens (WebGL2). Use the photo Studio instead."), { name: "NoWebGL" });
      const lm = await getLandmarker("VIDEO");
      const smooth = smoother(0.55, 300);
      let mm = 0, frames = 0, fpsAt = performance.now(), hudAt = 0;
      live.current.t = 0;
      setDims({ w: v.videoWidth, h: v.videoHeight });
      setOn(true);
      const loop = () => {
        if (!stream.current) return;
        const W = v.videoWidth, H = v.videoHeight, now = performance.now();
        if (W && v.readyState >= 2) {
          const res = lm.detectForVideo(v, now);
          const face = smooth(widestFace(res.faceLandmarks), now);
          const L = live.current;
          const o = overlay.current, ctx = o.getContext("2d");
          if (o.width !== W) { o.width = W; o.height = H; }
          ctx.clearRect(0, 0, W, H);
          let pdNow = null;
          const turned = Boolean(face && inFrame(face) && faceTurned(face));
          if (face && inFrame(face) && !turned) {
            const m = measureFace(face, W, H);
            mm = mm ? mm + 0.15 * (m.mmPerPx - mm) : m.mmPerPx;
            pdNow = m.pd.far;
            const place = placeFrame({ landmarks: face, W, H, mmPerPx: mm, frame: L.frame, rx: L.rx });
            const t = L.t ?? 0;
            warper.render(v, W, H, lensUniforms(place, L.rx, t), { od: place.lenses.od.poly, os: place.lenses.os.poly });
            const edge = Math.max(L.fit.lens.od.maxEdge, L.fit.lens.os.maxEdge);
            drawLensGloss(ctx, place, { edgeMm: edge, minus: L.fit.minus, t });
            drawFrame(ctx, place, L.frame);
            if (L.xray) drawXray(ctx, place, { lens: L.fit.lens, rx: L.rx, t, mirrored: L.mirror });
          } else {
            warper.render(v, W, H, null, null);
          }
          frames++;
          if (now - hudAt > 300) {
            const fps = Math.round((frames * 1000) / (now - fpsAt));
            frames = 0; fpsAt = now; hudAt = now;
            setHud({ fps, pd: pdNow, face: Boolean(pdNow), turned });
          }
        }
        raf.current = requestAnimationFrame(loop);
      };
      raf.current = requestAnimationFrame(loop);
    } catch (e) {
      stop();
      setErr(e.name === "NotAllowedError" ? "Camera permission was blocked. Allow it in the address bar, or use a photo." : e.message || "Couldn't start the camera.");
    } finally {
      setBusy(false);
    }
  }

  function addToCart() {
    const lens = { n: fit.lens.best.n, label: fit.lens.best.label, priceUsd: fit.lens.best.priceUsd, maxEdge: Math.max(fit.lens.od.maxEdge, fit.lens.os.maxEdge), weightG: fit.lens.od.weightG + fit.lens.os.weightG };
    if (sendToStore({ id: frame.id, name: frame.name, priceUsd: frame.priceUsd, lens })) return toast(`${frame.name} sent to the store cart.`, "ok");
    setStore((st) => ({ bag: [...st.bag.filter((b) => b.kind !== "frame"), { kind: "frame", id: frame.id, name: `${frame.name} · ${frame.colorway.name}`, priceUsd: frame.priceUsd, lens, rx: st.rx, pd: st.measure?.pd }] }));
    toast(`${frame.name} with ${lens.label} lenses added to your bag.`, "ok");
  }

  // Keep the camera running until the snapshot is accepted, so a bad frame costs nothing.
  async function snapshot() {
    const v = video.current;
    const c = document.createElement("canvas");
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext("2d").drawImage(v, 0, 0);
    try {
      await acceptPhoto(c, "camera");
      stop();
      toast("Snapshot taken. Fine-tune it in the Studio.", "ok");
      navigate(`/studio/${frame.id}`);
    } catch (e) {
      toast(e.message, "warn");
    }
  }

  return (
    <div className="stack-lg">
      <PageHead kicker="Live Rx Mirror" title="See yourself through your real lenses, live" sub="Your camera, re-rendered on the GPU through your exact prescription, every frame." right={<Badge tone="violet"><Cpu size={13} /> WebGL lens shader</Badge>} />
      <div className="grid g-12">
        <div className="span-8 stack">
          <Card className="flush" tour="live-stage">
            <div className={`live-stage ${on ? "on" : ""} ${mirror ? "mirror" : ""}`} style={{ aspectRatio: `${dims.w} / ${dims.h}`, "--ratio": dims.w / dims.h }}>
              <video ref={video} playsInline muted />
              <canvas ref={glCanvas} className="gl" />
              <canvas ref={overlay} className="ov" />
              {!on && (
                <div className="scan-idle">
                  <Aperture size={36} />
                  <p>Your prescription, frames and lens thickness, rendered live on your face. Video stays on this device.</p>
                  <button className="btn primary lg" onClick={start} disabled={busy}>{busy ? <Loader2 size={18} className="spin" /> : <Camera size={18} />}Start Live Mirror</button>
                  {err && <p className="small" style={{ color: "var(--amber)" }}>{err}</p>}
                </div>
              )}
              {on && (
                <div className="stage-hud">
                  <span className="mode-pill mono"><span className="pulse-dot" />{hud.fps} fps · {mode === "rx" ? `Rx ${fmtD(s.rx.od.sph)} / ${fmtD(s.rx.os.sph)}` : "showroom"}</span>
                  <span className="mode-pill mono">{hud.face ? `eyes ${eyeChange >= 0 ? "+" : ""}${eyeChange.toFixed(1)}% · ${fit.minus ? "edge" : "centre"} ${fit.thick.toFixed(1)} mm` : hud.turned ? "face the camera straight on" : "looking for your face…"}</span>
                </div>
              )}
              {on && hud.pd && <span className="live-pd mono">PD {hud.pd.toFixed(1)} mm · live</span>}
            </div>
            <div className="stage-controls">
              <Seg options={[{ value: "showroom", label: "Showroom" }, { value: "rx", label: "Your Rx" }]} value={mode} onChange={setMode} />
              <label className="row small" style={{ gap: 8 }}><Toggle on={xray} onChange={setXray} label="Optics X-ray" />Optics X-ray</label>
              <button className={`btn sm ${mirror ? "" : "ghost"}`} onClick={() => setMirror((m) => !m)}><FlipHorizontal2 size={15} />{mirror ? "Show as others see you" : "Back to mirror view"}</button>
              {on ? <span className="row" style={{ gap: 8 }}>
                <button className="btn sm primary" onClick={snapshot} disabled={!hud.face}><Sparkles size={15} />Snapshot to Studio</button>
                <button className="btn sm ghost" onClick={stop} aria-label="Stop camera"><CameraOff size={15} /></button>
              </span> : null}
            </div>
          </Card>
          <Card title="Frames ranked for your prescription" icon={ScanEye} right={<Hud>switch live</Hud>}>
            <div className="frame-strip">
              {ranked.map(({ frame: f, fit: ff }) => (
                <button key={f.id} className={`frame-chip ${f.id === frame.id ? "on" : ""}`} onClick={() => navigate(`/live/${f.id}`)}>
                  <FrameArt frame={f} height={34} />
                  <span className="row between"><b>{f.name}</b><span className={`num tiny ${ff.score >= 75 ? "good" : ff.score >= 55 ? "ok" : "bad"}`}>{ff.score}</span></span>
                  <span className="tiny muted">{ff.minus ? "edge" : "centre"} {ff.thick.toFixed(1)} mm</span>
                </button>
              ))}
            </div>
          </Card>
        </div>
        <div className="span-4 stack">
          <Card title={`${frame.name} · ${fit.lens.best.label}`} right={<Badge tone={fit.score >= 75 ? "green" : fit.score >= 55 ? "amber" : "rose"}>Rx-Fit {fit.score}</Badge>}>
            <div className="grid g2 keep-2">
              <div className="stat"><div className="v">{eyeChange >= 0 ? "+" : ""}{eyeChange.toFixed(1)}<small>%</small></div><div className="l">Eye size to others</div></div>
              <div className="stat"><div className="v">{fit.thick.toFixed(1)}<small>mm</small></div><div className="l">{fit.minus ? "Thickest edge" : "Centre"}</div></div>
              <div className="stat"><div className="v">{(fit.lens.od.weightG + fit.lens.os.weightG).toFixed(1)}<small>g</small></div><div className="l">Lens weight</div></div>
              <div className="stat"><div className="v">${frame.priceUsd + fit.lens.best.priceUsd}</div><div className="l">Frame + lenses</div></div>
            </div>
            <p className="small text-2" style={{ marginTop: 10 }}>{fit.lens.note}</p>
            <div className="stack-sm" style={{ marginTop: 6 }}>
              <button className="btn primary block" onClick={addToCart}>{isEmbed() ? "Add to store cart" : "Add frame + lenses to bag"}</button>
              <a className="btn block ghost" href="#/rx">Change prescription</a>
            </div>
          </Card>
          <Card title="What you're seeing" right={<Hud tone="cyan">physics</Hud>}>
            <ul className="small text-2 how">
              <li>Every pixel inside the lens is re-sampled on the GPU from where its light really comes from, using your sphere, cylinder and axis.</li>
              <li>Minus lenses pull in more at the edges: that's the "cut-in" of your face behind strong lenses.</li>
              <li>Optics X-ray shows a 2.5 mm grid on your face bent by the lens, and the rim coloured by edge thickness.</li>
            </ul>
          </Card>
          {!on && err && <Card title="Try a sample profile instead"><DemoPicker compact to="/studio" /></Card>}
          {!s.measure && <p className="tiny muted">Tip: scan once so ranking uses your measured PD and face width.</p>}
        </div>
      </div>
    </div>
  );
}


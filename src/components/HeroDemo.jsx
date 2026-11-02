// Home hero: the real optics engine running on a sample portrait in a loop —
// showroom → your −9 Rx in big frames → Optics X-ray → the thin frame Refract ranks first.
import { useEffect, useRef, useState } from "react";
import { getFrame } from "../engine/frames";
import { lensPair, rankFrames } from "../engine/fit";
import { measureFace } from "../engine/measure";
import { placeFrame } from "../engine/placement";
import { prepareSource, drawScene, drawXray } from "../vision/compose";
import { loadImage } from "../vision/image";
import { tween, reduced } from "../lib/anim";

const RX = { od: { sph: -9, cyl: -1, axis: 10 }, os: { sph: -8.75, cyl: -0.75, axis: 170 } };
const fmt = (v) => `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(1)}`;

export default function HeroDemo() {
  const canvas = useRef(null);
  const [cap, setCap] = useState({ k: "Loading the optics engine…", v: "" });
  const [crop, setCrop] = useState(null);

  useEffect(() => {
    let alive = true, timer = 0, anim = null;
    (async () => {
      const [img, data] = await Promise.all([loadImage("/demo/lena.jpg"), fetch("/demo/lena.landmarks.json").then((r) => r.json())]);
      if (!alive) return;
      const { w, h } = data;
      const landmarks = data.landmarks.map(([x, y]) => ({ x, y, z: 0 }));
      const m = measureFace(landmarks, w, h);
      const pd = { left: m.pd.left, right: m.pd.right };
      const ranked = rankFrames({ rx: RX, pd, faceWidthMm: m.faceWidthMm, faceShape: "Oval" });
      const best = ranked[0].frame;
      const source = prepareSource(img, w, h);
      const c = canvas.current;
      c.width = w; c.height = h;
      const ctx = c.getContext("2d", { willReadFrequently: true });
      const scene = (frameId) => {
        const frame = getFrame(frameId);
        const fit = ranked.find((r) => r.frame.id === frameId).fit;
        const lens = lensPair({ frame, rx: RX, pd, index: fit.lens.best });
        const place = placeFrame({ landmarks, W: w, H: h, mmPerPx: m.mmPerPx, frame, rx: RX });
        return { frame, fit, lens, place };
      };
      const draw = (S, t, xray) => {
        drawScene(ctx, { source, place: S.place, frame: S.frame, rx: RX, t, lens: { od: S.lens.od, os: S.lens.os, minus: true } });
        if (xray) drawXray(ctx, S.place, { lens: S.lens, rx: RX, t });
      };
      const big = scene("juno"), thin = scene(best.id === "juno" ? "pico" : best.id);
      // Crop to the face, eyes in the upper third.
      const xs = [...big.place.lenses.od.poly, ...big.place.lenses.os.poly].map((p) => p[0]);
      const ys = [...big.place.lenses.od.poly, ...big.place.lenses.os.poly].map((p) => p[1]);
      const cw = Math.min(w, (Math.max(...xs) - Math.min(...xs)) * 1.55), ch = Math.min(h, cw * 0.78);
      const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
      setCrop({ x: Math.max(0, cx - cw / 2), y: Math.max(0, cy - ch * 0.42), w: cw, h: ch, W: w, H: h });

      const eyes = (S) => ((S.lens.od.magnification.mean + S.lens.os.magnification.mean) / 2 - 1) * 100;
      const steps = [
        () => { draw(big, 0, false); setCap({ k: "Showroom try-on", v: `${big.frame.name} · frames only, no lens power` }); return 1600; },
        () => { setCap({ k: `Your ${fmt(RX.od.sph)} D lenses`, v: `eyes ${fmt(eyes(big))}% to others · ${big.fit.thick.toFixed(1)} mm edge` }); anim = tween(0, 1, (t) => draw(big, t, false), { duration: 1500 }); return 2600; },
        () => { draw(big, 1, true); setCap({ k: "Optics X-ray", v: "2.5 mm grid bent by the lens · rim coloured by thickness" }); return 2400; },
        () => { setCap({ k: `${thin.frame.name}: ranked #1 for this Rx`, v: `same lenses · ${thin.fit.thick.toFixed(1)} mm edge · ${thin.fit.lens.best.label}` }); anim = tween(0, 1, (t) => draw(thin, t, false), { duration: 900 }); return 2600; },
      ];
      if (reduced()) { draw(big, 1, false); setCap({ k: `Your ${fmt(RX.od.sph)} D lenses`, v: `eyes ${fmt(eyes(big))}% to others` }); return; }
      let i = 0;
      const next = () => { if (!alive) return; const wait = steps[i % steps.length](); i++; timer = setTimeout(next, wait); };
      next();
    })().catch(() => setCap({ k: "Prescription-true try-on", v: "" }));
    return () => { alive = false; clearTimeout(timer); anim?.pause?.(); };
  }, []);

  return (
    <figure className="hero-demo" aria-label="Live demo of the lens optics on a sample portrait">
      <div className="hero-demo-stage" style={crop ? { aspectRatio: `${crop.w} / ${crop.h}` } : undefined}>
        <canvas ref={canvas} style={crop ? { width: `${(crop.W / crop.w) * 100}%`, left: `${(-crop.x / crop.w) * 100}%`, top: `${(-crop.y / crop.h) * 100}%` } : { opacity: 0 }} />
        <span className="hero-demo-tag mono">LIVE ENGINE · sample portrait</span>
      </div>
      <figcaption key={cap.k}>
        <b>{cap.k}</b>
        <span className="mono tiny">{cap.v}</span>
      </figcaption>
    </figure>
  );
}

import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Upload, Volume2, VolumeX, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { Card, PageHead, Hud, toast } from "../ui";
import { getLandmarker } from "../vision/landmarker";
import { faceLuma, boxOf, loadImage } from "../vision/image";
import { qualityChecks, measureFace } from "../engine/measure";
import { acceptPhoto } from "../lib/capture";
import { speak, stopSpeaking } from "../lib/speech";
import { navigate } from "../lib/router";
import DemoPicker from "../components/DemoPicker";

const HOLD_MS = 1200;
const LABEL = { face: "Face found", size: "Distance", centre: "Centred", pose: "Looking straight", light: "Even light" };

export default function Scan() {
  const video = useRef(null), overlay = useRef(null), raf = useRef(0), stream = useRef(null);
  const okSince = useRef(0), lastSpoken = useRef({ text: "", at: 0 }), lastUi = useRef(0), capturing = useRef(false);
  const [on, setOn] = useState(false);
  const [voice, setVoice] = useState(true);
  const [checks, setChecks] = useState([]);
  const [hold, setHold] = useState(0);
  const [pd, setPd] = useState(null);
  const [busy, setBusy] = useState(false);
  const voiceRef = useRef(voice);
  voiceRef.current = voice;

  const stop = () => {
    cancelAnimationFrame(raf.current);
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    setOn(false);
  };
  useEffect(() => () => { stop(); stopSpeaking(); }, []);

  const say = (text) => {
    if (!voiceRef.current) return;
    const now = performance.now();
    if (text === lastSpoken.current.text && now - lastSpoken.current.at < 6000) return;
    if (now - lastSpoken.current.at < 2200) return;
    lastSpoken.current = { text, at: now };
    speak(text, { lang: "en-IN" });
  };

  async function capture() {
    if (capturing.current) return;
    capturing.current = true;
    const v = video.current;
    const c = document.createElement("canvas");
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext("2d").drawImage(v, 0, 0);
    stop();
    setBusy(true);
    try {
      const m = await acceptPhoto(c, "camera");
      if (voiceRef.current) speak(`Got it. Your P D is about ${Math.round(m.pd.far)} millimetres. You can put your glasses back on.`, { lang: "en-IN" });
      toast("Captured. Now add your prescription.", "ok");
      navigate("/rx");
    } catch (e) {
      toast(e.message, "warn");
      capturing.current = false;
    } finally {
      setBusy(false);
    }
  }

  async function startCamera() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
      stream.current = s;
      const v = video.current;
      v.srcObject = s;
      await v.play();
      setOn(true);
      capturing.current = false;
      okSince.current = 0;
      const lm = await getLandmarker("VIDEO");
      say("Take your glasses off for a few seconds and look at the camera. I'll guide you.");
      const loop = () => {
        if (!stream.current) return;
        const W = v.videoWidth, H = v.videoHeight;
        if (W && v.readyState >= 2) {
          const res = lm.detectForVideo(v, performance.now());
          const face = res.faceLandmarks?.[0] || null;
          const box = face ? boxOf(face, W, H) : null;
          const cs = qualityChecks({ landmarks: face, W, H, luma: face ? faceLuma(v, box) : null });
          const allOk = cs.every((c) => c.ok) && (res.faceLandmarks?.length || 0) === 1;
          const now = performance.now();
          if (allOk) okSince.current ||= now; else okSince.current = 0;
          const held = okSince.current ? Math.min(1, (now - okSince.current) / HOLD_MS) : 0;
          draw(overlay.current, face, W, H, allOk);
          if (now - lastUi.current > 120) {
            lastUi.current = now;
            setChecks(cs);
            setHold(held);
            setPd(face ? measureFace(face, W, H).pd.far : null);
            const bad = cs.find((c) => !c.ok);
            say(bad ? bad.hint : "Perfect. Hold still.");
          }
          if (held >= 1) return capture();
        }
        raf.current = requestAnimationFrame(loop);
      };
      raf.current = requestAnimationFrame(loop);
    } catch (e) {
      toast(e.name === "NotAllowedError" ? "Camera permission was blocked. Allow it, or upload a photo." : "Couldn't start the camera. Try uploading a photo.", "warn");
      stop();
    }
  }

  async function onUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const url = URL.createObjectURL(file);
      await acceptPhoto(await loadImage(url), "upload");
      URL.revokeObjectURL(url);
      toast("Photo measured. Now add your prescription.", "ok");
      navigate("/rx");
    } catch (err) {
      toast(err.message, "warn");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  return (
    <div className="stack-lg">
      <PageHead kicker="Step 1 of 3" title="Scan your face" sub="Take your glasses off for a few seconds. Refract talks you through it, so you don't need to see the screen." />
      <div className="grid g-12">
        <Card className="span-7 flush" tour="scan-stage">
          <div className={`scan-stage ${on ? "live" : ""}`}>
            <video ref={video} playsInline muted />
            <canvas ref={overlay} />
            {!on && (
              <div className="scan-idle">
                <Camera size={34} />
                <p>Your photo stays in this browser. It's only sent to YouCam to run the analysis you ask for.</p>
                <button className="btn primary lg" onClick={startCamera} disabled={busy}>{busy ? <Loader2 size={18} className="spin" /> : <Camera size={18} />}Start camera</button>
              </div>
            )}
            {on && (
              <div className="scan-hud">
                <span className="mode-pill"><span className="pulse-dot" />Live · {pd ? `PD ≈ ${pd.toFixed(1)} mm` : "finding your eyes"}</span>
                <svg className="hold-ring" viewBox="0 0 44 44"><circle cx="22" cy="22" r="19" /><circle cx="22" cy="22" r="19" style={{ strokeDashoffset: 119.4 * (1 - hold) }} /></svg>
              </div>
            )}
          </div>
          <div className="row between wrap" style={{ padding: 14 }}>
            <button className="btn sm ghost" onClick={() => setVoice((v) => !v)} aria-pressed={voice}>{voice ? <Volume2 size={16} /> : <VolumeX size={16} />}Voice guide {voice ? "on" : "off"}</button>
            {on ? <button className="btn sm ghost" onClick={stop}><CameraOff size={16} />Stop</button>
              : <label className="btn sm ghost"><Upload size={16} />Upload a photo<input type="file" accept="image/*" hidden onChange={onUpload} /></label>}
          </div>
        </Card>
        <div className="span-5 stack">
          <Card title="Live checks" right={<Hud>auto-capture</Hud>}>
            <div className="list">
              {["face", "size", "centre", "pose", "light"].map((id) => {
                const c = checks.find((x) => x.id === id);
                return (
                  <div className="li" key={id}>
                    {c?.ok ? <CheckCircle2 size={18} color="var(--green)" /> : <Circle size={18} color={c ? "var(--amber)" : "var(--faint)"} />}
                    <span className="grow"><span className="t">{LABEL[id]}</span><span className="s">{c ? c.hint : "Waiting for camera"}</span></span>
                  </div>
                );
              })}
            </div>
            <p className="small muted" style={{ marginTop: 10 }}>When every check is green for a moment, the photo is taken for you. Your iris (about 11.7 mm wide in nearly everyone) is the ruler for your PD.</p>
          </Card>
          <Card title="No camera? Try a sample profile" right={<Hud tone="violet">recorded data</Hud>}>
            <DemoPicker compact to="/studio" />
          </Card>
        </div>
      </div>
    </div>
  );
}

function draw(canvas, face, W, H, ok) {
  if (!canvas) return;
  if (canvas.width !== W) { canvas.width = W; canvas.height = H; }
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, W, H);
  const css = getComputedStyle(document.documentElement);
  const good = css.getPropertyValue("--green").trim() || "#34d399";
  const info = css.getPropertyValue("--cyan").trim() || "#22d3ee";
  // Face guide
  ctx.strokeStyle = ok ? good : "rgba(255,255,255,0.35)";
  ctx.lineWidth = Math.max(2, W / 400);
  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  ctx.ellipse(W / 2, H * 0.47, W * 0.17, H * 0.36, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  if (!face) return;
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  for (let i = 0; i < 468; i += 7) ctx.fillRect(face[i].x * W - 1.5, face[i].y * H - 1.5, 3, 3);
  ctx.strokeStyle = info;
  for (const [c, a, b] of [[468, 469, 471], [473, 474, 476]]) {
    const r = Math.abs(face[a].x - face[b].x) * W / 2;
    ctx.beginPath();
    ctx.arc(face[c].x * W, face[c].y * H, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(face[468].x * W, face[468].y * H);
  ctx.lineTo(face[473].x * W, face[473].y * H);
  ctx.stroke();
}

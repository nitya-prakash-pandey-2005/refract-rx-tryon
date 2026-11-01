import { useRef, useState } from "react";
import { ScanFace, Sparkles, Loader2, Eye, Droplets, ArrowRight, Receipt } from "lucide-react";
import { Card, PageHead, Hud, Badge, Progress, toast } from "../ui";
import { useStore } from "../state/store";
import { analyseFace, renderLooks, rxKey } from "../lib/pipeline";
import { useReveal } from "../lib/anim";
import { navigate } from "../lib/router";
import { spherEq, eyeMagnification } from "../engine/optics";
import { planLook } from "../engine/makeup";
import { HD_MIN_SHORT_SIDE } from "../engine/youcam";
import { cropForAnalysis } from "../engine/measure";
import NeedPhoto from "../components/NeedPhoto";
import CompareSlider from "../components/CompareSlider";
import DemoPicker from "../components/DemoPicker";

const FEATURE_NAME = { "face-attr-analysis": "Face Analyzer", "skin-analysis": "Skin Analysis", "makeup-vto": "Makeup VTO" };
const SKIN_ROWS = [
  ["darkCircle", "Dark circles"], ["eyeBag", "Eye bags"], ["crowfeet", "Crow's feet"], ["periocular", "Fine lines around the eye"],
  ["wrinkle", "Wrinkles (whole face)"], ["droopyUpper", "Upper-lid droop"], ["droopyLower", "Lower-lid droop"], ["tearTrough", "Tear trough"],
];
const tone = (v) => (v >= 70 ? "var(--green)" : v >= 50 ? "var(--amber)" : "var(--rose)");

export default function Profile({ query }) {
  const s = useStore();
  const root = useRef(null);
  const [step, setStep] = useState(null);
  const [err, setErr] = useState(null);
  useReveal(root, [Boolean(s.photo)]);
  if (!s.photo) return <div className="stack-lg"><PageHead kicker="Your face" title="Your face, measured" /><NeedPhoto to="/profile" /></div>;

  const se = [spherEq(s.rx.od), spherEq(s.rx.os)].reduce((a, b) => (Math.abs(b) > Math.abs(a) ? b : a));
  const m = eyeMagnification(se);
  const area = (m * m - 1) * 100;
  const look = planLook({ rx: s.rx, faceAttr: s.faceAttr || {}, skin: s.skin || {}, skinHex: s.skinHex });
  const crop = cropForAnalysis(s.measure.faceBox, s.photo.w, s.photo.h);
  const hd = Math.min(crop.w, crop.h) >= HD_MIN_SHORT_SIDE;
  const estimate = 20 + (hd ? 16 : 12) + 2;
  const staleLook = s.looks.rx && s.looks.rx.rxKey && s.looks.rx.rxKey !== rxKey(s.rx);
  const fa = s.faceAttr;

  async function run(what) {
    setErr(null);
    try {
      if (what !== "looks") { setStep("analyse"); await analyseFace({ label: query.record }); }
      setStep("looks");
      await renderLooks({ label: query.record });
      toast("YouCam analysis complete.", "ok");
    } catch (e) {
      setErr({ message: e.message || "YouCam call failed.", code: e.code });
    } finally {
      setStep(null);
    }
  }

  const runBtn = (
    <button className="btn primary" onClick={() => run(fa ? "looks" : "all")} disabled={!!step}>
      {step ? <Loader2 size={17} className="spin" /> : <Sparkles size={17} />}
      {step === "analyse" ? "Analysing face and skin…" : step === "looks" ? "Rendering your looks…" : fa ? (staleLook ? "Re-render looks for this Rx" : "Re-render looks") : `Run YouCam analysis · ~${estimate} units`}
    </button>
  );

  return (
    <div className="stack-lg" ref={root}>
      <PageHead kicker="Step 3 of 3" title="Your face, measured" sub="YouCam reads your eye area and face shape; Refract works out what your lenses will change." right={runBtn} />
      {s.persona && (s.faceAttr || s.looks.rx) && <div className="callout small" data-reveal>Sample profile: the YouCam results below are real responses recorded earlier and replayed, so you can try Refract without a camera or an API key.</div>}
      {s.persona && !s.faceAttr && !s.looks.rx && <div className="callout small" data-reveal>Sample profile: measurements come from the sample photo. YouCam results haven't been recorded for it on this server.</div>}
      {err && (
        <Card className="alert" data-reveal>
          <div className="stack-sm">
            <b>{err.message}</b>
            {/^error_(src_face|no_face|lighting|face_parsing)/.test(err.code || "") ? (
              <a className="btn sm" href="#/scan" style={{ width: "max-content" }}>Retake my photo</a>
            ) : (
              <><span className="small muted">You can still try everything with a sample profile:</span><DemoPicker compact to="/profile" /></>
            )}
          </div>
        </Card>
      )}

      <div className="grid g-12">
        <Card className="span-5" title="Measurements" icon={ScanFace} right={<Hud>from your photo</Hud>} data-reveal>
          <div className="photo-frame"><img src={s.photo.src} alt="Your scan" /></div>
          <div className="grid g2 keep-2" style={{ marginTop: 14 }}>
            <Stat2 v={s.measure.pd.far.toFixed(1)} u="mm" l={`PD ± ${s.measure.pd.plusMinus.toFixed(1)}`} />
            <Stat2 v={s.measure.faceWidthMm.toFixed(0)} u="mm" l="Face width at temples" />
            <Stat2 v={`${s.measure.pd.right.toFixed(1)} / ${s.measure.pd.left.toFixed(1)}`} u="" l="Mono PD right / left" />
            <Stat2 v={(s.measure.distanceMm / 10).toFixed(0)} u="cm" l="Camera distance (est.)" />
          </div>
        </Card>

        <div className="span-7 stack">
          <Card title="Face & eyes" icon={Eye} right={<Badge tone="cyan">YouCam Face Analyzer</Badge>} data-reveal>
            {fa ? (
              <div className="attr-grid">
                <Attr k="Face shape" v={fa.faceShape} />
                <Attr k="Eye shape" v={fa.eyeShape} />
                <Attr k="Eye size" v={fa.eyeSize} />
                <Attr k="Eye setting" v={fa.eyeSetting} />
                <Attr k="Eyelid" v={fa.eyelid} />
                <Attr k="Brow shape" v={fa.browShape} />
                <Attr k="Eye colour" v={fa.eyeColorName} swatch={fa.eyeColor} />
                <Attr k="Hair colour" v={fa.hairColorName} swatch={fa.hairColor} />
              </div>
            ) : <p className="small muted">Not analysed yet. Run the YouCam analysis to read your face shape, eyes and brows.</p>}
          </Card>
          <Card title="Eye-area skin" icon={Droplets} right={<Badge tone="violet">YouCam Skin Analysis{s.skin ? (s.skin.hd ? " · HD" : " · SD") : ""}</Badge>} data-reveal>
            {s.skin ? (
              <div className="stack-sm">
                {SKIN_ROWS.filter(([k]) => s.skin[k] != null).map(([k, label]) => (
                  <div className="skin-row" key={k}>
                    {s.skin.masks?.[k] ? <img src={s.skin.masks[k]} alt="" className="mask-thumb" /> : <span className="mask-thumb" />}
                    <span className="grow"><span className="row between"><span className="small">{label}</span><b className="num" style={{ color: tone(s.skin[k]) }}>{s.skin[k]}</b></span><Progress value={s.skin[k]} color={tone(s.skin[k])} /></span>
                  </div>
                ))}
                <p className="tiny muted">Scores 1–100, higher is better (YouCam ui_score). Cosmetic analysis, not a diagnosis.</p>
              </div>
            ) : <p className="small muted">Not analysed yet. YouCam checks dark circles, eye bags, fine lines and lid droop, which are the areas your lenses sit in front of.</p>}
          </Card>
        </div>

        <Card className="span-5 glow" title="What your lenses do to this area" right={<Hud tone="pink">optics</Hud>} data-reveal>
          <div className="display">{area > 0 ? "+" : ""}{area.toFixed(1)}<small>% area</small></div>
          <p className="small text-2">{Math.abs(se) < 0.5 ? "Your lenses barely change how the eye area looks." : area < 0
            ? `Behind ${se.toFixed(2)} D lenses, your eyes and everything around them look ${Math.abs(area).toFixed(0)}% smaller in area to others. Eye makeup has to work harder to read.`
            : `Behind +${se.toFixed(2)} D lenses, your eye area looks ${area.toFixed(0)}% larger to others${s.skin?.darkCircle != null ? `, including dark circles that YouCam scored ${s.skin.darkCircle}/100` : ""}.`}</p>
          <div className="stack-sm" style={{ marginTop: 10 }}>
            {look.reasons.slice(0, 3).map((r) => <div key={r} className="reason">{r}</div>)}
          </div>
        </Card>

        <Card className="span-7" title={`Your ${look.name} look`} icon={Sparkles} right={<Badge tone="pink">YouCam Makeup VTO</Badge>} data-reveal>
          {s.looks.rx && s.looks.generic ? (
            <>
              <CompareSlider before={s.looks.generic.image} after={s.looks.rx.image} beforeLabel="Generic tutorial look" afterLabel="Rx-tuned look" initial={42} />
              {staleLook && <p className="small" style={{ color: "var(--amber)", marginTop: 8 }}>Your prescription changed since this render. Re-render to match.</p>}
              <button className="btn block" style={{ marginTop: 12 }} onClick={() => navigate("/frames")}>See it through your lenses in frames<ArrowRight size={16} /></button>
            </>
          ) : <p className="small muted">After the analysis, YouCam renders two looks on your photo: a generic tutorial look and one retuned for your lenses, so you can compare.</p>}
        </Card>

        <Card className="span-12" title="YouCam calls" icon={Receipt} right={<Hud>units ledger</Hud>} data-reveal>
          {s.ledger.length ? (
            <div className="list">
              {s.ledger.slice(0, 8).map((c) => (
                <div className="li" key={c.at + c.feature}>
                  <span className="grow"><span className="t">{FEATURE_NAME[c.feature] || c.feature}</span><span className="s">{new Date(c.at).toLocaleTimeString()} · {c.source === "replay" ? "recorded response (no units)" : `${(c.ms / 1000).toFixed(1)} s`}</span></span>
                  <Badge tone={c.source === "replay" ? "violet" : "green"}>{c.source === "replay" ? "sample" : `${c.units} units`}</Badge>
                </div>
              ))}
            </div>
          ) : <p className="small muted">No calls yet.</p>}
        </Card>
      </div>
    </div>
  );
}

const Stat2 = ({ v, u, l }) => <div className="stat"><div className="v">{v}{u && <small>{u}</small>}</div><div className="l">{l}</div></div>;
const Attr = ({ k, v, swatch }) => (
  <div className="attr"><span className="tiny muted">{k}</span><b className="row" style={{ gap: 6 }}>{swatch && /^#/.test(swatch) && <i className="swatch" style={{ background: swatch }} />}{v || "—"}</b></div>
);

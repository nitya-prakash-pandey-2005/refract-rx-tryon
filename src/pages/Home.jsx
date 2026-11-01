import { useEffect, useRef } from "react";
import { ScanFace, Ruler, Sparkles, Glasses, ArrowRight, ScanEye, Droplets, Palette, Bot } from "lucide-react";
import { animate, stagger, splitText } from "animejs";
import { Card, Hud, Badge } from "../ui";
import { useStore } from "../state/store";
import { reveal, reduced } from "../lib/anim";
import { eyeMagnification } from "../engine/optics";
import HeroLens from "../components/HeroLens";
import DemoPicker from "../components/DemoPicker";

const STEPS = [
  { icon: ScanFace, title: "Scan", body: "Live face scan with voice guidance, so you don't need your glasses to see the screen. Your iris is the ruler for PD." },
  { icon: Ruler, title: "Prescription", body: "Enter your Rx. See right away how much your lenses shrink or magnify your eyes." },
  { icon: Sparkles, title: "YouCam analysis", body: "Face Analyzer reads your eye shape and face; Skin Analysis checks the eye area your lenses magnify or hide." },
  { icon: Glasses, title: "Studio", body: "Frames on your face with real lens optics, the right lens index, and eye makeup retuned for your lenses." },
];
const APIS = [
  { icon: ScanEye, name: "AI Face Analyzer", use: "Face shape, eye shape, size, setting, lids, brows and colours drive frame and makeup choices." },
  { icon: Droplets, name: "AI Skin Analysis", use: "Dark circles, eye bags, crow's feet, lid droop and tear trough: what a plus lens magnifies." },
  { icon: Palette, name: "AI Makeup VTO", use: "Renders an eye look computed for your lens power, next to a generic look for comparison." },
];

export default function Home() {
  const s = useStore();
  const root = useRef(null), title = useRef(null);
  useEffect(() => {
    reveal(root.current, "[data-reveal]", { delay: 250 });
    if (reduced() || !title.current) return;
    const { words } = splitText(title.current, { words: true });
    const a = animate(words, { opacity: [0, 1], translateY: ["0.6em", 0], duration: 700, delay: stagger(45), ease: "outExpo" });
    return () => a.revert();
  }, []);
  const minus8 = ((1 - eyeMagnification(-8)) * 100).toFixed(0);

  return (
    <div className="stack-lg home" ref={root}>
      <section className="hero" data-tour="home-hero">
        <div className="hero-copy">
          <Hud tone="pink">Prescription-true try-on · built on YouCam APIs</Hud>
          <h1 ref={title}>Every virtual try-on shows you frames without lenses.</h1>
          <p className="lead">Refract shows what you'll really look like through <b>your</b> prescription: how big your eyes look, how thick the edges get, and which eye makeup works behind the lens. Then it picks the frame, lens and look that suit you.</p>
          <div className="row wrap" style={{ gap: 10 }}>
            <a className="btn primary lg" href={s.photo ? "#/studio" : "#/scan"}>{s.photo ? "Open my Studio" : "Start my scan"}<ArrowRight size={18} /></a>
            <button className="btn lg ghost" onClick={() => document.getElementById("demo")?.scrollIntoView({ behavior: "smooth", block: "center" })}>Try a sample profile</button>
          </div>
        </div>
        <HeroLens />
      </section>

      <div className="grid g3">
        <Card data-reveal>
          <div className="display">−{minus8}<small>%</small></div>
          <p className="small text-2">how much smaller your eyes look to others behind −8.00 D lenses. A lensless try-on hides it.</p>
          <span className="pill-src">Spectacle magnification, 12 mm vertex</span>
        </Card>
        <Card data-reveal>
          <div className="display">~50<small>%</small></div>
          <p className="small text-2">of the world is projected to be shortsighted by 2050, so this affects billions of frame purchases.</p>
          <span className="pill-src">Holden et al., Ophthalmology 2016</span>
        </Card>
        <Card data-reveal>
          <div className="display">15–20<small>%</small></div>
          <p className="small text-2">of eyewear bought online is returned. Thick edges and "my eyes look tiny" are surprises Refract shows you up front.</p>
          <span className="pill-src">Industry estimates</span>
        </Card>
      </div>

      <Card title="How it works" right={<Hud>about 60 seconds</Hud>} data-reveal>
        <div className="steps">
          {STEPS.map((x, i) => (
            <div className="step" key={x.title}>
              <span className="step-ic"><x.icon size={18} /></span>
              <b><span className="muted mono tiny">0{i + 1}</span> {x.title}</b>
              <p className="small text-2">{x.body}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid g-12">
        <Card className="span-7" title="YouCam APIs doing the beauty work" right={<Badge tone="pink">3 APIs</Badge>} data-reveal>
          <div className="list">
            {APIS.map((a) => (
              <div className="li" key={a.name}><span className="step-ic"><a.icon size={17} /></span><span className="grow" style={{ minWidth: 0 }}><span className="t">{a.name}</span><span className="s wrap-s">{a.use}</span></span></div>
            ))}
            <div className="li"><span className="step-ic"><Bot size={17} /></span><span className="grow" style={{ minWidth: 0 }}><span className="t">Plus: Refract's optics engine and agent</span><span className="s wrap-s">Lens sag, edge thickness, weight and magnification per eye, a per-pixel lens renderer, and an agent that checks every claim with those tools.</span></span></div>
          </div>
        </Card>
        <Card className="span-5" title="Try it without a camera" id="demo" data-reveal>
          <DemoPicker compact to="/studio" />
          <p className="tiny muted" style={{ marginTop: 10 }}>Sample portraits are YouCam API sample images. YouCam results for them are real responses, recorded and labelled as sample data.</p>
        </Card>
      </div>
    </div>
  );
}

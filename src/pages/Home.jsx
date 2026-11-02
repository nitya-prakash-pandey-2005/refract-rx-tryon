import { useEffect, useRef } from "react";
import { Aperture, ArrowRight, Store, Sparkles, Glasses, ScanEye, Droplets, Palette, Bot, Cpu, ShoppingBag, ScanFace, Code2 } from "lucide-react";
import { animate, stagger, splitText } from "animejs";
import { Card, Hud, Badge } from "../ui";
import { useStore } from "../state/store";
import { reduced, onView, countUp, useScrollReveal } from "../lib/anim";
import HeroDemo from "../components/HeroDemo";
import DemoPicker from "../components/DemoPicker";

const IMPACT = [
  { to: 2.2, dec: 1, suffix: "B", label: "people live with a near or distance vision impairment", src: "WHO, World report on vision" },
  { to: 50, dec: 0, suffix: "%", label: "of the world projected to be shortsighted by 2050", src: "Holden et al., Ophthalmology 2016" },
  { to: 9, dec: 0, suffix: "%", prefix: "−", label: "how much smaller your eyes look to others behind −8 D lenses", src: "Spectacle magnification, 12 mm vertex" },
  { to: 20, dec: 0, suffix: "%", prefix: "15–", label: "of eyewear bought online is returned", src: "Industry estimates" },
];
const PRODUCTS = [
  { icon: Aperture, kicker: "For shoppers", title: "Live Rx Mirror", body: "Your camera, re-rendered on the GPU through your exact sphere, cylinder and axis. Frames track your face; your eyes shrink or grow exactly as they will.", to: "#/live", cta: "Start Live Mirror" },
  { icon: Palette, kicker: "For beauty", title: "Makeup retuned for your lenses", body: "YouCam reads your eyes and eye-area skin, then renders a look that works behind your lens power: brighter behind minus, matte and precise behind plus.", to: "#/profile", cta: "See the YouCam analysis" },
  { icon: Store, kicker: "For retailers", title: "One line on any store", body: "Add embed.js and a data-refract-sku attribute. Shoppers try frames with their real Rx; you get the frame, lens index and edge thickness back in the cart.", to: "/store/index.html", cta: "Open the demo store", external: true },
];
const TECH = ["WebGL2 lens shader", "478-point face mesh", "Iris-scaled PD", "Cylinder-axis optics", "Lens sag + edge thickness", "YouCam Face Analyzer", "YouCam Skin Analysis HD", "YouCam Makeup VTO", "Claude tool-use agent", "Rx-suitability feed", "One-line store embed", "Installable PWA"];
const APIS = [
  { icon: ScanEye, name: "AI Face Analyzer", use: "Face shape, eye shape, size, setting, lids, brows and colours drive frame ranking and makeup placement." },
  { icon: Droplets, name: "AI Skin Analysis", use: "Dark circles, eye bags, crow's feet, lid droop and tear trough: the area a plus lens magnifies." },
  { icon: Palette, name: "AI Makeup VTO", use: "Renders the look computed for your lens power, next to a generic look for comparison." },
];

export default function Home() {
  const s = useStore();
  const root = useRef(null), title = useRef(null), marquee = useRef(null), impact = useRef(null);
  useScrollReveal(root);

  useEffect(() => {
    if (reduced() || !title.current) return;
    const { words } = splitText(title.current, { words: true });
    const a = animate(words, { opacity: [0, 1], translateY: ["0.7em", 0], rotate: ["4deg", 0], duration: 800, delay: stagger(55), ease: "outExpo" });
    const b = animate(".hero-copy [data-hero]", { opacity: [0, 1], translateY: [16, 0], duration: 700, delay: stagger(90, { start: 450 }), ease: "outExpo" });
    return () => { a.revert(); b.revert(); };
  }, []);

  useEffect(() => onView(impact.current, () => {
    impact.current.querySelectorAll("[data-count]").forEach((el, i) => {
      const d = IMPACT[i];
      setTimeout(() => countUp(el, d.to, { decimals: d.dec, duration: 1400 }), i * 120);
    });
  }), []);

  useEffect(() => {
    if (reduced() || !marquee.current) return;
    const track = marquee.current;
    const a = animate(track, { translateX: ["0%", "-50%"], duration: 26000, ease: "linear", loop: true });
    return () => a.revert();
  }, []);

  return (
    <div className="stack-lg home" ref={root}>
      <section className="hero" data-tour="home-hero">
        <div className="hero-copy">
          <span data-hero><Hud tone="pink">Prescription-true try-on · built on YouCam AI</Hud></span>
          <h1 ref={title}>See yourself through your real prescription.</h1>
          <p className="lead" data-hero>Every virtual try-on shows frames <b>without lenses</b>. Refract renders your eyes, the lens edge and your eye makeup through your actual Rx, live on your camera and on any store, then picks the frame, lens and look that suit you.</p>
          <div className="row wrap" style={{ gap: 10 }} data-hero>
            <a className="btn primary lg" href="#/live"><Aperture size={18} />Start Live Mirror</a>
            <a className="btn lg" href="/store/index.html"><Store size={18} />Try it in a store</a>
            <a className="btn lg ghost" href={s.photo ? "#/studio" : "#/scan"}>{s.photo ? "Open my Studio" : "Use a photo"}<ArrowRight size={16} /></a>
          </div>
          <div className="hero-trust row wrap" data-hero>
            <span><Cpu size={14} /> Runs in the browser</span>
            <span><ScanFace size={14} /> Photo stays on your device</span>
            <span><ShoppingBag size={14} /> Lab-ready order sheet</span>
          </div>
        </div>
        <HeroDemo />
      </section>

      <section className="impact" ref={impact} data-section>
        {IMPACT.map((d) => (
          <div className="impact-item" key={d.label} data-reveal>
            <div className="display">{d.prefix || ""}<span data-count>0</span><small>{d.suffix}</small></div>
            <p className="small text-2">{d.label}</p>
            <span className="pill-src">{d.src}</span>
          </div>
        ))}
      </section>

      <section data-section>
        <div className="section-head" data-reveal>
          <Hud tone="cyan">One optics engine · three experiences</Hud>
          <h2>The lens is part of the look. Now every try-on can see it.</h2>
        </div>
        <div className="grid g3">
          {PRODUCTS.map((p) => (
            <Card key={p.title} className="interactive product-card" data-reveal>
              <span className="step-ic"><p.icon size={18} /></span>
              <Hud>{p.kicker}</Hud>
              <h3>{p.title}</h3>
              <p className="small text-2">{p.body}</p>
              <a className="btn sm" href={p.to}>{p.cta}<ArrowRight size={14} /></a>
            </Card>
          ))}
        </div>
      </section>

      <section className="marquee" aria-label="Technology">
        <div className="marquee-track" ref={marquee}>
          {[...TECH, ...TECH].map((t, i) => <span key={i} className="chip"><Sparkles size={12} />{t}</span>)}
        </div>
      </section>

      <section className="grid g-12" data-section>
        <Card className="span-7" title="Add it to any store in one line" icon={Code2} right={<Badge tone="green">live demo</Badge>} data-reveal>
          <pre className="json snippet">{`<script src="${typeof window !== "undefined" ? window.location.origin : ""}/embed.js" async></script>

<button data-refract-sku="juno">Try with my prescription</button>

<script>
  addEventListener("refract:add-to-cart", (e) => cart.add(e.detail));
</script>`}</pre>
          <div className="row wrap" style={{ gap: 8 }}>
            <a className="btn primary" href="/store/index.html"><Store size={16} />Open the demo store</a>
            <a className="btn ghost" href="#/retail">Catalogue Rx audit</a>
          </div>
        </Card>
        <Card className="span-5" title="YouCam APIs doing the beauty work" right={<Badge tone="pink">3 APIs</Badge>} data-reveal>
          <div className="list">
            {APIS.map((a) => (
              <div className="li" key={a.name}><span className="step-ic"><a.icon size={17} /></span><span className="grow" style={{ minWidth: 0 }}><span className="t">{a.name}</span><span className="s wrap-s">{a.use}</span></span></div>
            ))}
            <div className="li"><span className="step-ic"><Bot size={17} /></span><span className="grow" style={{ minWidth: 0 }}><span className="t">Plus Refract's optics engine + agent</span><span className="s wrap-s">Lens sag, edge thickness, weight and magnification per eye; a GPU lens renderer; an agent that checks every number with those tools.</span></span></div>
          </div>
        </Card>
      </section>

      <section className="grid g-12" data-section>
        <Card className="span-7" title="How it works" right={<Hud>about 60 seconds</Hud>} data-reveal>
          <div className="steps">
            {[
              [ScanFace, "Scan", "Glasses off, voice guided. Your iris is the ruler for PD."],
              [Glasses, "Your Rx", "Sphere, cylinder, axis: see what they do instantly."],
              [Sparkles, "YouCam", "Face, eye-area skin and makeup, from three APIs."],
              [Aperture, "Live", "Frames, lenses and look, through your prescription."],
            ].map(([I, t, b], i) => (
              <div className="step" key={t}><span className="step-ic"><I size={18} /></span><b><span className="muted mono tiny">0{i + 1}</span> {t}</b><p className="small text-2">{b}</p></div>
            ))}
          </div>
        </Card>
        <Card className="span-5" title="Try it without a camera" id="demo" data-reveal>
          <DemoPicker compact to="/studio" />
          <p className="tiny muted" style={{ marginTop: 10 }}>Sample portraits are YouCam API sample images; their YouCam results are real recorded responses.</p>
        </Card>
      </section>
    </div>
  );
}

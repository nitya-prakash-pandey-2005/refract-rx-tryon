import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Aperture, ShieldCheck, Store, Lock, FlaskConical, Github, Scale, Check, X, Minus, ScanEye, Droplets, Palette, Bot, Sparkles, Ruler, ScanSearch, Eye, BadgeDollarSign, ChevronDown } from "lucide-react";
import { animate, stagger, splitText, scrambleText, spring, createScope, createTimeline, onScroll, svg } from "animejs";
import { Card, Hud, Badge, Seg } from "../ui";
import { reduced, onView, countUp, useScrollReveal } from "../lib/anim";
import { getFrame } from "../engine/frames";
import { INDICES } from "../engine/optics";
import { lensPair } from "../engine/fit";
import { materialSight } from "../engine/sight";
import QuickCheck from "../components/QuickCheck";
import FailStory from "../components/FailStory";
import HeroDemo from "../components/HeroDemo";
import DemoPicker from "../components/DemoPicker";

const REPO = "https://github.com/nitya-prakash-pandey-2005/refract-rx-tryon";
const STATS = [
  { pre: "1 in ", to: 13, label: "pairs of prescription glasses has to be remade", src: "7.6% redo rate · Vision Council" },
  { pre: "15–", to: 20, suf: "%", label: "of glasses bought online are sent back", src: "industry estimates" },
  { pre: "~", to: 0.8, dec: 1, suf: " mm", label: "thinner: all the €50–120 \"ultra-thin\" upgrade buys at −4", src: "Refract engine · retailer price lists" },
  { to: 50, suf: "%", label: "of the world will be short-sighted by 2050", src: "Holden et al., Ophthalmology 2016" },
];
const ROWS = [
  ["Shows your real lenses (edge, weight, eye size) before you pay", "no", "after you order", "yes"],
  ["Predicts slipping, rainbow edges and PD errors", "no", "from experience", "yes"],
  ["Works for frames from any store", "no", "no", "yes"],
  ["Time it takes", "1 min", "an appointment", "1 min, at home"],
  ["What it costs you", "free", "exam + travel", "free"],
  ["Makes money from", "selling you glasses", "selling you glasses", "stores cutting remakes"],
];
const TRUST = [
  { icon: Lock, t: "Private by design", b: "Face tracking runs on your device and the camera feed never leaves it. A photo goes to YouCam only when you press \"Run analysis\"." },
  { icon: FlaskConical, t: "Built on published science", b: "Standard lens optics, Prentice's rule, measured colour-fringe perception (Winter et al. 2015), ANSI Z80.1 tolerances and skin-friction data.", href: `${REPO}/blob/main/docs/EVIDENCE.md`, cta: "Read the evidence" },
  { icon: Github, t: "Open and tested", b: "The whole engine is open source with 121 automated tests. Every number in the app shows how it was worked out.", href: REPO, cta: "See the code" },
  { icon: Scale, t: "Honest about limits", b: "A shopping aid, not a medical device. It can't test your eyes; it helps you pick frames and lenses for the prescription you have." },
];
const WHO = [
  { icon: Eye, who: "Shoppers", price: "Free", unit: "forever, no sign-up", items: ["Check any frame from any store", "See it live through your exact lenses", "A lens report to take to any shop"], to: "#/check", cta: "Check my glasses", tone: "pink" },
  { icon: Store, who: "Glasses stores", price: "$49", unit: "/month per store", items: ["One script tag on product pages", "Remake risk on every order, with fixes", "Fewer remakes and returns: see the ROI"], to: "#/retail", cta: "See the store dashboard", tone: "cyan", best: true },
  { icon: Bot, who: "AI shopping assistants", price: "API", unit: "REST + MCP", items: ["\"Which frame keeps my −7 lenses thin?\"", "Any frame, by its printed size", "Answers grounded in physics, not guesses"], to: "#/retail", cta: "See the API", tone: "violet" },
];
const APIS = [
  { icon: ScanEye, name: "AI Face Analyzer", use: "Reads your face shape and eyes, so frames are ranked for your face." },
  { icon: Droplets, name: "AI Skin Analysis", use: "Measures oiliness (how well nose pads grip) and the eye area your lenses magnify." },
  { icon: Palette, name: "AI Makeup VTO", use: "Renders eye makeup retuned for your lens power: what works behind −6 differs from +3." },
];
const FAQ = [
  ["Do you sell glasses?", "No. Refract doesn't sell frames or lenses and never takes a cut from you. Stores pay a monthly subscription to put it on their site, because every remake they avoid saves them a lab bill, shipping and often a customer."],
  ["Is it really free?", "Yes, for shoppers: no account, no card. The sample frames are only there so you can try it; you can check a frame from any store by typing its size."],
  ["Where do I find a frame's size?", "Inside the left arm, or in the product listing: three numbers like 52□18 140. That's lens width, bridge and arm length in millimetres."],
  ["Does my face get uploaded?", "Live try-on and the face scan run on your device; the camera feed never leaves it. A photo is sent to YouCam only when you press \"Run YouCam analysis\", to read your skin and face shape."],
  ["How accurate is it?", "Lens thickness, eye size, colour fringes and PD tolerance come from standard optics formulas and published standards. Slip risk is a physics model calibrated from published skin-friction data: treat it as a strong hint, not a guarantee."],
  ["Can it replace my optician?", "No. It can't test your eyes or write a prescription. It helps you choose frames and lenses that suit the prescription you already have, and tells you what to ask."],
];

export default function Home() {
  const root = useRef(null), title = useRef(null), stats = useRef(null), kicker = useRef(null);
  useScrollReveal(root);

  useEffect(() => {
    if (reduced() || !title.current) return;
    const split = splitText(title.current, { words: true });
    const a = animate(split.words, { opacity: [0, 1], translateY: ["0.7em", 0], rotate: ["4deg", 0], duration: 800, delay: stagger(55), ease: "outExpo" });
    const b = animate(".hero-copy [data-hero]", { opacity: [0, 1], translateY: [16, 0], duration: 700, delay: stagger(90, { start: 450 }), ease: "outExpo" });
    const c = kicker.current && animate(kicker.current, { innerHTML: scrambleText({ chars: "uppercase", duration: 1100 }), delay: 250 });
    return () => { a.revert(); b.revert(); c?.revert(); split.revert?.(); };
  }, []);

  useEffect(() => onView(stats.current, () => {
    stats.current.querySelectorAll("[data-count]").forEach((el, i) => {
      const d = STATS[i];
      setTimeout(() => countUp(el, d.to, { decimals: d.dec || 0, duration: 1400 }), i * 120);
    });
  }), []);

  return (
    <div className="stack-lg home home4" ref={root}>
      <section className="hero" data-tour="home-hero">
        <div className="hero-copy">
          <span data-hero><Hud tone="pink"><span ref={kicker}>Free · for glasses from any store · no sign-up</span></Hud></span>
          <h1 ref={title}>Check any glasses before you buy them.</h1>
          <p className="lead" data-hero>Refract is a <b>free second opinion for prescription glasses</b>. Give it your prescription and any frame, from any shop or website. In seconds you'll know how thick your lenses will be, how your eyes will look, whether you'll see rainbow edges and whether they'll slide down your nose. Then you see them live, on your own face.</p>
          <div className="row wrap" style={{ gap: 10 }} data-hero>
            <a className="btn primary lg" href="#/check"><ShieldCheck size={18} />Check a pair</a>
            <a className="btn lg" href="#/live"><Aperture size={18} />See them on my face</a>
            <a className="btn lg ghost" href="#/retail"><Store size={18} />I run a glasses store</a>
          </div>
          <div className="hero-trust row wrap" data-hero>
            <span><BadgeDollarSign size={14} /> Doesn't sell glasses</span>
            <span><Lock size={14} /> Camera stays on your device</span>
            <span><Sparkles size={14} /> Built on YouCam AI</span>
          </div>
        </div>
        <QuickCheck />
      </section>

      <section className="impact" ref={stats} data-section>
        {STATS.map((d) => (
          <div className="impact-item" key={d.label} data-reveal>
            <div className="display">{d.pre || ""}<span data-count>0</span><small>{d.suf || ""}</small></div>
            <p className="small text-2">{d.label}</p>
            <span className="pill-src">{d.src}</span>
          </div>
        ))}
      </section>

      <section className="section-head center" data-section>
        <span data-reveal><Hud tone="cyan">Why glasses get sent back</Hud></span>
        <h2 data-reveal>Four ways new glasses go wrong. Refract catches each one before you pay.</h2>
        <p className="text-2" data-reveal>Every virtual try-on shows you frames. None of them shows you the lenses, and the lenses are what go wrong. Scroll.</p>
      </section>
      <FailStory />

      <section className="grid g-12" data-section>
        <div className="span-6 stack-sm see-copy" data-reveal>
          <Hud tone="pink">Then see it</Hud>
          <h2>Your face, through your exact lenses.</h2>
          <p className="text-2">The Live Rx Mirror re-renders your camera on the GPU through your sphere, cylinder and axis: your eyes shrink or grow exactly as they will, and the lens edge shows where it will. Optics X-ray bends a grid through the lens and colours the rim by thickness.</p>
          <div className="row wrap" style={{ gap: 10 }}>
            <a className="btn primary" href="#/live"><Aperture size={16} />Start the Live Rx Mirror</a>
            <a className="btn ghost" href="#demo">Use a sample face</a>
          </div>
        </div>
        <div className="span-6" data-reveal><HeroDemo /></div>
      </section>

      <Savings />

      <ScienceStrip />

      <section className="stack" data-section>
        <div className="section-head center">
          <span data-reveal><Hud tone="cyan">Why Refract</Hud></span>
          <h2 data-reveal>What you get that a store's try-on or a shop visit doesn't give you.</h2>
        </div>
        <Compare />
      </section>

      <section className="stack" data-section>
        <div className="section-head center">
          <span data-reveal><Hud tone="green">Can I trust it?</Hud></span>
          <h2 data-reveal>Private, grounded in science, open, and honest about its limits.</h2>
        </div>
        <div className="grid g4">
          {TRUST.map((x) => (
            <Card key={x.t} className="trust-card" data-reveal>
              <span className="step-ic"><x.icon size={18} /></span>
              <b>{x.t}</b>
              <p className="small text-2">{x.b}</p>
              {x.href && <a className="tiny link" href={x.href} target="_blank" rel="noreferrer">{x.cta} →</a>}
            </Card>
          ))}
        </div>
      </section>

      <section className="stack" data-section>
        <div className="section-head center">
          <span data-reveal><Hud tone="violet">Who pays</Hud></span>
          <h2 data-reveal>Free for you. Stores pay, because every remake costs them money.</h2>
        </div>
        <div className="grid g3">
          {WHO.map((w) => (
            <Card key={w.who} className={`who-card ${w.best ? "glow" : ""}`} data-reveal>
              <div className="row between"><span className="row" style={{ gap: 10 }}><span className="step-ic"><w.icon size={18} /></span><b>{w.who}</b></span>{w.best && <Badge tone="cyan">the business</Badge>}</div>
              <div className="plan-price">{w.price}<small> {w.unit}</small></div>
              <ul className="plan-list">{w.items.map((i) => <li key={i}><Check size={14} />{i}</li>)}</ul>
              <a className={`btn sm ${w.best ? "primary" : ""}`} href={w.to}>{w.cta}<ArrowRight size={14} /></a>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid g-12" data-section>
        <Card className="span-7" title="How it works" right={<Hud>about a minute</Hud>} data-reveal>
          <div className="steps three">
            {[
              [Ruler, "Add your prescription", "Type it from your paper, or pick a sample. Your glasses' sphere, cylinder and axis."],
              [ScanSearch, "Pick any frame", "From the sample frames, or type the size printed on a frame from any store."],
              [ShieldCheck, "Get the verdict, see it live", "A remake-risk score with a fix for each problem, then your camera through your lenses."],
            ].map(([I, t, b], i) => (
              <div className="step" key={t}><span className="step-ic"><I size={18} /></span><b><span className="muted mono tiny">0{i + 1}</span> {t}</b><p className="small text-2">{b}</p></div>
            ))}
          </div>
          <p className="tiny muted" style={{ marginTop: 12 }}>Optional: a 20-second face scan measures your PD and face width; YouCam Skin AI measures oiliness for the slip check.</p>
        </Card>
        <Card className="span-5" title="Try it with a sample face" id="demo" data-reveal>
          <DemoPicker compact to="/check" />
          <p className="tiny muted" style={{ marginTop: 10 }}>Sample portraits are YouCam API sample images; their YouCam results are real recorded responses.</p>
        </Card>
      </section>

      <section className="stack" data-section>
        <div className="section-head center">
          <span data-reveal><Hud tone="pink">Powered by YouCam AI</Hud></span>
          <h2 data-reveal>Three YouCam APIs read your face and skin. Refract's engine does the optics.</h2>
        </div>
        <div className="grid g3">
          {APIS.map((a) => (
            <Card key={a.name} className="api-card" data-reveal>
              <span className="step-ic"><a.icon size={18} /></span>
              <b>YouCam {a.name}</b>
              <p className="small text-2">{a.use}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="stack faq" data-section>
        <div className="section-head center"><span data-reveal><Hud>Questions</Hud></span><h2 data-reveal>What people ask first.</h2></div>
        <div className="faq-list">
          {FAQ.map(([q, a]) => <Faq key={q} q={q} a={a} />)}
        </div>
      </section>

      <section className="cta-band" data-section>
        <div data-reveal>
          <h2>Know your glasses will work before you pay for them.</h2>
          <p className="text-2">Free, about a minute, and it works with any frame from any store.</p>
        </div>
        <div className="row wrap" style={{ gap: 10 }} data-reveal>
          <a className="btn primary lg" href="#/check"><ShieldCheck size={18} />Check a pair</a>
          <a className="btn lg ghost" href="#/retail"><Store size={18} />For stores</a>
        </div>
      </section>
    </div>
  );
}

// "Don't pay for thin you don't need": a big frame with the priciest lens vs a medium frame with
// a standard lens, from the engine, at three common powers.
function Savings() {
  const [p, setP] = useState(-4);
  const rows = useMemo(() => {
    const rx = { od: { sph: p, cyl: -0.5, axis: 180 }, os: { sph: p, cyl: -0.5, axis: 180 } };
    const pd = { left: 31.5, right: 31.5, plusMinus: 0.5 };
    const sight = materialSight({ sph: p - 0.5, cyl: 0, axis: 0 });
    const row = (id, n, label, sub, tone) => {
      const l = lensPair({ frame: getFrame(id), rx, pd, index: INDICES.find((i) => i.n === n) });
      return { label, sub, tone, edge: Math.max(l.od.maxEdge, l.os.maxEdge), lines: sight.find((r) => r.index.n === n).linesLost };
    };
    return [
      row("juno", 1.74, "Large frame + 1.74 \"ultra-thin\"", "the upgrade stores push · often +€50–120", "rose"),
      row("tate", 1.6, "Medium frame + standard 1.60", "no upgrade", "green"),
    ];
  }, [p]);
  const bars = useRef(null);
  useEffect(() => {
    const el = bars.current;
    if (!el) return;
    const fills = el.querySelectorAll(".sv-fill");
    if (reduced()) { fills.forEach((f, i) => { f.style.width = `${(rows[i].edge / 10) * 100}%`; }); return; }
    const a = animate(fills, { width: (_, i) => `${(rows[i].edge / 10) * 100}%`, ease: spring({ bounce: 0.25, duration: 700 }), delay: stagger(80) });
    return () => a.pause();
  }, [rows]);
  return (
    <section className="grid g-12 savings" data-section>
      <div className="span-5 stack-sm" data-reveal>
        <Hud tone="green">Saves you money</Hud>
        <h2>Don't pay for thin you don't need.</h2>
        <p className="text-2">Stores make their margin on lens upgrades. The frame size matters more than the lens: a medium frame with a standard lens can be thinner than a big frame with the most expensive one, and sharper too. Refract doesn't sell lenses, so it can tell you.</p>
        <Seg options={[{ value: -3, label: "−3.00" }, { value: -4, label: "−4.00" }, { value: -6, label: "−6.00" }]} value={p} onChange={setP} />
      </div>
      <Card className="span-7" data-reveal>
        <div className="stack" ref={bars}>
          {rows.map((r) => (
            <div key={r.label} className="sv-row">
              <div className="row between wrap"><b>{r.label}</b><span className="tiny muted">{r.sub}</span></div>
              <div className="sv-bar"><i className={`sv-fill ${r.tone}`} /><span className="num">{r.edge.toFixed(1)} mm edge</span></div>
              <span className="tiny text-2">Sharpness lost glancing 1 cm off-centre: <b className={r.lines >= 0.6 ? "bad" : "good"}>−{r.lines.toFixed(2)} chart lines</b></span>
            </div>
          ))}
          <p className="tiny muted">Edge thickness for {p.toFixed(2)} / −0.50 × 180 with an accurate PD, from Refract's lens engine. Upgrade prices from retailer price lists (e.g. +€120 for 1.74).</p>
        </div>
      </Card>
    </section>
  );
}

function Compare() {
  const tbl = useRef(null);
  useEffect(() => onView(tbl.current, () => {
    if (reduced()) return;
    animate(tbl.current.querySelectorAll(".cmp-mark"), { scale: [0, 1], opacity: [0, 1], ease: spring({ bounce: 0.5, duration: 500 }), delay: stagger(40) });
  }), []);
  const Mark = ({ v, ours }) => {
    if (v === "yes") return <span className="cmp-mark yes"><Check size={15} /></span>;
    if (v === "no") return <span className="cmp-mark no"><X size={15} /></span>;
    return <span className={`cmp-txt ${ours ? "ours" : ""}`}>{ours ? <Check size={13} className="cmp-mark yes sm" /> : <Minus size={13} className="cmp-mark mid" />}{v}</span>;
  };
  return (
    <div className="cmp-wrap" data-reveal>
      <table className="cmp" ref={tbl}>
        <thead><tr><th /><th>A store's virtual try-on</th><th>Visiting an optician</th><th className="ours">Refract</th></tr></thead>
        <tbody>
          {ROWS.map(([q, a, b, c]) => (
            <tr key={q}><th scope="row">{q}</th><td><Mark v={a} /></td><td><Mark v={b} /></td><td className="ours"><Mark v={c} ours /></td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Faq({ q, a }) {
  const body = useRef(null);
  const [open, setOpen] = useState(false);
  function toggle() {
    const el = body.current, next = !open;
    setOpen(next);
    if (!el) return;
    if (reduced()) { el.style.height = next ? "auto" : "0px"; el.style.opacity = next ? 1 : 0; return; }
    const h = el.scrollHeight;
    animate(el, { height: next ? [0, h] : [h, 0], opacity: next ? [0, 1] : [1, 0], duration: 380, ease: "outExpo", onComplete: () => { if (next) el.style.height = "auto"; } });
  }
  return (
    <div className={`faq-item ${open ? "open" : ""}`} data-reveal>
      <button className="faq-q" onClick={toggle} aria-expanded={open}><span>{q}</span><ChevronDown size={18} /></button>
      <div className="faq-a" ref={body}><p className="small text-2">{a}</p></div>
    </div>
  );
}

// "Deeper than a try-on": one looping anime.js timeline per science, played only while on screen.
const SCIENCE = [
  { k: "Physics", t: "Light, computed", b: "Ray tracing, Fresnel reflection and thin-film interference show what each lens and coating really does.", to: "#/lab", cta: "Lens Lab" },
  { k: "Chemistry", t: "Molecules, explained", b: "Why sulfur makes lenses thin but colourful, and why light-reactive lenses stay pale in the heat and in your car.", to: "#/lab", cta: "Lens Lab" },
  { k: "Biology", t: "Eyes that grow, skin that shines", b: "A child's myopia forecast from published data, and how your skin's oil through the day changes the fit.", to: "#/kids", cta: "Kids' eyes" },
  { k: "Math", t: "Choices, optimised", b: "Every frame and lens for your prescription on one price/risk frontier, plus Monte Carlo for your day.", to: "#/value", cta: "Best value" },
];
function ScienceStrip() {
  const root = useRef(null);
  useEffect(() => {
    const el = root.current;
    if (!el || reduced()) return;
    const scope = createScope({ root: el }).add(() => {
      const play = () => onScroll({ target: el, enter: "bottom top", leave: "top bottom", sync: "play pause" });
      createTimeline({ loop: true, alternate: true, autoplay: play() })
        .add(".sx-ray", { x2: (_, i) => 190, y2: (_, i) => 62 + i * 9, duration: 1400, ease: "inOutSine" }, 0);
      createTimeline({ loop: true, autoplay: play() })
        .add(".sx-sun", { scale: [0.8, 1.15, 0.8], duration: 2400, ease: "inOutSine" }, 0)
        .add(".sx-tint", { opacity: [0, 0.75], duration: 900, ease: "outQuad" }, 200)
        .add(".sx-tint", { opacity: 0, duration: 1100, ease: "inQuad" }, 1500);
      createTimeline({ loop: true, alternate: true, autoplay: play() })
        .add(".sx-eye", { rx: [44, 62], cx: [96, 114], duration: 1600, ease: "inOutQuad" }, 0)
        .add(".sx-retina", { translateX: [0, 36], duration: 1600, ease: "inOutQuad" }, 0);
      createTimeline({ loop: true, autoplay: play(), loopDelay: 600 })
        .add(".sx-dot", { scale: [0, 1], duration: 400, delay: stagger(60), ease: "outBack" }, 0)
        .add(svg.createDrawable(".sx-front"), { draw: ["0 0", "0 1"], duration: 900, ease: "inOutQuad" }, 700);
    });
    return () => scope.revert();
  }, []);
  const dots = [[24, 30], [40, 70], [52, 44], [66, 82], [78, 58], [92, 88], [104, 40], [118, 76], [130, 92], [146, 64], [160, 96], [176, 84], [36, 52], [88, 66]];
  return (
    <section className="stack" data-section ref={root}>
      <div className="section-head center">
        <span data-reveal><Hud tone="violet">Deeper than a try-on</Hud></span>
        <h2 data-reveal>Physics, chemistry, biology and math, not adjectives.</h2>
        <p className="text-2" data-reveal>Every claim a store makes about a lens can be computed. Refract does the computing and shows its working.</p>
      </div>
      <div className="grid g4">
        {SCIENCE.map((x, i) => (
          <Card key={x.k} className="sci-card interactive" data-reveal>
            <svg viewBox="0 0 200 110" className="sci-svg" aria-hidden="true">
              {i === 0 && <g><polygon points="70,20 40,92 100,92" fill="rgba(34,211,238,.18)" stroke="var(--cyan)" /><line x1="0" y1="66" x2="58" y2="58" stroke="#fff" strokeWidth="2" />{["#ff3355", "#ffb020", "#3dfc8a", "#3d8bff", "#9b6bff"].map((c, j) => <line key={c} className="sx-ray" x1="84" y1="60" x2="190" y2={66 + j * 3} stroke={c} strokeWidth="2" />)}</g>}
              {i === 1 && <g><circle className="sx-sun" cx="160" cy="26" r="13" fill="#ffd34d" style={{ transformBox: "fill-box", transformOrigin: "center" }} /><ellipse cx="80" cy="60" rx="52" ry="36" fill="rgba(255,255,255,.08)" stroke="var(--text-2)" strokeWidth="3" /><ellipse className="sx-tint" cx="80" cy="60" rx="50" ry="34" fill="#3a2f2a" opacity="0" /></g>}
              {i === 2 && <g><ellipse className="sx-eye" cx="96" cy="55" rx="44" ry="40" fill="rgba(255,255,255,.05)" stroke="var(--cyan)" strokeWidth="2" /><line x1="0" y1="40" x2="62" y2="40" stroke="#fff" opacity=".6" /><line x1="0" y1="70" x2="62" y2="70" stroke="#fff" opacity=".6" /><line x1="62" y1="40" x2="138" y2="55" stroke="#fff" opacity=".6" /><line x1="62" y1="70" x2="138" y2="55" stroke="#fff" opacity=".6" /><path className="sx-retina" d="M136 24 Q146 55 136 86" fill="none" stroke="var(--pink)" strokeWidth="3" /></g>}
              {i === 3 && <g>{dots.map(([x, y]) => <circle key={`${x}${y}`} className="sx-dot" cx={x} cy={y} r="4" fill="var(--rose)" opacity=".6" style={{ transformBox: "fill-box", transformOrigin: "center" }} />)}<path className="sx-front" d="M24 30 L36 52 L52 44" fill="none" /><path className="sx-front" d="M24 30 L52 44 L104 40" fill="none" stroke="var(--cyan)" strokeWidth="2.5" /></g>}
            </svg>
            <Hud tone="pink">{x.k}</Hud>
            <b>{x.t}</b>
            <p className="small text-2">{x.b}</p>
            <a className="btn sm" href={x.to}>{x.cta}<ArrowRight size={14} /></a>
          </Card>
        ))}
      </div>
    </section>
  );
}

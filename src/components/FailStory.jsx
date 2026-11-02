// "Four ways new glasses go wrong": a sticky stage whose anime.js timeline is scrubbed by the
// scroll position (ScrollObserver, smoothed). Numbers are the engine's, for a −6 to −7 Rx.
import { useEffect, useRef } from "react";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { createScope, createTimeline, onScroll, svg, eases } from "animejs";
import { Hud } from "../ui";
import { reduced } from "../lib/anim";
import { lensPath } from "./QuickCheck";

const ACTS = [
  { k: "Look", title: "Thick edges, smaller eyes", body: "A −6 lens in a big frame can be 9 mm thick at the edge and make your eyes look about 8% smaller to everyone you meet. Most people find out when the parcel arrives.", fix: "Refract calculates your exact lens edge, weight and eye size for every frame, from your sphere, cylinder and axis.", stat: "lens maths, per eye" },
  { k: "Sight", title: "Rainbow edges when you glance sideways", body: "Ultra-thin lenses split white light into colours. Stores sell them as the premium upgrade, yet at −6 they cost about a full line on the eye chart when you look 1 cm off-centre.", fix: "Refract compares every lens material by its Abbe number and shows the colour-clean zone you'd actually get.", stat: "Prentice's rule · Winter et al. 2015" },
  { k: "Fit", title: "Glasses that slide down your nose", body: "Heavy lenses, a hard plastic bridge and oily skin mean pushing your glasses up all day. A photo try-on can't show you that.", fix: "Refract weighs grip against load: lens weight, nose-pad friction, and your skin's oiliness measured by YouCam Skin AI.", stat: "skin friction + YouCam Skin AI" },
  { k: "Measure", title: "A PD that's a few millimetres off", body: "Selfie apps guess your pupil distance to ±2–3 mm. At −7 that shifts the lens centres by about 2 prism dioptres: nearly three times the ANSI tolerance, enough for headaches.", fix: "Refract tells you when your PD isn't accurate enough for your power, and the free way to fix it.", stat: "ANSI Z80.1 tolerance" },
  { k: "Verdict", title: "One score, before you pay", body: "Refract turns all four into one remake-risk score, with a fix for each. Change the frame, the lens or the PD and watch the risk fall.", fix: "At −6: a big plastic frame, 1.74 lenses and a selfie PD score 87. A 48 mm titanium oval, 1.60 lenses and a card-measured PD score 22.", stat: "same engine as the store API" },
];
const THIN = lensPath(2, 2.4, 110, 9), THICK = lensPath(1.6, 9.2, 110, 9);
const N = ACTS.length, A = 1000;
// A number that counts between two values over [t0, t0 + d] of the timeline.
const counter = (t, t0, d, from, to) => from + (to - from) * eases.inOutQuad(Math.min(1, Math.max(0, (t - t0) / d)));

export default function FailStory() {
  const sec = useRef(null);
  const still = reduced();

  useEffect(() => {
    const root = sec.current;
    if (!root || still) return;
    const mm = root.querySelector(".s0-mm"), score = root.querySelector(".s4-num");
    const scope = createScope({ root }).add(() => {
      const tl = createTimeline({
        defaults: { ease: "inOutQuad" },
        // SVG text has no animatable innerHTML: the counters follow the timeline clock instead.
        onUpdate: (self) => {
          const t = self.currentTime;
          mm.textContent = counter(t, 120, 600, 2.4, 9.2).toFixed(1);
          score.textContent = Math.round(counter(t, 4 * A + 160, 520, 87, 22));
        },
        autoplay: onScroll({ target: root, enter: "top top", leave: "bottom bottom", sync: 0.15 }),
      });
      for (let i = 0; i < N; i++) {
        const t0 = i * A;
        if (i > 0) {
          tl.add(`.sc${i}`, { opacity: [0, 1], duration: 140 }, t0);
          tl.add(`.act${i}`, { opacity: [0, 1], translateY: [28, 0], duration: 160 }, t0);
        }
        if (i < N - 1) {
          tl.add(`.sc${i}`, { opacity: [1, 0], duration: 140 }, t0 + 860);
          tl.add(`.act${i}`, { opacity: [1, 0], translateY: [0, -28], duration: 140 }, t0 + 860);
        }
        tl.add(`.dot${i}`, { opacity: [0.3, 1], scale: [1, 1.5], duration: 80 }, t0 + (i ? 0 : 1));
        if (i < N - 1) tl.add(`.dot${i}`, { opacity: [1, 0.3], scale: [1.5, 1], duration: 80 }, t0 + 920);
      }
      // 1 · Look: the lens thickens, the eye shrinks.
      tl.add(".s0-lens", { d: [THIN, THICK], duration: 600 }, 120)
        .add(".s0-iris", { scale: [1, 0.86], duration: 500 }, 260)
        .add(".s0-pct", { opacity: [0, 1], duration: 150 }, 600);
      // 2 · Sight: white light splits at the lens edge; the letter fringes.
      tl.add(svg.createDrawable(".s1-white"), { draw: ["0 0", "0 1"], duration: 220 }, A + 120)
        .add(svg.createDrawable(".s1-ray"), { draw: ["0 0", "0 1"], duration: 300 }, A + 330)
        .add(".s1-r", { translateX: [0, -6], duration: 300 }, A + 420)
        .add(".s1-b", { translateX: [0, 6], duration: 300 }, A + 420)
        .add(".s1-note", { opacity: [0, 1], duration: 120 }, A + 640);
      // 3 · Fit: oil appears, grip drops, the glasses creep down.
      tl.add(".s2-oil", { scale: [0, 1], opacity: [0, 1], duration: 160, delay: (_, j) => j * 50 }, 2 * A + 150)
        .add(".s2-grip", { scaleX: [1, 0.38], duration: 420 }, 2 * A + 260)
        .add(".s2-glasses", { translateX: [0, 24], translateY: [0, 40], rotate: [0, 4], duration: 480 }, 2 * A + 300);
      // 4 · Measure: the lens centres drift away from the pupils.
      tl.add(".s3-ocl", { translateX: [0, -15], duration: 420 }, 3 * A + 200)
        .add(".s3-ocr", { translateX: [0, 15], duration: 420 }, 3 * A + 200)
        .add(".s3-note", { opacity: [0, 1], duration: 140 }, 3 * A + 560);
      // 5 · Verdict: the score falls as the fixes apply.
      tl.add(svg.createDrawable(".s4-arc"), { draw: ["0 0.87", "0 0.22"], duration: 520 }, 4 * A + 160)
        .add(".s4-arc", { stroke: ["#fb7185", "#34d399"], duration: 520 }, 4 * A + 160)
        .add(".s4-tick", { opacity: [0, 1], scale: [0.4, 1], duration: 110, delay: (_, j) => j * 50 }, 4 * A + 320)
        .add({ duration: 1 }, N * A - 1); // pad to the full length so the last act settles before the end
    });
    return () => scope.revert();
  }, [still]);

  return (
    <section className={`story ${still ? "static" : ""}`} ref={sec} aria-label="Four ways new glasses go wrong">
      <div className="story-sticky">
        <div className="story-stage">
          <svg viewBox="0 0 480 380" role="img" aria-label="Illustration of each failure mode">
            <defs>
              <linearGradient id="fs-glass" x1="0" x2="1"><stop offset="0" stopColor="var(--cyan)" stopOpacity=".5" /><stop offset=".5" stopColor="var(--violet)" stopOpacity=".22" /><stop offset="1" stopColor="var(--pink)" stopOpacity=".5" /></linearGradient>
              <linearGradient id="fs-glass-v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--cyan)" stopOpacity=".5" /><stop offset=".5" stopColor="var(--violet)" stopOpacity=".2" /><stop offset="1" stopColor="var(--pink)" stopOpacity=".5" /></linearGradient>
            </defs>

            <g className="sc sc0">
              <text x="240" y="44" textAnchor="middle" className="fs-cap">big frame · −6.00 · standard lens</text>
              <g transform="translate(160 200)">
                <rect x="-124" y="-26" width="14" height="52" rx="4" className="fs-rim" />
                <rect x="110" y="-26" width="14" height="52" rx="4" className="fs-rim" />
                <path className="s0-lens" d={THIN} fill="url(#fs-glass)" stroke="var(--cyan)" strokeWidth="1.5" />
                <text y="82" textAnchor="middle" className="fs-num"><tspan className="s0-mm">2.4</tspan> mm</text>
                <text y="102" textAnchor="middle" className="fs-cap">edge thickness</text>
              </g>
              <g transform="translate(380 200)">
                <path d="M-56 0 Q0 -44 56 0 Q0 44 -56 0Z" fill="rgba(255,255,255,.92)" />
                <g className="s0-iris fs-origin"><circle r="21" fill="#5b3a2a" /><circle r="9" fill="#0b0b10" /><circle cx="7" cy="-7" r="3.4" fill="#fff" opacity=".85" /></g>
                <text y="82" textAnchor="middle" className="fs-num s0-pct" opacity="0">−8%</text>
                <text y="102" textAnchor="middle" className="fs-cap">eye size, as others see it</text>
              </g>
            </g>

            <g className="sc sc1" opacity="0">
              <path d="M228 60 Q246 200 228 340 L264 340 Q246 200 264 60 Z" fill="url(#fs-glass-v)" stroke="var(--cyan)" strokeWidth="1.5" />
              <path className="s1-white" d="M20 300 L236 300" stroke="#fff" strokeWidth="3" fill="none" />
              <path className="s1-ray" d="M256 300 L470 328" stroke="#ff4d6d" strokeWidth="2.5" fill="none" />
              <path className="s1-ray" d="M256 300 L470 342" stroke="#3dfc8a" strokeWidth="2.5" fill="none" />
              <path className="s1-ray" d="M256 300 L470 356" stroke="#4d8bff" strokeWidth="2.5" fill="none" />
              <g transform="translate(372 170)" className="fs-letter">
                <text className="s1-r" fill="#ff3355" textAnchor="middle">E</text>
                <text className="s1-g" fill="#33ff88" textAnchor="middle">E</text>
                <text className="s1-b" fill="#3377ff" textAnchor="middle">E</text>
              </g>
              <text x="120" y="120" textAnchor="middle" className="fs-cap">white light in</text>
              <text x="120" y="140" textAnchor="middle" className="fs-cap">near the lens edge</text>
              <text x="372" y="226" textAnchor="middle" className="fs-cap s1-note" opacity="0">1.74 ultra-thin · Abbe 32</text>
              <text x="372" y="246" textAnchor="middle" className="fs-num-sm s1-note" opacity="0">−1 chart line</text>
            </g>

            <g className="sc sc2" opacity="0">
              <path d="M110 30 C 140 80, 178 160, 232 236 Q 250 262 230 276 L 196 280" fill="none" stroke="var(--text-2)" strokeWidth="3" strokeLinecap="round" />
              <circle className="s2-oil fs-origin" cx="168" cy="132" r="5" fill="var(--cyan)" opacity="0" />
              <circle className="s2-oil fs-origin" cx="186" cy="160" r="4" fill="var(--cyan)" opacity="0" />
              <circle className="s2-oil fs-origin" cx="204" cy="190" r="5.5" fill="var(--cyan)" opacity="0" />
              <g className="s2-glasses fs-origin">
                <rect x="190" y="70" width="16" height="78" rx="7" fill="url(#fs-glass-v)" stroke="var(--cyan)" strokeWidth="1.5" />
                <circle cx="166" cy="122" r="6" fill="var(--surface-raised)" stroke="var(--pink)" strokeWidth="2" />
                <path d="M200 78 L420 72 Q448 74 452 104" fill="none" stroke="var(--pink)" strokeWidth="5" strokeLinecap="round" />
              </g>
              <text x="280" y="290" className="fs-cap">grip vs load</text>
              <rect x="280" y="302" width="170" height="12" rx="6" fill="var(--line)" />
              <rect className="s2-grip fs-left" x="280" y="302" width="170" height="12" rx="6" fill="var(--green)" />
              <text x="280" y="336" className="fs-cap">oily skin · hard bridge</text>
              <text x="280" y="354" className="fs-cap">27 g of lenses</text>
            </g>

            <g className="sc sc3" opacity="0">
              {[150, 330].map((x) => (
                <g key={x} transform={`translate(${x} 180)`}>
                  <path d="M-58 0 Q0 -42 58 0 Q0 42 -58 0Z" fill="rgba(255,255,255,.92)" />
                  <circle r="19" fill="#3d5a7a" /><circle r="8" fill="#0b0b10" />
                </g>
              ))}
              {[["s3-ocl", 150], ["s3-ocr", 330]].map(([c, x]) => (
                <g key={c} className={c}>
                  <circle cx={x} cy="180" r="44" fill="none" stroke="var(--pink)" strokeWidth="2" strokeDasharray="5 5" />
                  <path d={`M${x - 12} 180 H${x + 12} M${x} 168 V192`} stroke="var(--pink)" strokeWidth="2.5" />
                </g>
              ))}
              <path d="M150 268 H330 M150 260 V276 M330 260 V276" stroke="var(--line-2)" strokeWidth="2" />
              <text x="240" y="296" textAnchor="middle" className="fs-cap">your PD, measured by a selfie: ±2.7 mm</text>
              <text x="240" y="80" textAnchor="middle" className="fs-num-sm s3-note" opacity="0">1.9 Δ prism · limit 0.67 Δ</text>
              <text x="240" y="100" textAnchor="middle" className="fs-cap s3-note" opacity="0">lens centres (pink) miss your pupils</text>
            </g>

            <g className="sc sc4" opacity="0">
              <circle cx="240" cy="180" r="96" fill="none" stroke="var(--line)" strokeWidth="14" />
              <circle className="s4-arc" cx="240" cy="180" r="96" fill="none" stroke="#fb7185" strokeWidth="14" strokeLinecap="round" transform="rotate(-90 240 180)" />
              <text x="240" y="196" textAnchor="middle" className="fs-big s4-num">87</text>
              <text x="240" y="222" textAnchor="middle" className="fs-cap">remake risk / 100</text>
              {[["Look", 70, 60], ["Sight", 410, 60], ["Fit", 70, 320], ["Measure", 410, 320]].map(([t, x, y]) => (
                <g key={t} className="s4-tick fs-origin" opacity="0">
                  <circle cx={x} cy={y - 5} r="13" fill="var(--green-a)" stroke="var(--green)" />
                  <path d={`M${x - 6} ${y - 5} l4 4 l8 -8`} stroke="var(--green)" strokeWidth="2.5" fill="none" />
                  <text x={x} y={y + 26} textAnchor="middle" className="fs-cap">{t}</text>
                </g>
              ))}
            </g>
          </svg>
          <div className="story-dots" aria-hidden="true">{ACTS.map((a, i) => <span key={a.k} className={`dot${i}`} />)}</div>
        </div>

        <div className="story-copy">
          {ACTS.map((a, i) => (
            <article key={a.k} className={`act act${i}`}>
              <Hud tone={i === N - 1 ? "green" : "pink"}>{String(i + 1).padStart(2, "0")} · {a.k}</Hud>
              <h3>{a.title}</h3>
              <p className="text-2">{a.body}</p>
              {a.fix && <p className="act-fix"><CheckCircle2 size={16} />{a.fix}</p>}
              <span className="pill-src">{a.stat}</span>
            </article>
          ))}
          <a className="btn primary story-cta" href="#/check">Check my glasses<ArrowRight size={16} /></a>
        </div>
      </div>
    </section>
  );
}

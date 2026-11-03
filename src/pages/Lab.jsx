// Lens Lab: what lens upgrades really do, computed rather than claimed. Ray tracing and
// dispersion (materials), thin-film interference and colour science (coatings), spectral
// transmission (blue-light filters) and reaction kinetics (photochromics).
import { useMemo, useRef, useState } from "react";
import { FlaskConical, Sparkles, Layers, Sun, ThumbsUp, ThumbsDown, Scale } from "lucide-react";
import { Card, PageHead, Hud, Seg } from "../ui";
import { useStore } from "../state/store";
import { useScrollReveal } from "../lib/anim";
import { FRAMES, getFrame } from "../engine/frames";
import { INDICES } from "../engine/optics";
import { lensPair } from "../engine/fit";
import { materialSight } from "../engine/sight";
import { MATERIALS, fresnelR, designAR } from "../engine/light";
import Prism from "../components/lab/Prism";
import Coating from "../components/lab/Coating";
import BlueLight from "../components/lab/BlueLight";
import Photochromic from "../components/lab/Photochromic";

const fmt = (v) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(2)}`;
const nearest = (n) => MATERIALS.reduce((a, b) => (Math.abs(b.n - n) < Math.abs(a.n - n) ? b : a));
const indexFor = (m) => INDICES.reduce((a, b) => (Math.abs(b.n - m.n) < Math.abs(a.n - m.n) ? b : a));

function Verdict({ tone, icon: Icon, children }) {
  return <div className={`verdict ${tone}`}><Icon size={17} /><span className="small">{children}</span></div>;
}

export default function Lab() {
  const s = useStore();
  const root = useRef(null);
  useScrollReveal(root);
  const frame = getFrame(s.lastFrame) || FRAMES[0];
  const pd = s.measure?.pd || { left: 31.5, right: 31.5 };
  const strongest = Math.max(Math.abs(s.rx.od.sph), Math.abs(s.rx.os.sph), Math.abs(s.rx.od.sph + s.rx.od.cyl), Math.abs(s.rx.os.sph + s.rx.os.cyl));
  const rows = useMemo(() => {
    const sight = materialSight({ sph: strongest, cyl: 0, axis: 0 });
    return MATERIALS.map((m) => {
      const ix = indexFor(m), p = lensPair({ frame, rx: s.rx, pd, index: ix });
      return { m, ix, edge: Math.max(p.od.maxEdge, p.os.maxEdge, p.od.centre, p.os.centre), weight: p.od.weightG + p.os.weightG, lines: sight.find((r) => r.index.n === ix.n).linesLost };
    });
  }, [frame, JSON.stringify(s.rx), pd.left, pd.right]); // eslint-disable-line react-hooks/exhaustive-deps
  const recommended = lensPair({ frame, rx: s.rx, pd }).best;
  const [mat, setMat] = useState(nearest(recommended.n));
  const row = rows.find((r) => r.m === mat);
  const thinnest = rows.reduce((a, b) => (b.edge < a.edge ? b : a));
  const mr8 = rows.find((r) => r.m.n === 1.6);
  const bareMine = (2 * fresnelR(1, mat.n)) / (1 + fresnelR(1, mat.n));
  const arMine = designAR(mat.n).luminous * 2;

  return (
    <div className="stack-lg lab" ref={root}>
      <PageHead kicker="Lens Lab · physics and chemistry" title="What you're really paying for"
        sub="Lens upgrades are sold with adjectives. Here they are computed: ray tracing, thin-film interference, colour science and reaction kinetics, each ending with a verdict for your prescription."
        right={<Hud tone="cyan">Rx {fmt(s.rx.od.sph)} / {fmt(s.rx.os.sph)} · {frame.name}</Hud>} />

      <div className="lab-picker" data-section><span data-reveal className="small text-2">Lens material</span>
        <span data-reveal><Seg options={MATERIALS.map((m) => ({ value: m.n, label: m.label.split(" ")[0] }))} value={mat.n} onChange={(n) => setMat(MATERIALS.find((m) => m.n === n))} /></span>
      </div>

      <section data-section>
        <Card title="1 · Material: why thinner means more rainbow" icon={FlaskConical} right={<Hud tone="pink">ray tracing · Cauchy · Lorentz–Lorenz</Hud>} data-reveal>
          <div className="lab-split">
            <Prism mat={mat} />
            <div className="stack-sm">
              <b>{mat.chem}</b>
              <p className="small text-2">{mat.why} The index comes from how easily the material's electrons are polarized by light (Lorentz–Lorenz). The same electronic transitions make that response depend on colour, so blue bends more than red: dispersion. More index almost always means a lower Abbe number.</p>
              <table className="lab-table">
                <thead><tr><th>In your {frame.name}</th><th>Thickest</th><th>Lenses</th><th>Sharpness off-centre</th></tr></thead>
                <tbody>{rows.map((r) => (
                  <tr key={r.m.n} className={r.m === mat ? "on" : ""} onClick={() => setMat(r.m)}>
                    <td>{r.m.label}</td><td className="num">{r.edge.toFixed(1)} mm</td><td className="num">{r.weight.toFixed(0)} g</td>
                    <td className={`num ${r.lines >= 1 ? "bad" : r.lines >= 0.6 ? "ok" : "good"}`}>−{r.lines.toFixed(2)} lines</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
          {thinnest.m.n > 1.6 && mr8 && (thinnest.edge > mr8.edge - 1.2
            ? <Verdict tone="good" icon={ThumbsDown}>At {fmt(s.rx.od.sph)} in {frame.name}, {thinnest.m.label.split(" ")[0]} is only {(mr8.edge - thinnest.edge).toFixed(1)} mm thinner than 1.60 and costs you {(thinnest.lines - mr8.lines).toFixed(2)} chart lines of side sharpness. <b>Skip the ultra-thin upgrade</b>; a smaller frame saves more.</Verdict>
            : <Verdict tone="ok" icon={Scale}>At your power, {thinnest.m.label.split(" ")[0]} saves {(mr8.edge - thinnest.edge).toFixed(1)} mm over 1.60. Worth it if the edge bothers you, at the price of {(thinnest.lines - mr8.lines).toFixed(2)} chart lines off-centre.</Verdict>)}
        </Card>
      </section>

      <section data-section>
        <Card title="2 · Anti-reflective coating: light you lose and glare others see" icon={Layers} right={<Hud tone="pink">Fresnel · thin-film interference · CIE 1931</Hud>} data-reveal>
          <Coating mat={mat} />
          <p className="small text-2">Every surface between air and plastic reflects ((n−1)/(n+1))² of the light, more for high-index plastics. A coating a quarter-wavelength thick makes the reflection from its top and bottom cancel; four alternating SiO₂/ZrO₂ layers, with thicknesses optimized here by the engine, cancel it across the whole visible spectrum. The leftover reflection at the blue and red ends is the coloured sheen you see on coated lenses: this design leaves a violet one; commercial coatings are often tuned to leave a green one instead.</p>
          <Verdict tone="good" icon={ThumbsUp}>{`Uncoated, your ${mat.label.split(" ")[0]} pair reflects ${(bareMine * 100).toFixed(1)}% of light: ghost images at night and eyes hidden in photos. Coated, about ${(arMine * 100).toFixed(1)}%. `}<b>Always get AR</b>{mat.n >= 1.6 ? ", and it should be included at this price." : "."}</Verdict>
        </Card>
      </section>

      <section data-section>
        <Card title="3 · Blue-light filters" icon={Sparkles} right={<Hud tone="pink">spectral transmission · evidence</Hud>} data-reveal>
          <BlueLight />
          <p className="small text-2">A Cochrane systematic review of 17 randomized trials (Singh et al., 2023) found that blue-light filtering lenses <b>probably make no difference to eye strain</b> from screen use in the short term (low-certainty evidence), with inconsistent results for sleep and no studies at all on macular health. Typical clear filters remove only about 10–25% of blue light (Leung et al., PLoS ONE 2017).</p>
          <Verdict tone="good" icon={ThumbsDown}><b>Skip it</b> unless you like the look: you pay for a slight yellow tint, not for less eye strain.</Verdict>
        </Card>
      </section>

      <section data-section>
        <Card title="4 · Light-reactive (photochromic) lenses" icon={Sun} right={<Hud tone="pink">photochemistry · Arrhenius kinetics</Hud>} data-reveal>
          <Photochromic />
        </Card>
      </section>
    </div>
  );
}

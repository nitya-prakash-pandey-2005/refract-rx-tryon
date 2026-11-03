// Fit through the day: a 24-hour ring, each hour coloured by the Monte Carlo chance that the
// frame creeps down at that hour's temperature (skin oil rises as it warms). Optional: today's
// hourly forecast where the shopper is (Open-Meteo, coordinates rounded to ~10 km).
import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { animate, stagger, spring } from "animejs";
import { Seg, toast } from "../ui";
import { reduced } from "../lib/anim";
import { slipDay, dayTemps, oilinessAt, SCAN_AIR_C } from "../engine/climate";

const PRESETS = { cold: { label: "Cold day", t: dayTemps(6, 6) }, mild: { label: "Mild day", t: dayTemps(22, 8) }, hot: { label: "Hot summer day", t: dayTemps(34, 8) } };
const C = 120, R = 92, W = 22;
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const color = (p) => `rgb(${(p < 0.5 ? mix([52, 211, 153], [251, 191, 36], p / 0.5) : mix([251, 191, 36], [251, 113, 133], (p - 0.5) / 0.5)).join(", ")})`; // comma form: anime parses it
function arc(h) {
  const a0 = ((h * 15 - 90 + 0.8) * Math.PI) / 180, a1 = (((h + 1) * 15 - 90 - 0.8) * Math.PI) / 180, r0 = R - W / 2, r1 = R + W / 2;
  const p = (r, a) => `${(C + r * Math.cos(a)).toFixed(2)} ${(C + r * Math.sin(a)).toFixed(2)}`;
  return `M${p(r1, a0)} A${r1} ${r1} 0 0 1 ${p(r1, a1)} L${p(r0, a1)} A${r0} ${r0} 0 0 0 ${p(r0, a0)} Z`;
}

export default function DayRing({ frame, lensWeightG, face, score }) {
  const [preset, setPreset] = useState("hot");
  const [today, setToday] = useState(null);
  const [busy, setBusy] = useState(false);
  const ring = useRef(null);
  const temps = preset === "today" && today ? today : PRESETS[preset]?.t || PRESETS.mild.t;
  const day = useMemo(() => slipDay({ frame, lensWeightG, face, score, temps }), [frame, lensWeightG, face.bridge, face.noseWidthMm, face.faceWidthMm, score, temps]); // eslint-disable-line react-hooks/exhaustive-deps
  const peak = day.hours.reduce((a, b) => (b.airC > a.airC ? b : a));

  useEffect(() => {
    const el = ring.current;
    if (!el || reduced()) return;
    const a = animate(el.querySelectorAll(".dr-seg"), { opacity: { from: 0 }, scale: { from: 0.6 }, delay: stagger(28), ease: spring({ bounce: 0.4, duration: 500 }) });
    return () => a.revert();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const el = ring.current;
    if (!el || reduced()) return;
    const a = animate(el.querySelectorAll(".dr-seg"), { fill: (_, i) => color(day.hours[i].p), delay: stagger(18), duration: 500, ease: "outQuad" });
    return () => a.pause();
  }, [day]);

  async function useToday() {
    if (!navigator.geolocation) { toast("Location isn't available in this browser.", "warn"); return; }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const lat = pos.coords.latitude.toFixed(1), lon = pos.coords.longitude.toFixed(1);
        const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m&forecast_days=1&timezone=auto`).then((x) => x.json());
        const t = r.hourly?.temperature_2m;
        if (!t || t.length < 24) throw new Error("no forecast");
        setToday(t.slice(0, 24)); setPreset("today");
      } catch { toast("Couldn't load today's forecast.", "warn"); }
      setBusy(false);
    }, () => { setBusy(false); toast("Location permission was declined.", "warn"); }, { maximumAge: 600000, timeout: 10000 });
  }

  return (
    <div className="dayring">
      <div className="row wrap" style={{ gap: 8 }}>
        <Seg options={[...Object.entries(PRESETS).map(([value, p]) => ({ value, label: p.label })), ...(today ? [{ value: "today", label: "Today, here" }] : [])]} value={preset} onChange={setPreset} />
        {!today && <button className="btn sm ghost" onClick={useToday} disabled={busy}>{busy ? <Loader2 size={14} className="spin" /> : <MapPin size={14} />}Today's weather where I am</button>}
      </div>
      <div className="dr-grid">
        <svg ref={ring} viewBox="0 0 240 240" className="lab-svg dr-ring" role="img" aria-label={`Expected ${day.expectedHours.toFixed(1)} hours of creeping in ${day.wakingHours} waking hours`}>
          {day.hours.map((x) => <path key={x.h} className="dr-seg" d={arc(x.h)} fill={color(x.p)} opacity={x.awake ? 1 : 0.35} style={{ transformBox: "fill-box", transformOrigin: "center" }}><title>{`${x.h}:00 · ${x.airC.toFixed(0)} °C · ${Math.round(x.p * 100)}% chance of creeping`}</title></path>)}
          {[0, 6, 12, 18].map((h) => { const a = ((h * 15 - 90) * Math.PI) / 180; return <text key={h} x={C + (R + 24) * Math.cos(a)} y={C + (R + 24) * Math.sin(a) + 4} textAnchor="middle" className="lab-cap">{String(h).padStart(2, "0")}</text>; })}
          <text x={C} y={C - 4} textAnchor="middle" className="dr-big">{day.expectedHours.toFixed(1)}</text>
          <text x={C} y={C + 16} textAnchor="middle" className="lab-cap">hours creeping</text>
          <text x={C} y={C + 30} textAnchor="middle" className="lab-cap">of {day.wakingHours} awake</text>
        </svg>
        <div className="stack-sm">
          <div className="dr-facts">
            <div><span className="tiny muted">Oiliness at your scan ({SCAN_AIR_C} °C)</span><b className="num">{Math.round(score)}/100</b></div>
            <div><span className="tiny muted">At {peak.h}:00, {peak.airC.toFixed(0)} °C</span><b className={`num ${oilinessAt(score, peak.airC) < score - 5 ? "bad" : ""}`}>{Math.round(oilinessAt(score, peak.airC))}/100</b></div>
            <div><span className="tiny muted">Worst hour</span><b className="num">{day.worst.h}:00 · {Math.round(day.worst.p * 100)}%</b></div>
          </div>
          <p className="small text-2">Skin makes about 10% more sebum for every °C it warms (Cunliffe et al. 1970), and sebum is a lubricant. Your YouCam oiliness was measured indoors; this runs the slip physics {day.hours.length * 300} times across the day, varying head posture and skin temperature, to show when the frame creeps down. Heat matters most for frames close to the edge; a frame that slips everywhere needs a different bridge, not cooler weather.</p>
        </div>
      </div>
    </div>
  );
}

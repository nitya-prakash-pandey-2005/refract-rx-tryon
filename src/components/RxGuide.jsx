// "How to read your prescription": a sample prescription slip; tap a column and an anime.js
// spring slides the highlight onto it while the explanation changes.
import { useEffect, useRef, useState } from "react";
import { animate, spring } from "animejs";
import { reduced } from "../lib/anim";

const COLS = [
  { k: "eye", h: "", od: "OD", os: "OS", t: "OD and OS: which eye", b: "OD is your right eye and OS your left (Latin oculus dexter and sinister). Some prescriptions just say R and L." },
  { k: "sph", h: "SPH", od: "−4.25", os: "−4.00", t: "SPH: your main power", b: "In dioptres. Minus (−) means short-sighted: the lens is thicker at the edge. Plus (+) means long-sighted: thicker in the middle. The bigger the number, the more the frame size matters." },
  { k: "cyl", h: "CYL", od: "−0.75", os: "−0.50", t: "CYL: astigmatism", b: "Extra power in one direction. If it's blank or says DS or SPH, type 0." },
  { k: "axis", h: "AXIS", od: "180", os: "175", t: "AXIS: the direction of the cylinder", b: "An angle from 0 to 180°. It only matters when CYL isn't 0; Refract uses it to shape the lens and the eye distortion." },
  { k: "add", h: "ADD", od: "—", os: "—", t: "ADD: reading power", b: "Only for varifocals and bifocals. Refract checks single-vision lenses, so you can leave it out." },
  { k: "pd", h: "PD", od: "63", os: "", t: "PD: distance between your pupils", b: "In mm. Often missing from the paper. Scan your face here, or ask your optician: at strong powers a few millimetres off causes eye strain." },
];
export const EXAMPLE_RX = { od: { sph: -4.25, cyl: -0.75, axis: 180 }, os: { sph: -4, cyl: -0.5, axis: 175 } };

export default function RxGuide({ onUse }) {
  const [on, setOn] = useState(1);
  const slip = useRef(null), mark = useRef(null);
  useEffect(() => {
    const cell = slip.current?.querySelector(`[data-col="${on}"]`);
    if (!cell || !mark.current) return;
    const to = { left: cell.offsetLeft, width: cell.offsetWidth };
    if (reduced()) { Object.assign(mark.current.style, { left: `${to.left}px`, width: `${to.width}px` }); return; }
    const a = animate(mark.current, { left: to.left, width: to.width, ease: spring({ bounce: 0.3, duration: 450 }) });
    return () => a.pause();
  }, [on]);
  const c = COLS[on];
  return (
    <div className="rxg">
      <div className="rxg-slip" ref={slip} role="tablist" aria-label="Parts of a prescription">
        <span className="rxg-mark" ref={mark} aria-hidden="true" />
        {COLS.map((col, i) => (
          <button key={col.k} data-col={i} role="tab" aria-selected={on === i} className={`rxg-col ${on === i ? "on" : ""}`} onClick={() => setOn(i)}>
            <span className="rxg-h">{col.h || "Eye"}</span>
            <span className="rxg-v">{col.od}</span>
            <span className="rxg-v">{col.os}</span>
          </button>
        ))}
      </div>
      <div className="rxg-text" role="tabpanel">
        <b>{c.t}</b>
        <p className="small text-2">{c.b}</p>
      </div>
      <div className="row wrap" style={{ gap: 8 }}>
        {COLS.map((col, i) => <button key={col.k} className={`chip ${on === i ? "on" : ""}`} onClick={() => setOn(i)}>{col.h || "OD / OS"}</button>)}
        <button className="chip" onClick={() => onUse(EXAMPLE_RX)}>Use these example numbers</button>
      </div>
    </div>
  );
}

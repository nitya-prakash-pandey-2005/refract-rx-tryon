// Front view of a frame drawn from its real contour (SVG, mm units).
import { useId } from "react";
import { frameContour } from "../engine/frames";

export default function FrameArt({ frame, height = 54 }) {
  const id = useId().replace(/:/g, "");
  const c = frameContour(frame, 72);
  const half = frame.A / 2 + frame.DBL / 2;
  const pts = (flip) => c.map(([x, y]) => `${(flip * (x + half)).toFixed(2)},${y.toFixed(2)}`).join(" ");
  const w = 2 * frame.A + frame.DBL + frame.rim * 2 + 12;
  const h = frame.B + frame.rim * 2 + 6;
  const rim = Math.max(1.1, frame.rim);
  const stroke = frame.colorway.pattern === "tortoise" ? `url(#t${id})` : `url(#g${id})`;
  return (
    <svg viewBox={`${-w / 2} ${-h / 2} ${w} ${h}`} style={{ height, width: "100%" }} role="img" aria-label={`${frame.name} frame`}>
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={frame.colorway.accent} />
          <stop offset={frame.material === "metal" ? "0.5" : "0.4"} stopColor={frame.colorway.rim} />
          <stop offset="1" stopColor={frame.material === "metal" ? frame.colorway.accent : frame.colorway.rim} />
        </linearGradient>
        <pattern id={`t${id}`} width="9" height="9" patternUnits="userSpaceOnUse">
          <rect width="9" height="9" fill={frame.colorway.rim} />
          <ellipse cx="2.5" cy="3" rx="2.2" ry="1.3" fill={frame.colorway.accent} opacity=".55" />
          <ellipse cx="7" cy="6.5" rx="1.6" ry="1" fill="#1a0d05" opacity=".6" />
        </pattern>
      </defs>
      {[-1, 1].map((f) => (
        <polygon key={f} points={pts(f)} fill="rgba(170,200,255,0.07)" stroke={stroke} strokeWidth={rim} strokeLinejoin="round" />
      ))}
      <path d={`M${-frame.DBL / 2 - 0.5},${-frame.B * 0.2} Q0,${-frame.B * 0.2 - 3} ${frame.DBL / 2 + 0.5},${-frame.B * 0.2}`} fill="none" stroke={stroke} strokeWidth={frame.material === "metal" ? 1.2 : rim * 0.85} strokeLinecap="round" />
    </svg>
  );
}

// Drag to compare two images of the same size (left = before, right = after).
import { useRef, useState } from "react";

export default function CompareSlider({ before, after, beforeLabel = "Before", afterLabel = "After", initial = 50 }) {
  const [pos, setPos] = useState(initial);
  const box = useRef(null);
  const move = (clientX) => {
    const r = box.current.getBoundingClientRect();
    setPos(Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100)));
  };
  return (
    <div
      className="compare"
      ref={box}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); move(e.clientX); }}
      onPointerMove={(e) => e.buttons && move(e.clientX)}
      role="slider" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pos)} aria-label="Compare looks" tabIndex={0}
      onKeyDown={(e) => { if (e.key === "ArrowLeft") setPos((p) => Math.max(0, p - 5)); if (e.key === "ArrowRight") setPos((p) => Math.min(100, p + 5)); }}
    >
      <img src={after} alt={afterLabel} draggable={false} />
      <img src={before} alt={beforeLabel} draggable={false} style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }} />
      <span className="compare-bar" style={{ left: `${pos}%` }} />
      <span className="compare-tag l">{beforeLabel}</span>
      <span className="compare-tag r">{afterLabel}</span>
    </div>
  );
}

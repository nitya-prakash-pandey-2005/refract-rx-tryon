// anime.js helpers. Everything respects prefers-reduced-motion.
import { useEffect } from "react";
import { animate, stagger, createDrawable } from "animejs";

export const reduced = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function reveal(root, selector = "[data-reveal]", { delay = 0 } = {}) {
  if (!root) return;
  const els = root.querySelectorAll(selector);
  if (!els.length) return;
  if (reduced()) { els.forEach((e) => { e.style.opacity = 1; }); return; }
  return animate(els, { opacity: [0, 1], translateY: [14, 0], duration: 620, delay: stagger(55, { start: delay }), ease: "outExpo" });
}

export function useReveal(ref, deps = []) {
  useEffect(() => {
    const a = reveal(ref.current);
    return () => a?.revert?.();
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}

export function drawStroke(el, { duration = 1100, delay = 0 } = {}) {
  if (!el || reduced()) return;
  const [d] = createDrawable(el);
  return animate(d, { draw: ["0 0", "0 1"], duration, delay, ease: "inOutQuad" });
}

export function countUp(el, to, { decimals = 0, duration = 900, suffix = "" } = {}) {
  if (!el) return;
  if (reduced()) { el.textContent = to.toFixed(decimals) + suffix; return; }
  const o = { v: Number(el.dataset.v || 0) };
  el.dataset.v = to;
  return animate(o, { v: to, duration, ease: "outExpo", onUpdate: () => { el.textContent = o.v.toFixed(decimals) + suffix; } });
}

// Tween a plain number and call back each frame (used for the Showroom → Your Rx morph).
export function tween(from, to, onUpdate, { duration = 1400, ease = "inOutCubic", onComplete } = {}) {
  if (reduced()) { onUpdate(to); onComplete?.(); return; }
  const o = { t: from };
  return animate(o, { t: to, duration, ease, onUpdate: () => onUpdate(o.t), onComplete });
}

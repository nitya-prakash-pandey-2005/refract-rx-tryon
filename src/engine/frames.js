// House-brand frame catalogue with real-world dimensions (boxing system, mm).
// A = lens width, B = lens height, DBL = bridge, rim = visible rim thickness on the face.
// weightG = frame without lenses; pads = adjustable silicone pads or a fixed (moulded) bridge.
// Contours describe the image-right lens (the wearer's left eye): +x is temporal, y down.

export const FRAMES = [
  { id: "nori", name: "Nori", shape: "round", A: 46, B: 42, DBL: 21, temple: 140, rim: 1.2, material: "metal", weightG: 14, pads: "adjustable",
    colorway: { name: "Brushed gold", rim: "#c9a24a", accent: "#f1d78a" }, priceUsd: 79, faceShapes: ["square", "diamond", "oblong", "heart"] },
  { id: "halden", name: "Halden", shape: "panto", A: 49, B: 42, DBL: 20, temple: 145, rim: 4.2, material: "acetate", weightG: 24, pads: "fixed",
    colorway: { name: "Havana tortoise", rim: "#5a3418", accent: "#c98a3c", pattern: "tortoise" }, priceUsd: 95, faceShapes: ["square", "heart", "oblong", "oval"] },
  { id: "oslo", name: "Oslo", shape: "rect", A: 54, B: 38, DBL: 18, temple: 145, rim: 4.6, material: "acetate", weightG: 26, pads: "fixed",
    colorway: { name: "Gloss black", rim: "#16161c", accent: "#3a3a48" }, priceUsd: 89, faceShapes: ["round", "oval", "invtriangle"] },
  { id: "tate", name: "Tate", shape: "rect", A: 52, B: 32, DBL: 19, temple: 145, rim: 1.4, material: "metal", weightG: 15, pads: "adjustable",
    colorway: { name: "Gunmetal", rim: "#5b5f6b", accent: "#a3a8b8" }, priceUsd: 85, faceShapes: ["round", "oval", "triangle"] },
  { id: "juno", name: "Juno", shape: "square", A: 56, B: 48, DBL: 18, temple: 145, rim: 5.0, material: "acetate", weightG: 30, pads: "fixed",
    colorway: { name: "Ink black", rim: "#101014", accent: "#2b2b36" }, priceUsd: 110, faceShapes: ["round", "oval", "oblong"] },
  { id: "mira", name: "Mira", shape: "cat", A: 53, B: 42, DBL: 17, temple: 145, rim: 4.4, material: "acetate", weightG: 25, pads: "fixed",
    colorway: { name: "Bordeaux", rim: "#5c1426", accent: "#a8324f" }, priceUsd: 105, faceShapes: ["diamond", "heart", "round", "oval"] },
  { id: "kite", name: "Kite", shape: "aviator", A: 58, B: 50, DBL: 15, temple: 140, rim: 1.3, material: "metal", weightG: 18, pads: "adjustable",
    colorway: { name: "Polished gold", rim: "#d1ab52", accent: "#f6e2a0" }, priceUsd: 120, faceShapes: ["square", "heart", "oval", "triangle"] },
  { id: "atlas", name: "Atlas", shape: "browline", A: 51, B: 40, DBL: 21, temple: 145, rim: 5.2, material: "acetate", weightG: 22, pads: "adjustable",
    colorway: { name: "Black and silver", rim: "#141418", accent: "#b9bcc6" }, priceUsd: 99, faceShapes: ["round", "oval", "triangle"] },
  { id: "vela", name: "Vela", shape: "geo", A: 50, B: 43, DBL: 20, temple: 140, rim: 1.3, material: "metal", weightG: 14, pads: "adjustable",
    colorway: { name: "Satin silver", rim: "#aeb3bf", accent: "#e3e6ee" }, priceUsd: 92, faceShapes: ["round", "oval", "square"] },
  { id: "ines", name: "Ines", shape: "butterfly", A: 57, B: 50, DBL: 16, temple: 145, rim: 4.8, material: "acetate", weightG: 28, pads: "fixed",
    colorway: { name: "Rose crystal", rim: "rgba(232,150,170,0.42)", accent: "rgba(255,214,226,0.75)", pattern: "crystal" }, priceUsd: 115, faceShapes: ["heart", "diamond", "oval", "triangle"] },
  { id: "pico", name: "Pico", shape: "panto", A: 45, B: 39, DBL: 22, temple: 140, rim: 3.8, material: "crystal", weightG: 18, pads: "fixed", lowBridgeFit: true,
    colorway: { name: "Clear crystal", rim: "rgba(214,226,240,0.28)", accent: "rgba(255,255,255,0.62)", pattern: "crystal" }, priceUsd: 79, faceShapes: ["oblong", "square", "heart", "oval"] },
  { id: "lumen", name: "Lumen", shape: "oval", A: 50, B: 36, DBL: 19, temple: 140, rim: 1.0, material: "metal", weightG: 10, pads: "adjustable",
    colorway: { name: "Titanium", rim: "#8d8f96", accent: "#d6d8de" }, priceUsd: 129, faceShapes: ["square", "diamond", "oval", "invtriangle"] },
];

export const getFrame = (id) => FRAMES.find((f) => f.id === id);

const spow = (v, p) => Math.sign(v) * Math.abs(v) ** p;

function rawShape(shape, a) {
  const c = Math.cos(a), s = Math.sin(a);
  switch (shape) {
    case "round": return [spow(c, 2 / 2.1), spow(s, 2 / 2.1)];
    case "oval": return [spow(c, 2 / 2.4), spow(s, 2 / 2.4)];
    case "rect": return [spow(c, 2 / 7), spow(s, 2 / 7)];
    case "square": return [spow(c, 2 / 5), spow(s, 2 / 5)];
    case "browline": return [spow(c, 2 / 4.5), spow(s, 2 / (s < 0 ? 7 : 3))];
    case "panto": return [spow(c, 2 / (s < 0 ? 3.6 : 2.2)), spow(s, 2 / (s < 0 ? 4.5 : 2.1))];
    case "cat":
    case "butterfly": {
      const lift = shape === "cat" ? 0.42 : 0.3;
      const x = spow(c, 2 / 3.2), y = spow(s, 2 / (s < 0 ? 4 : 2.4));
      const t = Math.max(0, x); // temporal side
      return [x * (1 + (shape === "butterfly" ? 0.12 * t : 0)), y < 0 ? y * (1 + lift * t * t) : y * (1 - 0.18 * t)];
    }
    case "aviator": {
      const x = spow(c, 2 / 3.4), y = spow(s, 2 / (s < 0 ? 5 : 2.2));
      const nasal = Math.max(0, -x);
      return [x, y > 0 ? y * (1 + 0.35 * nasal) : y];
    }
    case "geo": {
      const seg = Math.PI / 3;
      const k = Math.cos(seg / 2) / Math.cos(((a % seg) + seg) % seg - seg / 2);
      return [c * k, s * k];
    }
    default: return [c, s];
  }
}

// Inner lens edge in mm, centred on the box centre, normalised to exactly A × B.
export function frameContour(frame, steps = 96) {
  const pts = [];
  for (let i = 0; i < steps; i++) pts.push(rawShape(frame.shape, (i / steps) * Math.PI * 2 + 1e-4));
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  return pts.map(([x, y]) => [((x - x0) / (x1 - x0) - 0.5) * frame.A, ((y - y0) / (y1 - y0) - 0.5) * frame.B]);
}

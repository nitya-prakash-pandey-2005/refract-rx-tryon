// Canvas helpers for photos: load, downscale, crop and light measurement.

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load the image."));
    img.src = src;
  });
}

export function toCanvas(source, w, h, crop) {
  const c = document.createElement("canvas");
  c.width = Math.round(w);
  c.height = Math.round(h);
  const ctx = c.getContext("2d");
  if (crop) ctx.drawImage(source, crop.x, crop.y, crop.w, crop.h, 0, 0, c.width, c.height);
  else ctx.drawImage(source, 0, 0, c.width, c.height);
  return c;
}

export function sizeOf(source) {
  return { w: source.videoWidth || source.naturalWidth || source.width, h: source.videoHeight || source.naturalHeight || source.height };
}

// Downscale so the long side is at most maxSide; returns { canvas, w, h }.
export function fit(source, maxSide = 1600) {
  const { w, h } = sizeOf(source);
  const k = Math.min(1, maxSide / Math.max(w, h));
  const canvas = toCanvas(source, w * k, h * k);
  return { canvas, w: canvas.width, h: canvas.height };
}

export const jpeg = (canvas, q = 0.88) => canvas.toDataURL("image/jpeg", q);

export function cropDataUrl(source, crop, maxSide = 1600) {
  const k = Math.min(1, maxSide / Math.max(crop.w, crop.h));
  return jpeg(toCanvas(source, crop.w * k, crop.h * k, crop), 0.9);
}

// Mean luminance of the face box and of its left/right halves (0..255).
const probe = document.createElement("canvas");
probe.width = 48;
probe.height = 48;
export function faceLuma(source, box) {
  if (!box || box.w < 4) return null;
  const ctx = probe.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(source, box.x, box.y, box.w, box.h, 0, 0, 48, 48);
  const d = ctx.getImageData(0, 0, 48, 48).data;
  let all = 0, l = 0, r = 0;
  for (let y = 0; y < 48; y++)
    for (let x = 0; x < 48; x++) {
      const i = (y * 48 + x) * 4;
      const v = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
      all += v;
      if (x < 24) l += v; else r += v;
    }
  return { mean: all / 2304, left: l / 1152, right: r / 1152 };
}

export function boxOf(landmarks, W, H) {
  const xs = landmarks.map((p) => p.x * W), ys = landmarks.map((p) => p.y * H);
  const x = Math.min(...xs), y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}

// Average skin colour from both cheeks (for concealer shade), as #RRGGBB.
export function cheekHex(source, landmarks, W, H) {
  const ctx = probe.getContext("2d", { willReadFrequently: true });
  let r = 0, g = 0, b = 0, n = 0;
  for (const i of [50, 280, 101, 330]) {
    const p = landmarks[i];
    if (!p) continue;
    const s = W * 0.025;
    ctx.drawImage(source, p.x * W - s, p.y * H - s, 2 * s, 2 * s, 0, 0, 8, 8);
    const d = ctx.getImageData(0, 0, 8, 8).data;
    for (let k = 0; k < d.length; k += 4) { r += d[k]; g += d[k + 1]; b += d[k + 2]; n++; }
  }
  if (!n) return null;
  return "#" + [r, g, b].map((v) => Math.round(v / n).toString(16).padStart(2, "0")).join("").toUpperCase();
}

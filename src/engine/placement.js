// Where the frame and lenses sit on the photo, and how a lens bends what's behind it.
// Pure geometry (no DOM) so it can be tested and reused by the compositor.
import { frameContour } from "./frames.js";
import { PUPIL_ABOVE_BOX_CENTRE } from "./fit.js";

export const EYE_DEPTH_M = 0.012; // cornea sits ~12 mm behind the lens
export const DEPTH_GAIN = 0.00035; // m of extra depth per mm away from the optical centre (face curves away)

export function placeFrame({ landmarks, W, H, mmPerPx, frame, rx }) {
  const P = (i) => ({ x: landmarks[i].x * W, y: landmarks[i].y * H });
  const od = P(468), os = P(473), nasion = P(168);
  const gap = Math.hypot(os.x - od.x, os.y - od.y);
  const u = { x: (os.x - od.x) / gap, y: (os.y - od.y) / gap }; // along the eye line, image-right
  const v = { x: -u.y, y: u.x }; // perpendicular, image-down
  const pxPerMm = 1 / mmPerPx;
  const proj = (p) => (p.x - nasion.x) * u.x + (p.y - nasion.y) * u.y;
  const mono = { od: -proj(od) * mmPerPx, os: proj(os) * mmPerPx }; // as seen in this photo
  const contour = frameContour(frame);
  const toPx = (oc, mx, my) => [oc.x + (mx * u.x + my * v.x) * pxPerMm, oc.y + (mx * u.y + my * v.y) * pxPerMm];

  const lens = (side, oc) => {
    const flip = side === "od" ? -1 : 1; // od = wearer's right eye = image-left lens
    const dec = (frame.A + frame.DBL) / 2 - mono[side];
    const poly = contour.map(([x, y]) => toPx(oc, flip * (x + dec), y + PUPIL_ABOVE_BOX_CENTRE));
    const th = (((rx?.[side]?.axis ?? 0) * Math.PI) / 180);
    const axis = { x: Math.cos(th) * u.x - Math.sin(th) * v.x, y: Math.cos(th) * u.y - Math.sin(th) * v.y };
    const [bx, by] = toPx(oc, flip * dec, PUPIL_ABOVE_BOX_CENTRE);
    return { side, oc, poly, axis, flip, boxCentre: { x: bx, y: by }, dec };
  };

  return {
    u, v, pxPerMm, mmPerPx, nasion, mono,
    roll: (Math.atan2(u.y, u.x) * 180) / Math.PI,
    lenses: { od: lens("od", od), os: lens("os", os) },
    temples: { od: P(127), os: P(356) },
    toPx,
  };
}

// For a pixel inside a lens, where in the original photo does its light come from?
// t morphs from 0 (no lens power, "showroom") to 1 (your prescription).
export function warpSource(px, py, lens, power, mmPerPx, t = 1) {
  const dx = px - lens.oc.x, dy = py - lens.oc.y;
  const d = EYE_DEPTH_M + DEPTH_GAIN * Math.hypot(dx, dy) * mmPerPx;
  const ma = 1 / (1 - d * power.sph * t);
  const mp = 1 / (1 - d * (power.sph + power.cyl) * t);
  const ax = lens.axis.x, ay = lens.axis.y;
  const a = dx * ax + dy * ay, p = -dx * ay + dy * ax;
  return { x: lens.oc.x + (a / ma) * ax - (p / mp) * ay, y: lens.oc.y + (a / ma) * ay + (p / mp) * ax };
}

// Shader inputs for the live GPU mirror: the same quantities warpSource uses, per eye.
// fa = power along the cylinder axis, fp = power across it (both already scaled by t).
export function lensUniforms(place, rx, t = 1) {
  const eye = (side) => {
    const L = place.lenses[side];
    return { oc: [L.oc.x, L.oc.y], axis: [L.axis.x, L.axis.y], fa: rx[side].sph * t + 0, fp: (rx[side].sph + rx[side].cyl) * t + 0 };
  };
  return { od: eye("od"), os: eye("os"), mmPerPx: place.mmPerPx, depth: [EYE_DEPTH_M, DEPTH_GAIN] };
}

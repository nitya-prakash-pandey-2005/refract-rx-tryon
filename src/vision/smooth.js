// Exponential smoothing for live landmarks so frames don't jitter. Resets when the face
// disappears or after a long gap, so the frames snap to the face instead of sliding in.
export function smoother(alpha = 0.5, resetMs = 300) {
  let prev = null, last = -Infinity;
  return (points, now) => {
    if (!points) { prev = null; return null; }
    if (!prev || prev.length !== points.length || now - last > resetMs) {
      prev = points.map(({ x, y, z }) => ({ x, y, z }));
    } else {
      for (let i = 0; i < points.length; i++) {
        const p = prev[i], q = points[i];
        p.x += alpha * (q.x - p.x);
        p.y += alpha * (q.y - p.y);
        p.z += alpha * (q.z - p.z);
      }
    }
    last = now;
    return prev;
  };
}

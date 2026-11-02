// Runs the order simulation off the main thread so the dashboard stays smooth.
import { simulateOrders } from "../engine/simulate.js";

self.onmessage = (e) => {
  const { orders, summary } = simulateOrders(e.data);
  self.postMessage({ summary, orders: orders.map(({ id, frameId, score, fixedScore, level, parts, rx }) => ({ id, frameId, score, fixedScore, level, parts, se: rx.od.sph + rx.od.cyl / 2 })) });
};

// App state in one small store, persisted to localStorage (photos never leave the browser
// except to run a YouCam task). Components read with useStore(); write with setStore().
import { useSyncExternalStore } from "react";
import { setCustomFrame } from "../engine/frames";

const KEY = "refract.v1";
export const DEFAULT_RX = { od: { sph: -6.5, cyl: -0.75, axis: 180 }, os: { sph: -6.0, cyl: -0.5, axis: 175 } };
const DEFAULT = {
  photo: null, // { src: dataURL, w, h, source: "camera" | "upload" | "demo" }
  landmarks: null,
  measure: null,
  rx: DEFAULT_RX,
  rxConfirmed: false,
  faceAttr: null,
  skin: null,
  looks: {}, // { rx: { image, ... }, generic: { image, ... } }
  ledger: [], // YouCam calls: { feature, units, ms, at, source }
  bag: [],
  persona: null, // demo persona id when replaying recorded data
  index: null, // chosen lens index n
  lastFrame: "pico",
  customFrame: null, // { A, DBL, temple, B?, shape, material }: a frame from any store, by its printed size
  myGlasses: null, // the pair the shopper wears today: { A, DBL, temple, shape, material, n? }
};

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : { ...DEFAULT };
  } catch {
    return { ...DEFAULT };
  }
}

let state = load();
setCustomFrame(state.customFrame);
const subs = new Set();

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    try { localStorage.setItem(KEY, JSON.stringify({ ...state, looks: {} })); } catch { /* storage full or blocked */ }
  }
}

export const getStore = () => state;
export function setStore(patch) {
  const prev = state;
  state = { ...state, ...(typeof patch === "function" ? patch(state) : patch) };
  if (state.customFrame !== prev.customFrame) setCustomFrame(state.customFrame);
  save();
  subs.forEach((f) => f());
}
export function resetStore() {
  state = { ...DEFAULT };
  setCustomFrame(null);
  save();
  subs.forEach((f) => f());
}
const subscribe = (f) => { subs.add(f); return () => subs.delete(f); };
export const useStore = () => useSyncExternalStore(subscribe, () => state);

export const logCall = (entry) => setStore((s) => ({ ledger: [{ at: Date.now(), ...entry }, ...s.ledger].slice(0, 40) }));
export const hasProfile = (s) => Boolean(s.photo && s.measure);

// Embed mode: Refract running inside a store's modal (public/embed.js opens it with ?embed=1).
export const isEmbed = () => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("embed") === "1";
export const storeHost = () => new URLSearchParams(window.location.search).get("store") || "the store";

const parentOrigin = () => { try { return new URL(document.referrer).origin; } catch { return "*"; } };

// Esc inside the try-on should close the store's modal too (keys don't cross iframes).
export function bridgeEscape() {
  if (!isEmbed() || window.parent === window) return () => {};
  const onKey = (ev) => { if (ev.key === "Escape") window.parent.postMessage({ type: "refract:close" }, parentOrigin()); };
  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}

// Tell the host store what the shopper chose. The store's page decides what to do with it.
export function sendToStore(item) {
  if (!isEmbed() || window.parent === window) return false;
  window.parent.postMessage({ type: "refract:add-to-cart", item }, parentOrigin());
  return true;
}

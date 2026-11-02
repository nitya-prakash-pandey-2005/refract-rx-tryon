// Embed mode: Refract running inside a store's modal (public/embed.js opens it with ?embed=1).
export const isEmbed = () => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("embed") === "1";
export const storeHost = () => new URLSearchParams(window.location.search).get("store") || "the store";

// Tell the host store what the shopper chose. The store's page decides what to do with it.
export function sendToStore(item) {
  if (!isEmbed() || window.parent === window) return false;
  window.parent.postMessage({ type: "refract:add-to-cart", item }, "*");
  return true;
}

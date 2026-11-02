// "Check with Refract" bookmarklet: on any glasses web page, finds the frame size (the selected
// text first, else the first size on the page), guesses shape and material from the product
// title, and opens Refract's check for that exact frame. Must stay self-contained: it is
// serialised with toString() and runs on the other site.
function grab(origin) {
  const sel = String(getSelection()).trim();
  const head = `${sel} ${document.title} ${document.querySelector("h1")?.innerText || ""}`;
  const text = sel || document.body.innerText;
  const m = text.match(/\b([3-6]\d)\s*(?:□|\[\s*\]|[-–xX×/|]|\s)\s*(1\d|2[0-6])(?:\s*(?:[-–/|]|\s)\s*(1[1-6]\d))?\b/);
  const pick = (pairs, d) => (pairs.find(([re]) => re.test(head)) || [0, d])[1];
  const shape = pick([[/aviator|pilot/i, "aviator"], [/cat.?eye/i, "cat"], [/butterfly/i, "butterfly"], [/browline|clubmaster/i, "browline"], [/geometric|hexagon|octagon/i, "geo"], [/panto/i, "panto"], [/round|circle/i, "round"], [/oval/i, "oval"], [/square/i, "square"], [/rectang/i, "rect"]], "rect");
  const material = pick([[/titanium/i, "titanium"], [/metal|steel|wire|gold|silver/i, "metal"]], "acetate");
  const q = new URLSearchParams({ size: m ? [m[1], m[2], m[3]].filter(Boolean).join("-") : "", shape, material, from: location.hostname });
  open(`${origin}/#/check/custom?${q}`, "_blank");
}

export const bookmarklet = (origin) => `javascript:${encodeURIComponent(`(${grab.toString()})(${JSON.stringify(origin)})`)}`;
export { grab as findFrameOnPage };

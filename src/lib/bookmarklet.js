// "Check with Refract" bookmarklet: on any glasses web page, finds the frame size, guesses shape
// and material from the product title, and opens Refract's check for that exact frame.
// Where it looks, in order: the selected text, the blocks around the product title (<h1>), then
// the whole page. In each it prefers a labelled size ("Lens width 52 · Bridge 18 · Temple 145")
// and skips prices and return windows ("$50 | 14-day returns").
// Must stay self-contained: it is serialised with toString() and runs on the other site.
function grab(origin) {
  const sel = String(getSelection()).trim();
  const h1 = document.querySelector("h1");
  const head = `${sel} ${document.title} ${h1?.innerText || ""}`;
  const S = "\\s*(?:□|\\[\\s*\\]|[-‐‑–—xX×/|]|\\s)\\s*";
  const plain = new RegExp(`(^|[^$€£₹\\d.])\\b([3-6]\\d)${S}(1\\d|2[0-6])\\b(?![-‐‑–\\s]*days?\\b)(?:${S}(1[1-6]\\d)\\b)?`, "g");
  const label = /lens(?:\s*width)?\D{0,10}?(\d{2})\b[\s\S]{0,40}?bridge\D{0,10}?(\d{2})\b(?:[\s\S]{0,40}?(?:temple|arm)(?:\s*length)?\D{0,10}?(\d{3})\b)?/i;
  const find = (t) => {
    const l = t.match(label);
    if (l) return [l[1], l[2], l[3]];
    const all = [...t.matchAll(plain)];
    const m = all.find((x) => x[4]) || all[0];
    return m && [m[2], m[3], m[4]];
  };
  const texts = [sel];
  for (let el = h1?.parentElement, i = 0; el && el !== document.body && i < 6; el = el.parentElement, i++) texts.push(el.innerText);
  texts.push(document.body.innerText);
  let size = null;
  for (const t of texts) if (t && !size) size = find(t);
  const pick = (pairs, d) => (pairs.find(([re]) => re.test(head)) || [0, d])[1];
  const shape = pick([[/\b(aviator|pilot)\b/i, "aviator"], [/\bcat[\s-]?eye\b/i, "cat"], [/\bbutterfly\b/i, "butterfly"], [/\b(browline|clubmaster)\b/i, "browline"], [/\b(geometric|hexagon\w*|octagon\w*)\b/i, "geo"], [/\bpantos?\b/i, "panto"], [/\b(round|circle)\b/i, "round"], [/\boval\b/i, "oval"], [/\bsquare\b/i, "square"], [/\brectang\w*/i, "rect"]], "rect");
  const material = pick([[/\btitanium\b/i, "titanium"], [/\b(acetate|plastic|tr-?90|nylon)\b/i, "acetate"], [/\b(metal|steel|wire)\b/i, "metal"]], "acetate");
  const q = new URLSearchParams({ size: size ? size.filter(Boolean).join("-") : "", shape, material, from: location.hostname });
  open(`${origin}/#/check/custom?${q}`, "_blank");
}

export const bookmarklet = (origin) => `javascript:${encodeURIComponent(`(${grab.toString()})(${JSON.stringify(origin)})`)}`;
export { grab as findFrameOnPage };

import { test } from "node:test";
import assert from "node:assert/strict";
import { findFrameOnPage, bookmarklet } from "../src/lib/bookmarklet.js";

// Run the bookmarklet against a fake page and return the Refract URL it opens.
function run({ selection = "", title = "", h1 = "", body = "" }) {
  let opened = null;
  Object.assign(globalThis, {
    getSelection: () => selection,
    document: { title, querySelector: () => (h1 ? { innerText: h1 } : null), body: { innerText: body } },
    location: { hostname: "shop.example" },
    open: (u) => { opened = u; },
  });
  findFrameOnPage("https://refract.app");
  const url = new URL(opened.replace("/#/", "/"));
  return Object.fromEntries(url.searchParams);
}

test("reads the selected product: size, shape and material", () => {
  const q = run({ selection: "Kite Aviator · Polished gold metal · 58□15 140" });
  assert.deepEqual(q, { size: "58-15-140", shape: "aviator", material: "metal", from: "shop.example" });
});

test("falls back to the page title and the first size on the page", () => {
  const q = run({ title: "Ellis Round Titanium Glasses", body: "Free shipping\nFrame size 49-21-145 · Lens height 42 mm" });
  assert.equal(q.size, "49-21-145");
  assert.equal(q.shape, "round");
  assert.equal(q.material, "titanium");
});

test("an empty size when the page has none, so the app can say so", () => {
  const q = run({ title: "Our story", body: "Founded in 2010 with 140 stores" });
  assert.equal(q.size, "");
});

test("the bookmarklet is a single javascript: URL", () => {
  const b = bookmarklet("https://refract.app");
  assert.ok(b.startsWith("javascript:"));
  assert.ok(!/\s/.test(b), "no raw whitespace");
});

test("prefers a labelled size over prices and return windows elsewhere on the page", () => {
  const q = run({ title: "Ellis Glasses", body: "Free shipping on orders over $50 | 14-day returns\nEllis\nLens width 52 mm / Bridge 20 mm / Temple 145 mm" });
  assert.equal(q.size, "52-20-145");
});

test("reads labelled sizes, unusual hyphens and box separators", () => {
  assert.equal(run({ selection: "Lens width: 52 mm · Bridge: 18 mm · Temple: 145 mm" }).size, "52-18-145");
  assert.equal(run({ selection: "Size 52‑18‑140" }).size, "52-18-140");
  assert.equal(run({ selection: "52□18□145" }).size, "52-18-145");
});

test("colour names and words inside words don't decide material or shape", () => {
  const q = run({ title: "Background story: Tortoise Gold Acetate", body: "Size 51-20-145" });
  assert.equal(q.material, "acetate");
  assert.equal(q.shape, "rect");
});

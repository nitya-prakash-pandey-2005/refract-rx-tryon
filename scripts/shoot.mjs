// Visual check: drive the app in headless Chrome and save screenshots.
// Usage: node scripts/shoot.mjs <photo.jpg> <outDir> [routes...]
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

const [photo, outDir = "shots", ...routes] = process.argv.slice(2);
const BASE = process.env.BASE || "http://localhost:5190";
const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--use-gl=angle", "--enable-unsafe-swiftshader", "--autoplay-policy=no-user-gesture-required"] });
const page = await browser.newPage();
const errors = [];
page.on("console", (m) => { if (m.type() === "error" && !/XNNPACK|TensorFlow Lite/.test(m.text())) errors.push(m.text()); });
page.on("pageerror", (e) => errors.push(String(e)));
await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 });
await page.goto(`${BASE}/#/scan`, { waitUntil: "networkidle0" });
if (photo) {
  const input = await page.$("input[type=file]");
  await input.uploadFile(photo);
  await page.waitForFunction(() => location.hash.startsWith("#/rx"), { timeout: 60000 });
}
const list = routes.length ? routes : ["/", "/scan", "/rx", "/profile", "/frames", "/studio", "/agent", "/bag", "/retail"];
for (const r of list) {
  for (const [w, h, tag] of [[1440, 1000, "desktop"], [390, 844, "phone"]]) {
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
    await page.goto(`${BASE}/#${r}`, { waitUntil: "networkidle0" });
    await new Promise((res) => setTimeout(res, r.startsWith("/studio") ? 3200 : r === "/" ? 4200 : 1200));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    const name = `${outDir}/${(r.replace(/\//g, "_") || "_home").replace(/^_/, "") || "home"}-${tag}.png`;
    await page.screenshot({ path: name, fullPage: tag === "desktop" ? false : false });
    console.log(`${name}${overflow ? "  ⚠ horizontal overflow" : ""}`);
  }
}
console.log(errors.length ? `console errors:\n${[...new Set(errors)].join("\n")}` : "console: clean");
await browser.close();

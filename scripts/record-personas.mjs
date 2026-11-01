// Record real YouCam responses for the sample profiles (judge/replay mode).
// 1) Put YOUCAM_API_KEY in .env   2) RECORD=1 npm run dev   3) node scripts/record-personas.mjs
// Costs about 35–40 units per profile. Results land in public/replay/.
import puppeteer from "puppeteer-core";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.BASE || "http://localhost:5190";
const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PEOPLE = [
  { id: "lena", photo: "public/demo/lena.jpg", preset: "−6.50 strong" },
  { id: "helen", photo: "public/demo/helen.png", preset: "+3.00 reading" },
].filter((p) => !process.argv[2] || p.id === process.argv[2]);

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new" });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1000 });
page.on("console", (m) => { if (m.type() === "error" && !/XNNPACK|TensorFlow Lite/.test(m.text())) console.log("  console:", m.text()); });

for (const p of PEOPLE) {
  console.log(`Recording ${p.id}…`);
  await page.goto(`${BASE}/#/scan`, { waitUntil: "networkidle0" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle0" });
  await (await page.$("input[type=file]")).uploadFile(path.join(here, "..", p.photo));
  await page.waitForFunction(() => location.hash.startsWith("#/rx"), { timeout: 60000 });
  await page.evaluate((label) => [...document.querySelectorAll("button.chip")].find((b) => b.textContent.includes(label))?.click(), p.preset);
  await page.goto(`${BASE}/#/profile?record=${p.id}`, { waitUntil: "networkidle0" });
  await page.evaluate(() => [...document.querySelectorAll(".page-head button")].find((b) => /Run YouCam/.test(b.textContent))?.click());
  await page.waitForFunction(() => document.querySelector(".compare") || [...document.querySelectorAll(".toast")].some((t) => /failed|isn't|couldn't|out of units|too/i.test(t.textContent)), { timeout: 300000, polling: 1000 });
  const result = await page.evaluate(() => ({ ok: !!document.querySelector(".compare"), toast: [...document.querySelectorAll(".toast")].map((t) => t.textContent).join(" | "), ledger: [...document.querySelectorAll(".li .t")].map((e) => e.textContent).slice(0, 6) }));
  console.log(`  ${result.ok ? "done" : "FAILED"} ${result.toast}`);
}
await browser.close();

// Devpost gallery: drives the running app (npm run dev) in headless Chrome and writes every
// screenshot in story order to docs/screenshots. A Y4M clip stands in for the webcam.
// Usage: node scripts/gallery.mjs <face.y4m> [outDir]
import puppeteer from "puppeteer-core";
import { mkdirSync, readFileSync } from "node:fs";

const [y4m, out = "docs/screenshots"] = process.argv.slice(2);
const B = process.env.BASE || "http://localhost:5190";
const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
mkdirSync(out, { recursive: true });

const cam = y4m ? ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", `--use-file-for-fake-video-capture=${y4m}`] : [];
const b = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: [...cam, "--use-gl=angle", "--enable-unsafe-swiftshader", "--hide-scrollbars"] });
const p = await b.newPage();
const errs = [];
p.on("pageerror", (e) => errs.push(`pageerror: ${e.message}`));
p.on("console", (m) => { if (m.type() === "error" && !/XNNPACK|TensorFlow Lite|Failed to load resource/.test(m.text())) errs.push(m.text()); });
p.on("response", (r) => { if (r.status() >= 400) errs.push(`${r.status()} ${r.url()}`); });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const view = (w = 1440, h = 900) => p.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: w < 600, hasTouch: w < 600 });
const go = async (route, ms = 1200) => { await p.goto(`${B}/#${route}`, { waitUntil: "networkidle0" }); await wait(ms); };
const fresh = async () => { await go("/", 200); await p.evaluate(() => localStorage.clear()); await p.reload({ waitUntil: "networkidle0" }); };
const click = (sel, text) => p.evaluate((s, t) => [...document.querySelectorAll(s)].find((x) => x.textContent.trim().includes(t))?.click(), sel, text);
const shot = async (name) => { await p.screenshot({ path: `${out}/${name}.png` }); console.log(name); };
const scrollTo = async (sel, offset = 100, ms = 1300) => { await p.evaluate((s, o) => { const el = document.querySelector(s); scrollTo(0, el.getBoundingClientRect().top + scrollY - o); }, sel, offset); await wait(ms); };
const story = async (f) => {
  await p.evaluate((frac) => {
    const s = document.querySelector(".story"), st = document.querySelector(".story-sticky");
    scrollTo(0, s.getBoundingClientRect().top + scrollY - parseFloat(getComputedStyle(st).top) + (s.offsetHeight - st.offsetHeight) * frac);
  }, f);
  await wait(1500);
};
const persona = async (name) => { await fresh(); await click(".persona-card", name); await p.waitForFunction(() => !location.hash.match(/^#\/?$/), { timeout: 60000 }); await wait(500); };

// ---- the pitch: home ----
await view();
await fresh(); await wait(2600);
await shot("01-home");
const noFab = () => p.addStyleTag({ content: ".demo-fab { display: none !important; }" });
await noFab(); const qc = await p.$(".qc"); await qc.screenshot({ path: `${out}/.qc.png` }); await p.reload({ waitUntil: "networkidle0" }); await wait(1500);
await story(0.13); await shot("02-story-look");
await story(0.33); await shot("03-story-sight");
await story(0.53); await shot("04-story-fit");
await story(0.995); await shot("05-story-verdict");
await scrollTo(".savings", 90); await shot("06-savings");
await scrollTo(".cmp-wrap", 210); await shot("07-comparison");
await scrollTo(".who-card", 190); await shot("08-who-pays");

// ---- any frame, from any store ----
await go("/check", 800);
const href = await p.$eval(".bm-link", (a) => a.getAttribute("href"));
await p.goto(`${B}/store/index.html`, { waitUntil: "networkidle0" }); await wait(600);
await shot("14-store-integration");
const linked = await p.evaluate((code) => {
  const card = [...document.querySelectorAll(".card")].find((c) => c.innerText.includes("Kite"));
  const r = document.createRange(); r.selectNodeContents(card); getSelection().removeAllRanges(); getSelection().addRange(r);
  let url = null; window.open = (u) => { url = u; };
  (0, eval)(decodeURIComponent(code.slice("javascript:".length)));
  return url;
}, href);
await p.goto(linked, { waitUntil: "networkidle0" }); await wait(1500);
await shot("09-check-any-frame");

// ---- the shopper app, with a recorded YouCam profile ----
await persona("Lena"); await wait(3000); // let the recorded YouCam results land in the store first
// Write straight to storage and reload at once, before the app saves its in-memory state over it.
await p.evaluate(() => { const s = JSON.parse(localStorage.getItem("refract.v1")); s.rx = { od: { sph: -7.25, cyl: -0.5, axis: 180 }, os: { sph: -7, cyl: -0.5, axis: 175 } }; s.myGlasses = { A: 50, DBL: 19, temple: 140, shape: "rect", material: "metal" }; s.lastFrame = "juno"; localStorage.setItem("refract.v1", JSON.stringify(s)); location.reload(); });
await p.waitForNavigation({ waitUntil: "networkidle0" }).catch(() => {});
await go("/check/juno", 2500);
await scrollTo(".risk-hero", 84); await shot("10-fit-check");
await scrollTo(".sight-sim", 200, 800); await shot("11-sight-simulator");
await go("/studio/mira", 300); await click(".seg button", "Rx-tuned look"); await wait(3500); await shot("16-photo-try-on");
await go("/frames", 1800); await shot("19-frames-ranked");
await go("/agent", 600); await click(".suggest", "oversized"); await wait(2600); await shot("20-ask-refract-agent");
await go("/retail", 5000); await shot("21-store-dashboard");
await click("button", "Try the live API"); await wait(1500);
await scrollTo(".api-out", 380, 600); await shot("22-api-and-mcp");
await persona("Helen");
await go("/profile", 2500); await shot("17-youcam-analysis");

// ---- live, through the webcam ----
if (y4m) {
  await fresh();
  await p.evaluate(() => { const s = JSON.parse(localStorage.getItem("refract.v1") || "{}"); s.rx = { od: { sph: -9, cyl: -1, axis: 10 }, os: { sph: -8.75, cyl: -0.75, axis: 170 } }; localStorage.setItem("refract.v1", JSON.stringify(s)); });
  await go("/live/juno", 300); await p.reload({ waitUntil: "networkidle0" });
  await click("button", "Start Live Mirror"); await wait(6500); await shot("12-live-rx-mirror");
  await p.evaluate(() => document.querySelector(".stage-controls .toggle")?.click()); await wait(1500); await shot("13-live-optics-xray");
  await p.goto(`${B}/store/index.html`, { waitUntil: "networkidle0" }); await wait(500);
  await p.click('#grid [data-refract-sku="mira"]'); await wait(3000);
  const f = p.frames().find((x) => x.url().includes("embed=1"));
  await f.evaluate(() => [...document.querySelectorAll("button")].find((x) => x.textContent.includes("Start Live Mirror"))?.click()); await wait(6500);
  await shot("15-store-modal-live");
}

// ---- phone ----
await view(390, 844);
await fresh(); await noFab(); await wait(2200); await p.screenshot({ path: `${out}/.ph1.png` });
await story(0.33); await p.screenshot({ path: `${out}/.ph2.png` });
await scrollTo(".qc", 70, 1200); await p.screenshot({ path: `${out}/.ph3.png` });

// ---- composites: phone strip and cover ----
const data = (f) => `data:image/png;base64,${readFileSync(`${out}/${f}`).toString("base64")}`;
const icon = `data:image/svg+xml;base64,${readFileSync("public/icons/icon.svg").toString("base64")}`;
const bg = "background:#05060f;font-family:'Segoe UI',system-ui,sans-serif;color:#e9ecf8;overflow:hidden;position:relative;margin:0";
const glow = `<div style="position:absolute;inset:0;background:radial-gradient(600px 420px at 12% 18%,rgba(255,77,157,.26),transparent 70%),radial-gradient(620px 460px at 92% 70%,rgba(34,211,238,.18),transparent 70%),radial-gradient(500px 400px at 50% 110%,rgba(139,92,246,.24),transparent 70%)"></div>`;
const phone = (f, x) => `<img src="${data(f)}" style="position:absolute;left:${x}px;top:46px;width:360px;border-radius:34px;border:8px solid #1b1d2b;box-shadow:0 30px 70px rgba(0,0,0,.55)">`;
await view(1440, 900);
await p.setContent(`<html><body style="${bg};width:1440px;height:900px">${glow}${phone(".ph1.png", 110)}${phone(".ph3.png", 540)}${phone(".ph2.png", 970)}</body></html>`); await wait(300);
await shot("18-phone");
const pill = (t) => `<span style="padding:7px 12px;border:1px solid rgba(255,255,255,.14);border-radius:999px">${t}</span>`;
await view(1280, 640);
await p.setContent(`<html><body style="${bg};width:1280px;height:640px">${glow}
<div style="position:absolute;left:64px;top:62px;width:560px">
  <div style="display:flex;align-items:center;gap:14px"><img src="${icon}" width="52" height="52"><span style="font-size:38px;font-weight:700;letter-spacing:-.02em">Refract</span></div>
  <div style="margin-top:30px;font-size:56px;font-weight:700;line-height:1.04;letter-spacing:-.03em">Check any glasses <span style="background:linear-gradient(135deg,#ff4d9d,#a855f7,#22d3ee);-webkit-background-clip:text;color:transparent">before you buy them.</span></div>
  <div style="margin-top:22px;font-size:20px;line-height:1.45;color:#b7bdd8">A free second opinion for prescription glasses from any store: lens thickness, rainbow edges, slipping and PD, predicted from optics, physics and YouCam Skin AI. Then see it live on your face.</div>
  <div style="margin-top:24px;display:flex;gap:10px;flex-wrap:wrap;font:600 14px ui-monospace,Consolas,monospace;color:#22d3ee">${pill("Any frame, any store")}${pill("YouCam Face · Skin · Makeup")}${pill("REST API · MCP")}</div>
</div>
<img src="${data(".qc.png")}" style="position:absolute;right:56px;top:40px;height:560px;border-radius:24px;box-shadow:0 30px 80px rgba(0,0,0,.5),0 0 40px rgba(255,77,157,.25)">
</body></html>`); await wait(300);
await shot("00-cover");

console.log(errs.length ? `errors:\n${[...new Set(errs)].join("\n")}` : "gallery done, no errors");
await b.close();

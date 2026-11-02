# Refract: know your glasses will work, before you buy them

**Tagline (≤ 200 chars):** Refract predicts if prescription glasses will fail (thick edges, colour fringes, sliding off your nose, wrong PD) before checkout, and shows you live through your real lenses. Built on YouCam AI.

**Track:** eCommerce VTO
**Code:** https://github.com/nitya-prakash-pandey-2005/refract-rx-tryon

---

## Inspiration

**7.6% of prescription glasses are redone, and about 1 in 8 redos is a measurement error** (Vision Council lab and practice surveys). **15–22% of eyewear bought online comes back** (industry estimates). By 2050, **4.76 billion people will be shortsighted, 938 million of them highly** (Holden et al., *Ophthalmology* 2016). Those are the people with heavy, thick, distorting lenses.

Glasses fail in four ways nobody checks before you buy:
- **Look:** the lens edge is thick and your eyes look 8–10% smaller.
- **Sight:** a cheap high-index lens shows rainbow fringes when you glance sideways.
- **Fit:** heavy lenses on an oily nose with a fixed acetate bridge slide down all day.
- **Measure:** a PD taken from a selfie is off by ±2.7 mm, which at −7 D gives 2 prism dioptres, three times the ANSI tolerance.

Every virtual try-on, including Perfect Corp's own eyewear tool, shows frames **without lenses**, so none of this is visible. The only tools that come close are in-store optician systems costing about £28k (ZEISS VISUFIT) and a 2017 research paper.

## What it does

**1. Fit Check: will these glasses fail? (new to the web)**
A remake-risk score from four models, each explained and each with a fix:

| Model | What it checks | Built on |
|---|---|---|
| **Look** | Edge or centre thickness around the real frame shape, decentred to your PD, plus how much smaller or bigger your eyes look to others | Lens sag + spectacle magnification |
| **Sight** | Colour fringes for every lens material: a colour-clean zone and *chart lines of sharpness lost* at a 10 mm glance | Prentice's rule, Abbe number, Winter et al. *JOSA A* 2015 |
| **Fit** | Will they slide down your nose? | Physics: frame + lens weight (from your Rx) under head movement, against grip from pad friction, ear hold and temple clamp. **Pad friction drops on oily skin, measured by YouCam Skin AI.** Silicone pads lose about 15% grip on oily skin; hard acetate loses about 40% (skin-tribology studies). Nose width at pad height comes from your photo. Pressure marks flagged above capillary pressure. |
| **Measure** | Can your PD be trusted at your power? | Prism induced by PD uncertainty vs the ANSI Z80.1 0.67 Δ tolerance |

What-if controls (lens material, nose bridge, oiliness, known PD) move the score live. The **Sight simulator** shows a street scene through each material, fringes and all.

**2. Live Rx Mirror: see yourself through your real lenses, live.**
A WebGL2 shader re-renders your camera through your exact sphere, cylinder and axis every frame:
- eye minification or magnification;
- the face cut-in at the lens edge;
- power rings;
- physically scaled frames that track your face, with PD measured live from your iris.

**Optics X-ray** bends a 2.5 mm grid through the lens and colours the rim by thickness.

**3. Eye makeup retuned for your lenses: the YouCam beauty layer.**
- **AI Face Analyzer** reads face shape, eyes, lids, brows and colours.
- **AI Skin Analysis** (HD when the photo allows) scores the eye area a lens magnifies: dark circles, eye bags, crow's feet, lid droop, tear trough. It also reads **oiliness**, which drives the Fit model.
- **AI Makeup VTO** renders a generic look next to an **Rx-tuned** one: brighter behind minus lenses; matte and precise behind plus lenses.

**4. A platform you can sell (SaaS).**
- **One-line store embed:** `embed.js` plus `data-refract-sku`. The demo store "Northlight" receives `refract:add-to-cart` with the frame, lens index and edge thickness.
- **REST API:** `POST /api/v1/risk` scores one frame, or ranks the catalogue.
- **MCP server:** AI shopping agents (Claude, ChatGPT) get Rx-aware tools: `rank_frames`, `remake_risk`, `lens_report`, `sight_by_material`. Existing eyewear MCP servers only do cart and checkout.
- **Retailer dashboard:**
  - a simulated order stream: 11% of orders are high risk, and Refract's fixes cut high-risk orders from 33 to 13 (−61%) and average risk by 37%;
  - an ROI calculator (7.6% redo rate × $90 per remake);
  - pricing at $49 / $199 / custom per store.
- **Catalogue Rx audit** and an Rx-suitability feed.

**Also included:** a voice-guided scan you can do without your glasses, a frame and lens-index ranker, an agent (Claude with tool use) where every number is a visible tool call, a lab-ready order sheet, and a shareable Refract card.

## How we built it

**YouCam APIs**, server-side on `yce-api-01.makeupar.com`:
- **Flow:** File API → presigned PUT → task → poll, never re-creating a task.
- **`face-attr-analysis`:** 9 features.
- **`skin-analysis` v2.1:** 7 concerns including oiliness, still in the same unit tier; HD is chosen automatically.
- **`makeup-vto`:** effects computed from your lens power.
- **Spend protection:** parameters are built server-side, with per-IP limits and a daily unit budget.
- **Robustness:** faces are auto-cropped so they fill about 70% of the frame; result images are typed from their bytes, because YouCam sends `binary/octet-stream`.

**Engine** (pure JS, shared by the app, API, MCP server and agent):
- optics: lens sag and edge thickness, weight, spectacle magnification with the iris 15 mm behind the lens, astigmatism axis;
- sight: Prentice and Abbe, calibrated to Winter 2015;
- fit physics: friction from Zhang & Mak 1999, clamp from Zhang 2024, capillary pressure threshold;
- PD prism against ANSI Z80.1;
- a seeded order simulator running in a Web Worker.

**Experiments:**
- We tested whether one selfie can measure nose-bridge height. MediaPipe's depth returned 15–16 mm for every face: a learned average, not a measurement. So we use only reliable 2D measurements (iris-scaled nose width and face width) and ask one question about the bridge.
- We fed a fake camera from a portrait video to test the GPU lens at 24–30 fps.
- We ran the risk engine across 12 frames × 4 prescriptions and 300 simulated orders.

**Rendering:** MediaPipe Face Landmarker (478 points with irises) with smoothing; a WebGL2 lens shader; Canvas 2D for frames, X-ray and the Sight simulator; **anime.js** for all motion.

**Quality:** 74 automated tests, including a real MCP client calling our server and API route tests. Three independent code reviews, with every finding fixed test-first. Headless-Chrome end-to-end runs.

## Challenges

- Getting optics to look right, not just compute right: we added depth away from the optical centre to get the real cut-in.
- Honest physics. Pure friction says weight doesn't matter, yet heavy glasses do slide. Modelling head movement (load that scales with mass) against holds that don't fixed it.
- Avoiding overclaiming. We don't show 1.74 as "clearer" (its Abbe number is 32), and we don't trust single-image depth.
- YouCam's eyewear try-on is enterprise-only, so YouCam powers the beauty and skin layer while we render the lenses.

## Accomplishments

- A remake-risk check with physics-based slip prediction that uses YouCam skin oiliness. We found nothing like it in products, patents or papers.
- The first online live try-on showing what your prescription does to your face. The research ancestor is Zhang et al., *IEEE CG&A* 2017, offline.
- A real platform: an embed, an API and an MCP server.

## What's next

- Progressive lens corridor simulation (Minkwitz).
- Validating slip predictions with a pilot store's return data.
- A Shopify app.
- Optician hand-off with the order sheet.

## Built with

React · Vite · WebGL2 · anime.js · MediaPipe · Node.js · Express · MCP SDK · Vercel · YouCam API (AI Face Analyzer, AI Skin Analysis, AI Makeup VTO) · Anthropic Claude API

**Evidence and sources:** `docs/EVIDENCE.md`. **Screenshots:** `docs/screenshots/`. Cosmetic and shopping guidance, not medical advice.

# Refract: check any glasses before you buy them

**A free second opinion for prescription glasses, from any store.** Give Refract your prescription and any frame. You can pick one from the sample catalogue, type the size printed inside any frame's arm (`52□18 140`), or tap the "Check with Refract" bookmark on any glasses product page. In seconds it tells you:
- how thick your lenses will be;
- how much smaller or bigger your eyes will look;
- whether you'll see rainbow edges;
- whether the frame will slide down your nose;
- whether your PD is accurate enough.

Each answer comes with a fix. Then it shows the pair live, on your own face, through your exact lenses.

Refract doesn't sell glasses. **Shoppers use it free; stores pay** (embed, remake-risk dashboard, REST API, MCP server), because every remake they avoid saves them a lab bill, shipping and a customer.

![Refract: check any glasses before you buy them](docs/screenshots/00-cover.png)

Built for the *YouCam API Skin AI & eCommerce VTO Hackathon* (eCommerce VTO track).

---

## Why

- **1 in 13 prescription pairs is remade** (7.6% redo rate, Vision Council), and 15–22% of eyewear bought online comes back.
- Every virtual try-on shows frames **without lenses**. Real lenses change your face: at −8 your eyes look about 9% smaller, and high-minus lenses get thick at the edge in big frames.
- Everyone who could warn you sells you the glasses. The 1.74 "ultra-thin" upgrade often costs €50–120 more, yet at −4 it saves under 1 mm, and a smaller frame with a standard 1.60 lens is thinner and sharper (see the home page).
- Shortsightedness is projected to affect about half the world by 2050 (Holden et al., *Ophthalmology*, 2016).

## What it does

| Screen | What happens |
|---|---|
| **Home** | A **5-second check** with no camera: drag your prescription on an anime.js Draggable dial and pick a frame size and lens. The real engine springs a lens cross-section to its true thickness and scores all four risks. Then **"Four ways new glasses go wrong"**, a sticky story whose anime.js timeline is scrubbed by scroll. Then **"Don't pay for thin you don't need"** (live engine bars), a comparison with store try-ons and opticians, trust, who pays, and an FAQ. |
| **Check a pair** | Remake risk for any frame. **Any frame from any store:** type its printed size, use the bookmarklet, or open a shared link (`#/check/custom?size=52-18-140&shape=rect&material=metal`). **vs the glasses you wear now:** edge and weight against your current pair. Four models, each with a fix:<ul><li>**Look:** lens thickness and eye-size change.</li><li>**Sight:** colour fringes by material (Prentice + Abbe, calibrated to Winter et al. 2015), with a **Sight simulator**.</li><li>**Fit:** slip physics from frame + lens weight, head movement, pad friction (silicone 0.61, hard about 0.45; oily skin cuts grip by 15% vs 40%), **oiliness from YouCam Skin Analysis**, nose width and temple grip.</li><li>**Measure:** PD-induced prism vs ANSI Z80.1 0.67 Δ.</li></ul>What-if controls move the score live. |
| **Live Rx Mirror** | Real-time try-on: MediaPipe face mesh + a **WebGL2 lens shader** that re-samples every pixel inside each lens through your sphere, cylinder and axis. Frames track your face and PD is measured live. **Showroom ↔ Your Rx** morphs between the lensless view and reality. **Optics X-ray** bends a 2.5 mm grid through the lens. |
| **For stores · API** | Order-risk dashboard (simulated order stream in a Web Worker), ROI calculator, pricing ($49 / $199 / custom). `POST /api/v1/risk` scores a catalogue frame, **any frame by its printed size**, or ranks the catalogue. An **MCP server** (`npm run mcp`) gives AI shopping agents `check_any_frame`, `rank_frames`, `remake_risk`, `lens_report` and `sight_by_material`. Also a catalogue × Rx audit. |
| **Store embed** | `public/embed.js`: one script tag and `data-refract-sku` on a button. Refract opens in a modal; the store receives `refract:add-to-cart` with frame, lens index and predicted edge. Demo store: `/store/index.html`. |
| **YouCam analysis** | **YouCam Face Analyzer** reads face shape and eyes. **YouCam Skin Analysis** scores oiliness (nose-pad grip) and the eye area a lens magnifies. **YouCam Makeup VTO** renders an Rx-tuned eye look next to a generic one. |
| **Photo try-on** | Your photo, or a YouCam makeup render, re-sampled through each lens per pixel, with physically scaled frames and lens-index chips that say when a thinner lens isn't worth it. |
| **Face scan** | Live face mesh with distance, centring, pose and light checks, **voice guidance and auto-capture** (you can't read the screen with your glasses off). PD from the iris. |
| **Ask Refract** | An agent (Claude `claude-opus-5-5`, tool use) whose every number is a visible tool call to the same engine. Without a key, a built-in planner answers with the same tools. |
| **Shortlist** | A lens report (frame, index, coatings, Rx, mono PD with tolerance, predicted edge) to take to any shop or optician, plus a shareable 1080×1350 card. |

## YouCam APIs used

All calls go through our server (the key never reaches the browser) on the India-reachable host `https://yce-api-01.makeupar.com`, using the full File API → task → poll flow:

| API | Endpoint | Used for | Units |
|---|---|---|---|
| AI Face Analyzer | `POST /s2s/v2.0/task/face-attr-analysis` (9 features) | Face shape for frame fit; eye shape, size, setting and eyelid for makeup placement; eye, brow and hair colour for shades | 20 |
| AI Skin Analysis | `POST /s2s/v2.1/task/skin-analysis` (HD when the face crop is ≥ 1080 px, else SD; 6 eye-area concerns, JSON + mask overlays) | Dark circles, eye bags, crow's feet/periocular lines, upper and lower lid droop, tear trough: what a plus lens magnifies | 12 / 16 |
| AI Makeup VTO | `POST /s2s/v2.0/task/makeup-vto` (eye_shadow, eye_liner, eyelashes, eyebrows, concealer, skin_smooth) | Rx-tuned look vs. generic look on the user's own photo | 1 each |

About 35–40 units per full profile. The app keeps a units ledger, and the face is auto-cropped so it fills about 70% of the width (the API requires more than 60%), which avoids `error_src_face_too_small`.

## The optics (all in `src/engine/`, unit-tested)

- Meridional power `F(θ) = S + C·sin²(θ − axis)`; spherical equivalent `S + C/2`.
- Apparent eye size seen through the lens: `m = 1 / (1 − d·F)`, with `d` = 12 mm vertex plus extra depth away from the optical centre (this produces the cut-in), applied separately along and across the cylinder axis.
- Edge thickness from lens sag `R − √(R² − r²)`, with `R = 1000(n − 1)/|F|`, around the real frame contour, with decentration from your mono PD. Minimum centre and edge thickness per material.
- Lens weight by integrating thickness over the lens shape × material density; Abbe value per index.
- PD from the iris (horizontal visible iris diameter ≈ 11.7 mm), with camera distance estimated from iris size and a convergence correction from near PD to far PD; ± tolerance shown.

## Run it

```bash
npm install
cp .env.example .env        # add YOUCAM_API_KEY (and optionally ANTHROPIC_API_KEY)
npm run dev                 # http://localhost:5190 (app + API on one port)
npm test                    # 92 tests: optics, sight, slip physics, remake risk, any-frame sizes, bookmarklet, PD, makeup, placement, API routes, MCP (real client), agent, limits
npm run mcp                 # MCP server over stdio for Claude / ChatGPT / any MCP client
npm run build               # production build in dist/
```

**No keys?** Open the app and pick a sample profile (Lena −6.50, Helen +2.75). When `public/replay/` holds recordings, the sample profiles replay real YouCam responses, labelled as recorded in the UI. To make them, run `RECORD=1 npm run dev`, then `node scripts/record-personas.mjs` (about 35–40 units per profile). The home page, Check a pair, photo try-on, frames, store dashboard and planner agent need no keys at all.

**Spend protection:** YouCam params are built on the server from fixed presets (the browser only says which analysis or look to run). Each IP gets 24 YouCam runs and 30 agent requests per 10 minutes, and a daily unit budget (`YOUCAM_DAILY_UNITS`, default 400) protects a public demo key.

**Deploy:** `vercel.json` serves the Vite build and routes `/api/*` to one serverless function (`api/index.js`). Set `YOUCAM_API_KEY` (and optionally `ANTHROPIC_API_KEY`) as environment variables.

## Project layout

```
src/engine/     optics.js, sight.js, risk.js, simulate.js, frames.js, fit.js, measure.js, placement.js, makeup.js, youcam.js  (pure, tested)
server/mcp.js   MCP server for AI shopping agents
src/vision/     landmarker.js (MediaPipe), glwarp.js (WebGL2 lens shader), compose.js (lens compositor, X-ray), smooth.js, card.js, image.js
public/         embed.js (store integration), store/ (demo store), replay/ (recorded YouCam responses)
src/pages/      Home, Check, Live, Scan, Rx, Profile, Frames, Studio, Agent, Bag (Shortlist), Retail
src/components/ QuickCheck (hero dial), FailStory (scroll story), RemakeDashboard, SightSim, HeroDemo, …
src/lib/        anim.js (anime.js helpers), bookmarklet.js, embed.js
scripts/        gallery.mjs (Devpost screenshots), record-personas.mjs
server/         youcam.js (File API, task, poll), router.js, agent.js, dev.js
api/index.js    Vercel entry
tests/          node:test suites
```

## Honest limits

- Cosmetic shopping preview, not medical advice. An optician confirms the prescription and PD.
- Frames are drawn by Refract's renderer at real scale. YouCam's eyewear try-on and glasses removal are enterprise products, not part of the self-serve API, so Refract spends the YouCam API where it adds the most: face, skin and makeup.
- A frame typed in by size gets its lens height and weight estimated from catalogue ratios unless the listing gives the height; the check says so.
- Iris-based PD has about ±4% uncertainty (shown in the app); for strong prescriptions the app suggests confirming with an optician.
- The lens model is thin-lens and spherical-surface; real aspheric designs come out somewhat thinner.

## Evidence

Sources, numbers and our own measurement experiment are in [docs/EVIDENCE.md](docs/EVIDENCE.md).

## Credits

- YouCam AI APIs by Perfect Corp. Sample portraits in `public/demo/` are YouCam API documentation sample images.
- MediaPipe Face Landmarker (Apache-2.0). UI motion with anime.js (MIT).

MIT licensed. See `LICENSE`.

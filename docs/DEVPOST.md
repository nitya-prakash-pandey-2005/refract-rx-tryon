# Refract: check any glasses before you buy them

**Tagline (≤ 200 chars):** A free second opinion for prescription glasses from any store: predicts thick edges, rainbow fringes, slipping and PD errors before you pay, then shows them live on your face.

**Track:** eCommerce VTO
**Code:** https://github.com/nitya-prakash-pandey-2005/refract-rx-tryon

---

## Inspiration

**1 in 13 pairs of prescription glasses has to be remade** (7.6% redo rate, Vision Council lab and practice surveys), and **15–22% of eyewear bought online comes back**. By 2050, **half the world will be short-sighted** (Holden et al., *Ophthalmology* 2016).

Glasses fail in four ways, and nobody checks any of them before you pay:
- **Look:** the lens edge is thick and your eyes look 8–10% smaller.
- **Sight:** "ultra-thin" lenses show rainbow fringes when you glance sideways.
- **Fit:** heavy lenses on an oily nose with a hard plastic bridge slide down all day.
- **Measure:** a selfie PD is off by about ±2.7 mm. At −7 that is 2 prism dioptres, nearly three times the ANSI tolerance.

Every virtual try-on, including Perfect Corp's own eyewear tool, shows frames **without lenses**, and the lenses are what go wrong. Everyone who could warn you sells you the glasses. The 1.74 "ultra-thin" upgrade often costs €50–120 more, yet at −4 it saves under 1 mm, and a smaller frame with a cheaper lens beats it.

So we built the thing nobody sells: a neutral second opinion.

## What it does

Refract is **free for shoppers and works with any frame from any store**. You give it your prescription and a frame. You can:
- pick one from the sample catalogue;
- type the size printed inside any frame's arm (`52□18 140`);
- tap a bookmark on any glasses product page.

Refract predicts the four failure modes with a fix for each, compares the frame with the glasses you wear today, and shows the result live on your own face. **Stores pay**, because every remake they avoid saves them a lab bill, shipping and a customer.

**1. A home page anyone gets in 10 seconds.**
- **5-second check (no camera):** drag your prescription on an anime.js Draggable dial and pick a frame size and lens. The real engine springs a lens cross-section to its true thickness, shrinks an eye to show what others will see, and scores all four risks.
- **"Four ways new glasses go wrong":** a sticky, scroll-scrubbed anime.js timeline. A lens thickens, white light splits into a rainbow at the edge, glasses slide down an oily nose, PD centres miss the pupils, and a risk score of 87 falls to 22 as the fixes apply. Every number comes from the engine.
- **"Don't pay for thin you don't need":** live bars at −3, −4 and −6 show a medium frame with a standard 1.60 lens beating a large frame with the 1.74 upgrade on edge thickness and sharpness.
- A comparison against a store's try-on and an optician visit, a trust section, who pays, and an FAQ.

**2. Check any frame, from any store (new to the web).**
- **Size code:** type `52□18 140` and pick shape and material. The lens height and frame weight are estimated from catalogue ratios unless the listing gives them.
- **"Check with Refract" bookmarklet:** on any glasses product page it reads the frame size, shape and material (the selected text first) and opens the check.
- **Shareable check links:** `#/check/custom?size=52-18-140&shape=rect&material=metal`.
- **vs the glasses you wear now:** type the size on your current pair and get "+2.5 mm thicker, +30 g: you will notice".

**3. Remake-risk check: four models, each explained, each with a fix.**

| Model | What it checks | Built on |
|---|---|---|
| **Look** | Edge or centre thickness around the real frame shape, decentred to your PD, plus how much smaller or bigger your eyes look | Lens sag + spectacle magnification |
| **Sight** | Colour fringes by lens material: the colour-clean zone, and *chart lines of sharpness lost* at a 10 mm glance | Prentice's rule, Abbe number, Winter et al. *JOSA A* 2015 |
| **Fit** | Will they slide down your nose? | Physics, evaluated while you look down at your phone: frame + lens weight under head movement, against pad friction, ear hold and temple grip. **Pad friction drops with oily skin, measured by YouCam Skin AI.** |
| **Measure** | Is your PD accurate enough for your power? | Induced prism vs the ANSI Z80.1 0.67 Δ tolerance |

What-if controls (lens material, nose bridge, oiliness, known PD) move the score live. A **Sight simulator** shows a street scene through each material.

**4. Live Rx Mirror.** A WebGL2 shader re-renders your camera through your exact sphere, cylinder and axis every frame:
- your eyes shrink or grow;
- your face cuts in at the lens edge;
- frames are physically scaled and track your face, with PD measured live from your iris.

**Optics X-ray** bends a 2.5 mm grid through the lens and colours the rim by thickness.

**5. The YouCam beauty and skin layer.**
- **AI Face Analyzer** reads face shape and eyes to rank frames for your face.
- **AI Skin Analysis** measures **oiliness**, which feeds nose-pad grip in the Fit model, and the eye area a lens magnifies: dark circles, bags, crow's feet, lid droop and tear trough.
- **AI Makeup VTO** renders eye makeup retuned for your lens power, next to a generic look.

**6. The business: stores pay, shoppers don't.**
- **One-line embed:** `embed.js` plus `data-refract-sku`. The demo store "Northlight" receives `refract:add-to-cart` with the frame, lens index and predicted edge.
- **REST API:** `POST /api/v1/risk` scores a catalogue frame, **any frame by its printed size**, or ranks the catalogue.
- **MCP server for AI shopping assistants:** `check_any_frame`, `rank_frames`, `remake_risk`, `lens_report`, `sight_by_material`. Existing eyewear MCP servers only do cart and checkout.
- **Store dashboard:**
  - a simulated order stream in which 8.7% of orders are high risk;
  - the fixes cut high-risk orders from 26 to 7 (−73%) and average risk by 39%;
  - an ROI calculator with a preventable-share slider;
  - pricing at $49 / $199 / custom per store.

**Also included:**
- an interactive "how to read your prescription" guide (OD/OS, SPH, CYL, AXIS, ADD, PD);
- a voice-guided face scan you can do without your glasses;
- an agent (Claude with tool use) where every number is a visible tool call;
- a shortlist with a lens report to take to any shop;
- a shareable card.

## How we built it

**YouCam APIs**, server-side on `yce-api-01.makeupar.com`:
- **Flow:** File API → presigned PUT → task → poll, never re-creating a task.
- **Features used:**
  - **`face-attr-analysis`** with 9 features;
  - **`skin-analysis` v2.1** with 7 concerns including oiliness, HD chosen automatically;
  - **`makeup-vto`** with effects computed from the lens power.
- **Spend protection:** parameters are built server-side, with per-IP limits and a daily unit budget. Faces are auto-cropped to fill about 70% of the frame.
- **Result typing:** result images are typed from their bytes, because YouCam sends `binary/octet-stream`.

**Engine** (pure JS, shared by the app, the API, the MCP server and the agent):
- **Optics:** lens sag, edge thickness, weight, spectacle magnification and astigmatism axis.
- **Sight:** Prentice and Abbe, calibrated to Winter 2015.
- **Fit physics:** friction from Zhang & Mak 1999, temple clamp from Zhang 2024, a capillary-pressure threshold.
- **Measure:** PD prism against ANSI Z80.1.
- **Any-frame builder:** turns a printed size into a full frame.
- **Order simulator:** seeded, running in a Web Worker.

**Motion with anime.js 4:**
- the home story is one `createTimeline` driven by `onScroll({ sync })`, scoped with `createScope`;
- the hero dial is a `createDraggable` with keyboard support;
- the lens morphs with `spring` easing;
- light rays are drawn with `svg.createDrawable`;
- headlines use `splitText` and `scrambleText`;
- counters, bars and the comparison table animate on view.

Everything respects `prefers-reduced-motion`.

**Rendering:** MediaPipe Face Landmarker (478 points with irises) with smoothing, a WebGL2 lens shader, and Canvas 2D for frames, X-ray and the Sight simulator.

**Quality:**
- **97 automated tests,** including a real MCP client calling our server, API route tests, and bookmarklet tests against fake pages.
- **Four independent code reviews,** with every finding fixed test-first.
- **Headless-Chrome end-to-end runs** with a fake webcam. The whole screenshot gallery is generated by one script.

## Challenges we ran into

- **Explaining it.** Our first version explained technology. People asked "so you sell glasses?" We rebuilt the home page around one sentence ("check any glasses before you buy them"), a 5-second interactive check and a scroll story. We also renamed the bag to a shortlist, because Refract doesn't sell anything.
- **Working with any store without scraping.** The size printed on every frame's arm is the universal key, so we built the frame from it and made the bookmarklet read it from any page.
- **Honest physics.** Pure friction says weight doesn't matter, yet heavy glasses do slide. Modelling head movement (load that scales with mass) against holds that don't fixed it.
- **Not overclaiming.** We don't call 1.74 "clearer" (its Abbe number is 32), we don't trust single-image depth, and every number in the story is the engine's own.

## Accomplishments we're proud of

- A remake-risk check with physics-based slip prediction using YouCam skin oiliness. We found nothing like it in products, patents or papers.
- **It works with any frame on the internet,** in the app, the API and the MCP server.
- Money advice a store can't give: when the cheaper lens in a better frame wins.
- The first online live try-on that shows what your prescription does to your face. The research ancestor is Zhang et al., *IEEE CG&A* 2017, offline.

## What we learned

- Shoppers trust a tool more when it clearly doesn't sell them anything, and stores will pay for that trust because remakes cost them more.
- A newcomer needs to see one number move in five seconds before reading a word.

## What's next

- Turn the bookmarklet into a browser extension that badges every frame on a store page.
- A Shopify app.
- Validate slip predictions against a pilot store's return data.
- Progressive lens corridor simulation.
- Read a photo of a paper prescription.

## Built with

React · Vite · WebGL2 · anime.js · MediaPipe · Node.js · MCP SDK · Vercel · YouCam API (AI Face Analyzer, AI Skin Analysis, AI Makeup VTO) · Anthropic Claude API

**Evidence and sources:** `docs/EVIDENCE.md`. **Screenshots:** `docs/screenshots/` (`00-cover.png` is the thumbnail). Cosmetic and shopping guidance, not medical advice.

# Refract: prescription-true try-on

**Tagline (≤ 200 chars):** Every virtual try-on shows frames without lenses. Refract renders you live through your real prescription, picks the frame and lens, retunes your eye makeup with YouCam AI, and drops into any store.

**Track:** eCommerce VTO
**Links:** Code: https://github.com/nitya-prakash-pandey-2005/refract-rx-tryon · Demo store: `/store/index.html` on the live site

---

## Inspiration

Glasses are the one fashion item that changes your face. A −7 lens makes your eyes look about 9% smaller to everyone else and pulls in the edge of your face. Strong lenses get thick in big frames. Your eyeliner vanishes behind the glass, and a +3 lens magnifies every fine line and dark circle.

Yet every virtual try-on renders frames **with no lenses**. And if you're strongly shortsighted you can't even see the frames you try on in a store. About 2.2 billion people live with a vision impairment (WHO), and half the world is projected to be shortsighted by 2050. They all shop for glasses blind to the one thing that changes their look most.

## What it does

**1. Live Rx Mirror: see yourself through your real lenses, live.**
Your camera feed is re-rendered on the GPU through your exact prescription, every frame. A WebGL2 shader re-samples every pixel inside each lens from where its light really comes from, using your sphere, cylinder and axis plus the extra depth away from the optical centre. You see:
- your eyes shrink or grow;
- the face "cut-in" at the lens edge;
- power rings on strong minus lenses;
- frames that track your face.

**Showroom ↔ Your Rx** morphs between the lensless view every other try-on gives you and the reality. **Optics X-ray** draws a 2.5 mm grid on your face bent by the lens and colours the rim by edge thickness. PD is measured live from your iris, which is about 11.7 mm wide in nearly everyone.

**2. Frames and lens index ranked for *your* prescription.**
- Every frame has real boxing dimensions.
- The optics engine computes edge or centre thickness around the actual frame shape, decentred to your PD, plus weight, Abbe value and eye-size change.
- An explainable **Rx-Fit** score ranks the frames.
- The index advisor sometimes says *"1.74 would save only 0.5 mm for $149 more. Not worth it."*

**3. Eye makeup retuned for your lenses: the YouCam beauty layer.**
- **AI Face Analyzer** reads face shape, eye shape, size, setting, eyelids, brows and eye, brow and hair colour.
- **AI Skin Analysis** (HD when the photo allows) scores the area a lens sits in front of: dark circles, eye bags, crow's feet, lid droop and tear trough.
- Refract computes what your lenses will magnify or hide there.
- **AI Makeup VTO** renders a generic tutorial look next to an **Rx-tuned** one:
  - minus lenses: brighter shimmer lids, a thin liner and lifted lashes;
  - plus lenses: matte, fine and precise, with more under-eye correction when your dark-circle score is low.

**4. One line on any store.**
- A store adds `embed.js` and `data-refract-sku="juno"` to a button.
- Shoppers get the Live Rx Mirror in a modal.
- When they choose, the store receives a `refract:add-to-cart` event with the frame, lens index and predicted edge thickness.
- The demo store, *Northlight*, is a fictional brand, and the integration works end to end.

**5. And around it:**
- **Voice-guided scan with auto-capture**, so you can scan without your glasses.
- **Ask Refract**, an agent (Claude with tool use) whose every number comes from a visible tool call to the optics engine.
- **Lab-ready order sheet** with mono PD and tolerance.
- **Shareable Refract card**.
- **Catalogue Rx audit for retailers**, with an Rx-suitability JSON feed that AI shopping agents can read.

## How we built it

**YouCam APIs**, called server-side on the India host `yce-api-01.makeupar.com`:
- **Request flow:** File API → presigned PUT → task → poll. A task is never re-created on a slow poll, so units are never charged twice.
- **`face-attr-analysis`:** 9 features.
- **`skin-analysis` v2.1:** 6 eye-area concerns; HD is chosen automatically for large face crops.
- **`makeup-vto`:** `eye_shadow`, `eye_liner`, `eyelashes`, `eyebrows` and `concealer` effects computed from the lens power, using official pattern names.
- **Spend protection:** parameters are built server-side from presets, with per-IP limits and a daily unit budget.
- **Robustness:** faces are auto-cropped to fill about 70% of the width; result images get their real type from their bytes (YouCam serves them as `binary/octet-stream`); downloads retry.

**Optics engine** (pure JS, unit-tested):
- meridional power;
- spectacle magnification with a depth term;
- lens sag and edge thickness around the real frame contour with decentration;
- per-material minimum thickness;
- weight integration;
- an index advisor with an anti-upsell rule.

**Vision and rendering:**
- MediaPipe Face Landmarker (478 points with irises), with exponential smoothing so frames don't jitter.
- A WebGL2 fragment shader for live mode that uses the same maths as the CPU compositor used for photos. Its inputs come from one tested function.
- Canvas 2D for frames, power rings, glare and the X-ray.

**Agent:** Anthropic SDK with `claude-opus-5-5`, a manual tool loop over strict tools, and server-side fallbacks. A deterministic planner uses the same tools when no key is set.

**UI:** React 19 + Vite 6, a dark glass/HUD design system, and **anime.js**: split-text headline, scroll-triggered counters, a tech marquee, the Showroom↔Rx morph and a looping engine demo in the hero. It works at 390 px and 1440 px and installs as a PWA.

**Quality:**
- 52 `node:test` tests.
- Two independent code reviews, with every finding fixed test-first.
- Headless-Chrome end-to-end runs, including a fake camera fed from a portrait to test the live shader.

## Challenges we ran into

- **Making optics look right, not just compute right.** A single magnification factor looked fake. Modelling depth away from the optical centre produced the real cut-in you see on strong lenses.
- **Live performance.** We moved the per-pixel lens maths from the CPU to a WebGL2 shader and upload lens masks as a small texture each frame. It holds 24–30 fps even on software rendering.
- **The API's eyewear products are enterprise-only.** Refract uses YouCam for the beauty layer (face, skin and makeup) and draws physically scaled frames itself.
- **Indian ISPs block perfectcorp.com hosts.** We moved everything to the `makeupar.com` mirror.

## Accomplishments we're proud of

- A live mirror that shows your eyes through your real prescription, which we couldn't find in any eyewear or beauty try-on.
- A real, working one-line store integration.
- Makeup advice driven by your lens power and your YouCam scores.
- An index advisor honest enough to say "don't pay for this".

## What we learned

The lens is part of the look. Frame choice, lens index and eye makeup are one decision, and your prescription is the input every try-on ignores.

## What's next

- Progressive and bifocal lens zones.
- Contact-lens mode with YouCam eye-colour VTO.
- A Shopify app wrapping the embed.
- Optician hand-off with the lab-ready order sheet.

## Built with

React · Vite · WebGL2 · anime.js · MediaPipe · Node.js · Express · Vercel · YouCam API (AI Face Analyzer, AI Skin Analysis, AI Makeup VTO) · Anthropic Claude API

---

**Screenshots:** `docs/screenshots/` (01–11). **Disclaimer:** cosmetic shopping preview, not medical advice. Sample portraits are YouCam API documentation sample images; Northlight is a fictional demo store.

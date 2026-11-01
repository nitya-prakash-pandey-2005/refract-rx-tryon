# Refract: prescription-true try-on

**Tagline (≤ 200 chars):** Every virtual try-on shows frames without lenses. Refract shows your eyes through your real prescription, picks the right frame and lens, and retunes your eye makeup with YouCam AI.

**Track:** eCommerce VTO

---

## Inspiration

If you're −7, the frames you try on in a store are a blur, and the ones you try on online lie to you: every virtual try-on renders frames **with no lenses**. When the glasses arrive, your eyes look smaller, the edges are thick, and your eyeliner has vanished behind the glass. At +3 it's the opposite: every fine line and dark circle is magnified.

Glasses are the most-worn fashion accessory in the world, and roughly half the planet is projected to be shortsighted by 2050. Yet no try-on we found models the lens, the part that changes your face most.

## What it does

Refract is a web app (installable on phones) that shows what you'll **actually** look like in glasses:

1. **Scan with your glasses off, without seeing the screen.** Live face mesh with distance, pose and light checks, voice guidance and auto-capture. Your iris (≈ 11.7 mm in nearly everyone) is the ruler, so Refract measures your **PD** with a ± tolerance, corrected for looking at a near camera.
2. **Enter your prescription.** You see at once how much your eyes will shrink or grow to others, with a true-scale lens cross-section.
3. **YouCam analyses the eye area.**
   - **AI Face Analyzer:** face shape, eye shape, size, setting, eyelid, brows and colours.
   - **AI Skin Analysis:** dark circles, eye bags, crow's feet, lid droop and tear trough, the exact zone a lens sits in front of.

   Refract then computes what your lenses will magnify or hide there.
4. **Frames ranked for your Rx, not for a lensless photo.** An explainable Rx-Fit score: edge thickness at the recommended index, lens cost, fit to your face width, decentration, face-shape match.
5. **The Studio.** Your photo is re-rendered through each lens, per pixel:
   - eye minification or magnification, separately along and across the astigmatism axis;
   - the face "cut-in" at the lens edge;
   - power rings and glare;
   - physically scaled frames.

   One toggle morphs **Showroom ↔ Your Rx**. Lens-index chips show edge, weight, Abbe and price, and Refract tells you when the pricier lens **isn't worth it**.
6. **Eye makeup retuned for your lenses.** **YouCam Makeup VTO** renders two looks on your photo:
   - a generic tutorial look;
   - an **Rx-tuned** look: brighten and open behind minus lenses; matte, fine and precise behind plus lenses, with more under-eye correction when your dark-circle score is low.

   Shades are picked from your YouCam-measured eye colour and brow colour.
7. **Ask Refract.** An optician + makeup-artist agent (Claude with tool use). Every thickness, weight, eye-size and price figure it states comes from a visible tool call to the same optics engine. It suggests buttons; you confirm. Nothing is bought automatically.
8. **Lab-ready order sheet.** Frame, lens index, coatings, Rx and mono PD with tolerance, plus the eye-look products, in USD and ₹.
9. **For retailers.** A catalogue × prescription matrix showing which frames stay thin at −2, −4, −6, −8 D, and an **Rx-suitability JSON feed** so AI shopping agents stop recommending 58 mm aviators to −8 shoppers.

## How we built it

- **YouCam APIs**, server-side on the India host `yce-api-01.makeupar.com`, using the full File API → presigned PUT → task → poll flow, never re-creating a task on a slow poll (no double charges):
  - `face-attr-analysis`: 9 features, 20 units.
  - `skin-analysis` v2.1: 6 eye-area concerns. HD is chosen automatically when the face crop is at least 1080 px, otherwise SD; JSON plus mask overlays; 12–16 units.
  - `makeup-vto`: computed `eye_shadow`, `eye_liner`, `eyelashes`, `eyebrows` and `concealer` effects using pattern names from the official catalogues; 1 unit each.
  - Faces are auto-cropped to about 70% of image width (the API needs more than 60%), a units ledger tracks spend, and makeup results are inlined because result URLs expire after 2 hours.
- **Optics engine** (pure JS, unit-tested): meridional power, spectacle magnification with a depth term, lens sag and edge thickness around the real frame contour with decentration from mono PD, per-material minimum thickness, weight integration, Abbe, and index recommendation with an anti-upsell rule.
- **Vision:** MediaPipe Face Landmarker (478 points including irises) in the browser; a Canvas compositor that bilinearly re-samples each lens region through the optics.
- **Agent:** Anthropic SDK, `claude-opus-5-5`, with a manual tool-use loop over strict JSON-schema tools (`search_frames`, `lens_report`, `plan_eye_look`, `suggest_action`) and server-side fallbacks. A deterministic planner uses the same tools when no key is set.
- **UI:** React 19 + Vite 6, a dark glass/HUD design system, and anime.js for the lens hero timeline, text splitting, stroke drawing and the Showroom↔Rx morph. Works at 390 px and 1440 px, installable as a PWA.
- **Judge mode:** two sample profiles that replay real recorded YouCam responses, clearly labelled *Sample data*.
- **Tests:** 38 `node:test` cases covering optics, fit scoring, PD measurement, frame placement, lens warp, makeup rules, response normalisers and the agent planner.

## Challenges we ran into

- **The eyewear and glasses-removal products aren't in the self-serve API.** We used the API where it adds the most (face, skin, makeup) and built a physically scaled frame renderer ourselves.
- **perfectcorp.com hosts were blocked on our Indian ISP.** We moved everything to the `makeupar.com` mirror.
- **Making the optics look right, not just compute right.** A single magnification factor looked fake. Adding depth (features further from the optical centre sit further behind the lens) produced the real cut-in effect you see on strong lenses.
- **Being honest about PD.** Iris-scaled PD has about ±4% uncertainty, so we show it and suggest an optician check for strong prescriptions.

## Accomplishments we're proud of

- At −9 D you can watch the eyes shrink about 10% and the face edge cut in, which no lensless try-on can show.
- An index advisor that sometimes says "don't pay for this".
- Makeup advice that comes from your lens power and your YouCam scores, not from a generic tutorial.

## What we learned

The lens is part of the look. Eye makeup, frame choice and lens index are one decision, and the shopper's prescription is the missing input every try-on ignores.

## What's next

- Live video try-on with the same optics shader in WebGL.
- Retailer embed (one script tag on product pages) and a Shopify app.
- Progressive and bifocal lens zones.
- Contact-lens mode, where YouCam eye-colour VTO meets no magnification at all.

## Built with

React · Vite · anime.js · MediaPipe · Node.js · Express · Vercel · YouCam API (AI Face Analyzer, AI Skin Analysis, AI Makeup VTO) · Anthropic Claude API

---

**Disclaimer:** Cosmetic shopping preview, not medical advice. Sample portraits are YouCam API documentation sample images.

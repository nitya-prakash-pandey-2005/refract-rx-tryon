# Refract — design and winning strategy

**Date:** 2026-11-02 · **Deadline:** 2026-11-02 22:15 IST (11:45 EST) · **Track:** eCommerce VTO (beauty + fashion as one look)

## 1. The one-line idea

> Every virtual try-on shows you frames **without lenses**. Refract is the first try-on that knows your prescription: it shows what your eyes, face and eye makeup will *really* look like through your actual lenses, picks the frame and lens index that suit your Rx, and retunes your eye makeup to compensate, using YouCam Skin AI, Face Analyzer and Makeup VTO.

## 2. Why this wins (evidence)

| Judging criterion (equal weight; #1 breaks ties) | How Refract scores |
|---|---|
| **Technological implementation** | 3 YouCam APIs doing real work (Face Attribute Analyzer, Skin Analysis eye-area concerns, Makeup VTO with computed multi-effect looks) + an optics engine (spectacle magnification, meridional power for astigmatism, edge-thickness sag maths, lens weight, Abbe), MediaPipe iris-scaled PD measurement with convergence correction, per-pixel lens-warp compositor. Full file → PUT → task → poll pipeline server-side, unit ledger, recorded-replay judge mode. |
| **Design** | One coherent journey: scan → measured profile → Rx-ranked frames → studio (Showroom vs Your-Rx morph) → compensating eye look → order sheet. UI kit glass/HUD + anime.js motion. Works at 390 px and 1440 px. |
| **Potential impact** | ~2/3 of adults need vision correction; myopia projected to reach ~50% of the world by 2050 (Holden et al., *Ophthalmology* 2016). Online eyewear returns are ~15–20% (industry estimates). High-Rx shoppers are the ones most surprised by thick edges and shrunken eyes. Retailers get an Rx-readiness audit of their catalogue. |
| **Quality of idea** | Non-obvious, untaken: none of 237 round-1 entries or ~97 visible current entries does prescription-aware try-on (checked by keyword). Aligns with Perfect Corp's 20 Oct 2026 Glasses Removal launch and the CEO's "shoppers who need their glasses to see" quote — but solves the part their VTO doesn't: the lenses. |

What we avoid (crowded this round): selfie → routine → cart, "is my skincare working", colour seasons, weddings, weather, generic AI stylist, "honest error bars" as the whole pitch.

## 3. Users and moments

- **Primary:** a −4 to −10 myope (or +2 to +5 hyperope / presbyope) buying glasses online. Moment: on the product page, about to pick a big trendy frame.
- **Secondary moment:** the mirror — "my eye makeup disappears behind my glasses" (minus) or "my lenses magnify every smudge and my dark circles" (plus).
- **Retailer:** eyewear e-commerce merchandiser who wants fewer returns from high-Rx customers.

## 4. Goals / non-goals / anti-goals

**Goals:** credible optics; real YouCam calls end to end; one memorable "Showroom → Your Rx" morph; Rx-ranked catalogue with explanations; compensating eye look rendered by YouCam Makeup VTO; agent that explains trade-offs; judge-runnable replay mode with labelled sample data.

**Non-goals:** medical advice or prescribing; real checkout/payments; 3D frames; video try-on.

**Anti-goals (would make it a failure even if it works):** overclaiming ("clinical-grade", invented return-reduction %); upselling high-index lenses that don't help (we say when 1.74 is not worth it); storing face photos on a server (photos stay in the browser; YouCam files expire per their retention); copying a trademarked frame brand.

## 5. The product (screens)

1. **Home** — hero morph (lensless vs Rx-true), how it works, "Try the demo profile" (replay) and "Start my scan".
2. **Scan** — live camera, MediaPipe Face Landmarker; checks: face size, yaw/pitch/roll ≤ 8°, light level and left/right balance, stillness. Voice guidance + auto-capture (people who need glasses can't read the screen with them off). Upload-a-photo fallback.
3. **Prescription** — SPH/CYL/AXIS per eye (+ presets −2.5, −6.5, −9, +3), PD prefilled from scan with ± uncertainty.
4. **Profile ("Your face, measured")** — YouCam Face Analyzer (face shape, eye shape/size/setting, eyelid, brow shape, eye/hair/brow colour) + YouCam Skin Analysis eye-area concerns (dark circles, eye bags, crow's feet/periocular wrinkles, droopy lids, tear trough) + "what your lenses will magnify or hide" (area change = m²).
5. **Frames** — 12 house-brand frames with true dimensions, ranked by Rx-Fit score with Drivers ("why"): edge thickness at recommended index, weight, width fit to temples, decentration, face-shape match.
6. **Studio** — canvas compositor: photo (or YouCam makeup result) + per-lens warp + frame + power rings. Controls: Showroom ↔ Your Rx (animated), lens index chips with live thickness/weight/price, Look: Bare / Generic / Rx-tuned. Side report: lens cross-section SVG, eye-size change %, weight g, Abbe, cost.
7. **Ask Refract (agent)** — LLM tool loop over the engine (search frames, lens report, compare, makeup plan) returning a visible tool trace and action buttons; deterministic fallback without an LLM key.
8. **Bag / Order sheet** — frame + lens spec (index, PD, coatings) + eye-look products; human confirms.
9. **For retailers** — catalogue × Rx matrix (−10…+6 D) of max edge thickness, % of catalogue wearable at each Rx band, export Rx-suitability JSON feed for AI shopping agents.

## 6. Key maths (builder must match)

- Spherical equivalent `SE = S + C/2`. Meridional power `F(θ) = S + C·sin²(θ − axis)`.
- Apparent size of the eye seen through the lens (observer view): `m = 1 / (1 − d·F)`, `d = 0.012 m` (vertex) for the eye; anisotropic for cylinder (axis meridian uses `S`, perpendicular uses `S + C`). Displayed eye-size change = `(m − 1)·100 %`, area change = `(m² − 1)·100 %`.
- Lens sag at radius r (mm): `R = 1000·(n − 1)/|F|`, `sag = R − √(R² − r²)`.
- Edge thickness at contour point p: `t(p) = t_c − sign(F(θ))·sag(r, |F(θ)|)` with `t_c = max(t_min_center[n], 1.0 + max_p sign·sag)`; `t_min_center`: 1.50→2.0, 1.59→1.0, 1.60→1.5, 1.67→1.5, 1.74→1.5 mm; min edge 1.0 mm.
- Optical centre at pupil: horizontal decentration `(A + DBL)/2 − monoPD`, vertical: pupil 2 mm above box centre.
- Density g/cm³: 1.50 1.32, 1.59 1.20, 1.60 1.30, 1.67 1.35, 1.74 1.47. Abbe: 58, 30, 42, 32, 33. Price add-on USD: 0, 30, 49, 89, 149 (INR shown at ×84, rounded).
- PD: iris horizontal visible diameter 11.7 mm → mm/px; near PD from iris centres; distance estimate `D = f_px·11.7/iris_px` with `f_px = W / (2·tan(30°))`; far PD = near PD · (D + 13.5)/D; uncertainty ±4.3 %.
- Index recommendation: cheapest index with max edge ≤ 4.0 mm (minus) / centre ≤ 4.5 mm (plus); flag "not worth it" when the next index saves < 0.5 mm.

## 7. YouCam integration (India host)

- Base `https://yce-api-01.makeupar.com`, `Authorization: Bearer <YOUCAM_API_KEY>` server-side only.
- Upload: `POST /s2s/v2.0/file` → PUT bytes → `file_id`. Tasks: `POST /s2s/v2.0/task/{feature}`, poll `GET /s2s/v2.0/task/{feature}/{id}` every 3 s up to 120 s; never re-create on poll timeout.
- `face-attr-analysis`: features `faceShape, eyeShape, eyeSize, eyeDistance, eyelid, eyebrowShape, eyeColor, hairColor, eyebrowColor` (20 units).
- `skin-analysis`: HD if crop short side ≥ 1080 else SD; eye-area concerns (6 → 12 SD / 16 HD units), `format: "json"`, mask overlays on.
- `makeup-vto`: `eye_shadow`, `eye_liner`, `eyelashes`, `eyebrows`, `concealer`, `skin_smooth` 0/0; 1 unit per look.
- Face crop for analysis: face width ≈ 70 % of crop width (API requires > 60 %).
- Recorded replay: real responses saved once, served with a visible "Sample data · recorded YouCam response" label.

## 8. Calls left to the builder

Frame artwork details, copy, animation choreography, exact colour picks per eye colour, agent prompt wording.

<div align="center">

<img src="docs/screenshots/00-cover.png" alt="Refract: check any glasses before you buy them" width="100%">

# Refract

### Check any glasses before you buy them.

A free second opinion for prescription glasses from **any** store. Refract predicts how thick your lenses will be, how your eyes will look, whether you'll see rainbow edges, whether the frame will slide down your nose and whether your PD is good enough. Every answer comes with a fix. Then it shows the pair live on your face, through your exact lenses.

![Tests](https://img.shields.io/badge/tests-121%20passing-2ea44f?style=flat-square)
![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646cff?style=flat-square&logo=vite&logoColor=white)
![anime.js](https://img.shields.io/badge/anime.js-4-ff4b4b?style=flat-square)
![WebGL2](https://img.shields.io/badge/WebGL2-lens%20shader-990000?style=flat-square&logo=webgl&logoColor=white)
![MediaPipe](https://img.shields.io/badge/MediaPipe-Face%20Landmarker-0097a7?style=flat-square)
![YouCam](https://img.shields.io/badge/YouCam%20API-Face%20%C2%B7%20Skin%20%C2%B7%20Makeup-e84e8a?style=flat-square)
![MCP](https://img.shields.io/badge/MCP-server-6b46c1?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)

[What it is](#what-refract-is) · [Tour](#a-tour-of-the-app) · [Engine numbers](#what-the-engine-says) · [Science](#the-science-inside) · [Architecture](#how-it-is-built) · [API and MCP](#for-stores-and-ai-agents) · [Run it](#run-it-locally)

<sub>Built for the <b>YouCam API Skin AI &amp; eCommerce VTO Hackathon</b> (eCommerce VTO track)</sub>

</div>

---

## Contents

- [What Refract is](#what-refract-is)
- [Why it matters](#why-it-matters)
- [A tour of the app](#a-tour-of-the-app)
- [What the engine says](#what-the-engine-says)
- [The science inside](#the-science-inside)
- [How it is built](#how-it-is-built)
- [For stores and AI agents](#for-stores-and-ai-agents)
- [Quality, privacy and spend protection](#quality-privacy-and-spend-protection)
- [Run it locally](#run-it-locally)
- [Project layout](#project-layout)
- [Honest limits](#honest-limits)
- [Evidence and credits](#evidence-and-credits)

---

## What Refract is

> [!IMPORTANT]
> **Refract doesn't sell glasses.** Shoppers use it free, for frames from any shop or website. Stores pay for the same engine (an embed, a remake-risk dashboard, a REST API and an MCP server), because every remake they avoid saves them a lab bill, shipping and a customer.

| | Shoppers | Glasses stores | AI shopping agents |
|---|---|---|---|
| **They bring** | A prescription and any frame: one from the sample catalogue, the size printed inside the arm (`52□18 140`), or a one-tap bookmark on any product page | Their catalogue and their order stream | A shopper's question |
| **Refract gives back** | Lens thickness, eye size, rainbow edges, slipping and PD risk, each with a fix. A live try-on through the real lenses. A lens report to take to any optician | A remake-risk score on every order with the reason and the fix. An embeddable try-on and an ROI calculator | Five prescription-aware tools over MCP, and a REST API |
| **Price** | Free, no sign-up | From $49 a month per store | REST API on the Growth plan, MCP on Enterprise |

### The five questions it answers before you pay

| Question | Model | Physics behind it | Typical fix |
|---|---|---|---|
| **How will it look?** | Look | Lens sag around the real frame contour, decentred to your PD; spectacle magnification `1/(1 − d·F)` | A smaller, rounder frame, or a higher index |
| **Will I see clearly at the edges?** | Sight | Prentice's rule and the Abbe number, calibrated to Winter et al. 2015 | A higher-Abbe material |
| **Will it slide down my nose?** | Fit | Frame and lens weight against pad friction, head tilt and temple grip, with nose oiliness from **YouCam Skin Analysis** | Silicone pads, a lighter lens, a snugger temple |
| **Is my PD accurate enough?** | Measure | Prism induced by PD error at your power vs ANSI Z80.1 (0.67 Δ) | Confirm PD with a card or an optician |
| **What about a hot day?** | Fit through your day | Sebum rises about 10% per °C of skin temperature; seeded Monte Carlo over head posture and weather | A frame with more slip margin |

---

## Why it matters

| Fact | Number | Source |
|---|---|---|
| Prescription jobs redone | **7.6%**, about 1 in 13 | Vision Council lab and ECP surveys (*Eyecare Business*, 2012) |
| Share of redos caused by measurement errors | **13%** | *Eyecare Business*, 2012 |
| Lab cost per redo | $16.82 single vision, $66.55 AR, $63.87 progressive | *20/20 Magazine* |
| Online eyewear sent back | **15–22%**, and fit is the leading reason | Shopify 2024 via Fittingbox |
| People short-sighted by 2050 | **4.76 billion (49.8%)**, 938 million highly | Holden et al., *Ophthalmology* 2016 |

### What other try-ons don't show you

| | Typical online try-on | Optician in a shop | **Refract** |
|---|:---:|:---:|:---:|
| The frame on your face | ✓ | in a mirror | ✓ live, at real scale |
| **Your lenses**: thickness, eye size, cut-in | ✗ | rarely | ✓ per-pixel WebGL lens shader |
| Rainbow edges by lens material | ✗ | rarely explained | ✓ with a sight simulator |
| Will it slide down your nose? | ✗ | after you buy | ✓ physics + YouCam oiliness |
| Is your PD good enough for your power? | ✗ | ✓ | ✓ tolerance from your prescription |
| Frames from **any** store | ✗ | ✗ | ✓ printed size or bookmarklet |
| Independent of the seller | ✗ | ✗ | ✓ sells nothing |

---

## A tour of the app

### 1. The home page explains it in five seconds

<table>
<tr>
<td width="50%"><img src="docs/screenshots/01-home.png" alt="Home page with the 5-second check"><br><b>5-second check, no camera.</b> Drag your prescription on a draggable dial and pick a frame size and lens. The real engine springs a lens cross-section to its true thickness and scores all four risks.</td>
<td width="50%"><img src="docs/screenshots/02-story-look.png" alt="Scroll story: the look"><br><b>"Four ways new glasses go wrong."</b> A sticky story whose anime.js timeline is scrubbed by scroll. First: thick edges and shrunken eyes.</td>
</tr>
<tr>
<td width="50%"><img src="docs/screenshots/03-story-sight.png" alt="Scroll story: rainbow edges"><br><b>Rainbow edges.</b> White light splits through an "ultra-thin" lens when you glance sideways.</td>
<td width="50%"><img src="docs/screenshots/04-story-fit.png" alt="Scroll story: slipping"><br><b>Slipping.</b> Weight, an oily nose and a phone-down head tilt against pad friction.</td>
</tr>
<tr>
<td width="50%"><img src="docs/screenshots/05-story-verdict.png" alt="Scroll story: verdict"><br><b>The verdict.</b> One remake-risk score, with the reason and the fix for each part.</td>
<td width="50%"><img src="docs/screenshots/06-savings.png" alt="Don't pay for thin you don't need"><br><b>"Don't pay for thin you don't need."</b> Live engine bars show what each lens upgrade really buys.</td>
</tr>
<tr>
<td width="50%"><img src="docs/screenshots/07-comparison.png" alt="Comparison with other options"><br><b>Compared honestly</b> with store try-ons and opticians.</td>
<td width="50%"><img src="docs/screenshots/08-who-pays.png" alt="Who pays"><br><b>Who pays:</b> shoppers free, stores from $49 a month, agents through the API.</td>
</tr>
</table>

### 2. Check a pair: any frame, any store

<table>
<tr>
<td width="50%"><img src="docs/screenshots/09-check-any-frame.png" alt="Check any frame by its printed size"><br><b>Any frame.</b> Type the size printed inside the arm, tap the "Check with Refract" bookmark on a product page, or open a shared link such as <code>#/check/custom?size=52-18-140&amp;shape=rect&amp;material=metal</code>.</td>
<td width="50%"><img src="docs/screenshots/10-fit-check.png" alt="Fit check"><br><b>Fit physics, explained.</b> Every driver of slip risk is listed with its contribution, and what-if controls move the score live.</td>
</tr>
<tr>
<td width="50%"><img src="docs/screenshots/11-sight-simulator.png" alt="Sight simulator"><br><b>Sight simulator.</b> See the colour fringes each lens material gives you at a side glance.</td>
<td width="50%"><img src="docs/screenshots/29-fit-through-day.png" alt="Fit through your day"><br><b>Fit through your day.</b> A 24-hour ring of slip probability from a seeded Monte Carlo, for a cold, mild or hot day, or today's real forecast.</td>
</tr>
</table>

### 3. See it on your own face

<table>
<tr>
<td width="50%"><img src="docs/screenshots/12-live-rx-mirror.png" alt="Live Rx Mirror"><br><b>Live Rx Mirror.</b> MediaPipe tracks your face; a WebGL2 shader re-samples every pixel inside each lens through your sphere, cylinder and axis. PD is measured live.</td>
<td width="50%"><img src="docs/screenshots/13-live-optics-xray.png" alt="Optics X-ray"><br><b>Optics X-ray.</b> A 2.5 mm grid bent by your lens, and the rim coloured by edge thickness. <b>Showroom ↔ Your Rx</b> morphs from the lensless view to reality.</td>
</tr>
<tr>
<td width="50%"><img src="docs/screenshots/16-photo-try-on.png" alt="Photo try-on"><br><b>Photo try-on.</b> Your photo, or a YouCam makeup render, seen through each lens, with frames at physical scale and lens chips that say when a thinner lens isn't worth it.</td>
<td width="50%"><img src="docs/screenshots/17-youcam-analysis.png" alt="YouCam analysis"><br><b>YouCam analysis.</b> Face shape and eyes from <b>Face Analyzer</b>, oiliness and the eye area a lens magnifies from <b>Skin Analysis</b>, and an Rx-tuned eye look from <b>Makeup VTO</b>.</td>
</tr>
</table>

### 4. The science pages

<table>
<tr>
<td width="50%"><img src="docs/screenshots/24-lens-lab-material.png" alt="Lens Lab: materials"><br><b>Lens Lab: materials.</b> Light ray-traced through a prism of each material shows why "ultra-thin" splits colours more, with the chemistry behind it.</td>
<td width="50%"><img src="docs/screenshots/25-lens-lab-coating.png" alt="Lens Lab: coatings"><br><b>Lens Lab: coatings.</b> A thin-film solver designs a 4-layer anti-reflective coating and shows its leftover colour through the CIE 1931 observer.</td>
</tr>
<tr>
<td width="50%"><img src="docs/screenshots/26-lens-lab-photochromic.png" alt="Lens Lab: photochromic"><br><b>Lens Lab: photochromic.</b> A time-lapse of lenses darkening and clearing in sun, cloud or a car, at any temperature.</td>
<td width="50%"><img src="docs/screenshots/27-kids-forecast.png" alt="Kids' eyes"><br><b>Kids' eyes.</b> A child's prescription forecast to 18, with and without myopia-control lenses, ortho-k or atropine, and an eye that grows longer as myopia grows.</td>
</tr>
<tr>
<td width="50%"><img src="docs/screenshots/28-best-value.png" alt="Best value"><br><b>Best value.</b> All 60 frame and lens combinations on a price vs remake-risk plane, the Pareto frontier and its knee.</td>
<td width="50%"><img src="docs/screenshots/30-science.png" alt="Science strip"><br><b>Physics, chemistry, biology and math.</b> One looping animation per science on the home page; each plays only while it is on screen.</td>
</tr>
</table>

### 5. Decide, ask and keep

<table>
<tr>
<td width="50%"><img src="docs/screenshots/19-frames-ranked.png" alt="Frames ranked"><br><b>Frames ranked for your prescription</b>, thinnest and safest first.</td>
<td width="50%"><img src="docs/screenshots/20-ask-refract-agent.png" alt="Ask Refract"><br><b>Ask Refract.</b> A Claude agent whose every number is a visible tool call into the same engine. Without a key, a built-in planner answers with the same tools.</td>
</tr>
<tr>
<td width="50%"><img src="docs/screenshots/23-share-card.png" alt="Share card" width="70%"><br><b>Shortlist and share card.</b> A lens report (frame, index, coatings, Rx, mono PD with tolerance, predicted edge) for any shop, and a 1080×1350 card.</td>
<td width="50%"><img src="docs/screenshots/18-phone.png" alt="On a phone"><br><b>Phone-first.</b> Bottom tabs, the same 5-second check and the scroll story on a phone.</td>
</tr>
</table>

### 6. For stores

<table>
<tr>
<td width="50%"><img src="docs/screenshots/14-store-integration.png" alt="Store integration"><br><b>One script tag.</b> A demo store adds "Try with my prescription" buttons with one attribute per product.</td>
<td width="50%"><img src="docs/screenshots/15-store-modal-live.png" alt="Store modal"><br><b>Refract inside the store.</b> The try-on opens in a modal; the store receives <code>refract:add-to-cart</code> with the frame, lens index and predicted edge.</td>
</tr>
<tr>
<td width="50%"><img src="docs/screenshots/21-store-dashboard.png" alt="Store dashboard"><br><b>Order-risk dashboard.</b> A simulated order stream (in a Web Worker) scored live, with an ROI calculator.</td>
<td width="50%"><img src="docs/screenshots/22-api-and-mcp.png" alt="API and MCP"><br><b>REST API and MCP server</b> for store backends and AI shopping agents.</td>
</tr>
</table>

### All pages

| Page | Route | What happens |
|---|---|---|
| Home | `#/` | 5-second check, scroll story, savings, comparison, trust, who pays, science strip, FAQ |
| Check a pair | `#/check` | Remake risk for any frame, vs the glasses you wear now, what-if controls, fit through your day |
| Live Rx Mirror | `#/live` | Real-time try-on through your lenses, live PD, Optics X-ray |
| Best value | `#/value` | Price vs risk for 60 combinations, Pareto frontier, three picks |
| Photo try-on | `#/studio` | Per-pixel lens rendering on a photo or a YouCam makeup render |
| Ask Refract | `#/agent` | Claude tool-use agent (or built-in planner) over the engine |
| Lens Lab | `#/lab` | Dispersion, AR coatings, blue-light filters, photochromic kinetics |
| Kids' eyes | `#/kids` | Myopia forecast to 18 with four evidence-based options |
| Prescription | `#/rx` | SPH / CYL / AXIS per eye, live cross-section, how to read your prescription |
| Face scan | `#/scan` | Distance, centring, pose and light checks, voice guidance, auto-capture, PD from the iris |
| YouCam analysis | `#/profile` | Face Analyzer, Skin Analysis and Makeup VTO results |
| Sample frames | `#/frames` | The 12-frame catalogue ranked for you |
| Shortlist | `#/bag` | Lens report and share card |
| For stores · API | `#/retail` | Dashboard, ROI, pricing, API and MCP docs, catalogue × Rx audit |

---

## What the engine says

> [!NOTE]
> Every number in this section is computed by the app's own engine, not typed in. Regenerate all of it with `npm run numbers` ([scripts/readme-numbers.mjs](scripts/readme-numbers.mjs)). Lens prices are the example upgrade prices used in the app.

### "Ultra-thin" buys less than you think

Both eyes at the same power, in the 52□19 Tate frame, PD 63 mm. The "colour split" is the prism ÷ Abbe a 10 mm side glance produces; about 0.1 Δ is where people start to notice it.

| Lens | Extra cost | −4.00 edge | −4.00 pair weight | −4.00 colour split | −6.50 edge | −6.50 pair weight | −6.50 colour split |
|---|---:|---:|---:|---:|---:|---:|---:|
| 1.50 Standard | $0 | 6.3 mm | 14.2 g | 0.069 Δ | 9.3 mm | 17.8 g | 0.112 Δ |
| 1.59 Polycarbonate | $30 | 4.7 mm | 8.2 g | 0.133 Δ | 7.1 mm | 10.9 g | 0.217 Δ |
| 1.60 Thin | $49 | 5.1 mm | 10.9 g | 0.098 Δ | 7.5 mm | 13.8 g | 0.159 Δ |
| 1.67 Extra thin | $89 | 4.7 mm | 10.8 g | 0.125 Δ | 6.8 mm | 13.5 g | 0.203 Δ |
| 1.74 Ultra thin | $149 | 4.4 mm | 11.4 g | 0.125 Δ | 6.3 mm | 14.0 g | 0.203 Δ |

- At −4, going from 1.60 to 1.74 saves **0.7 mm** of edge for **$100 more**, and splits colour **28% more**.
- 1.74 is **heavier** than 1.67 at both powers: its resin is denser (1.47 vs 1.35 g/cm³).

### A smaller frame beats a thinner lens

At −6.50, rectangular acetate frames with an 18 mm bridge:

| Frame size | Edge with 1.60 | Edge with 1.74 |
|---|---:|---:|
| 46□18 | **5.5 mm** | 4.7 mm |
| 50□18 | 6.8 mm | 5.8 mm |
| 52□18 | 7.5 mm | 6.3 mm |
| 54□18 | 8.4 mm | 7.0 mm |
| 56□18 | 9.2 mm | 7.6 mm |

A 46 mm frame with the cheaper 1.60 lens (5.5 mm) is thinner than a 52 mm frame with the 1.74 upgrade (6.3 mm).

### How your eyes look to everyone else

Minus lenses shrink the eyes; plus lenses enlarge them (`1/(1 − d·F)`, iris 15 mm behind the lens).

| Prescription | −8 | −6 | −4 | −2 | +2 | +4 | +6 |
|---|---:|---:|---:|---:|---:|---:|---:|
| **Eyes look** | −10.7% | −8.3% | −5.7% | −2.9% | +3.1% | +6.4% | +9.9% |

### One shopper, every frame

Lena (−6.50 / −6.00, a sample profile), each frame with its recommended lens (1.74 at this power). Weight is frame plus lenses. The risk is shown twice: with a webcam PD (±2.7 mm) and with a PD confirmed to ±0.5 mm.

| Frame | Size | Material | Price | Edge (mm) | Weight (g) | Risk, webcam PD | Risk, PD known |
|---|---|---|---:|---:|---:|:---:|:---:|
| Lumen | 50□19&nbsp;140 | metal | $129 | 5.1 | 22 | 58 high | **33 medium** |
| Nori | 46□21&nbsp;140 | metal | $79 | 4.5 | 26 | 60 high | **35 medium** |
| Vela | 50□20&nbsp;140 | metal | $92 | 5.4 | 27 | 65 high | 40 medium |
| Pico | 45□22&nbsp;140 | crystal | $79 | 4.6 | 30 | 67 high | 42 medium |
| Tate | 52□19&nbsp;145 | metal | $85 | 6.4 | 29 | 71 high | 46 medium |
| Halden | 49□20&nbsp;145 | acetate | $95 | 5.3 | 39 | 75 high | 50 medium |
| Atlas | 51□21&nbsp;145 | acetate | $99 | 6.2 | 39 | 76 high | 51 medium |
| Mira | 53□17&nbsp;145 | acetate | $105 | 6.3 | 42 | 80 high | 55 high |
| Kite | 58□15&nbsp;140 | metal | $120 | 7.5 | 44 | 84 high | 59 high |
| Oslo | 54□18&nbsp;145 | acetate | $89 | 7.2 | 45 | 86 high | 61 high |
| Ines | 57□16&nbsp;145 | acetate | $115 | 7.6 | 53 | 89 high | 64 high |
| Juno | 56□18&nbsp;145 | acetate | $110 | 8.2 | 57 | 93 high | 68 high |

- Confirming the PD to ±0.5 mm lowers **every** score by 25 points.
- Picking Lumen over Juno lowers it by another 35.

### Best value for that shopper

60 options (12 frames × 5 lenses), PD known; 3 of them sit on the Pareto frontier.

| Pick | Frame | Lens | Price | Risk |
|---|---|---|---:|---:|
| Lowest risk | Lumen | 1.60 Thin | $178 | 30 |
| **Best value (the knee)** | **Nori** | **1.60 Thin** | **$128** | **31** |
| Cheapest that isn't high-risk | Nori | 1.50 Standard | $79 | 33 |

Paying $50 more than the best-value pick buys 1 point of risk; the 1.74 upgrade is on none of the picks.

---

## The science inside

Refract started as an optics engine. The science pages take it into chemistry, biology and statistics, and every model is a small, pure, unit-tested module in `src/engine/`.

| Science | Model | Where | Calibrated to |
|---|---|---|---|
| **Optics** | Lens sag, decentration, magnification, Prentice + Abbe | Check a pair, Live Rx Mirror | Winter et al. 2015; ANSI Z80.1 |
| **Mechanics** | Friction, head tilt, temple clamp | Check a pair | Zhang & Mak 1999; Zhang, Chen & Luximon 2024 |
| **Wave optics** | Fresnel, thin-film transfer matrix, AR design, CIE 1931 colour | Lens Lab | Macleod; CIE; Wyman, Sloan & Shirley 2013 |
| **Chemistry** | Cauchy dispersion, Lorentz–Lorenz, photochromic kinetics, Arrhenius | Lens Lab | Mitsui datasheet; Moon et al. 2020 |
| **Biology** | Myopia progression, axial elongation, maculopathy risk; sebum vs temperature | Kids' eyes, Fit through your day | Donovan 2012; COMET 2013; Lam, Bao, ROMIO, LAMP trials; Cunliffe 1970 |
| **Math & statistics** | Weighted risk score, Pareto frontier and knee, seeded Monte Carlo | Everywhere, Best value | — |

### Optics: what your lens does

```math
F(\theta) = S + C\sin^2(\theta - \text{axis}) \qquad
s(r) = R - \sqrt{R^2 - r^2},\quad R = \frac{1000\,(n-1)}{|F|} \qquad
m = \frac{1}{1 - d\,F}
```

- **Edge thickness:** lens sag evaluated around the real frame contour, decentred to your mono PD, with a minimum centre and edge per material.
- **Lens weight:** thickness integrated over the lens shape on a 2 mm grid, times material density.
- **Eye size:** `m` with `d` = 15 mm (12 mm vertex + about 3 mm to the iris), applied along and across the cylinder axis.

```math
P_\Delta = c_{\text{cm}}\,F \qquad \text{colour split} = \frac{P_\Delta}{V} \qquad P_{\text{PD}} = \frac{e_{\text{mm}}}{10}\,|F| \le 0.67\,\Delta
```

- **Rainbow edges:** Prentice's rule gives the prism at a 10 mm glance; dividing by the Abbe number `V` gives the colour split. Perceived size and acuity cost follow Winter et al. 2015.
- **PD:** an uncertainty of ±e mm induces up to `e/10 · |F|` prism; above 0.67 Δ (ANSI Z80.1) the app asks you to confirm it.

### Mechanics: will it slide?

```math
\text{margin} = \frac{\mu_{\text{eff}}\,W_n\cos\theta + F_{\text{hold}} + \mu_t\,F_{\text{grip}}}{W_n\,(\sin\theta + a_{\text{dyn}})},\qquad
W_n = 0.65\,m g,\quad \theta = 30^\circ + \text{head pitch}
```

| Term | Value | Meaning |
|---|---|---|
| `μ_eff` | 0.61 silicone, 0.45 hard pads, × oiliness × bridge × seat | Pad friction. Oily skin cuts it 15% on silicone and 40% on hard pads |
| Oiliness | from **YouCam Skin Analysis** (1–100) | Measured, not guessed |
| `θ` | 30° nose slope + 20° phone-down head pitch | Everyday worst case |
| `F_grip` | up to 2 × 0.34 N | The most comfortable temple clamp |
| `a_dyn` | 0.3 g | Walking and nodding |

The frame creeps when the margin falls below 1. The score lists every driver, and the fixes come from the drivers.

### Wave optics: reflections and coatings

```math
R = \left(\frac{n-1}{n+1}\right)^2,\qquad R_{\text{pair}} = \frac{2R}{1+R},\qquad
M_j = \begin{pmatrix}\cos\delta_j & \tfrac{i}{n_j}\sin\delta_j\\ i\,n_j\sin\delta_j & \cos\delta_j\end{pmatrix},\quad \delta_j = \frac{2\pi n_j d_j}{\lambda}
```

The Lens Lab multiplies the layer matrices, gets the reflectance at every wavelength, and runs coordinate descent over four SiO₂ (n 1.46) / ZrO₂ (n 2.05) thicknesses to minimise daylight-weighted reflection from 420 to 680 nm. The residual spectrum is turned into a colour with the CIE 1931 observer under 6504 K daylight, which is why coated lenses show a faint violet sheen.

| Lens material | Uncoated pair | Classic single MgF₂ layer | Refract's 4-layer design |
|---|---:|---:|---:|
| 1.50 CR-39 | 7.7% | 2.85% | **0.27%** |
| 1.59 Polycarbonate | 9.8% | 1.77% | **0.29%** |
| 1.60 MR-8 | 10.1% | 1.63% | **0.29%** |
| 1.67 MR-7 | 11.8% | 1.03% | **0.32%** |
| 1.74 Episulfide | 13.6% | 0.62% | **0.34%** |

The design it finds on 1.60, from the air side: SiO₂ 91.3 nm, ZrO₂ 78 nm, SiO₂ 18 nm, ZrO₂ 25.8 nm.

### Chemistry: why thin lenses split colour

```math
n(\lambda) = A + \frac{B}{\lambda^2}\ \ \text{(fitted to } n_d \text{ and } V\text{)} \qquad
\frac{n^2-1}{n^2+2} = \frac{N\alpha}{3\varepsilon_0}\ \ \text{(Lorentz–Lorenz)}
```

Sulfur atoms and aromatic rings pack more polarizable electrons into each unit of volume. That raises the index (thinner lenses), and the same electronic transitions raise dispersion (more colour split).

| Material | Chemistry | n at 486 nm (blue) | n at 656 nm (red) | Abbe | Polarizability per volume |
|---|---|---:|---:|---:|---:|
| 1.50 CR-39 | Allyl diglycol carbonate | 1.5060 | 1.4974 | 58 | 0.294 |
| 1.59 Polycarbonate | Bisphenol-A polycarbonate | 1.5997 | 1.5801 | 30 | 0.336 |
| 1.60 MR-8 | Thiourethane | 1.6102 | 1.5956 | 41 | 0.342 |
| 1.67 MR-7 | Thiourethane, more sulfur | 1.6846 | 1.6637 | 32 | 0.374 |
| 1.74 | Episulfide resin | 1.7562 | 1.7330 | 32 | 0.403 |

### Chemistry: photochromic lenses

```math
\frac{dc}{dt} = k_{\text{act}}\,U\,(1-c) - k_{\text{fade}}(T)\,c,\qquad
k_{\text{fade}}(T) = k_{21}\,e^{-\frac{E_a}{R}\left(\frac{1}{T}-\frac{1}{T_{21}}\right)},\qquad
\tau = 0.95\cdot 10^{-0.9\,c}
```

UV switches dye molecules to their dark form; heat switches them back (Arrhenius, E<sub>a</sub> 80 kJ/mol, fade half-life 45 s at 21 °C, calibrated to the 12 lenses measured by Moon et al. 2020). Transmission follows Beer–Lambert. Windshields block about 96% of UVA.

| Scene | Air | Darkest (light let through) | Darkens in | Clears in |
|---|---:|---:|---:|---:|
| Sun | 6 °C | 14% | 76 s | 1,087 s |
| Sun | 21 °C | 25% | 53 s | 165 s |
| Sun | 35 °C | **52%** | 24 s | 26 s |
| Cloud | 21 °C | 41% | 89 s | 135 s |
| In a car | 21 °C | **83%** | 139 s | 18 s |

Photochromic lenses barely darken on a hot beach or behind a windshield, and take 18 minutes to clear after a cold walk.

### Evidence: blue-light filters

A filter that removes 20% of 400–450 nm light costs only 0.2% of brightness, but it tints white paper yellow (the Lens Lab shows the exact colour). The 2023 Cochrane review (Singh et al., 17 trials) found they probably make no difference to short-term eye strain, so the Lens Lab says so plainly instead of upselling them.

### Biology: where is my child's prescription heading?

```math
r(a) = r_0\,(1-0.097)^{\,a-9.3}\;\frac{s(a)}{s(13)}\;(1+0.135\,p)\;f,\qquad
s(a) = \frac{1}{1+e^{(a-15.19)/2.33}}\ \ (\text{applied from age } 13)
```

| Term | Value | Source |
|---|---|---|
| `r₀` (age 9.3, single-vision glasses) | 0.82 D/yr East Asian, 0.55 D/yr European, 0.68 D/yr other | Donovan et al., *Optom Vis Sci* 2012 |
| Slowing with age | 9.7% per year | Smotherman et al., *IOVS* 2023 |
| `s(a)` stabilization | 48% stopped by 15, 77% by 18 | COMET, Hardy et al., *IOVS* 2013 |
| `p` myopic parents | 13.5% faster per parent | COMET 2013 |
| `f` intervention | DIMS 0.48, HAL 0.45, ortho-k 0.57, atropine 0.05% 0.33 | Lam 2020, Bao 2022, ROMIO 2012, LAMP 2019 |
| Eye length | 23.5 mm + 1 mm per 2.5 D | Atchison 2004 |
| Maculopathy | risk × 1.67 per dioptre | Bullimore & Brennan 2019 |

**Calibration check:** a European 9-year-old at −2.00 lands on **−4.87 D at 18**, exactly COMET's mean at stabilization.

<table>
<tr><th colspan="4">European descent, age 9, −2.00</th><th colspan="4">East or South-East Asian, age 9, −2.00</th></tr>
<tr><th>Option</th><th>At 18</th><th>Eye length</th><th>Maculopathy risk</th><th>Option</th><th>At 18</th><th>Eye length</th><th>Maculopathy risk</th></tr>
<tr><td>Regular glasses</td><td>−4.87&nbsp;D</td><td>25.4&nbsp;mm</td><td>baseline</td><td>Regular glasses</td><td>−6.28&nbsp;D</td><td>26.0&nbsp;mm</td><td>baseline</td></tr>
<tr><td>DIMS lenses</td><td>−3.38&nbsp;D</td><td>24.9&nbsp;mm</td><td>53% lower</td><td>DIMS lenses</td><td>−4.05&nbsp;D</td><td>25.1&nbsp;mm</td><td>68% lower</td></tr>
<tr><td>HAL lenses</td><td>−3.29&nbsp;D</td><td>24.8&nbsp;mm</td><td>56% lower</td><td>HAL lenses</td><td>−3.93&nbsp;D</td><td>25.1&nbsp;mm</td><td>70% lower</td></tr>
<tr><td>Ortho-k</td><td>−3.64&nbsp;D</td><td>25.0&nbsp;mm</td><td>47% lower</td><td>Ortho-k</td><td>−4.44&nbsp;D</td><td>25.3&nbsp;mm</td><td>61% lower</td></tr>
<tr><td>Atropine 0.05%</td><td>−2.95&nbsp;D</td><td>24.7&nbsp;mm</td><td>63% lower</td><td>Atropine 0.05%</td><td>−3.41&nbsp;D</td><td>24.9&nbsp;mm</td><td>77% lower</td></tr>
</table>

> [!CAUTION]
> Kids' eyes shows population averages for parents, not a diagnosis. The trials ran 1–3 years; the forecast assumes their effect holds until progression stops. An eye doctor decides on treatment.

### Biology and statistics: fit through your day

```math
\text{oil}(T_{\text{air}}) = \text{oil}_{\text{scan}}\cdot 1.1^{\,0.3\,(T_{\text{air}} - 22^{\circ}\mathrm{C})}
```

YouCam measures nose oiliness once, indoors (here `oil` = 100 − the YouCam score, so higher means oilier). Skin makes about 10% more sebum per °C of skin temperature, and nose skin moves about 0.3 °C per °C of air (a model assumption). For each hour, 300 seeded samples draw head pitch from N(20°, 12°) and skin temperature ±1.5 °C, and count how often the slip margin falls below 1: 7,200 runs per day, the same answer every time.

Expected hours the frame creeps while awake (07:00–23:00), Lena's lenses, oiliness score 40:

| Frame | Cold day (6 °C) | Mild day (22 °C) | Hot day (34 °C) |
|---|---:|---:|---:|
| Tate (metal, silicone pads) | 1.5 h | 1.6 h | 1.7 h |
| Halden (acetate, fixed bridge) | 11.0 h | 11.8 h | 12.6 h |
| Juno (big acetate) | 15.0 h | 15.9 h | 16.0 h |

The frame matters far more than the weather; heat adds more than an hour and a half of creeping to a borderline frame.

### Math: the score and the frontier

```math
\text{risk} = 100\,\big(0.25\,x_{\text{look}} + 0.20\,x_{\text{sight}} + 0.30\,x_{\text{fit}} + 0.25\,x_{\text{measure}}\big),\qquad x \in [0, 1]
```

High from 55, medium from 30. Best value keeps the options nothing beats on both price and risk (the Pareto frontier) and picks its **knee**: the point furthest from the line joining the cheapest and the safest ends, with both axes normalised.

---

## How it is built

```mermaid
flowchart LR
  subgraph Browser["Browser · React 19 + anime.js"]
    UI["Pages, charts and animations"]
    MP["MediaPipe Face Landmarker"]
    GL["WebGL2 lens shader"]
    WK["Web Worker: store order stream"]
  end
  ENG["Shared engine · src/engine<br/>optics · risk · sight · light · photochromic<br/>myopia · climate · value (pure JS, tested)"]
  subgraph Server["Node server · Express locally, one Vercel function in production"]
    R["router.js<br/>rate limits · daily unit budget"]
    YC["youcam.js<br/>File API, task, poll"]
    AG["agent.js<br/>Claude tool use or planner"]
  end
  MCP["mcp.js · MCP server over stdio"]
  Y[("YouCam API<br/>Face · Skin · Makeup")]
  C[("Claude")]
  ST["Store page + embed.js"]
  BE["Store backend"]
  AI["AI shopping agents"]

  MP --> GL --> UI
  UI --> ENG
  WK --> UI
  UI -- "/api/youcam/run" --> R
  UI -- "/api/agent" --> R
  R --> YC --> Y
  R --> AG --> C
  AG --> ENG
  BE -- "POST /api/v1/risk" --> R --> ENG
  ST -- "modal · refract:add-to-cart" --> UI
  AI --> MCP --> ENG
```

The same engine files run in the browser, the API, the MCP server and the agent, so a store's API call, an AI agent and the shopper's screen always agree.

### A YouCam call, end to end

```mermaid
sequenceDiagram
  autonumber
  participant B as Browser
  participant S as Refract server
  participant Y as YouCam API
  B->>S: POST /api/youcam/run (feature, photo)
  S->>S: rate limit, daily unit budget, params from server presets
  S->>Y: File API: upload the photo
  S->>Y: Create the task
  loop Until done (under the 120 s function limit)
    S->>Y: Poll the task
  end
  Y-->>S: Results, masks, try-on image
  S-->>B: Results, units spent, time taken
```

### YouCam APIs used

All calls go through the server (the key never reaches the browser), on the India-reachable host `https://yce-api-01.makeupar.com`.

| API | Endpoint | Used for | Units |
|---|---|---|---:|
| AI Face Analyzer | `POST /s2s/v2.0/task/face-attr-analysis` (9 features) | Face shape for frame fit; eye shape, size, setting and eyelid for makeup placement; eye, brow and hair colour for shades | 20 |
| AI Skin Analysis | `POST /s2s/v2.1/task/skin-analysis` (HD when the face crop is ≥ 1080 px, else SD) | **Oiliness for nose-pad grip**; dark circles, eye bags, crow's feet, lid droop and tear trough, which a plus lens magnifies | 12 / 16 |
| AI Makeup VTO | `POST /s2s/v2.0/task/makeup-vto` (eye shadow, liner, lashes, brows, concealer, skin smooth) | An Rx-tuned eye look next to a generic one, on the shopper's own photo | 1 each |

About 35–40 units per full profile. The face is auto-cropped to about 70% of the width (the API needs more than 60%), which avoids `error_src_face_too_small`.

### Tech stack

| Layer | Choice | Why |
|---|---|---|
| UI | React 19, Vite 6, a dark glass/HUD design system | Fast, small, phone-first |
| Motion | anime.js 4 | Timelines, scroll sync, springs, SVG drawing, draggables |
| Face tracking | MediaPipe Face Landmarker (in the browser) | 478 landmarks including the irises, no upload |
| Rendering | WebGL2 fragment shader | Re-samples every pixel through the lens in real time |
| Engine | Plain ES modules in `src/engine/` | Pure functions, shared by app, API, MCP and agent |
| Server | Node, Express locally, one Vercel function in production | One port for app and API in development |
| AI | YouCam API (Face, Skin, Makeup); Claude for the agent | Measured face and skin data; explained answers |
| Agents | Model Context Protocol SDK | AI shopping agents call the same engine |
| Tests | `node:test`, puppeteer-core for screenshots and end-to-end runs | No test framework to install |

### anime.js, used as a storytelling tool

| What you see | anime.js API | Where |
|---|---|---|
| Prescription dial you can throw and that settles on a spring | `createDraggable`, `spring` | Home, 5-second check |
| Story scrubbed by scroll | `createTimeline` + `onScroll` sync, `createScope` | Home, "Four ways new glasses go wrong" |
| Lines that draw themselves | `svg.createDrawable` | Scroll story, Best value frontier, Kids' forecast, photochromic curve |
| Kinetic headline and decoding kicker | `splitText` + `stagger`, `scrambleText` | Home hero |
| Science loops that play only on screen | `createTimeline` + `onScroll` play/pause | Home science strip |
| Spectra that morph when you change a setting | `animate` on the path `d` with a spring | Coating reflectance, blue-light transmission |
| Light rays re-tracing through a new material | `animate` line end points, `spring`, `stagger` | Lens Lab prism |
| Time-lapse driven by a simulation clock | `animate` on a plain object + `onUpdate` | Photochromic |
| An eye that grows longer as a child grows | `createTimer` + `spring` | Kids' eyes |
| 24 hour arcs changing colour in sequence | `animate` + `stagger` | Fit through your day |
| Scatter points popping in | `animate` scale + `stagger` | Best value |

Every animation is skipped when the device asks for reduced motion.

### Performance

Measured in Node on a laptop:

| Computation | Time |
|---|---:|
| Myopia forecast to 18 | 0.04 ms |
| Fit through your day (7,200 Monte Carlo runs) | 3.6 ms |
| AR coating design (cached per material) | 42 ms |
| Best value (60 full risk checks) | 119 ms |

---

## For stores and AI agents

### Embed: one script tag

```html
<script src="https://YOUR-REFRACT-HOST/embed.js" async></script>

<button data-refract-sku="halden">Try with my prescription</button>

<script>
  addEventListener("refract:add-to-cart", (e) => {
    cart.add(e.detail); // frame, lens index, predicted edge (mm)
  });
</script>
```

A demo store is at `/store/index.html`.

### REST API

| Method | Path | What it does |
|---|---|---|
| `GET` | `/api/health` | Whether the YouCam and LLM keys are configured |
| `GET` | `/api/v1/frames` | The catalogue with dimensions, weight, pads, material and price |
| `POST` | `/api/v1/risk` | Remake risk for a catalogue frame (`frameId`), **any frame by its printed size** (`frame`), or the whole catalogue ranked (neither) |
| `POST` | `/api/youcam/run` | Runs a YouCam feature with server-side presets |
| `POST` | `/api/agent` | Ask Refract |

```bash
curl -X POST http://localhost:5190/api/v1/risk \
  -H "content-type: application/json" \
  -d '{
    "rx": { "od": { "sph": -6.5, "cyl": -0.75, "axis": 180 },
            "os": { "sph": -6.0, "cyl": -0.5,  "axis": 175 } },
    "pd": { "left": 31.5, "right": 31.5, "plusMinus": 0.5 },
    "frame": { "size": "52-18-140", "shape": "rect", "material": "acetate" },
    "oiliness": 40
  }'
```

<details>
<summary><b>Response</b> (real output of the current engine)</summary>

```json
{
  "frameId": "custom",
  "size": "52-18-140",
  "frame": { "shape": "rect", "material": "acetate", "lensHeightMm": 35, "estimatedWeightG": 25 },
  "score": 56,
  "level": "high",
  "fixes": [
    "Smaller, rounder frame or a higher index",
    "A higher-Abbe material (1.50 or 1.60) keeps edges cleaner",
    "A higher-index lens cuts lens weight"
  ],
  "lensIndex": "1.74 Ultra thin",
  "parts": {
    "look":    { "level": "medium", "headline": "6.5 mm edge · eyes −9%", "fix": "Smaller, rounder frame or a higher index" },
    "sight":   { "level": "high",   "headline": "0.23 Δ colour split at a 10 mm glance (1.74 Ultra thin)", "fix": "A higher-Abbe material (1.50 or 1.60) keeps edges cleaner" },
    "fit":     { "level": "high",   "headline": "slip margin 0.9× · 40.7 g", "fix": "A higher-index lens cuts lens weight" },
    "measure": { "level": "low",    "headline": "0.36 Δ possible prism from PD ±0.5 mm", "fix": null }
  }
}
```

</details>

Shapes: `round`, `oval`, `rect`, `square`, `browline`, `panto`, `cat`, `butterfly`, `aviator`, `geo`; aliases such as `rectangle`, `cat-eye`, `pilot` and `clubmaster` are normalised. Materials: `acetate`, `metal`, `titanium`; `plastic`, `TR90` and `stainless steel` are understood too. Unknown values are rejected with a 400 that lists the valid ones, never guessed.

### MCP server for AI shopping agents

```bash
npm run mcp   # MCP server over stdio
```

```json
{
  "mcpServers": {
    "refract": { "command": "node", "args": ["/path/to/refract-rx-tryon/server/mcp.js"] }
  }
}
```

| Tool | What an agent gets |
|---|---|
| `check_any_frame` | Remake risk and lens thickness for **any** frame on the internet, from the size printed inside its arm, its shape and material |
| `rank_frames` | Every catalogue frame ranked by remake risk for a prescription |
| `remake_risk` | Whether a frame and prescription are likely to be remade, with the reason and fixes |
| `lens_report` | Edge and centre thickness, lens weight and eye-size change at the recommended index |
| `sight_by_material` | Lens materials compared by colour-clean zone and acuity lost at a 10 mm glance |

The in-app agent (Ask Refract, `claude-opus-5-5` with tool use) has its own tools: `search_frames`, `lens_report`, `plan_eye_look` and `suggest_action`. Each tool call is shown in the chat, so every number can be traced to the engine.

### Pricing for stores

| Plan | Price | Checks | Includes |
|---|---:|---|---|
| Starter | $49 / month | 2,000 / month | Live Rx Mirror embed, remake-risk check on product pages, a risk badge per order |
| Growth | $199 / month | 15,000 / month | Everything in Starter, order-risk dashboard and exports, REST API and the YouCam beauty layer |
| Enterprise | Custom | Unlimited | MCP server for AI shopping agents, lab / LMS integration, catalogue sync |

---

## Quality, privacy and spend protection

### 121 tests

```bash
npm test
```

| Area | Suites | Tests |
|---|---|---:|
| Lens optics and frame fitting | `optics`, `fit` | 15 |
| Sight and colour fringes | `sight` | 6 |
| Slip physics and remake risk | `risk` | 12 |
| Any frame from any store | `anyframe`, `bookmarklet` | 14 |
| Face measurement and the live mirror | `measure`, `live`, `smooth`, `placement` | 17 |
| YouCam integration | `normalize`, `makeup`, `sniff` | 11 |
| REST API, MCP server and agent | `api`, `mcp`, `agent` | 13 |
| Guards, limits and the store simulation | `fixes`, `simulate` | 9 |
| Science: light, photochromic, myopia, climate, value | `light`, `photochromic`, `myopia`, `climate`, `value` | 24 |
| **Total** | **23 suites** | **121** |

A few of them, to show the style:

- `minus lens shrinks the eye about 8.3% at -6 D (iris 15 mm behind the lens)`
- `Prentice: 1 cm off-centre through a −7 D lens is 7 prism dioptres`
- `silicone pads lose less grip on oily skin than hard pads (skin tribology)`
- `thin-film transfer matrix matches closed forms`
- `a designed multilayer AR coating beats the classic single MgF2 layer`
- `the thermal fade-back follows Arrhenius: slower in the cold, faster in the heat`
- `a European 9-year-old at -2 lands near COMET's mean at stabilization (-4.87 D)`
- `YouCam params are built on the server from presets, not taken from the client`

### Privacy

- Face tracking, PD measurement and the live mirror run **on your device**.
- A photo leaves the device only when you run a YouCam analysis, through Refract's server; the YouCam key never reaches the browser.
- "Today's weather" in Fit through your day asks Open-Meteo only when you click, with coordinates rounded to 0.1°.

### Spend protection for a public demo

| Guard | Limit |
|---|---|
| YouCam runs per IP | 24 per 10 minutes |
| Agent requests per IP | 30 per 10 minutes |
| Risk API calls per IP | 120 per 10 minutes |
| Daily YouCam units | `YOUCAM_DAILY_UNITS` (default 400) |
| YouCam parameters | Built on the server from fixed presets; the browser only names the analysis |

---

## Run it locally

```bash
git clone https://github.com/nitya-prakash-pandey-2005/refract-rx-tryon.git
cd refract-rx-tryon
npm install
cp .env.example .env     # add YOUCAM_API_KEY, optionally ANTHROPIC_API_KEY
npm run dev              # http://localhost:5190 (app + API on one port)
```

> [!TIP]
> **No keys?** Open the app and pick a sample profile (Lena −6.50, Helen +2.75). When `public/replay/` holds recordings, the profiles replay real YouCam responses, labelled as recorded in the UI. The home page, Check a pair, Lens Lab, Kids' eyes, Best value, photo try-on, frames, the store dashboard and the planner agent need no keys at all.

### Environment variables

| Variable | Required | Default | Purpose |
|---|:---:|---|---|
| `YOUCAM_API_KEY` | for live YouCam | — | Face Analyzer, Skin Analysis, Makeup VTO |
| `YOUCAM_BASE` | | `https://yce-api-01.makeupar.com` | India-reachable YouCam host |
| `ANTHROPIC_API_KEY` | | — | Claude for Ask Refract; without it, a built-in planner answers |
| `YOUCAM_DAILY_UNITS` | | `400` | Daily cap on live YouCam units |
| `RECORD` | | — | `1` saves real YouCam responses to `public/replay/` |
| `PORT` | | `5190` | Dev server port |

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | App and API on one port, with Vite hot reload |
| `npm test` | All 121 tests |
| `npm run numbers` | Recomputes every table in this README from the engine |
| `npm run mcp` | MCP server over stdio |
| `npm run build` | Production build in `dist/` |
| `node scripts/gallery.mjs <face.y4m> [outDir]` | Regenerates the screenshots in `docs/screenshots/` with a fake webcam |
| `node scripts/record-personas.mjs` | Records sample-profile YouCam responses (run the server with `RECORD=1`; about 35–40 units per profile) |

**Deploy:** `vercel.json` serves the Vite build and routes `/api/*` to one serverless function (`api/index.js`). Set `YOUCAM_API_KEY` (and optionally `ANTHROPIC_API_KEY`) as environment variables.

---

## Project layout

```text
src/engine/       Pure, tested models
  optics.js         lens powers, sag, edge thickness, weight, magnification
  sight.js          Prentice, Abbe, colour-clean zone, acuity cost
  risk.js           slip physics, PD prism, the remake-risk score
  fit.js            lens pairs on a frame, frame ranking
  frames.js         12-frame catalogue, any frame from its printed size
  measure.js        iris ruler, PD, face crop, scan quality checks
  light.js          Fresnel, thin films, AR design, CIE colour, Cauchy, Lorentz–Lorenz
  photochromic.js   UV activation, Arrhenius fade, Beer–Lambert
  myopia.js         children's myopia forecast and interventions
  climate.js        sebum vs temperature, Monte Carlo through the day
  value.js          Pareto frontier and knee
  makeup.js, placement.js, simulate.js, youcam.js, rxinput.js
src/pages/        Home, Check, Live, Value, Studio, Agent, Lab, Kids, Rx, Scan, Profile, Frames, Bag, Retail
src/components/   QuickCheck, FailStory, DayRing, SightSim, RemakeDashboard, RxGuide, lab/ (Prism, Coating, BlueLight, Photochromic), …
src/vision/       landmarker.js (MediaPipe), glwarp.js (WebGL2 lens shader), compose.js, smooth.js, card.js, image.js
src/lib/          anim.js (anime.js helpers), bookmarklet.js, embed.js, router.js, speech.js, …
src/workers/      sim.worker.js (store order stream)
src/tour/         guided tour
server/           router.js, youcam.js, agent.js, mcp.js, limits.js, dev.js
api/index.js      Vercel entry
public/           embed.js, store/ (demo store), replay/ (recorded YouCam responses), demo/ (sample portraits)
scripts/          gallery.mjs, readme-numbers.mjs, record-personas.mjs
tests/            23 node:test suites
docs/             EVIDENCE.md, DEVPOST.md, screenshots/
```

---

## Honest limits

- A cosmetic shopping preview and education, **not medical advice**. An optician confirms the prescription and PD; an eye doctor decides on myopia treatment.
- Frames are drawn by Refract's renderer at real scale. YouCam's eyewear try-on and glasses removal are enterprise products outside the self-serve API, so Refract spends the YouCam API where it adds the most: face, skin and makeup.
- A frame typed in by size gets its lens height and weight estimated from catalogue ratios unless the listing gives the height; the check says so.
- Iris-based PD has about ±4% uncertainty (shown in the app); for strong prescriptions the app suggests confirming it.
- The lens model is thin-lens with spherical surfaces; real aspheric designs come out somewhat thinner.
- The slip score is a physics-based heuristic, not yet validated against a store's return data. That is the next step.
- How much nose skin warms with the air (0.3 °C per °C) is a model assumption, and the COMET stabilization percentages come from a secondary source. [docs/EVIDENCE.md](docs/EVIDENCE.md) marks every such value.

## Evidence and credits

- **Sources, constants and our own measurement experiment:** [docs/EVIDENCE.md](docs/EVIDENCE.md), including the [science models](docs/EVIDENCE.md#v5-science-models-branch-v5-science).
- **YouCam AI APIs** by Perfect Corp. Sample portraits in `public/demo/` are YouCam API documentation sample images.
- **MediaPipe Face Landmarker** (Apache-2.0). **anime.js** (MIT).

MIT licensed. See [LICENSE](LICENSE).

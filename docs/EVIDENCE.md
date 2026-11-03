# Evidence behind Refract's remake-risk engine

Sources gathered on 2026-11-02. Old or vendor figures are labelled; inferred values say so.

## The problem: glasses fail after purchase
- **7.6% of prescription eyewear jobs are redone every month** (Vision Council lab + ECP surveys, 2012); the industry range is 5–15%. [Eyecare Business, Dec 2012](https://eyecarebusiness.com/issues/2012/december/editor-s-letter/)
- **Causes of redos:**
  - warranty remakes 36% (of which failed AR + non-adapts 17%);
  - Rx errors 30%;
  - **measurement errors 13%**;
  - finishing 6%; surfacing 5%; order 3%; input 1%.

  Measurement redos are often logged as "non-adapts". [Eyecare Business, May 2012](https://eyecarebusiness.com/issues/2012/may/redos-remakes/)
- **Lab cost per redo (2012–13):**

  | Job | Lab cost per redo |
  |---|---|
  | Progressive | $63.87 |
  | AR | $66.55 |
  | Single vision | $16.82 |

  A redone progressive takes **5.71 extra days**. [20/20 Magazine](https://www.2020mag.com/article/finding-the-balance-with-redos-remakes-and-warranties) A full remake costs **2–3× the lab charge** (lab blog). [iCare Labs](https://blog.icarelabs.com/blog/how-to-cut-remakes-in-half)
- **Online eyewear returns:**
  - commonly estimated at 15–20%;
  - 22% for cross-border orders (Shopify 2024 via Fittingbox);
  - fit is the leading reason (vendor sources). [Fittingbox](https://fittingbox.com/en/resources/blog/lower-returns-in-cross-border-sales-with-precise-pd)
- **Progressive non-adaptation:** practitioners estimate 5–10%. [Optiboard](https://www.optiboard.com/forums/forum/optical-forums/general-optics-and-eyecare-discussion-forum/29176-non-adapts-of-progressives)

## Who it affects
- **Myopia:**
  - 1.41B people (22.9%) in 2000;
  - **4.76B (49.8%) by 2050, with 938M highly myopic** (Holden et al., *Ophthalmology* 2016;123:1036). [PubMed](https://pubmed.ncbi.nlm.nih.gov/26875007/)
- **Presbyopia:** 1.8B people in 2015, 826M without adequate near correction (Fricke et al., *Ophthalmology* 2018).
- **Low and flat nasal bridges are typical** across East Asian, Southeast Asian and African-descent faces. Frames are designed around European norms, and frames slide on wider, flatter bridges. [Clinical Optometry 2025 review](https://www.dovepress.com/african-facial-anthropometry-and-spectacle-frame-design-a-review-peer-reviewed-fulltext-article-OPTO)
- **"Low-bridge" or "Asian fit" lines** now sell at Warby Parker, Zenni, EyeBuyDirect, Oakley and JINS.

## Market and pricing anchors
- **Global eyewear market:** about $160–220B (2025 estimates: GMI, Fortune BI, Ken Research).
- **India:**
  - ₹78,800 crore market in FY25, heading to ₹1,48,300 crore by FY30;
  - 73% of the value is prescription glasses;
  - Lenskart sold **27.2M pairs** in FY25 through 2,723 stores. [Kotak](https://www.kotaksecurities.com/news/market-news/lenskart-fy25-revenue-profit-analysis)
- **What retailers pay today:**
  - online try-on: Fittingbox Shopify app **$59–199 a month**;
  - in-store 3D centration: ZEISS VISUFIT 1000 **about £28,000 (£566 a month over 60 months)**.

## Prior art (why Refract is new online)
- **Rendering refraction on the face:** a research prototype exists (Zhang, Guo, Laffont, Martin, Gross, "A Virtual Try-On System for Prescription Eyeglasses", *IEEE CG&A* 2017, offline video). [PDF](https://qianzhanginfo.github.io/assets/pubs/virtualtryon.pdf)
- **In store:** Fittingbox Optical Fit Pro (iPad, Sept 2025) simulates lens thickness.
- **Online:** none found. Perfect Corp's eyewear try-on offers only tint, density and reflection.
- **Wearer's view of a lens:** optician tools only (Hoya HVC Viewer and Vision Simulator, Essilor Nautilus, Shamir), behind an optician login or a headset.
- **Slip and pressure prediction from Rx lens weight, nose geometry and skin oiliness:** not found. Fit tools stop at geometry (Topology, Warby Parker patents).
- **Per-order remake-risk score:** not found. Only single-factor tools exist (PD tools, lab thickness calculators such as Essilor Precal).
- **Rx-aware MCP tools for AI shopping agents:** not found. Existing eyewear MCP servers are generic Shopify cart tools.

## Physics and standards used
- **Prentice's rule:** prism (Δ) = decentration (cm) × power (D).
- **Transverse chromatic aberration:** TCA = prism ÷ Abbe number.
  - Abbe numbers: CR-39 58; polycarbonate about 30; 1.60 about 41; 1.67 about 32; 1.74 about 32.
  - At 5 Δ off-axis, polycarbonate spreads about 0.17 Δ of colour against 0.09 Δ for CR-39. [20/20 "Crossing Abbe Road"](https://www.2020mag.com/article/crossing-abbe-road)
- **ANSI Z80.1:** unwanted horizontal prism ≤ 0.67 Δ.
- **Spectacle magnification:** power factor 1/(1 − d·F), with d ≈ 12 mm vertex.

## Our own experiment: can one photo measure the nose bridge?
We ran MediaPipe Face Landmarker on four portraits (YouCam sample images), with iris-scaled millimetres.
- **Depth-based bridge height came out at 15–16 mm for every face.** That's the model's canonical-face prior, not a measurement, so we don't use it.
- **2D measurements were consistent and plausible:**
  - inner-eye-corner gap 29.7–31.1 mm (typical adult);
  - nose width at pad height 12.8–13.9 mm.

Refract therefore measures nose width and face width from the photo, takes skin oiliness from YouCam Skin AI, and asks one question for bridge height ("do glasses rest on your cheeks?").

## Constants in the models, with sources
| Model | Constant | Value | Source |
|---|---|---|---|
| Sight | Perceived colour split | 0.49 ± 0.03 arcmin per Δ (V≈32 lens) | Winter et al., *JOSA A* 32(10):1764, 2015 [PDF](https://www.aphys.kth.se/polopoly_fs/1.591766!/Effect_of_induced_transverse_chromatic_aberration_on_peripheral_vision.pdf) |
| Sight | Acuity cost | 0.032 logMAR per arcmin of TCA (foveal); 0.1 logMAR = 1 chart line | Winter 2015; Meslin & Obrecht 1988 |
| Sight | Noticeable TCA | about 0.1 Δ; clean-zone radius ≈ V/\|F\| mm | Jalie (teaching sources) |
| Sight | Abbe numbers | CR-39 58 · PC 30 · MR-8 41 · MR-7 31–32 · 1.74 32 | Mitsui MR brochure, Universe Optical |
| Look | Observer magnification | 1/(1 − d·F), d = vertex 12 mm + about 3 mm to the iris | Spectacle-magnification optics |
| Fit | Silicone pad on skin | μ = 0.61 ± 0.21 (in vivo) | Zhang & Mak, *Prosthet Orthot Int* 1999 |
| Fit | Hard polymer on skin | μ ≈ 0.37–0.5; lubricating lipid/sweat films lower friction on smooth hard surfaces | Zhang & Mak 1999; Gerhardt et al., *Tribol Lett* 2009; J Bionic Eng 2014 |
| Fit | Comfortable temple clamp | 0.34 N per temple (cantilever model) | Zhang, Chen & Luximon, *Meas. Sci. Technol.* 35:105903, 2024 |
| Fit | Pressure marks | about 4.3 kPa sustained (capillary closure); 14.7 kPa pad design limit | Landis; nose-pad patent |
| Measure | Prism tolerance | ≤ 0.67 Δ unwanted horizontal prism | ANSI Z80.1 |
| PD | Iris ruler | HVID 11.7 ± 0.5 mm; depth error 4.3 ± 2.4% | Google MediaPipe Iris |
| Depth | Face Mesh z | "not metrically accurate" (synthetic supervision) | Kartynnik et al., arXiv:1907.06724 |

The slip score is a physics-based **heuristic**, not a validated predictor. Validating it against a pilot store's return data is the next step.

## Lens upgrades: what "ultra-thin" buys

**What it costs:** retailers price the 1.74 upgrade well above a 1.60/1.61 lens:
- Miller & Marc lists **+€120 for 1.74 above ±6** ([price list](https://www.millerandmarc.com/en/pages/price-miller-and-marc)).
- A Singapore optical listing prices a 1.61 lens at **S$45 and a 1.74 at S$95** ([listing](https://www.carousell.sg/p/new-arrivals-of-the-season-oakley-ox8171-size-57-18-138-total-width-140-frame-height-1438017187/)).

The home page says "often €50–120 extra".

**What it buys** (Refract's lens engine; Rx sph / −0.50 × 180, accurate PD; max edge in mm):

| Sphere | Tate 52□19 metal, 1.60 | Tate, 1.74 | Juno 56□18 acetate, 1.74 | Sharpness lost at a 10 mm glance (1.60 vs 1.74) |
|---|---|---|---|---|
| −3 | 4.3 | 3.8 | 4.6 | −0.43 vs −0.55 chart lines |
| −4 | 5.2 | 4.5 | 5.6 | −0.55 vs −0.71 |
| −6 | 7.1 | 6.0 | 7.6 | −0.80 vs −1.02 |

In the same frame, 1.74 saves 0.5–1.1 mm. A medium frame with 1.60 is thinner than a large frame with 1.74 at every power shown, and sharper.

**Home story, scene 5:** at −6, oiliness 45 and a medium bridge:
- a 56□18 square acetate frame with 1.74 lenses and a selfie PD (±2.7 mm) scores **87**;
- a 48□20 titanium oval with 1.60 lenses and a card-measured PD (±0.5 mm) scores **22**.

## Any frame by its printed size

Frames carry "lens width □ bridge temple" on the arm (boxing system, mm). The lens height (B) is rarely printed. Refract estimates it from the shape, using ratios taken from the catalogue frames, unless the listing gives it:

| Shape | B / A |
|---|---|
| round | 0.90 |
| oval | 0.72 |
| rect | 0.68 |
| square | 0.85 |
| browline | 0.78 |
| panto | 0.86 |
| cat-eye | 0.79 |
| butterfly | 0.88 |
| aviator | 0.86 |
| geometric | 0.86 |

**Frame weight** is estimated per mm of lens width: metal 0.29 g, titanium 0.20 g, acetate 0.49 g (catalogue fit). Metal and titanium frames get adjustable pads; acetate gets a fixed bridge.

**The bookmarklet** reads the size from the selected text, or else from the first size on the page. It reads shape and material from the selection, the page title and the `<h1>`. When no size is found, the app says so instead of guessing.

## v5 science models (branch `v5-science`)

Every constant below is in code (`src/engine/light.js`, `photochromic.js`, `myopia.js`, `climate.js`, `value.js`) and covered by unit tests. Where sources disagree or a value is a model assumption, it says so.

### Light and lens materials (`light.js`)

| Quantity | Model / value | Source |
|---|---|---|
| Reflection per surface | Fresnel, normal incidence: ((n−1)/(n+1))². 4.0% at 1.50, 5.3% at 1.60, 7.3% at 1.74 | Textbook optics |
| Uncoated pair | 2R/(1+R) per lens (incoherent multiple reflections): 7.7% at 1.50, 13.6% at 1.74 | Textbook optics |
| Thin films | Characteristic-matrix method at normal incidence | Macleod, *Thin-Film Optical Filters* |
| AR design | Four SiO₂ (1.46) / ZrO₂ (2.05) layers, thicknesses found by coordinate descent minimizing daylight-weighted reflectance from 420 to 680 nm. Result: 0.13–0.17% per surface | Engine. Layer indices are handbook values. Trade sources give under 1% total for premium coatings |
| Residual colour | CIE 1931 2° observer (Wyman, Sloan & Shirley 2013 multi-lobe fit), daylight as a 6504 K black body, sRGB | CIE; JCGT 2013 |
| Dispersion | Cauchy n(λ) = A + B/λ², fitted to n_d and the Abbe number | Textbook optics |
| Index vs Abbe | Lorentz–Lorenz: (n²−1)/(n²+2) is polarizability per volume. Sulfur and aromatic groups raise it, and the same UV-edge transitions raise dispersion | Liu & Ueda, *J Mater Chem* 2009; Mazumder et al., *ACS Omega* 2024 |
| Materials | CR-39 1.50/58 · PC 1.59/30 · MR-8 1.60/41 · MR-7 1.67/31–32 · 1.74/32 | Mitsui MR datasheet |

### Blue-light filters
- **Evidence:** Singh et al., *Cochrane Database Syst Rev* 2023 (CD013244), 17 RCTs. They probably make no difference to short-term eye strain (low certainty). Results for sleep are inconsistent (very low certainty). There are no studies on macular health.
- **How much they filter:** typical clear filters remove about 10–25% of blue light. Calculated phototoxicity falls by 10.6–23.6% (Leung et al., *PLoS ONE* 2017).

### Photochromic lenses (`photochromic.js`)
- **Model:**
  - dc/dt = k_act·UV·(1−c) − k_fade(T)·c, with Arrhenius k_fade and Beer–Lambert transmission.
  - Calibrated to Moon et al., *PLoS ONE* 2020 (12 lenses): fade half-lives of 38–198 s at 21 °C, and 2.7–5.4× slower at 6 °C.
  - We model a fast lens: half-life 45 s at 21 °C and 261 s at 6 °C.
- **Activation energy:** about 80 kJ/mol, because fading roughly triples per 10 °C. Dyes measured in solution give 63–82 kJ/mol. No value measured in a lens polymer was found.
- **Windshields:** they block about 96% of UVA (Boxer Wachler, *JAMA Ophthalmol* 2016). Side windows block 44–96%.

### Children's myopia (`myopia.js`)
| Quantity | Value | Source |
|---|---|---|
| Progression at age 9.3, single vision | −0.82 D/yr Asian (CI 0.71–0.93), −0.55 D/yr European (0.39–0.72) | Donovan et al., *Optom Vis Sci* 2012 |
| Slowing with age | 9.7% per year of age | Smotherman et al., *IOVS* 2023 (meta-regression abstract) |
| Stabilization | Mean age 15.6 y, at −4.87 D. 48% stabilized by 15, 77% by 18 (logistic fit, applied from 13) | COMET, Hardy et al., *IOVS* 2013. The percentages come from a secondary source |
| Parents | Two myopic parents meant about 1 D more at stabilization. Modelled as 13.5% faster per parent | COMET 2013 |
| DIMS lenses | 52% less progression over 2 y; sustained to 6 y without rebound (small n) | Lam et al., *BJO* 2020; *Sci Rep* 2023 |
| HAL lenses | 55% less over 2 y; 67% with ≥12 h/day wear (self-reported, sponsor-affiliated authors) | Bao et al., *JAMA Ophthalmol* 2022 |
| Ortho-k | 43% less axial growth over 2 y | ROMIO, Cho & Cheung, *IOVS* 2012 |
| Atropine 0.05% | 67% less progression over 1 y (0.01%: 27%, not significant for axial length) | LAMP, Yam et al., *Ophthalmology* 2019 |
| Eye length | Emmetropic adult about 23.5 mm; about 2.5 D per mm (adults 2.9, children nearer 2) | Atchison et al., *IOVS* 2004; COMET |
| Each dioptre | Maculopathy prevalence ×1.67 per D, so 1 D less is about 40% lower risk | Bullimore & Brennan, *Optom Vis Sci* 2019 (modelled from population data) |
| Outdoor time | +40 min/day: incidence over 3 y 30.4% vs 39.5%; little effect once myopic | He et al., *JAMA* 2015; Wu et al., *Ophthalmology* 2013 |

**Calibration check:** a European 9-year-old at −2 D projects to −4.87 D at 18, matching COMET's mean at stabilization. The trials ran 1–3 years; the forecast assumes their effect holds until progression stops.

### Fit through the day (`climate.js`)
- **Sebum and temperature:**
  - Sebum excretion changes about 10% per °C of skin temperature (Cunliffe, Burton & Shuster, *Br J Dermatol* 1970, as quoted by Schaefer 1973).
  - Seasonal direction is disputed (Youn 2005 vs Galzote 2014), so we use only temperature.
- **Model assumption:** nose-skin temperature moves 0.3 °C per °C of air.
- **Monte Carlo:**
  - Each hour gets 300 seeded samples.
  - Head pitch is drawn as N(20°, 12°), clipped to 0–55°; skin temperature varies ±1.5 °C.
  - It reports the expected hours with slip margin below 1.
- **Today's weather:** Open-Meteo hourly forecast, requested only on a click, with coordinates rounded to 0.1°.

### Best value (`value.js`)
- **Frontier:** the Pareto frontier of (frame + lens price, remake risk) over all 12 frames × 5 lenses.
- **Knee:** the frontier point furthest from the chord between its ends, with both axes normalized.

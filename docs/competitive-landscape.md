# Competitive landscape: AI skin analysis, makeup/apparel VTO and agentic beauty commerce (as of 2 Nov 2026)

Method: web search plus primary sources where they could be fetched. Perfect Corp's site, Business Wire and Devpost blocked automated fetches, so some Perfect Corp and hackathon facts come from syndicated copies of their press releases. Many small competitors are known only from App Store listings, which are the developers' own claims. Treat "exists" as "someone ships it", not "it works well".

---

## 0. Read first

- **Deadline is today.** The YouCam API Skin AI & eCommerce VTO Hackathon (round 2, on Devpost) closes **2 Nov 2026 at 11:45 a.m. ET**, which is 16:45 UTC or 10:15 p.m. IST (US daylight saving time ended on 1 Nov). Winners are announced around 24 Nov.
  - Judging criteria: technological implementation, design, potential impact and quality of the idea.
  - Required: a code repo, a project description and a 1 to 3 minute demo video.
  - Any YouCam API may be used, as long as the app adds clear value for shoppers or retailers.
  - Prizes: $2,500, $1,000 and $500, plus a $1,000 Women in Tech award and a $1,000 Rising Star (student) award.
  - Source: https://www.webull.com/news/15740848956318720 and https://www.perfectcorp.com/business/news/YouCam-API-Hackthon-eCommerce. I could not open the Devpost page itself, so check the exact time there.
- **Round 1 (6 Jul to 17 Aug 2026, 238 submissions). Avoid copying the winners:**
  - **Aloud (1st):** voice-guided skincare shopping for blind and low-vision users.
  - **ShadeSpan (2nd):** shows each garment on 6 skin tones and scores how the color performs.
  - **KeepMe:** the shopper controls which facial features a try-on may change, and unapproved edits are flagged.
  - **ConfidFit:** a Shopify clothes try-on app with a "preview, not a fit guarantee" label (https://devpost.com/software/confidfit).
  - Other round 1 entries I saw: Skinova (scan history and trends, routines, a coach chatbot, AI Skin Simulation before/after; https://dev.to/imawais/skinova-youcam-ai-hackathon-3k46), Worn (wardrobe plus try-on; https://devpost.com/software/worn) and OurSkinOurFuture (https://github.com/Ch3nOff/OurSkinOurFuture).
- **Perfect Corp already ships the obvious idea: "selfie, then skin analysis, then chat, then recommendations, then makeup and clothes try-on".** A generic "AI beauty agent" will not look novel to these judges.
  - **YouCam AI Beauty Agent** in the YouCam Makeup app (Nov 2025): detects undertone and skin type, gives skincare advice, and suggests makeup and hairstyles. https://www.businesswire.com/news/home/20251110601035/en
  - **YouCam AI Agent** shown at CES 2026: one selfie plus live dialogue gives skin concerns, products, routines and looks. https://www.businesswire.com/news/home/20251219606970/en
  - **A2A "Agent Skill" (VivaTech, June 2026):** plugs into a brand's own agent. Described as compatible with Claude and as featuring ChatGPT-enabled skills. It covers dermatologist-validated skin analysis, makeup and clothing try-on, Shade Finder and recommendations. Recommendations come only from the brand's own catalog (brand RAG, so competing products are never mentioned). https://www.industries-cosmetiques.fr/en/?p=25138
  - **YouCam Makeup app features:**
    - **AI Wardrobe** (Jul 2026): outfit together with hair and makeup. https://www.perfectcorp.com/consumer/blog/selfie-editing/ai-virtual-try-on-ai-wardrobe
    - **AI color analysis:** https://www.perfectcorp.com/consumer/blog/photo-editing/ai-color-analysis
    - **Skin Diary:** claims to "balance lighting conditions and normalize environmental factors" so scans can be compared over time. https://www.businesswire.com/news/home/20200925005178/en
  - **APIs:**
    - Skin Analysis with up to 14 concerns. https://www.perfectcorp.com/business/blog/ai-skincare/skin-analysis-api
    - Skin Tone and Fitzpatrick analysis, Face Analyzer with color analysis, and AI Skin Simulation.
    - Clothes try-on (May 2025). https://www.businesswire.com/news/home/20250523976398/en
    - Bag, shoe, jewelry, hat and scarf try-on (Jan 2026). https://secure.businesswire.com/news/home/20260115898437/en
    - Perfect Corp has also published "Agent Skills", MCP and Claude tool guides for the YouCam API.

---

## 1. AI skin analysis consumer products

| Product | Core features | Does well | Gaps and complaints |
|---|---|---|---|
| **L'Oréal Paris Beauty Genius / Skin Genius** | "Agentic AI" assistant with memory, context and proactive guidance. Skin, skin-tone and hair diagnosis from a selfie. Recommends from about 750 products, offers try-on, and runs on the web and WhatsApp (L'Oréal reports 1.2M+ US conversations). Skin Genius gives a skin age plus radiance, pore, firmness, lines and tone scores, online and in Boots. | Scale, clinical and ingredient knowledge base, omnichannel. | Recommends L'Oréal products only. No independent accuracy checks. Nothing on tracking your own shelf. https://www.loreal.com/en/articles/science-and-technology/loreal-paris-beauty-genius/ , https://www.rli.uk.com/loreal-launches-skin-genius |
| **L'Oréal Cell BioPrint** (CES 2025) | Tabletop lab-on-a-chip that reads protein biomarkers in about 5 minutes and estimates biological skin age. Pilot in Asia, then Lancôme. | Real biology rather than pixels. | Hardware, in store or clinic only. https://loreal.com/en/press-release/research-and-innovation/loreal-cell-bioprint |
| **Olay Skin Advisor** | Mobile web selfie plus quiz, then a regimen. Generative AI and predictive modeling added. In 2026, Haut.AI's LIQA capture-quality check plus a "Virtual Companion" simulation built with SkinGPT. | Guided, quality-checked capture. Simulated future results. | Olay catalog only. No longitudinal proof of results. https://consumergoods.com/olay-upgrades-skin-advisor-gen-ai-predictive-modeling , https://haut.ai/blogs/hautai-olay-collaboration-virtual-companion |
| **Neutrogena Skin360** | 5 scores (wrinkles, fine lines, dark circles, dark spots, smoothness), a weekly check-in chatbot, journal and goals. Later moved to the web. | Built-in weekly re-scan habit. | Reviewers called side-by-side comparison "finicky" and the bot slow. https://gizmodo.com/neutrogenas-free-skincare-app-actually-works-mostly-1841026360 |
| **Haut.AI** (B2B) | Skin metrics engine, LIQA capture quality, SkinGPT photoreal simulation of product effects (sold commercially since Jan 2025). Consumer demo site Generative.Skin. | Best-in-class capture quality and simulation. | Simulation is tied to brands' own claims, with no validation from the user's own results. https://haut.ai/blogs/skingpt-commerical-announcement , https://docs.saas.haut.ai/haut.ai/haut.ai-features/skingpt |
| **Revieve** (B2B, powers many retailers) | Skin, makeup and hair advisors built with Google Cloud. AI Beauty Discovery Connect (Nov 2025) pushes brand experiences into AI shopping channels. White-label AI Skin Advisor inside ChatGPT (Mar 2026). | Distribution: runs at least 7 of the 17 scanners Which? found (Which? spells it "Revive"). | Same engine weaknesses as the Which? test below. https://www.revieve.com/insider/news/revieve-launches-ai-beauty-discovery-connect-generative-ai-commerce , https://www.revieve.com/insider/news/revieve-ai-skin-advisor-chatgpt-generative-ai-beauty-discovery |
| **Proven Skincare** | 3-minute "Skin Genome" quiz (lifestyle, water hardness, humidity, UV), then custom formulas. | Uses environmental context. | Quiz only, no photo measurement. Subscription and cancellation complaints, and the company rarely responds on Trustpilot or BBB. Its marketing database numbers are inconsistent. https://www.healthline.com/health/proven-skincare , https://thedermreview.com/proven-skincare-review/ |
| **Curology / Dermatica** | Telederm: photos plus intake, a clinician prescribes a custom Rx and progress photos are reviewed every few months. | A real prescriber in the loop. | Trustpilot complaints include "not really custom", misleading before/after photos, and an "AI bot" (Curology replied apologizing). Progress review is manual and infrequent. https://nl.trustpilot.com/review/curology.com , https://www.treatcompare.com/articles/dermatica-vs-skin-me |
| **TroveSkin** | Selfie diary and comparisons plus trigger logging. | Early mover in progress tracking. | No evidence it normalizes lighting. Gone from some App Stores. A study of user reviews still asked for better progress tracking. https://appshunter.io/ios/app/troveskin-skincare-coach/id1435184918/similar |
| **SkinVision** (medical) | Mole risk check. CE class IIa (2025). | Most-studied consumer mole app. | BMJ review: about 80% sensitivity and 78% specificity, with poor-quality studies. It would miss about 4 of 30 melanomas and give 200 false alarms per 1,000 users. https://nottingham-repository.worktribe.com/output/3950182 |
| **"AI dermatologist" GPT apps** | Upload a photo and get a likely condition. | Accessible. | GPT-4 on melanoma images: 68.5% accuracy, 52.5% sensitivity. In a 2026 JAMA Derm trial of a prototype app, users picked the right condition only 22.8% of the time. Weaker on dark skin, and users report anxiety. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11836967/ , https://www.healio.com/news/dermatology/20260430/ai-app-use-increased-patient-understanding-of-skin-conditions |
| **Perfect Corp YouCam apps** | Skin Diary, AI Beauty Agent chat, Skin Simulation, color analysis, AI Wardrobe (see section 0). | Broadest single stack. | Only checked by Perfect Corp itself. Agent recommendations are catalog-locked when white-labeled. |
| **Sephora** | Virtual Artist and Color Match (selfie shade estimate), skin diagnostics, in-store UV skin scanner in Shanghai. ChatGPT app (Mar 2026 US pilot), where checkout sends you back to Sephora. | Loyalty data (80M+ members). | In Glossy's test it returned 3 to 4 products and asked no follow-up questions. https://www.glossy.co/beauty/is-agentic-shopping-the-next-big-thing-in-beauty-sephora-and-ulta-are-betting-yes/ |
| **Nykaa Skin Scan** (India, 18 Nov 2025) | In-app selfie diagnosis that leads to recommendations. | Reach in India. | Few public details, no reviews found. https://www.mediainfoline.com/tag/nykaa |
| **Foxtale "Skin Horoscope" / Minimalist** | Foxtale: AI skin analysis plus habits leads to a regimen (vendor reports 1.6x conversion). Minimalist: Routine Recommender and Skin Analyzer. | Low friction for D2C brands. | Brand catalog only. The numbers are vendor claims. https://www.glamar.io/customer-stories/foxtale |

**Cross-cutting evidence, the most important finding.** Which? (15 Oct 2026) tested 17 retailer and brand skin scanners. https://www.which.co.uk/news/article/can-you-trust-ai-skin-analysers-a7Uhd1Q5mhUa
- **Lighting:** under identical conditions scores were stable, but changing the light moved scores by **+39 or -25 points** for about half of the testers.
- **Missed concerns:** acne was missed or contradicted in 10 of 14 testers. Pigmentation was rated "healthy" for 6 of 9 testers who had dark spots. Redness was flagged for none of 7 testers who had it.
- **Darker skin:** the tool under-detected hyperpigmentation for Fitzpatrick IV and V.
- **Risky advice:** a tester with rosacea was recommended retinol plus salicylic acid.
- **Brand skew:** L'Oréal appeared 214 times and Cosrx 154 times in recommendations.

Kettlewell (2026) found the same problem in color analysis: even under studio lighting, apps got the broad season right only about half the time. https://kettlewellcolours.com/blogs/the-colour-blog/does-ai-colour-analysis-work

---

## 2. Virtual try-on and AI shopping

| Player | What it does | Limits |
|---|---|---|
| **Google Search / AI Mode try-on** | Try apparel on your own photo (I/O 2025). Expanded to Australia, Canada and Japan plus shoes (Oct 2025), then the UK and India. Agentic checkout from "track price". | Apparel and shoes only. No skin or makeup awareness. https://www.retailtouchpoints.com/news/google-brings-advanced-ai-capabilities-to-search-including-virtual-try-on-agentic-checkout/151927/ , https://techcrunch.com/2025/10/08/googles-virtual-try-on-shopping-tool-expands-to-more-countries-now-lets-you-try-on-shoes/ |
| **Google Doppl** | Animated avatar try-on, video, sharing, and a shoppable feed (Dec 2025). | **Shut down on 30 Apr 2026**, less than a year after launch. https://blog.google/technology/google-labs/doppl/ , https://jetstream.blog/en/google-doppl-shut-down-end-of-april-2026/ |
| **Google UCP / Gemini** | Universal Commerce Protocol checkout in AI Mode and Gemini. Partners include Sephora, Ulta, Fenty and others. Universal Cart is expected around Oct 2026; sources disagree on the exact date. | Checkout only for eligible listings, with an explicit approval for each purchase. https://www.androidauthority.com/google-universal-commerce-protocol-announcement-3631662 , https://blog.google/products-and-platforms/products/shopping/shopping-updates-google-marketing-live |
| **Amazon** | Ended physical Try Before You Buy (Jan 2025). AR try-on for shoes, glasses and cosmetics. Lens Live visual search. Rufus price alerts and auto-buy, and "Buy for Me" on third-party sites. | No apparel generative try-on found. No skin-tone-based recommendations found. https://www.techradar.com/computing/artificial-intelligence/amazon-thinks-ai-helping-you-buy-clothes-is-better-than-you-sending-back-whatever-doesnt-fit , https://press.aboutamazon.com/in/news/retail/2026/3/amazon-fashion-and-beauty-make-spring-style-discovery-seamless-with-ai |
| **Alta** ($11M seed, 2025) | Digital closet, avatar try-on, and daily outfits based on calendar and weather (the "Clueless" app). Shifting to brand integrations. | Fashion only, with no skin or makeup. https://fashionunited.com/news/business/alta-raises-11-million-in-seed-funding-for-ai-powered-personal-shopping-styling-app/2025061766632 , https://wwd.com/fashion-news/fashion-features/cfda-partnership-alta-personal-styling-app-ai-1237089028 |
| **Daydream** ($50M) | Chat-based fashion search across about 2M products and 8,000 brands. Checkout happens on the partner's site. | Critics call it "thin middleware" if shoppers stay inside ChatGPT or Gemini. https://techcrunch.com/2025/06/25/julie-bornsteins-daydream-is-releasing-an-ai-powered-chatbot-for-fashion-related-shopping |
| **Gensmo** ($60 to 70M) | Fashion agent with avatar try-on. | Fashion only. https://fashionunited.com/news/business/ai-powered-fashion-agent-gensmo-secures-60-million-dollars-in-funding/2025062766848 |
| **Phia** | "Should I buy this?" price check and new-vs-secondhand comparison across 40k sites. | Price only, nothing about the person. https://www.fortune.com/2025/04/25/phoebe-gates-sophia-kianni-phia-launch-fashion-shopping-secondhand |
| **OpenAI ChatGPT** | Instant Checkout (Sep 2025, built with Stripe on ACP). Shopping research mode (24 Nov 2025) that builds buyer's guides from memory. | Checkout was reportedly **scaled back in Mar 2026** in favor of discovery, though reports conflict. CNET-style tests found it confused about beauty eligibility. https://openai.com/index/chatgpt-shopping-research , https://www.talon.one/blog/chat-gpt-shopping , https://tech.yahoo.com/ai/chatgpt/articles/chatgpt-instant-checkout-review-worse-170900195.html |
| **Perplexity** | Instant Buy with PayPal for all US users, plus avatar try-on for Pro and Max (Nov 2025). | Apparel only. https://newsroom.paypal-corp.com/2025-11-PayPal-and-Perplexity-Launch-Instant-Buy , https://alternativeto.net/news/2025/11/perplexity-adds-a-new-instant-buy-shopping-feature-with-paypal-and-virtual-try-on/ |
| **Myntra / Ajio** | Myntra has MyStylist (complete-the-look), MyFashionGPT conversational search and the Maya assistant. | No first-party generative try-on found (only a third-party Chrome extension). https://apparelresources.com/business-news/retail/myntra-launches-ai-powered-chatbot-maya-personalized-shopping-assistance |
| **Zara / H&M** | Zara app AI fitting room: Spain Dec 2025, US early 2026, 360-degree avatar from photos. Zara and H&M also use AI "digital twins" of models. | Takes minutes per look, with some facial distortion. https://letsdatascience.com/news/zara-launches-ai-virtual-try-on-tool-123794bd |
| **FASHN, Kling, Revery** (APIs) | FASHN v1.6 plus "tryon-max" (Jan 2026, about 50 seconds per image). Kling Kolors try-on at about $0.07 per generation. | These are tools, not consumer products. https://fal.ai/learn/tools/best-virtual-try-on-apis-2026 , https://fashn.ai/changelog/api-try-on-max-endpoint-now-available |
| **Snapchat** | Catalog-powered AR shopping lenses (the beauty ones use Perfect Corp's AR). New AR shopping ad formats (Feb 2026). | Ad-driven, with no skin data. https://www.theatdb.com/news/snap-inc-launches-ar-shopping-ads-with-virtual-try-on-for-beauty-brands |
| **True Fit + Glance** | True Fit fit agent (Feb 2026) plus an MCP fit-data layer. Glance's generative try-on with True Fit fit data, planned for holiday 2026. | Size and fit only, not color or skin. https://www.businesswire.com/news/home/20260217995165/en , https://www.cmswire.com/the-wire/true-fit-and-glance-bring-fit-intelligence-to-agentic-commerce-for-hundreds-of-millions-of-shoppers/ |

**Does anyone combine makeup, apparel and skin in one flow?** Only partly.
- **Perfect Corp** comes closest: in the YouCam app (Wardrobe, makeup, agent) and in its VivaTech brand skill, though the skill is limited to one brand's catalog.
- **Alhena AI** combines Perfect Corp skin analysis, shade narrowing to 2 or 3 options, try-on in chat and agentic checkout on Shopify. It covers beauty only; apparel is a separate "Live Try-On" product. https://alhena.ai/blog/virtual-makeup-try-on-ai-beauty-advisor/
- **Indie color apps** (Dressika, Color Analysis AI: Style Match, Palette Hunt) go from palette to makeup preview to outfit suggestions.

Nothing I found goes all the way from measured skin, to a validated palette, to real SKUs from several retailers across makeup and apparel, to one combined render, to a single mixed cart.

---

## 3. Agentic shopping in beauty and fashion

- **Who acts, not just advises:**
  - Google UCP checkout. Ulta was announced in Apr 2026 with in-agent checkout and no redirect. https://www.googlecloudpresscorner.com/2026-04-22-Ulta-Beauty-and-Google-Introduce-Gemini-Enabled-Shopping-Experiences-That-Streamline-Beauty-Discovery-and-Purchase
  - Perplexity Instant Buy.
  - Amazon Rufus auto-buy at a target price, and Buy for Me.
  - ChatGPT Instant Checkout, since scaled back.
  - Alhena: cart, discounts and pre-filled checkout for Shopify brands.
  - True Fit agent.
- **Advisory agents:**
  - Sephora's ChatGPT app (checkout redirects to Sephora).
  - Fenty "Rose Amber" on WhatsApp.
  - L'Oréal Beauty Genius on WhatsApp.
  - Revieve AI Skin Advisor in ChatGPT.
  - Maybelline / ModiFace makeup try-on inside ChatGPT (VivaTech 2026). https://cosmetech.co.in/article/vivatech-2026-beauty-agentic-ai-chatgpt-personalisation
  - Daydream, Gensmo, Phia.
  - Overview of the beauty initiatives: https://www.pymnts.com/artificial-intelligence-2/2026/beauty-giants-race-to-own-the-ai-shopping-moment/
- **Documented limitations:**
  - Alhena "Agentic CX Stress Test 2026" (vendor-run): 15 live agents were each asked to match a foundation shade from a selfie. 5 of 15 returned bestsellers that ignored the photo, 6 of 15 named a shade but gave no route to the product, 3 of 15 showed unsafe confidence, only 1 of 15 remembered the shopper, and only 4 of 15 could act on orders. https://alhena.ai/blog/ai-foundation-shade-matching/
  - Glossy's side-by-side test: inconsistent guardrails, Ulta and ChatGPT returning 11 to 15 product lists, and shoppers reluctant to upload their faces.
  - Which? found brand-skewed recommendations.
  - Brand agents, including Perfect Corp's skill, only recommend their own catalog, so no agent is neutral across brands.
  - ChatGPT's in-chat checkout pullback is a signal that shoppers resist fully autonomous buying.
  - No agent remembers what you already own or whether past purchases worked.

---

## 4. Do the candidate ideas already exist?

### a. "Product verdict": a product checked against your measured skin and your shelf
- **Exists? Yes, in pieces, among indie apps in 2026.**
  - **Skin Bliss** (4.7 stars from 908 ratings): AI face-scan profile (a $1.99 add-on), barcode or pasted ingredient list, a compatibility checker for clashes, duplicate ingredients and irritation, shelf-photo analysis and humidity/UV tips. Reviewers complain about the heavy paywall and duplicate database entries. https://apps.apple.com/app/1385561364
  - **Glo / Sivona** (May 2026, 8 ratings): Safety Score plus a personal "Skin Match" score, conflicts across the whole routine, and a profile learned from scans. https://mwm.ai/apps/glo-skin-scanner-routine/6762490628
  - **Skin Lens:** barcode scan gives a skin-matched 0 to 100 score plus routine clashes. https://apps.apple.com/app/id6762028112
  - **Skinlapse:** ingredient scanner that flags clashes with your routine. https://apps.apple.com/qa/app/id6785582868
  - **SkinSort:** routine builder, conflict checks (reportedly premium), dupes and pore-clogging checks. https://skinsort.com
- **How good?** Unvalidated. The "skin" input is a type label or quiz rather than measured concern severity. Each is a separate app you have to open.
- **Missing:**
  - A verdict driven by measured, per-zone concern scores, with a predicted effect and an uncertainty band.
  - "You already own a functional duplicate or dupe of this" (duplicates by active ingredient and job, not by name).
  - A makeup shade check in the same verdict.
  - Working at the point of purchase: retailer product page, share sheet or cart.
  - Neutrality across brands.

### b. Longitudinal tracking with normalized photos and "is it working?" experiments, including purge vs breakout
- **Exists? Partly.**
  - **Capture normalization:**
    - SelfieLog: ghost overlay plus live lighting feedback. https://mwm.ai/ja/apps/selfielog-acne-tracker/6757474395
    - Acne Tracker: oval guide plus treatment day counts. https://apps.apple.com/app/id6770239249
    - GlowKit: scan-quality checks.
    - Skinlapse: 5-check capture guide, redness measured against your own baseline.
    - Haut.AI LIQA (B2B).
    - YouCam Skin Diary: claims lighting normalization.
  - **Attribution:**
    - Trigger, Flara and ClearTrace look for correlations between habits and skin. https://apps.apple.com/app/id6787020115
    - SkinIQ checks purging vs breakout against the start dates of actives. https://chrome-stats.com/d/id6762494298
    - Perfect Corp's own blogs on purging vs breakout and "why skincare progress photos lie" show it is aware of the problem. https://www.perfectcorp.com/business/blog/ai-skincare/skin-purging-vs-breakout
- **How good?** The listings are unvalidated, and Which? shows that changing the light alone moves scores by 25 to 39 points, which is bigger than most real treatment effects.
- **Missing:**
  - Nobody publishes test-retest noise or a "minimum detectable change".
  - No structured experiments (baseline, then use, then washout; or split-face comparison by zone) that end with a confidence statement.
  - No consumer split-face app found. General N-of-1 trial tools such as StudyMe and StudyU exist but not for skincare. One registered split-face trial: https://www.isrctn.com/ISRCTN17303898

### c. Skin-aware seasonal color driving makeup shades and clothing colors, then a full-look try-on and a cart
- **Exists? Partly; the palette step is crowded.**
  - **Dressika** (12 seasons, 170 makeup shades, virtual wardrobe and fitting room, 180 hair colors; claims 97% accuracy): https://apps.apple.com/app/1536745174
  - **Color Analysis AI: Style Match** (season, virtual makeup, nails, outfit scores): https://apps.apple.com/us/app/-/id6747317168
  - **Palette Hunt:** https://appshunter.io/ios/app/color-analysis-palette-hunt/id6737066020
  - **YouCam AI color analysis and AI Wardrobe.**
  - **ShadeSpan:** the retailer-side version, from round 1.
  - Newer apps: Harmony, TrueChroma, WhatColorsSuitMe.
- **How good?** Kettlewell's tests: Style DNA and ChatGPT both read a warm subject as "Summer" under studio lighting, and apps got the broad season right only about half the time. Newsweek experts called ChatGPT's analysis "simplistic". https://europe.newsweek.com/can-chatgpt-accurately-color-match-put-test-1892741
- **Missing:**
  - Calibrated capture, for example with a white or gray reference.
  - Checking real SKU colors against the palette (Lab color difference) across retailers, for both makeup and apparel.
  - One combined render of face makeup plus outfit.
  - A mixed cart.
  - An in-app "drape test" so the user can confirm or override the palette.

### d. "Mirror moment": a daily selfie plus weather and your shelf decide today's routine
- **Exists? Partly.**
  - Skin Bliss: product tips based on humidity, UV and temperature.
  - Skinlapse: daily UV and weather plus a guided selfie. Routine is by product type, with no inventory.
  - Alta: daily outfits from weather and calendar (the fashion equivalent).
  - Sycle: skin-cycling night schedule. https://apps.apple.com/us/app/-/id6740410254
  - Proven: uses humidity and UV, but only once, at formulation time.
- **Missing:** combining today's measured skin state with the forecast and your exact owned products (including when to use actives, and expiry) into a concrete AM/PM plan with reasons. Daily scan noise (see b) makes "today's measured state" weak unless capture is gated.

### e. Shared "second opinion" or social try-on for group decisions
- **Exists? For one person at a time.**
  - FitCast: public vote feed. https://mwm.ai/apps/fitcast-ai-virtual-try-on/6765899485
  - Ask My Wardrobe: private share link. https://chatgate.ai/post/ask-my-wardrobe
  - Dresly and Atricent.
  - Doppl had sharing, but it shut down in Apr 2026.
  - Perfect Corp's bridesmaid try-on is pitched for coordinating a bridal party, with image sharing. https://www.perfectcorp.com/business/products/bridesmaid-dresses-virtual-try-on
- **Missing:** decisions for several people at once, where each member is rendered in coordinated looks, the palette works across the group, people vote toward consensus, and the cart is shared or split. Glance (Oct 2025) said India had no dedicated wedding outfit planner. https://glance-corp-website.glance.inmobi.com/us/blogs/glanceai/tech/wedding-outfit-planner-app-india

### f. Retailer side: predicting return risk from try-on plus skin and color fit before checkout
- **Exists? For apparel size, yes. For color and shade, no.**
  - True Fit agent (Feb 2026) and Glance + True Fit.
  - Kumo: return probability scored at purchase, for example 68% for a bracket-buying order. https://kumo.ai/solutions/industries/retail-e-commerce/return-prediction/
  - Academic work on predicting returns before purchase. https://www.paperswithcode.com/paper/early-bird-catches-the-worm-predicting
  - Shade-matching vendors claim about 60% of foundation returns come from the wrong shade, and that returned foundation is destroyed at $20 to $33 each. These are unaudited vendor figures. https://arbelle.ai/virtual-foundation-shade-finder-guide/
  - ShadeSpan scores garment color at catalog level. ConfidFit only adds a disclaimer.
- **Missing:** a color/shade return-risk score for each shopper and cart, built from measured tone and undertone, try-on, bracketing (several shades in one cart) and SKU color data. It should come with an action: commit to one shade, suggest a swap, or show a drape. Plus a dashboard for the retailer.

---

## 5. Notable launches, 2025 to 2026

- **AI beauty agents:**
  - Perfect Corp: YouCam AI Beauty Agent (Nov 2025), CES 2026 agent, A2A Agent Skill (Jun 2026).
  - L'Oréal Beauty Genius on WhatsApp.
  - Revieve: AI Beauty Discovery Connect (Nov 2025) and its ChatGPT advisor (Mar 2026).
  - Sephora ChatGPT app (Mar 2026). Ulta AI plus Gemini/UCP (Apr 2026). Fenty Rose Amber on WhatsApp.
  - Maybelline try-on in ChatGPT (2026).
  - Olay with Haut.AI Virtual Companion (Jun 2026).
  - Nykaa Skin Scan (Nov 2025).
  - Alhena (agent built on Perfect Corp).
- **Personal color analysis:** Dressika (long-running), Color Analysis AI: Style Match, Palette Hunt, Harmony (https://mwm.ai/apps/harmony-color-analysis-ai/6765498541), TrueChroma (https://apps.apple.com/app/id6758364690), WhatColorsSuitMe (https://www.newswire.com/news/whatcolorssuitme-com-launches-ai-personal-colour-analysis-from-a-22784749), the ChatGPT color-analysis trend, and YouCam AI color analysis.
- **Skin cycling:** Sycle tracker. SkinSort hosts skin-cycling routine templates.
- **Dupe finders:**
  - Dupe.com (14 Nov 2025, visual, covers fashion, home and beauty). https://dupe.com/blog/what-the-new-dupe-app-can-do-for-you
  - Duped (ranks dupes by ingredient similarity). https://www.producthunt.com/products/duped-skincare-dupe-finder
  - Thea (dupe match scores and price comparison).
  - Findr (Mar 2026, dupes by active ingredient). https://peerpush.com/p/findr
  - SkinSort (3.7M+ dupes).
  - **None checks dupes against your shelf or your skin.**
- **Try-on and fashion agents:**
  - Google try-on expansions (2025). Doppl launched Jun 2025 and was killed Apr 2026.
  - Perplexity try-on (Nov 2025).
  - Zara AI fitting room (Dec 2025 / 2026).
  - Perfect Corp clothes try-on API (May 2025) and accessories APIs (Jan 2026).
  - FASHN tryon-max (Jan 2026).
  - Alta, Daydream and Gensmo raised money in 2025.
  - True Fit agent (Feb 2026).

---

## 6. Ranked white space: the 5 most promising openings

1. **"Did it actually work?": product trials that account for measurement noise, feeding verified-outcome reviews and keep/repurchase/return decisions (idea b plus a commerce angle).**
   - Dozens of 2026 trackers exist, but none measures its own test-retest noise or runs a structured or split-face trial with a confidence statement.
   - Which? shows lighting alone moves scores by 25 to 39 points, so today's "progress" charts can't be trusted.
   - Reviews that come with the reviewer's measured before/after change exist nowhere I found; Hwahae only filters reviews by skin type.
   - YouCam fit: HD skin scores and masks per zone allow left vs right comparison, and Skin Simulation can show the expected result.
2. **Pre-checkout color/shade return-risk scoring for retailers (idea f).**
   - Return-risk agents exist for apparel size (True Fit, Kumo), but nothing scores shade or color mismatch for each shopper and cart.
   - Live agents fail at exactly this: they dead-end, overclaim, or let shoppers bracket shades.
   - This lines up with the "potential impact for retailers" judging criterion and uses Skin Tone, Shade Finder, and Makeup and Clothes try-on.
   - Make it per order, not per catalog, to stay clear of ShadeSpan.
3. **A brand-neutral verdict at the point of purchase, against measured skin plus your existing shelf (idea a).**
   - Indie apps (Skin Bliss, Glo, Skin Lens) rely on type labels, live in separate apps, ignore makeup shade, and none says "you already own the functional dupe".
   - Brand agents, including Perfect Corp's own skill, are locked to one catalog, and Which? documented brand skew.
   - Gap: an explainable, uncertainty-aware verdict on any product page or cart.
4. **A palette-checked complete look, rendered once, with one mixed cart (idea c).**
   - Color apps stop at a palette and suggestions. Perfect Corp's full-look tools are single-brand. Accuracy is roughly a coin flip (Kettlewell).
   - Calibrated capture, SKUs checked by color difference across makeup and apparel, one combined render of face makeup plus outfit, and one bundled cart do not exist together anywhere I found.
5. **Group look coordination for events (idea e).**
   - Social try-on today is one person sharing or polling. Doppl, which had sharing, shut down.
   - No product renders each member of a group in coordinated, palette-matched looks with voting and a shared or split cart.
   - Indian multi-day weddings are a clear use case with no dedicated tool.

Left out of the top 5: **idea d ("mirror moment")**. It is the most crowded (Skin Bliss, Skinlapse, Alta) and the weakest technically while daily scans are this noisy. It works better as a feature of #1 or #3 than as a standalone product.

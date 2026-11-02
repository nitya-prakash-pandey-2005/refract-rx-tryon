# Demo video script (target 2:50, hard limit 3:00)

**Record:** Chrome at 1440 px, your own face on the webcam, plus 10–15 s of the phone (installed PWA or mobile Chrome) for the "on device" rule. No music, or royalty-free only. Name each YouCam API on screen when it appears.

**Before recording:**
- Set your real prescription on **Prescription**. If you don't wear glasses, use the "−6.50 strong" preset and say so.
- Run **Your face → Run YouCam analysis** once on your own scan (about 35 units).
- Empty the bag and close other tabs.

| Time | Screen | Say |
|---|---|---|
| 0:00–0:15 | Home: the hero engine cycles Showroom → −9 Rx → X-ray → best frame | "Every virtual try-on shows you frames without lenses. But glasses change your face: strong lenses shrink your eyes, cut in at the edge and get thick in big frames. This is Refract: try-on through your real prescription." |
| 0:15–0:45 | **Live Rx Mirror**: start the camera, move your head, toggle **Showroom / Your Rx** twice, switch to a big frame and then to a small one in the strip | "This is me, live. Every pixel inside the lens is re-rendered on the GPU from where its light really comes from: my sphere, cylinder and axis. Showroom… and my real prescription. My eyes are 10% smaller, and that big frame has an 11 mm edge. Refract ranks the frames for my prescription, and this one keeps the lens thin." |
| 0:45–1:00 | Toggle **Optics X-ray** | "Optics X-ray: a 2.5 mm grid on my face bent by the lens, and the rim coloured by edge thickness. My PD is measured live from my iris." |
| 1:00–1:35 | **Your face** page with your own YouCam results; the before/after slider | "Then the beauty layer, with three YouCam APIs. **AI Face Analyzer** reads my face shape, eyes and brows. **AI Skin Analysis** scores the area my lenses sit in front of: dark circles, eye bags, crow's feet. And **AI Makeup VTO** renders a generic look next to one retuned for my lens power. Behind minus lenses, brighter lids and lifted lashes, so my eyes don't disappear." |
| 1:35–1:55 | **Studio**: Rx-tuned look through the lenses, tap the index chips, read the note, click **Share my Refract card** | "The Studio shows that look through my lenses and picks the lens index, honestly: here a thinner lens saves almost nothing, so Refract says don't pay for it. And I get a card to share." |
| 1:55–2:25 | **Demo store**: `/store/index.html` → "Try with my Rx" → modal live mirror → "Add to store cart" → the store's cart updates | "And it drops into any store with one script tag. This is a demo shop: one button opens Refract with my real prescription, and when I choose, the store gets the frame, lens index and edge thickness straight into its cart." |
| 2:25–2:40 | **Ask Refract**: tap "I love big oversized frames…", show the tool trace | "Shoppers can ask the agent. Every number it gives comes from a visible tool call to the optics engine." |
| 2:40–2:55 | Phone shot of the Live mirror, then **For retailers** matrix | "It works on phones too. And retailers see which frames still look good with strong prescriptions. Refract: see yourself through your real lenses before you buy." |

**On-screen captions:** "WebGL lens shader", "YouCam AI Face Analyzer", "YouCam AI Skin Analysis", "YouCam AI Makeup VTO", "One-line store embed".

**YouTube:** title "Refract: try on glasses through your real prescription (YouCam API hackathon)", visibility **Public**. Paste the link into Devpost.

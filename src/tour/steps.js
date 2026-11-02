// Guided tour for demos: spotlights the real UI, page by page.
import { configureTour } from "./engine";
import { getStore } from "../state/store";
import { loadPersona } from "../lib/persona";

const ensureProfile = () => { if (!getStore().photo) loadPersona("lena").catch(() => {}); };

configureTour({
  steps: [
    { id: "t1", route: "/", target: "home-hero", title: "The problem", body: "Every virtual try-on shows frames without lenses. Real lenses shrink or magnify your eyes and can be thick at the edges. Refract shows the truth.", action: ensureProfile },
    { id: "t1b", route: "/live", target: "live-stage", title: "Live Rx Mirror", body: "Start the camera: a GPU shader renders your face through your exact lenses, every frame. Toggle Optics X-ray to see the lens bend a grid on your face." },
    { id: "t2", route: "/scan", target: "scan-stage", title: "Scan without your glasses", body: "Live checks and voice guidance mean you don't need to see the screen. Your iris (about 11.7 mm in nearly everyone) is the ruler for PD." },
    { id: "t3", route: "/rx", target: "rx-form", title: "Your prescription", body: "Enter your Rx and see how much your lenses change how your eyes look, with a true-scale lens cross-section." },
    { id: "t4", route: "/studio", target: "studio-stage", title: "Showroom vs your Rx", body: "The same frame with your real lens optics: eye size, the face 'cut-in' at the edge, and power rings. Toggle Showroom to compare." },
    { id: "t5", route: "/studio", target: "index-chips", title: "Honest lens advice", body: "Edge thickness for every lens index in this frame. Refract tells you when a pricier lens isn't worth it." },
    { id: "t6", route: "/studio", target: "frame-strip", title: "Ranked for your Rx", body: "Frames ranked by how they'll look with your lenses, PD and face, each score explained." },
    { id: "t7", route: "/agent", target: "agent-chat", title: "Ask Refract", body: "An agent that answers with tool calls to the optics engine, so every number is checked. You confirm every action." },
    { id: "t8", route: "/retail", target: "retail-matrix", title: "For retailers", body: "A catalogue audit of which frames work for strong prescriptions, plus a feed AI shopping agents can read. Any store adds the try-on with one script tag: see the demo store from the home page." },
  ],
});

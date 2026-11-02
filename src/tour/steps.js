// Guided tour for demos: spotlights the real UI, page by page.
import { configureTour } from "./engine";
import { getStore } from "../state/store";
import { loadPersona } from "../lib/persona";

const ensureProfile = () => { if (!getStore().photo) loadPersona("lena").catch(() => {}); };

configureTour({
  steps: [
    { id: "t1", route: "/", target: "quick-check", title: "A second opinion for any glasses", body: "1 in 13 prescription pairs gets remade and up to 1 in 5 online orders comes back, because every try-on ignores the lenses. Drag a prescription: the real engine shows the lens edge, eye size, rainbow edges and slip risk instantly. Free, and Refract doesn't sell glasses.", action: ensureProfile },
    { id: "t1c", route: "/check", target: "any-frame", title: "Any frame, from any store", body: "Type the size printed inside a frame's arm (like 52□18 140) from any website or shop. Refract checks that exact frame against your prescription." },
    { id: "t1a", route: "/check", target: "risk-score", title: "Will these glasses fail?", body: "Refract predicts the four ways glasses get remade: thick edges, colour fringes, sliding down your nose (lens weight + your YouCam oiliness) and PD error. Change the lens or bridge and watch the risk move." },
    { id: "t1b", route: "/live", target: "live-stage", title: "Live Rx Mirror", body: "Start the camera: a GPU shader renders your face through your exact lenses, every frame. Toggle Optics X-ray to see the lens bend a grid on your face." },
    { id: "t2", route: "/scan", target: "scan-stage", title: "Scan without your glasses", body: "Live checks and voice guidance mean you don't need to see the screen. Your iris (about 11.7 mm in nearly everyone) is the ruler for PD." },
    { id: "t3", route: "/rx", target: "rx-form", title: "Your prescription", body: "Enter your Rx and see how much your lenses change how your eyes look, with a true-scale lens cross-section." },
    { id: "t4", route: "/studio", target: "studio-stage", title: "Showroom vs your Rx", body: "The same frame with your real lens optics: eye size, the face 'cut-in' at the edge, and power rings. Toggle Showroom to compare." },
    { id: "t5", route: "/studio", target: "index-chips", title: "Honest lens advice", body: "Edge thickness for every lens index in this frame. Refract tells you when a pricier lens isn't worth it." },
    { id: "t6", route: "/studio", target: "frame-strip", title: "Ranked for your Rx", body: "Frames ranked by how they'll look with your lenses, PD and face, each score explained." },
    { id: "t7", route: "/agent", target: "agent-chat", title: "Ask Refract", body: "An agent that answers with tool calls to the optics engine, so every number is checked. You confirm every action." },
    { id: "t8", route: "/retail", target: "retail-matrix", title: "Who pays: stores", body: "Shoppers use Refract free. Stores pay per month for remake risk on every order, the ROI, a one-script embed, and a REST API and MCP server that AI shopping agents can call with any frame size." },
  ],
});

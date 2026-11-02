import { useEffect } from "react";
import { Home as HomeIcon, ScanFace, Glasses, Sparkles, MessageCircle, Ruler, UserRound, ShoppingBag, Store, PlayCircle, Aperture, ShieldCheck } from "lucide-react";
import { useRoute } from "./lib/router";
import AppShell from "./shell/AppShell";
import Tour from "./tour/Tour";
import { start } from "./tour/engine";
import { Toasts } from "./ui";
import { useStore } from "./state/store";
import "./tour/steps";
import { isEmbed, storeHost, bridgeEscape } from "./lib/embed";
import Home from "./pages/Home";
import Live from "./pages/Live";
import Check from "./pages/Check";
import Scan from "./pages/Scan";
import Rx from "./pages/Rx";
import Profile from "./pages/Profile";
import Frames from "./pages/Frames";
import Studio from "./pages/Studio";
import Agent from "./pages/Agent";
import Bag from "./pages/Bag";
import Retail from "./pages/Retail";

const NAV = [
  { group: "Try on", items: [
    { to: "/", label: "Home", icon: HomeIcon, exact: true },
    { to: "/live", label: "Live Rx Mirror", icon: Aperture },
    { to: "/check", label: "Fit Check", icon: ShieldCheck },
    { to: "/scan", label: "Scan", icon: ScanFace },
    { to: "/rx", label: "Prescription", icon: Ruler },
    { to: "/profile", label: "Your face", icon: UserRound },
    { to: "/frames", label: "Frames", icon: Glasses },
    { to: "/studio", label: "Studio", icon: Sparkles },
    { to: "/agent", label: "Ask Refract", icon: MessageCircle },
  ] },
  { group: "Shop", items: [
    { to: "/bag", label: "Bag", icon: ShoppingBag },
    { to: "/retail", label: "For retailers", icon: Store },
  ] },
];
const MOBILE_TABS = [
  { to: "/", label: "Home", icon: HomeIcon, exact: true },
  { to: "/live", label: "Live", icon: Aperture },
  { to: "/check", label: "Check", icon: ShieldCheck },
  { to: "/studio", label: "Studio", icon: Sparkles },
  { to: "/agent", label: "Ask", icon: MessageCircle },
];
const TITLES = [
  ["/check", "Fit Check", "Remake-risk prediction"],
  ["/live", "Live Rx Mirror", "Real-time prescription try-on"],
  ["/scan", "Scan", "Measure your face"],
  ["/rx", "Prescription", "Your lenses"],
  ["/profile", "Your face", "Measured by YouCam"],
  ["/frames", "Frames", "Ranked for your Rx"],
  ["/studio", "Studio", "Prescription-true try-on"],
  ["/agent", "Ask Refract", "Optician + makeup agent"],
  ["/bag", "Bag", "Order sheet"],
  ["/retail", "For retailers", "Catalogue Rx audit"],
  ["/", "Refract", "Prescription-true try-on"],
];
const EMBED_TABS = [["/live", "Live"], ["/check", "Fit check"], ["/studio", "Photo"], ["/rx", "My Rx"], ["/scan", "Scan"]];
const ROUTES = { "/": Home, "/live": Live, "/check": Check, "/scan": Scan, "/rx": Rx, "/profile": Profile, "/frames": Frames, "/studio": Studio, "/agent": Agent, "/bag": Bag, "/retail": Retail };

export default function App() {
  const route = useRoute();
  const s = useStore();
  const base = "/" + (route.parts[0] || "");
  const Page = ROUTES[base] || Home;
  useEffect(() => { window.scrollTo(0, 0); }, [base]);
  useEffect(() => bridgeEscape(), []);
  if (isEmbed()) {
    return (
      <div className="embed-shell">
        <header className="embed-bar">
          <a href="#/live" className="row" style={{ gap: 8 }}><img src="/icons/icon.svg" width="26" height="26" alt="" /><b>Refract</b><span className="tiny muted desktop-only">prescription-true try-on for {storeHost()}</span></a>
          <nav className="embed-tabs">
            {EMBED_TABS.map(([to, label]) => <a key={to} href={`#${to}`} className={base === to ? "on" : ""}>{label}</a>)}
          </nav>
        </header>
        <main className="embed-main"><Page query={route.query} parts={route.parts} key={base} /></main>
        <Toasts />
      </div>
    );
  }
  return (
    <>
      <AppShell
        path={base}
        brand={{ name: "Refract", sub: "Prescription-true try-on", logo: "/icons/icon.svg", href: "#/" }}
        nav={NAV.map((g) => ({ ...g, items: g.items.map((it) => (it.to === "/bag" && s.bag.length ? { ...it, badge: s.bag.length } : it)) }))}
        titles={TITLES}
        mobileTabs={MOBILE_TABS}
        topRight={
          <span className="row" style={{ gap: 8 }}>
            {s.persona && <span className="badge t-violet desktop-only">Sample profile</span>}
            <a className="btn sm ghost" href="#/bag" aria-label="Bag"><ShoppingBag size={16} />{s.bag.length ? <b>{s.bag.length}</b> : null}</a>
          </span>
        }
        footer={<div className="tiny muted">Cosmetic preview, not medical advice. Lens maths: standard ophthalmic optics.</div>}
        fab={{ label: "Tour", icon: PlayCircle, onClick: () => start(0) }}
      >
        <Page query={route.query} parts={route.parts} key={base} />
      </AppShell>
      <Tour />
      <Toasts />
    </>
  );
}

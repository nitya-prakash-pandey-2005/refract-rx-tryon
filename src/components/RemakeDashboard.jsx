// Retailer SaaS view: remake risk across an order stream, what the fixes change, ROI, pricing
// and the developer platform (REST API, MCP for AI agents, embed).
import { useEffect, useRef, useState } from "react";
import { Activity, Calculator, Code2, Bot, Loader2, Play, Check as CheckIcon } from "lucide-react";
import { Card, Hud, Badge, Stat } from "../ui";
import { countUp } from "../lib/anim";

const PARTS = [["look", "Look"], ["sight", "Sight"], ["fit", "Fit (slip)"], ["measure", "Measure (PD)"]];
const PLANS = [
  { name: "Starter", price: 49, checks: "2,000 checks / mo", items: ["Live Rx Mirror embed", "Remake-risk check on product pages", "Remake-risk badge per order"] },
  { name: "Growth", price: 199, checks: "15,000 checks / mo", items: ["Everything in Starter", "Order-risk dashboard + exports", "REST API + YouCam beauty layer"], best: true },
  { name: "Enterprise", price: null, checks: "Unlimited", items: ["MCP server for AI shopping agents", "Lab / LMS integration", "Custom frame catalogue sync"] },
];
const fmt = (v) => `${Math.round(v).toLocaleString("en-US")}`;
let cached = null; // the seeded simulation is deterministic: run it once per session

export default function RemakeDashboard() {
  const [data, setData] = useState(cached);
  const [addressable, setAddressable] = useState(30);
  const [orders, setOrders] = useState(2000);
  const [remakeRate, setRemakeRate] = useState(7.6);
  const [cost, setCost] = useState(90);
  const [plan, setPlan] = useState(199);
  const [api, setApi] = useState(null);
  const highEl = useRef(null), dropEl = useRef(null);

  useEffect(() => {
    if (cached) return;
    const w = new Worker(new URL("../workers/sim.worker.js", import.meta.url), { type: "module" });
    w.onmessage = (e) => { cached = e.data; setData(e.data); w.terminate(); };
    w.postMessage({ n: 300, seed: 7 });
    return () => w.terminate();
  }, []);

  const s = data?.summary;
  const highPct = s ? (s.levels.high / s.n) * 100 : 0;
  const drop = s ? (1 - s.avgScoreFixed / s.avgScore) * 100 : 0;
  const prevented = orders * (remakeRate / 100) * (addressable / 100) * (drop / 100);
  const savings = prevented * cost;
  useEffect(() => { if (s) { countUp(highEl.current, highPct, { decimals: 0 }); countUp(dropEl.current, drop, { decimals: 0 }); } }, [s]); // eslint-disable-line react-hooks/exhaustive-deps

  async function tryApi() {
    setApi({ loading: true });
    const body = { rx: { od: { sph: -7, cyl: -0.5, axis: 180 }, os: { sph: -6.75, cyl: -0.5, axis: 175 } }, frameId: "juno", pd: { left: 31.5, right: 31.5, plusMinus: 2.7 }, face: { faceWidthMm: 128, noseWidthMm: 13.5, bridge: "low" }, oiliness: 40 };
    const t0 = performance.now();
    const r = await fetch("/api/v1/risk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((x) => x.json()).catch((e) => ({ error: String(e) }));
    setApi({ ms: Math.round(performance.now() - t0), json: r });
  }

  return (
    <>
      <div className="grid g4 keep-2" data-reveal>
        <Card className="tight"><Stat value={s ? s.n : "…"} label="Orders analysed (simulated mix)" /></Card>
        <Card className="tight"><div className="stat"><div className="v" style={{ color: "var(--rose)" }}><span ref={highEl}>0</span><small>%</small></div><div className="l">Orders at high remake risk</div></div></Card>
        <Card className="tight"><div className="stat"><div className="v" style={{ color: "var(--green)" }}>−<span ref={dropEl}>0</span><small>%</small></div><div className="l">Average risk after Refract's fixes</div></div></Card>
        <Card className="tight"><Stat value={s ? `${s.levels.high} → ${s.highAfterFix}` : "…"} label="High-risk orders before → after" tone="cyan" /></Card>
      </div>

      <div className="grid g-12">
        <Card className="span-7" title="Why orders fail: risk by failure mode" icon={Activity} right={<Hud>{s ? `${s.n} orders` : "simulating…"}</Hud>} data-reveal>
          {!s ? <div className="row small muted" style={{ gap: 8 }}><Loader2 size={16} className="spin" />Running the optics, physics and PD checks on a synthetic order stream…</div> : (
            <div className="stack-sm">
              {PARTS.map(([k, label]) => {
                const p = s.byPart[k];
                return (
                  <div key={k} className="risk-bar-row">
                    <span className="small">{label}</span>
                    <span className="risk-bar">
                      <i className="lo" style={{ width: `${(p.low / s.n) * 100}%` }} />
                      <i className="me" style={{ width: `${(p.medium / s.n) * 100}%` }} />
                      <i className="hi" style={{ width: `${(p.high / s.n) * 100}%` }} />
                    </span>
                    <span className="mono tiny">{Math.round((p.high / s.n) * 100)}% high</span>
                  </div>
                );
              })}
              <p className="tiny muted">Synthetic, seeded order mix (Rx bands weighted to common myopia; 35% with a known PD; 25% low nasal bridges). Each order runs the same engine as the shopper app.</p>
            </div>
          )}
        </Card>

        <Card className="span-5" title="What it's worth to you" icon={Calculator} data-reveal>
          <div className="stack-sm">
            <label className="field"><span className="small row between">Prescription orders per month <b className="num">{orders.toLocaleString()}</b></span><input className="slider" type="range" min="200" max="20000" step="100" value={orders} onChange={(e) => setOrders(+e.target.value)} /></label>
            <label className="field"><span className="small row between">Remake rate <b className="num">{remakeRate}%</b></span><input className="slider" type="range" min="2" max="15" step="0.1" value={remakeRate} onChange={(e) => setRemakeRate(+e.target.value)} /><span className="tiny muted">7.6% industry average (Vision Council surveys, 2012)</span></label>
            <label className="field"><span className="small row between">Remakes this can prevent <b className="num">{addressable}%</b></span><input className="slider" type="range" min="10" max="60" step="1" value={addressable} onChange={(e) => setAddressable(+e.target.value)} /><span className="tiny muted">measurement errors are 13% of redos, non-adapts and failed AR about 6%, plus fit and cosmetic returns; Rx and lab errors are out of scope</span></label>
            <label className="field"><span className="small row between">Full cost per remake <b className="num">${cost}</b></span><input className="slider" type="range" min="20" max="250" step="5" value={cost} onChange={(e) => setCost(+e.target.value)} /><span className="tiny muted">lab $17–64 per redo × 2–3 for staff, shipping and goodwill</span></label>
            <div className="divider" />
            <div className="row between"><span className="small">Remakes avoided / month</span><b className="num">{s ? Math.round(prevented) : "…"}</b></div>
            <div className="row between"><span className="small">Saved / month</span><b className="display-sm" style={{ color: "var(--green)" }}>{s ? fmt(savings) : "…"}</b></div>
            <div className="row between"><span className="small">Return on a ${plan}/mo plan</span><Badge tone="green">{s ? `${Math.max(0, savings / plan).toFixed(0)}×` : "…"}</Badge></div>
            <p className="tiny muted">Model assumption: within the preventable share, remake likelihood scales with the risk score, so avoided remakes = orders × remake rate × preventable share × simulated risk reduction ({s ? drop.toFixed(0) : "…"}%).</p>
          </div>
        </Card>
      </div>

      <div className="grid g3" data-reveal>
        {PLANS.map((p) => (
          <Card key={p.name} className={`plan ${p.best ? "glow" : ""}`}>
            <div className="row between"><b className="display-sm" style={{ fontSize: 22 }}>{p.name}</b>{p.best && <Badge tone="pink">most stores</Badge>}</div>
            <div className="plan-price">{p.price ? <>${p.price}<small>/mo per store</small></> : <>Custom</>}</div>
            <span className="tiny muted">{p.checks}</span>
            <ul className="plan-list">{p.items.map((i) => <li key={i}><CheckIcon size={14} />{i}</li>)}</ul>
            {p.price && <button className={`btn sm ${plan === p.price ? "primary" : "ghost"}`} onClick={() => setPlan(p.price)}>Use in ROI</button>}
          </Card>
        ))}
      </div>
      <p className="tiny muted" data-reveal>Price anchors: online frame try-on apps cost $59–199/mo (Fittingbox Shopify); in-store 3D fitting hardware costs about £566/mo (ZEISS VISUFIT 1000). Refract adds prescription-aware try-on and remake prediction as software, for any store.</p>

      <div className="grid g-12">
        <Card className="span-7" title="Developer platform: one engine, three ways in" icon={Code2} data-reveal>
          <pre className="json snippet">{`POST /api/v1/risk
{ "rx": { "od": { "sph": -7, "cyl": -0.5, "axis": 180 }, "os": { … } },
  "frameId": "juno", "pd": { "left": 31.5, "right": 31.5, "plusMinus": 2.7 },
  "face": { "faceWidthMm": 128, "noseWidthMm": 13.5, "bridge": "low" },
  "oiliness": 40 }      // from YouCam Skin AI
→ { "score": 89, "level": "high", "parts": { look, sight, fit, measure }, "fixes": [ … ] }

// any frame on the internet, by the size printed on its arm:
{ "rx": …, "frame": { "size": "52-18-140", "shape": "rect", "material": "metal" } }`}</pre>
          <div className="row wrap" style={{ gap: 8 }}>
            <button className="btn primary sm" onClick={tryApi} disabled={api?.loading}>{api?.loading ? <Loader2 size={15} className="spin" /> : <Play size={15} />}Try the live API</button>
            <a className="btn sm ghost" href="/store/index.html">Embed demo store</a>
            <span className="tiny muted">GET /api/v1/frames · POST /api/v1/risk (frameId, any frame by size, or none = rank the catalogue)</span>
          </div>
          {api?.json && <pre className="json snippet api-out">{`// ${api.ms} ms\n${JSON.stringify(api.json, null, 2)}`}</pre>}
        </Card>
        <Card className="span-5" title="MCP server for AI shopping agents" icon={Bot} right={<Badge tone="violet">agentic</Badge>} data-reveal>
          <p className="small text-2">Shopping is moving into conversations with AI assistants. Refract's MCP server lets Claude, ChatGPT or any MCP client ask prescription-aware questions: "which of these frames keeps my −7 lenses thin and won't slide?"</p>
          <pre className="json snippet">{`{ "mcpServers": { "refract": {
    "command": "node",
    "args": ["server/mcp.js"] } } }

tools: check_any_frame · rank_frames
       remake_risk · lens_report
       sight_by_material`}</pre>
        </Card>
      </div>
    </>
  );
}

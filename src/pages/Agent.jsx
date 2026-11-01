import { useEffect, useRef, useState } from "react";
import { Send, Wrench, Sparkles, ShoppingBag, Loader2, Bot } from "lucide-react";
import { Card, PageHead, Hud, Badge, toast } from "../ui";
import { useStore, setStore, getStore } from "../state/store";
import { askAgent, health } from "../lib/api";
import { navigate } from "../lib/router";
import { getFrame } from "../engine/frames";
import { lensPair, rankFrames } from "../engine/fit";
import { INDICES } from "../engine/optics";
import { reveal } from "../lib/anim";

const SUGGEST = [
  "I love big oversized frames. Can I pull them off?",
  "Which frame keeps my lenses thinnest?",
  "Is 1.74 worth it for me?",
  "What eye makeup works with my glasses?",
];
const TOOL_NAME = { search_frames: "Ranked frames", lens_report: "Lens report", plan_eye_look: "Eye look", suggest_action: "Button" };

export default function Agent({ query }) {
  const s = useStore();
  const [msgs, setMsgs] = useState(() => [{ role: "assistant", content: "Hi, I'm Refract. Ask me about frames, lens thickness or eye makeup. I'll check every number against your prescription." }]);
  const [input, setInput] = useState(query.frame ? `Is the ${getFrame(query.frame)?.name || "frame"} a good choice for my prescription?` : "");
  const [busy, setBusy] = useState(false);
  const [provider, setProvider] = useState(undefined);
  const log = useRef(null);
  useEffect(() => { health().then((h) => setProvider(h.llm)); }, []);
  useEffect(() => { log.current?.scrollTo({ top: log.current.scrollHeight, behavior: "smooth" }); reveal(log.current, ".bubble-wrap:last-child"); }, [msgs.length]);

  async function send(text) {
    const q = (text ?? input).trim();
    if (!q || busy) return;
    const next = [...msgs, { role: "user", content: q }];
    setMsgs(next);
    setInput("");
    setBusy(true);
    try {
      const st = getStore();
      const profile = { rx: st.rx, pd: st.measure ? { left: st.measure.pd.left, right: st.measure.pd.right } : null, faceWidthMm: st.measure?.faceWidthMm, faceAttr: st.faceAttr, skin: st.skin, skinHex: st.skinHex };
      const r = await askAgent(next.filter((m) => !m.trace).map(({ role, content }) => ({ role, content })), profile);
      setMsgs((m) => [...m, { role: "assistant", content: r.reply, trace: r.trace, actions: r.actions, provider: r.provider }]);
      if (r.provider) setProvider(r.provider === "claude" ? "claude" : null);
    } catch (e) {
      setMsgs((m) => [...m, { role: "assistant", content: `Sorry, that didn't work (${e.message}).` }]);
    } finally {
      setBusy(false);
    }
  }

  function act(a) {
    if (a.type === "open_studio") return navigate(a.frameId ? `/studio/${a.frameId}` : "/studio");
    if (a.type === "add_to_bag") {
      const st = getStore();
      const frame = getFrame(a.frameId);
      const pd = st.measure ? { left: st.measure.pd.left, right: st.measure.pd.right } : { left: 31.5, right: 31.5 };
      const fit = rankFrames({ rx: st.rx, pd, faceWidthMm: st.measure?.faceWidthMm, faceShape: st.faceAttr?.faceShape }).find((r) => r.frame.id === frame.id).fit;
      const index = INDICES.find((i) => i.n === a.index) || fit.lens.best;
      const pair = lensPair({ frame, rx: st.rx, pd, index });
      setStore((x) => ({ bag: [...x.bag.filter((b) => b.kind !== "frame"), { kind: "frame", id: frame.id, name: `${frame.name} · ${frame.colorway.name}`, priceUsd: frame.priceUsd, lens: { n: index.n, label: index.label, priceUsd: index.priceUsd, maxEdge: Math.max(pair.od.maxEdge, pair.os.maxEdge), weightG: pair.od.weightG + pair.os.weightG }, rx: x.rx, pd: x.measure?.pd }] }));
      toast(`${frame.name} added to your bag. You'll confirm before anything is ordered.`, "ok");
    }
  }

  return (
    <div className="stack-lg">
      <PageHead kicker="Ask Refract" title="Your optician and makeup artist" sub="An agent that checks every claim against your prescription with the same optics engine as the Studio." right={<Badge tone={provider === "claude" ? "violet" : "cyan"}>{provider === "claude" ? "Claude agent · tool use" : provider === null ? "Built-in planner (no LLM key)" : "…"}</Badge>} />
      <div className="grid g-12">
        <Card className="span-8 flush chat-card" tour="agent-chat">
          <div className="chat-log" ref={log}>
            {msgs.map((m, i) => (
              <div key={i} className={`bubble-wrap ${m.role === "user" ? "me" : "them"}`}>
                {m.role !== "user" && <span className="bot"><Bot size={16} /></span>}
                <div className="stack-sm" style={{ minWidth: 0 }}>
                  {m.trace?.length > 0 && (
                    <div className="trace">
                      {m.trace.filter((t) => t.tool !== "suggest_action").map((t, k) => (
                        <div className="trace-row" key={k}><Wrench size={12} /><b>{TOOL_NAME[t.tool] || t.tool}</b><span>{t.summary}</span></div>
                      ))}
                    </div>
                  )}
                  <div className={`bubble ${m.role === "user" ? "me" : "them"}`}>{m.content}</div>
                  {m.actions?.length > 0 && (
                    <div className="row wrap" style={{ gap: 8 }}>
                      {m.actions.map((a, k) => (
                        <button key={k} className={`btn sm ${a.type === "add_to_bag" ? "" : "primary"}`} onClick={() => act(a)}>{a.type === "add_to_bag" ? <ShoppingBag size={14} /> : <Sparkles size={14} />}{a.label}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {busy && <div className="bubble-wrap them"><span className="bot"><Loader2 size={16} className="spin" /></span><div className="bubble them muted">Checking your lenses…</div></div>}
          </div>
          <form className="chat-input" onSubmit={(e) => { e.preventDefault(); send(); }}>
            <input className="input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about a frame, lens index or eye makeup…" aria-label="Message" />
            <button className="btn primary icon" disabled={busy || !input.trim()} aria-label="Send"><Send size={17} /></button>
          </form>
        </Card>
        <div className="span-4 stack">
          <Card title="Try asking">
            <div className="stack-sm">
              {SUGGEST.map((q) => <button key={q} className="suggest" onClick={() => send(q)} disabled={busy}>{q}</button>)}
            </div>
          </Card>
          <Card title="How it works" right={<Hud>grounded</Hud>}>
            <ul className="small text-2 how">
              <li>Every thickness, weight, eye-size and price figure comes from a tool call to Refract's optics engine. You can see each call above the reply.</li>
              <li>Eye-makeup advice uses your YouCam face and skin analysis when you've run it.</li>
              <li>It suggests buttons; you decide. Nothing is bought automatically.</li>
            </ul>
            {!s.measure && <a className="btn sm block" href="#/scan" style={{ marginTop: 10 }}>Scan for personalised answers</a>}
          </Card>
        </div>
      </div>
    </div>
  );
}

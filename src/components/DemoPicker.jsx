import { useState } from "react";
import { Loader2, UserRound } from "lucide-react";
import { PERSONAS, loadPersona } from "../lib/persona";
import { navigate } from "../lib/router";
import { toast } from "../ui";

export default function DemoPicker({ to = "/studio", compact = false }) {
  const [busy, setBusy] = useState(null);
  const pick = async (id) => {
    setBusy(id);
    try {
      const p = await loadPersona(id);
      toast(p.recorded ? `Loaded ${p.name}'s sample profile with recorded YouCam results.` : `Loaded ${p.name}'s sample profile.`, "ok");
      navigate(to);
    } catch (e) {
      toast(e.message || "Couldn't load the sample profile.", "warn");
    } finally {
      setBusy(null);
    }
  };
  return (
    <div className={compact ? "stack-sm" : "grid g2"}>
      {PERSONAS.map((p) => (
        <button key={p.id} className="persona-card" onClick={() => pick(p.id)} disabled={!!busy}>
          <img src={p.photo} alt="" onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} />
          <span className="grow" style={{ minWidth: 0 }}>
            <b>{p.name}</b>
            <span className="small muted">{p.blurb}</span>
          </span>
          {busy === p.id ? <Loader2 size={18} className="spin" /> : <UserRound size={18} className="muted" />}
        </button>
      ))}
    </div>
  );
}

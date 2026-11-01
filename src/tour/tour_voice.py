"""
Generate the guided tour's narration: one MP3 per step in an Indian-English female neural voice,
plus apps/web/src/tour/voice.json with each clip's duration, its time slot, and the moment the
step's cue word is spoken (so on-screen actions fire exactly on that word).

The whole tour is fitted to finish just under 3:00.

    pip install edge-tts mutagen
    python scripts/tour_voice.py

Voice: Microsoft Neural TTS "en-IN-NeerjaExpressiveNeural" via edge-tts. For production use, generate
the same voice with an Azure Speech key, or record a teammate with the same lines and timings.
"""
import asyncio
import json
import re
from pathlib import Path

import edge_tts
from mutagen.mp3 import MP3

ROOT = Path(__file__).resolve().parents[1]
NARRATION = ROOT / "apps/web/src/tour/narration.json"
OUT_DIR = ROOT / "apps/web/public/tour"
OUT_JSON = ROOT / "apps/web/src/tour/voice.json"

VOICE = "en-IN-NeerjaExpressiveNeural"
LEAD = 0.35          # seconds for navigation + spotlight before she speaks
TAIL = 0.4           # default pause after the last spoken word
TARGET = 178.2       # tour length (s); ~0.6 s start-up after the click keeps it under 3:00
MAX_TOTAL = 178.6


def norm(w):
    return re.sub(r"[^a-z0-9]", "", w.lower())


async def synth(text, path, rate):
    try:
        com = edge_tts.Communicate(text, VOICE, rate=rate, boundary="WordBoundary")
    except TypeError:  # older edge-tts
        com = edge_tts.Communicate(text, VOICE, rate=rate)
    words = []
    end = 0.0
    with open(path, "wb") as f:
        async for chunk in com.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                words.append({"t": round(chunk["offset"] / 1e7, 3), "w": chunk["text"]})
                end = (chunk["offset"] + chunk["duration"]) / 1e7
    # time each step from the last spoken word (clips end with ~0.9 s of silence)
    return min(MP3(path).info.length, end + 0.15), words


async def build(rate):
    steps = json.loads(NARRATION.read_text(encoding="utf-8"))
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out = {}
    for s in steps:
        path = OUT_DIR / f"{s['id']}.mp3"
        dur, words = await synth(s.get("say") or s["body"], path, rate)
        cue_at = 0.0
        if s.get("cue"):
            hit = next((w for w in words if norm(w["w"]) == norm(s["cue"])), None)
            if not hit:
                raise SystemExit(f"cue word '{s['cue']}' not found in {s['id']}: {[w['w'] for w in words]}")
            cue_at = hit["t"]
        out[s["id"]] = {"file": f"/tour/{s['id']}.mp3", "duration": round(dur, 3), "cueAt": cue_at, "tail": s.get("tail", TAIL), "words": len(words)}
    return out


async def main():
    rate_pct = 6
    while True:
        rate = f"{rate_pct:+d}%"
        steps = await build(rate)
        total = sum(LEAD + v["duration"] + v["tail"] for v in steps.values())
        print(f"rate {rate}: speech {sum(v['duration'] for v in steps.values()):.1f}s, total {total:.1f}s")
        if total <= TARGET or rate_pct >= 14:
            break
        rate_pct += 2
    # spread any spare time as breathing room after each line, so it ends right under 3:00
    spare = max(0.0, TARGET - total)
    per = min(1.2, spare / len(steps))
    for v in steps.values():
        v["slot"] = round(LEAD + v["duration"] + v["tail"] + per, 3)
    total = round(sum(v["slot"] for v in steps.values()), 2)
    assert total <= MAX_TOTAL, total
    OUT_JSON.write_text(json.dumps({"voice": VOICE, "rate": rate, "lead": LEAD, "total": total, "steps": steps}, indent=1), encoding="utf-8")
    print(f"final: rate {rate}, {len(steps)} clips, total {total}s ({int(total // 60)}:{total % 60:04.1f})")


if __name__ == "__main__":
    asyncio.run(main())

"""Film timeline from on-screen reading time, on the music's beat grid (the film has no voice-over).

Reads docs/vo_lines.json (the story beats L01-L35: ids, chapters, and the syllable count of each old voice line, kept
only to subdivide a beat for the scenes' internal choreography) and docs/onscreen.json (the text each beat shows).
Writes docs/timeline.json, which the engine and every tool read, and docs/timeline.md, a readable table.

Model
  reading time  PACE × Σ items: FIX + words / WPS[kind] (a skim counts half the words; a glance at a screenshot is
                GLANCE s; text seen before is KNOWN s). Numbers count as NUM words.
  beat length   max(reading time − the gap after it, ANIM × the old voice estimate): the text stays up through the
                one-beat gap that follows (at a chapter change, half of the transition), and no shot's choreography is
                squeezed below 85 % of what it was designed for; rounded up to whole beats of the grid (108 BPM).
  gaps          OPEN beats before a chapter's first line (its transition), WITHIN beats between lines.
  bars          every chapter is a whole number of 4/4 bars: its last line holds until the bar line, so every chapter
                change lands on a downbeat.
  length        PACE is the most relaxed value that fits the film in --bars bars with at least MIN_END beats of end
                hold; the end hold takes the rest. 81 bars at 108 BPM is exactly 3:00.
Scenes subdivide a beat by syllables with ctx.syl(id, k); the engine snaps those times to the grid (16th notes).

Usage: uv run python tools/timeline.py [--bars 81]
       uv run python tools/timeline.py --voice     timeline from docs/vo_timings.json (a recorded voice), on the grid
"""
import argparse
import importlib.util
import json
import math
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BPM = 108
BEAT = 60 / BPM
GRID = BEAT / 4  # 16th notes: ctx.syl snaps here
STEP = 2  # lines start and end on 8th notes (units of BEAT / STEP); chapters on bar lines
FIX = 0.3  # s to find and start a text block
WPS = {"disp": 4.0, "label": 3.3, "cap": 3.0, "mono": 2.5}  # words (Vietnamese syllables) per second at pace 1.0
NUM = 1.5  # a number reads like one and a half words
GLANCE = 0.6
KNOWN = 0.3
ANIM = 0.85
OPEN = 2
WITHIN = 1
MIN_END = 6

spec = importlib.util.spec_from_file_location("vo", ROOT / "tools" / "vo.py")
vo = importlib.util.module_from_spec(spec)
spec.loader.exec_module(vo)


def words(text):
    toks = [t for t in re.split(r"\s+|\s/\s", text.replace("·", " ")) if t and t != "/"]
    return sum(NUM if re.search(r"\d", t) else 1 for t in toks)


def item_time(text, kind, how):
    if how == "glance":
        return GLANCE
    if how == "known":
        return KNOWN
    w = words(text) * (0.5 if how == "skim" else 1.0)
    return FIX + w / WPS[kind]


def plan(lines, onscreen, pace):
    first = {}
    for i, ln in enumerate(lines):
        first.setdefault(ln["ch"], i)
    out = []
    for i, ln in enumerate(lines):
        items = onscreen[ln["id"]]["items"]
        read = pace * sum(item_time(t, k, h) for t, k, h in items)
        anim = ANIM * ln["syllables"] / 3.0
        nxt = lines[i + 1] if i + 1 < len(lines) else None
        after = (OPEN / 2 if nxt["ch"] != ln["ch"] else WITHIN) * BEAT if nxt else 0
        beats = max(1, math.ceil(STEP * max(read - after, anim) / BEAT - 1e-9)) / STEP
        gap = OPEN if first[ln["ch"]] == i else WITHIN
        out.append({**ln, "read": read, "anim": anim, "beats": beats, "gap": gap})
    # Whole bars per chapter: the last line of each chapter (but the film's last) holds to the bar line.
    chs = list(dict.fromkeys(ln["ch"] for ln in out))
    for ch in chs[:-1]:
        mine = [x for x in out if x["ch"] == ch]
        n = sum(x["gap"] + x["beats"] for x in mine)
        mine[-1]["beats"] += (-n) % 4
    return out


def total_beats(p):
    return sum(x["gap"] + x["beats"] for x in p)


def build(bars):
    doc = vo.load()
    ov = doc["syllable_overrides"]
    lines = [{"id": ln["id"], "ch": ln["ch"], "display": ln["display"], "syllables": vo.syllables(ln["spoken"], ov)}
             for ln in doc["lines"]]
    onscreen = json.loads((ROOT / "docs" / "onscreen.json").read_text(encoding="utf-8"))["lines"]
    budget = bars * 4
    # The last chapter's own content must also end on whole bars with the end hold, so fit that too.
    best = None
    for k in range(200, 60, -1):  # pace 2.00 .. 0.61, most relaxed first
        pace = k / 100
        p = plan(lines, onscreen, pace)
        if total_beats(p) + MIN_END <= budget:
            best = (pace, p)
            break
    if not best:
        raise SystemExit(f"the text does not fit in {bars} bars even at pace 0.61; raise --bars")
    pace, p = best
    end_hold = budget - total_beats(p)
    t = 0
    for x in p:
        t += x["gap"]
        x["b0"] = t
        t += x["beats"]
        x["b1"] = t
    film = budget * BEAT
    chapters = []
    chs = list(dict.fromkeys(x["ch"] for x in p))
    for i, ch in enumerate(chs):
        mine = [x for x in p if x["ch"] == ch]
        b0 = mine[0]["b0"] - mine[0]["gap"]
        b1 = mine[-1]["b1"] if i < len(chs) - 1 else budget
        chapters.append({"id": ch, "start": round(b0 * BEAT, 4), "end": round(b1 * BEAT, 4), "bars": (b1 - b0) / 4})
    out = {
        "generated_by": "tools/timeline.py", "source": "reading", "bpm": BPM, "beat": BEAT, "grid": GRID,
        "pace": pace, "bars": bars, "film_length": round(film, 4), "end": round(film, 4),
        "end_hold": round(end_hold * BEAT, 4),
        "chapters": chapters,
        "lines": [{
            "id": x["id"], "ch": x["ch"], "start": round(x["b0"] * BEAT, 4), "end": round(x["b1"] * BEAT, 4),
            "dur": round(x["beats"] * BEAT, 4), "beats": x["beats"], "syllables": x["syllables"],
            "read": round(x["read"], 2), "anim": round(x["anim"], 2), "display": x["display"],
        } for x in p],
    }
    return out, onscreen


def build_voice():
    """A recorded voice drives the timing again: take docs/vo_timings.json and snap every boundary to the grid."""
    vt = json.loads((ROOT / "docs" / "vo_timings.json").read_text(encoding="utf-8"))
    snap = lambda s: round(round(s / BEAT) * BEAT, 4)
    out = {**vt, "generated_by": "tools/timeline.py --voice", "source": f"voice ({vt['source']})", "bpm": BPM,
           "beat": BEAT, "grid": GRID}
    out["chapters"] = [{**c, "start": snap(c["start"]), "end": snap(c["end"])} for c in vt["chapters"]]
    return out


def write_md(tl, onscreen):
    rows = ["# Timeline: reading time on a 108 BPM grid", "",
            "Generated by `tools/timeline.py` from `docs/onscreen.json`; do not edit. The film has no voice-over, so each "
            "beat holds long enough to read its on-screen text at a relaxed pace, and every line and chapter boundary "
            "sits on the beat grid (chapters on bar lines).", "",
            f"- **Length: {tl['film_length']:.1f} s ({int(tl['film_length'] // 60)}:{tl['film_length'] % 60:04.1f}), "
            f"{tl['bars']} bars of 4/4 at {tl['bpm']} BPM.** Reading pace factor {tl['pace']:.2f} (1.00 = the base "
            f"rates below); end hold {tl['end_hold']:.1f} s.",
            f"- Base rates (pace 1.00): DISPLAY {WPS['disp']} words/s, LABEL {WPS['label']}, captions {WPS['cap']}, "
            f"MONO {WPS['mono']}; {FIX} s to find each block; numbers count as {NUM} words; a glance at a screenshot "
            f"{GLANCE} s; text seen before {KNOWN} s. Text stays readable through the gap after its beat.",
            f"- A beat never runs shorter than {ANIM:.0%} of its old voice estimate (its choreography's design length).",
            "", "| Ch | Start | End | Bars |", "|---|---|---|---|"]
    for c in tl["chapters"]:
        rows.append(f"| {c['id']} | {c['start']:.2f} | {c['end']:.2f} | {c['bars']:g} |")
    rows += ["", "| Beat | Ch | Start | End | Beats | Reading s | Min s | On screen |", "|---|---|---|---|---|---|---|---|"]
    for ln in tl["lines"]:
        texts = " · ".join(t.replace(" / ", " ") for t, k, h in onscreen[ln["id"]]["items"] if k != "ui")
        rows.append(f"| {ln['id']} | {ln['ch']} | {ln['start']:.2f} | {ln['end']:.2f} | {ln['beats']} | {ln['read']:.1f} | "
                    f"{ln['anim']:.1f} | {texts} |")
    (ROOT / "docs" / "timeline.md").write_text("\n".join(rows) + "\n", encoding="utf-8")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--bars", type=int, default=81)
    ap.add_argument("--voice", action="store_true")
    a = ap.parse_args()
    if a.voice:
        tl = build_voice()
    else:
        tl, onscreen = build(a.bars)
        write_md(tl, onscreen)
    (ROOT / "docs" / "timeline.json").write_text(json.dumps(tl, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"{tl['source']}: {tl['film_length']:.2f} s, pace {tl.get('pace')}, end hold {tl.get('end_hold')}")
    for c in tl["chapters"]:
        print(f"  {c['id']} {c['start']:7.2f} - {c['end']:7.2f}  ({c['end'] - c['start']:5.2f} s)")


if __name__ == "__main__":
    main()

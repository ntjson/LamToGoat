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
  pace          PACE is fixed: the relaxed reading pace approved at 3:09. The film never reads faster than this.
  length        The plan above is the film's natural length (85 bars). To fit --bars (81 bars at 108 BPM is exactly
                3:00), whole bars are trimmed from holds only: shots that stay up longer than their text needs,
                because their animation was given more time than their reading. Each trimmed chapter squeezes those
                shots toward max(reading time, α × natural length), rounded to 8ths. Its α is the highest (gentlest)
                value that frees a whole bar, and the chapter with the gentlest α loses the next bar.
  never trimmed Shots whose length is set by their text (the busiest ones keep every frame, bar padding included),
                the transition breaths, the breaths between shots, and the last chapter (its end hold). If no chapter
                can free a bar this way, the tool stops.
  pinned        A beat whose entry in docs/onscreen.json carries "beats" never gets shorter than that (and is never
                trimmed): the user's way to keep the timeline when a beat's text gets shorter (L24, 2026-10-04). Its
                "read" stays the truth, so it may hold longer than its text needs.
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
PACE = 0.82  # reading-time multiplier on the base rates: 1.0 = fully relaxed; 0.82 was approved at 3:09

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
    """The natural plan: every shot at max(reading time, ANIM × its old voice estimate), chapters on bar lines."""
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
        need = max(0.0, read - after) / BEAT  # reading floor in beats (the text stays up through the gap after it)
        beats = max(1, math.ceil(STEP * max(need, anim / BEAT) - 1e-9)) / STEP
        pin = onscreen[ln["id"]].get("beats")  # the user's pin: never shorter than this
        if pin:
            beats = max(beats, float(pin))
        gap = OPEN if first[ln["ch"]] == i else WITHIN
        out.append({**ln, "read": read, "anim": anim, "after": after, "need": need, "beats": beats, "gap": gap,
                    "pin": pin})
    for ch in list(dict.fromkeys(ln["ch"] for ln in out))[:-1]:
        pad_to_bar(out, ch)
    for x in out:
        x["natural"] = x["beats"]
    return out


def pad_to_bar(p, ch):
    """The chapter's last shot holds until the next bar line."""
    mine = [x for x in p if x["ch"] == ch]
    n = sum(x["gap"] + x["beats"] for x in mine)
    mine[-1]["beats"] += (-n) % 4


def chapter_beats(p, ch):
    return sum(x["gap"] + x["beats"] for x in p if x["ch"] == ch)


def text_bound(x):
    """A shot whose natural length is set by its reading time, not its animation."""
    return x["need"] >= x["anim"] / BEAT


def squeeze(p, ch, target):
    """Shorten one chapter's holds so it fits `target` beats: the gentlest α (fraction of each shot's natural length)
    that frees enough. Only animation-bound shots shrink, and never below their reading floor; text-bound shots keep
    their natural length. Returns (α, new beats per shot id) or (None, None)."""
    mine = [x for x in p if x["ch"] == ch]
    soft = [x for x in mine if not text_bound(x) and not x["pin"]]
    gaps = sum(x["gap"] for x in mine)
    for a100 in range(100, 29, -1):
        a = a100 / 100
        b = {x["id"]: x["natural"] for x in mine}
        for x in soft:
            b[x["id"]] = max(1 / STEP, math.ceil(STEP * max(x["need"], a * x["natural"]) - 1e-9) / STEP)
        n = gaps + sum(b.values())
        if n <= target:
            # Give back what was over-cut, in 8ths, to the shots cut the most.
            while n + 1 / STEP <= target + 1e-9:
                x = max(soft, key=lambda x: x["natural"] - b[x["id"]])
                b[x["id"]] += 1 / STEP
                n += 1 / STEP
            if n == target:
                return a, b
    return None, None


def trim(p, bars_to_cut):
    """Take whole bars out of holds, one at a time, from the chapter that can give one up most gently."""
    chs = list(dict.fromkeys(x["ch"] for x in p))[:-1]  # the last chapter keeps its end hold
    cuts = []
    for _ in range(bars_to_cut):
        best = None
        for ch in chs:
            a, b = squeeze(p, ch, chapter_beats(p, ch) - 4)
            if a is not None and (best is None or a > best[1]):
                best = (ch, a, b)
        if not best:
            raise SystemExit("no chapter can give up another bar without cutting reading time; raise --bars")
        ch, a, b = best
        for x in p:
            if x["ch"] == ch:
                x["beats"] = b[x["id"]]
        cuts.append((ch, a))
    return cuts


def total_beats(p):
    return sum(x["gap"] + x["beats"] for x in p)


def build(bars):
    doc = vo.load()
    ov = doc["syllable_overrides"]
    lines = [{"id": ln["id"], "ch": ln["ch"], "display": ln["display"], "syllables": vo.syllables(ln["spoken"], ov)}
             for ln in doc["lines"]]
    onscreen = json.loads((ROOT / "docs" / "onscreen.json").read_text(encoding="utf-8"))["lines"]
    budget = bars * 4
    p = plan(lines, onscreen, PACE)
    natural = total_beats(p) + MIN_END
    natural += (-natural) % 4
    cuts = []
    if natural > budget:
        cuts = trim(p, int((natural - budget) // 4))
    end_hold = budget - total_beats(p)
    if end_hold < MIN_END:
        raise SystemExit(f"end hold {end_hold} beats is under {MIN_END}")
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
        chapters.append({"id": ch, "start": b0 * BEAT, "end": b1 * BEAT, "bars": (b1 - b0) / 4})
    out = {
        "generated_by": "tools/timeline.py", "source": "reading", "bpm": BPM, "beat": BEAT, "grid": GRID,
        "pace": PACE, "bars": bars, "natural_bars": natural / 4, "film_length": film, "end": film,
        "end_hold": end_hold * BEAT,
        "trimmed": [{"ch": ch, "bars": 1, "alpha": a} for ch, a in cuts],
        "chapters": chapters,
        "lines": [{
            # Full precision: a chapter that moves by whole bars must see exactly the same local times.
            "id": x["id"], "ch": x["ch"], "start": x["b0"] * BEAT, "end": x["b1"] * BEAT,
            "dur": x["beats"] * BEAT, "beats": x["beats"], "natural_beats": x["natural"],
            "syllables": x["syllables"], "read": round(x["read"], 2), "visible": round(x["beats"] * BEAT + x["after"], 2),
            "text_bound": text_bound(x),
            "anim": round(x["anim"], 2), "display": x["display"],
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
    L = tl["length"] if "length" in tl else tl["film_length"]
    rows = ["# Timeline: reading time on a 108 BPM grid", "",
            "Generated by `tools/timeline.py` from `docs/onscreen.json`; do not edit. The film has no voice-over, so each "
            "beat holds long enough to read its on-screen text at a relaxed pace, and every line and chapter boundary "
            "sits on the beat grid (chapters on bar lines).", "",
            f"- **Length: {L:.1f} s ({int(L // 60)}:{L % 60:04.1f}), {tl['bars']} bars of 4/4 at {tl['bpm']} BPM.** "
            f"End hold {tl['end_hold']:.1f} s.",
            f"- **Reading pace factor {tl['pace']:.2f}**, fixed (1.00 = the base rates below): the relaxed pace approved "
            f"at 3:09. Base rates: DISPLAY {WPS['disp']} words/s, LABEL {WPS['label']}, captions {WPS['cap']}, "
            f"MONO {WPS['mono']}; {FIX} s to find each block; numbers count as {NUM} words; a glance at a screenshot "
            f"{GLANCE} s; text seen before {KNOWN} s. Text stays readable through the gap after its beat.",
            f"- Natural length: {tl['natural_bars']:g} bars, where every shot holds at least {ANIM:.0%} of its old "
            f"voice estimate (its choreography's design length). To fit {tl['bars']} bars, "
            + (f"{len(tl['trimmed'])} bar(s) were trimmed from holds only (see below)." if tl["trimmed"] else "nothing was trimmed."),
            *[f"- **Pinned:** {ln['id']} keeps {ln['beats']:g} beats (`beats` in `docs/onscreen.json`); its text needs "
              f"{ln['read']:.1f} s, so it holds longer than its reading needs." for ln in tl["lines"]
              if onscreen.get(ln["id"], {}).get("beats")],
            "", "| Ch | Start | End | Bars |", "|---|---|---|---|"]
    for c in tl["chapters"]:
        rows.append(f"| {c['id']} | {c['start']:.2f} | {c['end']:.2f} | {c['bars']:g} |")
    if tl["trimmed"]:
        rows += ["", "## Trimmed to fit", "",
                 "Whole bars taken out of holds: shots that stayed up longer than their text needs, because their "
                 "animation had been given more time than their reading. Every shot whose length is set by its text "
                 "keeps every frame (the busiest shots among them), as do the transition breaths, the breaths "
                 "between shots and the end hold. No shot shows its text for less than its reading time.", "",
                 "| Ch | Squeeze floor | Shot | Natural s | Now s | Cut s | Reading needs s | Text visible s |",
                 "|---|---|---|---|---|---|---|---|"]
        for tr in tl["trimmed"]:
            for ln in [x for x in tl["lines"] if x["ch"] == tr["ch"]]:
                cut = (ln["natural_beats"] - ln["beats"]) * tl["beat"]
                rows.append(f"| {tr['ch']} | {tr['alpha']:.0%} | {ln['id']} | {ln['natural_beats'] * tl['beat']:.2f} | "
                            f"{ln['dur']:.2f} | {cut:.2f} | {ln['read']:.2f} | {ln['visible']:.2f} |")
    rows += ["", "| Beat | Ch | Start | End | Beats | Reading s | Visible s | On screen |", "|---|---|---|---|---|---|---|---|"]
    for ln in tl["lines"]:
        texts = " · ".join(t.replace(" / ", " ") for t, k, h in onscreen[ln["id"]]["items"] if k != "ui")
        rows.append(f"| {ln['id']} | {ln['ch']} | {ln['start']:.2f} | {ln['end']:.2f} | {ln['beats']:g} | {ln['read']:.1f} | "
                    f"{ln['visible']:.1f} | {texts} |")
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
    print(f"{tl['source']}: {tl['film_length']:.2f} s, pace {tl.get('pace')}, end hold {tl.get('end_hold')}, "
          f"trimmed {tl.get('trimmed')}")
    for c in tl["chapters"]:
        print(f"  {c['id']} {c['start']:7.2f} - {c['end']:7.2f}  ({c['end'] - c['start']:5.2f} s)")


if __name__ == "__main__":
    main()

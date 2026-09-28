"""Voice-over script and timeline.

docs/vo_lines.json is the source of truth (edit that, not the outputs). This tool writes:
  docs/vo_script.md     the script: subtitle text, spoken text, syllables, characters
  docs/vo_timings.json  the film timeline every scene reads (scenes never hard-code seconds)

Usage:
  uv run python tools/vo.py build
  uv run python tools/vo.py calibrate L04=4.1 L05=4.3 L06=4.0 L07=3.2 L08=4.2   seconds read per line
  uv run python tools/vo.py calibrate L04-L08=19.8                              or one total for a range
  uv run python tools/vo.py measure audio/vo                                     durations of L01.wav ... L35.wav

Timing model: a line lasts its measured seconds if known, else syllables / rate. Each line has a breath before it
(gap) with a weight; the film is fixed at film_length, and the leftover time (slack) is spread over the weighted
gaps and the end hold. Negative slack shrinks them, never below min_gap.
"""
import json
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LINES = ROOT / "docs" / "vo_lines.json"
SCRIPT = ROOT / "docs" / "vo_script.md"
TIMINGS = ROOT / "docs" / "vo_timings.json"
SUB_MAX = 42  # characters per subtitle line


def load():
    return json.loads(LINES.read_text(encoding="utf-8"))


def save(doc):
    LINES.write_text(json.dumps(doc, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")


def syllables(text, overrides):
    n = 0
    for tok in re.split(r"[\s\-]+", text):
        tok = tok.strip(".,:;!?…“”\"'()")
        if not tok:
            continue
        if re.search(r"\d", tok):
            raise ValueError(f"digit in spoken text: {tok!r} (spell numbers out)")
        n += overrides.get(tok, 1)
    return n


def check(doc):
    problems = []
    for ln in doc["lines"]:
        for field in ("display", "spoken"):
            if ln[field] != unicodedata.normalize("NFC", ln[field]):
                problems.append(f"{ln['id']} {field} is not NFC")
        for event in ln["display"].split(" // "):
            rows = event.split(" / ")
            if len(rows) > 2:
                problems.append(f"{ln['id']} subtitle event has {len(rows)} lines: {event!r}")
            for r in rows:
                if len(r) > SUB_MAX:
                    problems.append(f"{ln['id']} subtitle line is {len(r)} chars (> {SUB_MAX}): {r!r}")
    return problems


def timeline(doc):
    ov = doc["syllable_overrides"]
    lines = doc["lines"]
    first_of_ch = {}
    for i, ln in enumerate(lines):
        first_of_ch.setdefault(ln["ch"], i)
    durs, syls = [], []
    for ln in lines:
        s = syllables(ln["spoken"], ov)
        syls.append(s)
        durs.append(doc["measured"].get(ln["id"], s / doc["rate_sps"]))
    gaps = [ln["gap"] for ln in lines]
    weights = [ln["gap_weight"] for ln in lines]
    mins = [
        doc["min_gap"]["chapter_open"] if first_of_ch[ln["ch"]] == i else doc["min_gap"]["within"]
        for i, ln in enumerate(lines)
    ]
    hold, hold_w = doc["end_hold"]["base"], doc["end_hold"]["weight"]
    slack = doc["film_length"] - (sum(durs) + sum(gaps) + hold)
    # Spread the slack over weighted gaps; when shrinking, respect the minimums and re-spread what is left.
    for _ in range(50):
        active = [i for i, w in enumerate(weights) if w > 0 and (slack > 0 or gaps[i] > mins[i] + 1e-9)]
        wsum = sum(weights[i] for i in active) + (hold_w if (slack > 0 or hold > 1.0) else 0)
        if abs(slack) < 1e-9 or wsum == 0:
            break
        used = 0.0
        for i in active:
            d = slack * weights[i] / wsum
            new = max(mins[i], gaps[i] + d)
            used += new - gaps[i]
            gaps[i] = new
        if slack > 0 or hold > 1.0:
            new = max(1.0, hold + slack * hold_w / wsum)
            used += new - hold
            hold = new
        slack -= used
    t, out = 0.0, []
    for ln, g, d, s in zip(lines, gaps, durs, syls):
        start = t + g
        t = start + d
        out.append({"id": ln["id"], "ch": ln["ch"], "shots": ln["shots"], "start": round(start, 3),
                    "end": round(t, 3), "dur": round(d, 3), "syllables": s,
                    "measured": ln["id"] in doc["measured"], "display": ln["display"]})
    end = t + hold
    chapters = []
    for ch, i in first_of_ch.items():
        start = 0.0 if i == 0 else out[i - 1]["end"]
        chapters.append({"id": ch, "start": round(start, 3)})
    for k, c in enumerate(chapters):
        c["end"] = chapters[k + 1]["start"] if k + 1 < len(chapters) else round(end, 3)
    if len(doc["measured"]) == len(lines):
        source = "measured"
    elif doc["measured"] or doc.get("rate_kind") == "calibrated":
        source = "calibrated"
    else:
        source = "estimate"
    return {
        "generated_by": "tools/vo.py build",
        "source": source,
        "rate_sps": round(doc["rate_sps"], 3),
        "rate_source": doc["rate_source"],
        "film_length": doc["film_length"],
        "end": round(end, 3),
        "overrun": round(max(0.0, end - doc["film_length"]), 3),
        "speech": round(sum(durs), 3),
        "end_hold": round(hold, 3),
        "chapters": chapters,
        "lines": out,
    }


def write_script(doc, tl):
    lines = doc["lines"]
    chars = {ln["id"]: len(ln["spoken"]) for ln in lines}
    total_chars = sum(chars.values())
    total_syl = sum(x["syllables"] for x in tl["lines"])
    by_id = {x["id"]: x for x in tl["lines"]}
    o = []
    o.append("# Voice-over script\n")
    o.append("Generated by `tools/vo.py` from `docs/vo_lines.json`. Edit the JSON, then run "
             "`uv run python tools/vo.py build`.\n")
    o.append(f"- **{len(lines)} lines, {total_syl} syllables, {total_chars:,} spoken characters** (NFC, counting "
             "spaces and punctuation).")
    o.append(f"- **Timing source: {tl['source']}.** {tl['rate_sps']} syllables/s, {tl['rate_source']}; "
             f"{tl['speech']:.1f} s of speech in a {tl['film_length']:.1f} s film.")
    if tl["overrun"] > 0:
        o.append(f"- **The film runs {tl['overrun']:.1f} s long at this rate.** Cut words or accept a longer cut.")
    o.append("- **Subtitle column:** what `out/final.vi.srt` shows. ` / ` is a line break, ` // ` starts the next "
             f"subtitle; lines stay within {SUB_MAX} characters.")
    o.append("- **Read-this column:** what gets spoken: numbers as words, and AI written \"Ây-ai\" so no voice reads it "
             "as the word \"ai\" (\"who\").\n")
    o.append("## Reading notes\n")
    o.append("- Calm and certain, like explaining something that already works. Slow down a little on the hook "
             "(L01-L03) and on L26: leave a short beat after \"số cũ,\" before \"hệ thống báo lỗi ngay.\"")
    o.append("- \"Ây-ai\" is just AI said the usual way. Zalo and Kawaibu: say them the way the team does. "
             "The timing assumes Za-lo (2 syllables) and Ka-wai-bu (3).")
    o.append("- Tháng 8/2027 is read \"tháng tám năm hai không hai bảy\"; the formal \"năm hai nghìn không trăm "
             "hai mươi bảy\" works too (it adds 3 syllables).\n")
    o.append("## Timing test (L04-L08)\n")
    o.append("Read L04-L08 from the \"Read this\" column at your recording pace, with your natural pause between lines. "
             "Send the seconds for each line (first sound to last sound). One total for all five also works.")
    test_syl = sum(by_id[i]["syllables"] for i in ("L04", "L05", "L06", "L07", "L08"))
    o.append(f"Those five lines hold {test_syl} syllables; your seconds give your rate, and "
             "`tools/vo.py calibrate` re-flows every line from it.\n")
    o.append("## Recording\n")
    o.append("You record the voice; ElevenLabs is not used and no calls are made. One WAV per line named L01.wav ... "
             "L35.wav (48 kHz, mono, 24-bit), about 0.5 s of room tone at the head and tail, same mic distance "
             "throughout. `tools/vo.py measure <folder>` then times the whole film from the real takes.\n")
    o.append("## Script\n")
    o.append("| Ch | Start | End |")
    o.append("|---|---|---|")
    for c in tl["chapters"]:
        o.append(f"| {c['id']} | {c['start']:.1f} | {c['end']:.1f} |")
    o.append("")
    cur = None
    for ln in lines:
        x = by_id[ln["id"]]
        if ln["ch"] != cur:
            cur = ln["ch"]
            o.append(f"\n### {cur}\n")
            o.append("| Line | Shots | Subtitle | Read this | Syl | Chars | Time |")
            o.append("|---|---|---|---|---|---|---|")
        t = f"{x['start']:.1f}-{x['end']:.1f}" + (" (measured)" if x["measured"] else "")
        o.append(f"| {ln['id']} | {ln['shots']} | {ln['display']} | {ln['spoken']} | {x['syllables']} | "
                 f"{chars[ln['id']]} | {t} |")
    SCRIPT.write_text("\n".join(o) + "\n", encoding="utf-8")


def build(doc):
    problems = check(doc)
    if problems:
        print("problems:\n  " + "\n  ".join(problems))
        sys.exit(1)
    tl = timeline(doc)
    TIMINGS.write_text(json.dumps(tl, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    write_script(doc, tl)
    print(f"{tl['source']}: rate {tl['rate_sps']} syl/s, speech {tl['speech']:.1f} s, end {tl['end']:.2f} s"
          + (f", OVER by {tl['overrun']:.2f} s" if tl["overrun"] else "") + f", end hold {tl['end_hold']:.2f} s")
    for c in tl["chapters"]:
        print(f"  {c['id']}: {c['start']:7.2f} - {c['end']:7.2f}  ({c['end'] - c['start']:5.2f} s)")


def calibrate(doc, args):
    ov = doc["syllable_overrides"]
    ids = [ln["id"] for ln in doc["lines"]]
    syl = {ln["id"]: syllables(ln["spoken"], ov) for ln in doc["lines"]}
    total_s = total_syl = 0.0
    measured = {}
    for a in args:
        key, val = a.split("=")
        sec = float(val)
        if "-" in key:
            a0, a1 = key.split("-")
            span = ids[ids.index(a0): ids.index(a1) + 1]
            total_syl += sum(syl[i] for i in span)
        else:
            measured[key] = sec
            total_syl += syl[key]
        total_s += sec
    rate = total_syl / total_s
    doc["rate_sps"] = round(rate, 4)
    doc["rate_source"] = f"calibrated from a test read of {', '.join(args)}"
    doc["rate_kind"] = "calibrated"
    doc["measured"].update(measured)
    save(doc)
    print(f"rate {rate:.3f} syllables/s from {total_syl:.0f} syllables in {total_s:.2f} s")
    build(doc)


def measure(doc, folder):
    import soundfile as sf

    folder = Path(folder)
    for ln in doc["lines"]:
        f = folder / f"{ln['id']}.wav"
        if f.exists():
            info = sf.info(str(f))
            doc["measured"][ln["id"]] = round(info.frames / info.samplerate, 3)
    doc["rate_source"] += f"; takes measured from {folder}"
    save(doc)
    build(doc)


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "build"
    d = load()
    if cmd == "build":
        build(d)
    elif cmd == "calibrate":
        calibrate(d, sys.argv[2:])
    elif cmd == "measure":
        measure(d, sys.argv[2])
    else:
        print(__doc__)
        sys.exit(2)

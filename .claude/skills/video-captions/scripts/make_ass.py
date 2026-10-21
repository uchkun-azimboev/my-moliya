#!/usr/bin/env python3
"""words.json -> .ass subtitr (short-form uslubi: 2-4 so'zli qatorlar, aytilayotgan so'z ajratiladi).

Video o'lchamini ffprobe'dan oladi, shrift o'lchami va joylashuvi shunga moslanadi.
"""
import argparse, json, re, subprocess
from pathlib import Path


def video_size(media):
    r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                        "stream=width,height:stream_side_data=rotation", "-of", "json", media],
                       capture_output=True, text=True, check=True)
    st = json.loads(r.stdout)["streams"][0]
    w, h = st["width"], st["height"]
    rot = next((abs(int(d.get("rotation", 0))) for d in st.get("side_data_list", []) if "rotation" in d), 0)
    return (h, w) if rot in (90, 270) else (w, h)


def ass_time(t):
    cs = int(round(t * 100))
    h, cs = divmod(cs, 360000)
    m, cs = divmod(cs, 6000)
    s, cs = divmod(cs, 100)
    return f"{h}:{m:02}:{s:02}.{cs:02}"


def ass_color(hex_rgb):  # "#FFD400" -> &H0000D4FF (ASS: BGR)
    h = hex_rgb.lstrip("#")
    return f"&H00{h[4:6]}{h[2:4]}{h[0:2]}".upper()


def esc(s):
    return s.replace("\\", "").replace("{", "(").replace("}", ")")


def chunk_words(words, max_words, max_chars, gap):
    lines, cur = [], []
    for i, w in enumerate(words):
        cur.append(w)
        text = " ".join(x["word"] for x in cur)
        nxt = words[i + 1] if i + 1 < len(words) else None
        brk = (len(cur) >= max_words or len(text) >= max_chars or nxt is None
               or nxt["start"] - w["end"] > gap or re.search(r"[.!?,;:]$", w["word"]))
        if nxt and not brk and len(text) + 1 + len(nxt["word"]) > max_chars + 4:
            brk = True
        if brk:
            lines.append(cur); cur = []
    return lines


def main():
    p = argparse.ArgumentParser()
    p.add_argument("words")
    p.add_argument("video", help="o'lchamni aniqlash uchun")
    p.add_argument("--out")
    p.add_argument("--font", default="Inter Display Black")
    p.add_argument("--size", type=float, default=0.07, help="shrift: video kengligiga nisbat")
    p.add_argument("--color", default="#FFFFFF")
    p.add_argument("--highlight", default="#FFD400", help="aytilayotgan so'z rangi; 'none' — o'chiq")
    p.add_argument("--outline", default="#000000")
    p.add_argument("--pos", type=float, default=0.30, help="pastdan balandlik (ekranga nisbat)")
    p.add_argument("--max-words", type=int, default=3)
    p.add_argument("--max-chars", type=int, default=18)
    p.add_argument("--upper", action="store_true", help="BOSH HARFLAR")
    p.add_argument("--no-punct", action="store_true", help="tinish belgilarini olib tashlash")
    p.add_argument("--fix", help="JSON: {\"xato\": \"to'g'ri\"} — so'z almashtirish")
    a = p.parse_args()

    words = json.loads(Path(a.words).read_text(encoding="utf-8"))
    fixes = json.loads(Path(a.fix).read_text(encoding="utf-8")) if a.fix else {}
    for w in words:
        t = w["word"].strip()
        core = re.sub(r"^\W+|\W+$", "", t)
        if core in fixes:
            t = t.replace(core, fixes[core])
        w["word"] = t
    W, H = video_size(a.video)
    fs = round(W * a.size) if W < H else round(H * a.size * 0.9)
    margin_v = round(H * a.pos)
    lines = chunk_words(words, a.max_words, a.max_chars, 0.45)

    def show(t):
        if a.no_punct:
            t = re.sub(r"[.,!?;:\"«»]", "", t)
        return esc(t.upper() if a.upper else t)

    hl = None if a.highlight.lower() == "none" else ass_color(a.highlight)
    ev = []
    for li, ln in enumerate(lines):
        end_line = ln[-1]["end"]
        nxt_start = lines[li + 1][0]["start"] if li + 1 < len(lines) else end_line + 0.3
        end_line = min(max(end_line, ln[0]["start"] + 0.5), nxt_start)  # bir oz ushlab turish
        if not hl:
            ev.append((ln[0]["start"], end_line, " ".join(show(w["word"]) for w in ln)))
            continue
        for k, w in enumerate(ln):
            s = w["start"] if k else ln[0]["start"]
            e = ln[k + 1]["start"] if k + 1 < len(ln) else end_line
            txt = " ".join(
                (f"{{\\c{hl}}}{show(x['word'])}{{\\c{ass_color(a.color)}}}" if j == k else show(x["word"]))
                for j, x in enumerate(ln))
            if e > s:
                ev.append((s, e, txt))

    head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,{a.font},{fs},{ass_color(a.color)},{ass_color(a.color)},{ass_color(a.outline)},&H80000000,0,0,0,0,100,100,0,0,1,{max(2, round(fs*0.09))},{max(1, round(fs*0.04))},2,{round(W*0.08)},{round(W*0.08)},{margin_v},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    body = "".join(f"Dialogue: 0,{ass_time(s)},{ass_time(e)},Cap,,0,0,0,,{t}\n" for s, e, t in ev)
    out = a.out or str(Path(a.words).with_suffix("")).removesuffix(".words") + ".ass"
    Path(out).write_text(head + body, encoding="utf-8")
    print(f"{len(lines)} qator, {W}x{H}, shrift {fs}px -> {out}")


if __name__ == "__main__":
    main()

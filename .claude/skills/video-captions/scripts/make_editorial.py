#!/usr/bin/env python3
""""Editorial" uslubidagi caption: aralash shriftlar, zinapoya qatorlar, so'z aytilganda paydo bo'ladi.

Reja fayli (plan.txt):
  - bo'sh qator  -> yangi ekran (blok)
  - har bir qator -> ekrandagi alohida qator
  - *so'z*  -> KATTA urg'u (harfma-harf ochiladi)
  - _so'z_  -> nafis serif (Instrument Serif)
  - ~so'z~  -> qalin kursiv
  Belgi bir nechta so'zni o'rashi mumkin: _Toshkent shahri_
Vaqt: words.json (transcribe.py yoki align_script.py) — so'zlar reja bilan avtomatik moslanadi.
"""
import argparse, difflib, json, re, subprocess
from pathlib import Path

FONTS = Path(__file__).resolve().parent.parent / "fonts"
STYLES = {  # nom: (shrift, qalinlik, kursiv, o'lcham koeffitsiyenti, harflar orasi (fs ga nisbat), fayl)
    "sans":  ("Inter Display", 700, 0, 1.00, -0.035, "/usr/share/fonts/opentype/inter/InterDisplay-Bold.otf"),
    "big":   ("Inter Display", 800, 0, 1.95, -0.045, "/usr/share/fonts/opentype/inter/InterDisplay-ExtraBold.otf"),
    "serif": ("Instrument Serif", 400, 0, 1.38, -0.01, str(FONTS / "InstrumentSerif-Regular.ttf")),
    "ital":  ("Inter Display", 700, 1, 1.00, -0.035, "/usr/share/fonts/opentype/inter/InterDisplay-BoldItalic.otf"),
}
MARK = {"*": "big", "_": "serif", "~": "ital"}
_metrics = {}


def text_width(style, text, fs):
    from fontTools.ttLib import TTFont
    path = STYLES[style][5]
    if path not in _metrics:
        f = TTFont(path)
        _metrics[path] = (f.getBestCmap(), f["hmtx"], f["OS/2"].usWinAscent + f["OS/2"].usWinDescent)
    cmap, hmtx, h = _metrics[path]
    units = sum(hmtx[cmap.get(ord(c), cmap.get(32))][0] for c in text)
    return units * fs / h + len(text) * STYLES[style][4] * fs


def video_size(media):
    r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                        "stream=width,height:stream_side_data=rotation", "-of", "json", media],
                       capture_output=True, text=True, check=True)
    st = json.loads(r.stdout)["streams"][0]
    rot = next((abs(int(d["rotation"])) for d in st.get("side_data_list", []) if "rotation" in d), 0)
    return (st["height"], st["width"]) if rot in (90, 270) else (st["width"], st["height"])


def parse_plan(text):
    """-> bloklar: [[ [ (so'z, uslub), ... ] qator ... ] blok ...]"""
    blocks, cur = [], []
    for raw in text.splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            if cur:
                blocks.append(cur); cur = []
            continue
        words, style = [], "sans"
        for tok in line.split():
            if style == "sans" and tok[0] in MARK:
                style, tok = MARK[tok[0]], tok[1:]
            st = style
            m = re.match(r"^(.*?)([*_~])([.,!?;:]*)$", tok)  # yopuvchi belgi (tinishdan oldin ham)
            if m and style != "sans" and MARK[m.group(2)] == style:
                tok, style = m.group(1) + m.group(3), "sans"
            words.append((tok, st))
        cur.append(words)
    if cur:
        blocks.append(cur)
    return blocks


def norm(w):
    return re.sub(r"[^\w]", "", w.lower().replace("ʻ", "").replace("’", "").replace("'", ""))


def assign_times(plan_words, timed):
    a, b = [norm(w) for w in plan_words], [norm(t["word"]) for t in timed]
    res = [None] * len(a)
    for blk in difflib.SequenceMatcher(None, a, b, autojunk=False).get_matching_blocks():
        for k in range(blk.size):
            t = timed[blk.b + k]; res[blk.a + k] = (t["start"], t["end"])
    known = [i for i, r in enumerate(res) if r]
    for i in range(len(res)):  # mos kelmaganlar — qo'shnilar orasida taqsimlanadi
        if res[i] is None:
            prev = max([k for k in known if k < i], default=None)
            nxt = min([k for k in known if k > i], default=None)
            s = res[prev][1] if prev is not None else (res[nxt][0] - 0.3 if nxt is not None else 0)
            e = res[nxt][0] if nxt is not None else s + 0.4
            gap = [k for k in range(prev + 1 if prev is not None else 0, nxt if nxt is not None else len(res))]
            step = (e - s) / max(len(gap), 1)
            for j, k in enumerate(gap):
                res[k] = (s + j * step, s + (j + 1) * step)
            known = sorted(set(known) | set(gap))
    return res


def ass_time(t):
    cs = max(int(round(t * 100)), 0)
    return f"{cs // 360000}:{cs // 6000 % 60:02}:{cs // 100 % 60:02}.{cs % 100:02}"


def esc(s):
    return s.replace("\\", "").replace("{", "(").replace("}", ")")


def main():
    p = argparse.ArgumentParser()
    p.add_argument("plan")
    p.add_argument("words")
    p.add_argument("video")
    p.add_argument("--out", required=True)
    p.add_argument("--size", type=float, default=0.078, help="asosiy shrift, kenglikka nisbat")
    p.add_argument("--y", type=float, default=0.68, help="blok markazi, balandlikka nisbat (0 tepa, 1 past)")
    p.add_argument("--color", default="F4F1EC", help="matn rangi RRGGBB")
    p.add_argument("--stagger", type=float, default=0.055, help="qatorlar siljishi, kenglikka nisbat")
    p.add_argument("--shadow", type=lambda v: int(v, 0), default=0x50, help="soya shaffofligi 0 (to'q) .. 255 (yo'q)")
    p.add_argument("--halo", type=lambda v: int(v, 0), default=0x90, help="harf atrofidagi yumshoq halo, 0..255")
    p.add_argument("--lead", type=float, default=0.86, help="qatorlar orasi (shrift o'lchamiga nisbat)")
    a = p.parse_args()

    W, H = video_size(a.video)
    blocks = parse_plan(Path(a.plan).read_text(encoding="utf-8"))
    flat = [w for b in blocks for ln in b for w, _ in ln]
    times = assign_times(flat, json.loads(Path(a.words).read_text(encoding="utf-8")))
    col = f"&H{a.color[4:6]}{a.color[2:4]}{a.color[0:2]}&"
    base = round(W * a.size)
    offsets = [0.035, -0.06, 0.05, -0.035, 0.03]
    events, wi = [], 0
    starts = []
    for b in blocks:
        n = sum(len(ln) for ln in b)
        starts.append((times[wi][0], times[wi + n - 1][1])); wi += n
    wi = 0
    for bi, b in enumerate(blocks):
        b_start = max(starts[bi][0] - 0.06, 0)
        b_end = starts[bi + 1][0] - 0.06 if bi + 1 < len(blocks) else starts[bi][1] + 0.6
        b_end = max(b_end, starts[bi][1] + 0.05)
        # qatorlar o'lchami va kengligi
        lines = []
        for ln in b:
            k = 1.0
            def width(k):
                return sum(text_width(st, w + " ", base * STYLES[st][3] * k) for w, st in ln)
            while width(k) > W * 0.86 and k > 0.4:
                k *= 0.95
            lines.append((ln, k, width(k), max(base * STYLES[st][3] * k for _, st in ln)))
        heights = [mx * a.lead for *_, mx in lines]
        y = H * a.y - sum(heights) / 2
        for li, (ln, k, wd, mx) in enumerate(lines):
            y += heights[li]
            off = offsets[li % len(offsets)] * W if len(lines) > 1 else 0
            cx = min(max(W / 2 + off, wd / 2 + W * 0.06), W - wd / 2 - W * 0.06)
            for layer, shadow in ((0, "drop"), (1, "halo"), (2, None)):
                parts = []
                for wj, (w, st) in enumerate(ln):
                    fn, wt, it, sc, sp, _ = STYLES[st]
                    fs = round(base * sc * k)
                    t0 = int((times[wi + wj][0] - b_start) * 1000)
                    target = {"drop": f"&H{a.shadow:02X}&", "halo": f"&H{a.halo:02X}&", None: "&H00&"}[shadow]
                    tag = f"{{\\fn{fn}\\b{wt}\\i{it}\\fs{fs}\\fsp{sp * fs:.1f}"
                    word = esc(w) + (" " if wj < len(ln) - 1 else "")
                    if st == "big":  # harfma-harf ochilish
                        d = min(45, max(20, int(220 / max(len(w), 1))))
                        parts.append(tag + "}" + "".join(
                            f"{{\\alpha&HFF&\\t({t0 + i * d},{t0 + i * d + 160},\\alpha{target})}}{esc(c)}"
                            for i, c in enumerate(word)))
                    else:
                        parts.append(tag + f"\\alpha&HFF&\\t({t0},{t0 + 130},\\alpha{target})}}{word}")
                pos_y = y + (round(base * 0.07) if shadow == "drop" else 0)
                look = {"drop": f"\\1c&H000000&\\bord0\\shad0\\blur{round(base * 0.28)}",
                        "halo": f"\\1c&H000000&\\3c&H000000&\\bord{max(round(base * 0.05), 1)}\\shad0\\blur{round(base * 0.12)}",
                        None: f"\\1c{col}\\bord0\\shad0\\blur0.6"}[shadow]
                events.append(f"Dialogue: {layer},{ass_time(b_start)},{ass_time(b_end)},Cap,,0,0,0,,"
                              f"{{\\an2\\pos({cx:.0f},{pos_y:.0f}){look}}}" + "".join(parts))
            wi += len(ln)
    head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,Inter Display,{base},&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,0,0,2,0,0,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    Path(a.out).write_text(head + "\n".join(events) + "\n", encoding="utf-8")
    print(f"{len(blocks)} ekran, {len(flat)} so'z, {W}x{H}, asosiy shrift {base}px -> {a.out}")


if __name__ == "__main__":
    main()

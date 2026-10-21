#!/usr/bin/env python3
"""Tayyor matnni (egasi bergan) videoga taxminiy vaqt bilan joylaydi — model kerak emas.

Usul: ffmpeg silencedetect bilan nutq bo'laklari topiladi, so'zlar ularga harf uzunligi
bo'yicha proporsional taqsimlanadi. Matndagi qatorlar soni nutq bo'laklari soniga teng bo'lsa,
har bir qator o'z bo'lagiga aniq tushadi (eng yaxshi natija). Natija: <out>.words.json
"""
import argparse, json, re, subprocess, sys
from pathlib import Path


def duration(media):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                        "-of", "csv=p=0", media], capture_output=True, text=True, check=True)
    return float(r.stdout.strip())


def speech_spans(media, noise_db, min_sil):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", media, "-af",
                        f"silencedetect=noise={noise_db}dB:d={min_sil}", "-f", "null", "-"],
                       capture_output=True, text=True)
    total = duration(media)
    sil, start = [], None
    for line in r.stderr.splitlines():
        m = re.search(r"silence_start: ([\d.]+)", line)
        if m:
            start = float(m.group(1))
        m = re.search(r"silence_end: ([\d.]+)", line)
        if m and start is not None:
            sil.append((max(start, 0), float(m.group(1))))
            start = None
    if start is not None:
        sil.append((start, total))
    spans, cur = [], 0.0
    for s, e in sil:
        if s - cur > 0.15:
            spans.append((cur, s))
        cur = e
    if total - cur > 0.15:
        spans.append((cur, total))
    return spans or [(0, total)]


def weight(w):
    return max(len(re.sub(r"\W", "", w)), 1) + 1


def place(words, t0, t1):
    tot = sum(weight(w) for w in words)
    out, t = [], t0
    for w in words:
        d = (t1 - t0) * weight(w) / tot
        out.append({"word": w, "start": round(t, 3), "end": round(t + d, 3)})
        t += d
    return out


def main():
    p = argparse.ArgumentParser()
    p.add_argument("media")
    p.add_argument("text", help="matn fayli (UTF-8); har bir qator — bitta ibora")
    p.add_argument("--out")
    p.add_argument("--noise", type=float, default=-32, help="jimlik chegarasi, dB (standart -32)")
    p.add_argument("--min-silence", type=float, default=0.3, help="eng qisqa pauza, s")
    a = p.parse_args()

    out = Path(a.out or Path(a.media).with_suffix(""))
    text = Path(a.text).read_text(encoding="utf-8")
    spans = speech_spans(a.media, a.noise, a.min_silence)
    lines = [l.split() for l in text.splitlines() if l.strip()]
    if len(lines) == len(spans):
        mode = "qatorlar = bo'laklar"
        res = [x for ln, (s, e) in zip(lines, spans) for x in place(ln, s, e)]
    else:
        mode = "proporsional"
        words = [w for ln in lines for w in ln]
        total_speech = sum(e - s for s, e in spans)
        total_w = sum(weight(w) for w in words)
        res, i = [], 0
        for k, (s, e) in enumerate(spans):
            if k == len(spans) - 1:
                chunk = words[i:]
            else:
                target = total_w * (e - s) / total_speech
                acc, j = 0, i
                while j < len(words) and acc + weight(words[j]) / 2 < target:
                    acc += weight(words[j]); j += 1
                chunk = words[i:j]; i = j
            if chunk:
                res += place(chunk, s, e)
    Path(f"{out}.words.json").write_text(json.dumps(res, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{len(res)} so'z, {len(spans)} nutq bo'lagi ({mode}) -> {out}.words.json (taxminiy vaqt)", file=sys.stderr)


if __name__ == "__main__":
    main()

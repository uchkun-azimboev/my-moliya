#!/usr/bin/env python3
"""Tayyor matnni (egasi bergan) videoga taxminiy vaqt bilan joylaydi — model kerak emas.

Usul:
  1. ffmpeg silencedetect bilan pauzalar topiladi (qisqa pauzalar ham — so'z guruhlari orasidagi).
  2. Ovozdagi bo'g'in "zarbalari" sanaladi va matndagi bo'g'inlar (unlilar) soni bilan solishtiriladi.
  3. Har bir ekran/ibora chegarasi (bo'sh qator; bo'lmasa har qator) pauzalardan biriga tushadi —
     barcha chegaralar birga tanlanadi (bo'g'inlar soni mos, uzun pauza ibora ichida qolmasin).
  4. Gap/vergul oxiri uzun pauzaga to'g'ri kelishi afzal; sekundiga 10 bo'g'indan tez gapirish jarimalanadi.
  5. Ibora ichida so'zlar bo'g'inlar bo'yicha taqsimlanadi — pauzalar vaqt olmaydi.
Matn plan.txt bo'lishi mumkin — *, _, ~ belgilari olib tashlanadi. Natija: <out>.words.json
"""
import argparse, json, re, subprocess, sys, tempfile
from bisect import bisect_right
from pathlib import Path


_wav = {}


def mono_wav(media):
    """16 kHz mono 16-bit WAV — silencedetect shu formatda qisqa pauzalarni ishonchli topadi."""
    if media not in _wav:
        tmp = tempfile.NamedTemporaryFile(suffix=".wav", delete=False).name
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", media, "-vn",
                        "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", tmp], check=True)
        _wav[media] = tmp
    return _wav[media]


def silences(media, noise_db, min_sil):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", mono_wav(media), "-af",
                        f"silencedetect=noise={noise_db}dB:d={min_sil}", "-f", "null", "-"],
                       capture_output=True, text=True)
    out, start = [], None
    for line in r.stderr.splitlines():
        m = re.search(r"silence_start: (-?[\d.]+)", line)
        if m:
            start = max(float(m.group(1)), 0.0)
        m = re.search(r"silence_end: ([\d.]+)", line)
        if m and start is not None:
            out.append((start, float(m.group(1)))); start = None
    if start is not None:
        out.append((start, duration(media)))
    return out


def duration(media):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                        "-of", "csv=p=0", media], capture_output=True, text=True, check=True)
    return float(r.stdout.strip())


def syllable_peaks(media):
    """Ovozdagi bo'g'in "zarbalari" (300-2500 Hz energiya cho'qqilari) vaqtlari — taxminiy bo'g'in sanash."""
    import wave
    import numpy as np
    w = wave.open(mono_wav(media))
    sr = w.getframerate()
    x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float) / 32768
    hop, win = int(sr * 0.01), int(sr * 0.03)
    frames = np.lib.stride_tricks.sliding_window_view(x, win)[::hop] * np.hanning(win)
    spec = np.abs(np.fft.rfft(frames, axis=1))
    f = np.fft.rfftfreq(win, 1 / sr)
    db = 20 * np.log10(spec[:, (f > 300) & (f < 2500)].sum(1) + 1e-9)
    db = np.convolve(db, np.ones(5) / 5, "same")
    floor, peaks = db.max() - 35, []
    for i in range(1, len(db) - 1):
        if db[i] >= db[i - 1] and db[i] > db[i + 1] and db[i] > floor:
            lo = min(db[max(0, i - 12):i].min(), db[i + 1:i + 13].min())
            if db[i] - lo >= 4:
                if peaks and i - peaks[-1] < 9:
                    if db[i] > db[peaks[-1]]:
                        peaks[-1] = i
                else:
                    peaks.append(i)
    return [i * 0.01 + 0.015 for i in peaks]


def syllables(w):
    return max(len(re.findall(r"[aeiouаеёиоуўэюя]", w.lower())), 1)


class Timeline:
    """Nutq vaqti o'qi: pauzalar chiqarib tashlangan."""
    def __init__(self, t0, t1, pauses):
        self.segs, cur = [], t0
        for s, e in pauses:
            if e <= t0 or s >= t1:
                continue
            if s > cur:
                self.segs.append((cur, s))
            cur = max(cur, e)
        if t1 > cur:
            self.segs.append((cur, t1))
        self.cum = [0.0]
        for s, e in self.segs:
            self.cum.append(self.cum[-1] + e - s)

    @property
    def total(self):
        return self.cum[-1]

    def real(self, x):  # nutq vaqti -> haqiqiy vaqt
        x = min(max(x, 0), self.total)
        i = min(bisect_right(self.cum, x) - 1, len(self.segs) - 1)
        return self.segs[i][0] + (x - self.cum[i])


def place(words, t0, t1, pauses):
    tl = Timeline(t0, t1, pauses)
    tot = sum(syllables(w) for w in words)
    out, acc = [], 0
    for w in words:
        s = tl.real(tl.total * acc / tot)
        acc += syllables(w)
        e = tl.real(tl.total * acc / tot)
        out.append({"word": w, "start": round(s, 3), "end": round(max(e, s + 0.05), 3)})
    return out


def main():
    p = argparse.ArgumentParser()
    p.add_argument("media")
    p.add_argument("text", help="matn yoki plan.txt (UTF-8)")
    p.add_argument("--out")
    p.add_argument("--noise", type=float, default=-30, help="jimlik chegarasi, dB (standart -30)")
    p.add_argument("--min-silence", type=float, default=0.08, help="eng qisqa pauza, s")
    a = p.parse_args()

    out = Path(a.out or Path(a.media).with_suffix(""))
    text = re.sub(r"[*_~]", "", Path(a.text).read_text(encoding="utf-8"))
    groups = [g.split() for g in re.split(r"\n\s*\n" if re.search(r"\n\s*\n", text.strip()) else r"\n", text)]
    groups = [g for g in groups if g]

    pauses = silences(a.media, a.noise, a.min_silence)
    total = duration(a.media)
    # nutq boshi/oxiri: jimroq chegarada (oxirgi so'z odatda pastroq ovozda)
    soft = silences(a.media, a.noise - 10, 0.3)
    t0 = next((e for s, e in soft if s <= 0.05), 0.0)
    t1 = next((s for s, e in soft if e >= total - 0.05 and s > t0), total)
    inner = [(s, e) for s, e in pauses if s > t0 + 0.05 and e < t1 - 0.05]

    # Chegaralarni birgalikda tanlash (dinamik dasturlash): har bir guruhning nutq davomiyligi
    # bo'g'inlar soniga mos bo'lsin, uzun pauza guruh ichida qolmasin.
    syl = [sum(syllables(w) for w in g) for g in groups]
    per = Timeline(t0, t1, inner).total / sum(syl)  # bir bo'g'in uchun o'rtacha vaqt
    peaks = [t for t in syllable_peaks(a.media) if t0 <= t <= t1]
    ratio = len(peaks) / sum(syl)  # topilgan cho'qqilar / matndagi bo'g'inlar
    nodes = [(t0, t0)] + inner + [(t1, t1)]  # 0 — boshlanish, oxirgisi — tugash

    def cost(k, i, j):  # k-guruh nodes[i] dan nodes[j] gacha
        s0, s1 = nodes[i][1], nodes[j][0]
        if s1 - s0 < 0.12 * len(groups[k]):
            return None
        inside = [(s, e) for s, e in inner if s >= s0 and e <= s1]
        d = (s1 - s0) - sum(e - s for s, e in inside)
        exp = syl[k] * per
        long_in = sum(max(e - s - 0.2, 0) for s, e in inside)
        det = sum(1 for t in peaks if s0 <= t < s1)
        want = syl[k] * ratio
        # tinish belgisi (gap/vergul oxiri) <-> uzun pauza; tezlik real bo'lsin (sekundiga <= 10 bo'g'in)
        punct = bool(re.search(r"[.,!?;:]$", groups[k][-1]))
        long_end = j < N - 1 and nodes[j][1] - nodes[j][0] >= 0.25
        mismatch = 0 if j == N - 1 else (3 if punct != long_end else 0)
        too_fast = max(syl[k] / max(d, 0.05) - 10, 0) * 2
        # bo'g'inlar soni + davomiylik + tinish/pauza + tezlik
        return ((det - want) ** 2 / (want + 1) + 0.3 * (d - exp) ** 2 / exp + 6 * long_in
                + mismatch + too_fast)

    G, N = len(groups), len(nodes)
    INF = float("inf")
    best = [[INF] * N for _ in range(G + 1)]
    back = [[None] * N for _ in range(G + 1)]
    best[0][0] = 0
    for k in range(G):
        for i in range(N):
            if best[k][i] == INF:
                continue
            for j in range(i + 1, N):
                if (k == G - 1) != (j == N - 1):
                    continue
                c = cost(k, i, j)
                if c is not None and best[k][i] + c < best[k + 1][j]:
                    best[k + 1][j], back[k + 1][j] = best[k][i] + c, i
    if best[G][N - 1] == INF:
        sys.exit("Matnni pauzalarga joylab bo'lmadi — --min-silence yoki --noise ni o'zgartiring")
    path, j = [N - 1], N - 1
    for k in range(G, 0, -1):
        j = back[k][j]; path.append(j)
    path.reverse()
    bounds = [nodes[j] for j in path[1:-1]]
    res, start = [], t0
    for k, g in enumerate(groups):
        end = bounds[k][0] if k < len(bounds) else t1
        res += place(g, start, end, inner)
        start = bounds[k][1] if k < len(bounds) else t1
    Path(f"{out}.words.json").write_text(json.dumps(res, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{len(res)} so'z, {len(groups)} guruh, "
          f"nutq {t0:.2f}-{t1:.2f}s -> {out}.words.json (taxminiy vaqt)", file=sys.stderr)


if __name__ == "__main__":
    main()

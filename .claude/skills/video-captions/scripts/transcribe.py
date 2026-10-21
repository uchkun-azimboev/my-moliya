#!/usr/bin/env python3
"""Videodagi nutqni so'zma-so'z vaqt bilan matnga o'giradi (faster-whisper).

Natija: <out>.words.json  ([{"word","start","end"}])  va  <out>.srt (ko'rib chiqish uchun).
Model HuggingFace'dan yuklanadi — tarmoq yopiq bo'lsa align_script.py dan foydalaning.
"""
import argparse, json, sys
from pathlib import Path


def srt_time(t):
    ms = int(round(t * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f"{h:02}:{m:02}:{s:02},{ms:03}"


def main():
    p = argparse.ArgumentParser()
    p.add_argument("media")
    p.add_argument("--out", help="natija fayl nomi (kengaytmasiz)")
    p.add_argument("--lang", default="uz", help="uz, ru, en ... (standart: uz)")
    p.add_argument("--model", default="small", help="tiny|base|small|medium|large-v3")
    p.add_argument("--prompt", default=None, help="maxsus so'zlar/nomlar (imlo uchun yordam)")
    a = p.parse_args()

    from faster_whisper import WhisperModel

    out = Path(a.out or Path(a.media).with_suffix(""))
    model = WhisperModel(a.model, device="cpu", compute_type="int8")
    segments, info = model.transcribe(
        a.media, language=a.lang, word_timestamps=True, vad_filter=True,
        initial_prompt=a.prompt, beam_size=5,
    )
    words, srt = [], []
    for i, seg in enumerate(segments, 1):
        for w in seg.words or []:
            words.append({"word": w.word.strip(), "start": round(w.start, 3), "end": round(w.end, 3)})
        srt.append(f"{i}\n{srt_time(seg.start)} --> {srt_time(seg.end)}\n{seg.text.strip()}\n")
    words = [w for w in words if w["word"]]
    Path(f"{out}.words.json").write_text(json.dumps(words, ensure_ascii=False, indent=1), encoding="utf-8")
    Path(f"{out}.srt").write_text("\n".join(srt), encoding="utf-8")
    print(f"{len(words)} so'z -> {out}.words.json, {out}.srt (til: {info.language})", file=sys.stderr)


if __name__ == "__main__":
    main()

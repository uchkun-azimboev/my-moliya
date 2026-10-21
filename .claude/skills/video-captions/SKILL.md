---
name: video-captions
description: Qisqa "kameraga qarab gapirish" (talking head) videolariga short-form uslubidagi subtitr (caption) qo'shish — transkripsiya, matnni tuzatish, .ass uslub, ffmpeg bilan videoga kuydirish. Foydalanuvchi "videoga caption/subtitr qo'sh", "reels/shorts uchun yozuv", "montaj" desa ishlat.
---

# Video caption (subtitr) skill'i

Maqsad: Reels / Shorts / TikTok uchun o'qilishi oson, 2–3 so'zli, aytilayotgan so'zi
ajratilgan subtitrni videoga kuydirish. Asosiy til — o'zbek (lotin); egasi dasturchi emas —
har qadamni sodda o'zbek tilida tushuntir va har bosqichdan keyin tasdiq so'ra.

## Vositalar

- `ffmpeg`, `ffprobe` (libass, libx264 bilan) — tizimda bor.
- `pip3 install -r .claude/skills/video-captions/requirements.txt` — faster-whisper.
- Shriftlar: `Inter Display Black` (standart), `Inter`, `DejaVu Sans` (`fc-list : family`).

Skriptlar: `.claude/skills/video-captions/scripts/`

| Skript | Vazifa |
|---|---|
| `transcribe.py VIDEO [--lang uz] [--model small] [--prompt "nomlar"]` | Avtomatik transkripsiya → `.words.json` + `.srt` |
| `align_script.py VIDEO matn.txt` | Model yo'q bo'lsa: egasi bergan matnni pauzalar bo'yicha taxminiy vaqtlaydi |
| `make_ass.py WORDS.json VIDEO [uslub]` | Subtitr fayli `.ass` |
| `burn.sh VIDEO captions.ass OUT.mp4` | Subtitrni videoga kuydirish |
| `preview.sh OUT.mp4 kadrlar/` | Tekshirish uchun kadrlar (Read bilan ko'r) |

## Ish tartibi

1. **Videoni olish.** Fayl ishchi papkaga kelishi kerak (masalan `video/` — `.gitignore`da,
   videolar repoga commit qilinmaydi). `ffprobe` bilan o'lcham, davomiylik, aylanish (rotation)ni tekshir.
2. **Matn.**
   - Avval `transcribe.py`. Model yuklanmasa (HuggingFace tarmoqda yopiq) — egasidan aytilgan
     matnni so'ra (har ibora yangi qatorda) va `align_script.py` ishlat. Bu vaqtlar taxminiy.
   - Matnni egasiga ko'rsat (`.srt` yoki oddiy matn). Imlo, nomlar, brend, raqamlarni u
     tasdiqlasin. Tuzatishlarni `fix.json` (`{"xato": "to'g'ri"}`) yoki `.words.json`ni
     to'g'ridan-to'g'ri tahrirlash bilan kirit. O'zbek lotin: `o'`, `g'` uchun oddiy apostrof `'`.
3. **Uslub** (standart — vertikal 9:16 uchun):
   - 3 so'zgacha / 18 belgigacha qator, pauzada yoki tinish belgisida yangi qator
   - Oq matn, qora kontur, aytilayotgan so'z sariq (`--highlight "#FFD400"`, `none` — o'chiq)
   - Pastdan ~30% balandlikda (`--pos 0.30`) — Reels/TikTok tugmalari ostida qolmaydi
   - `--upper` (BOSH HARF), `--no-punct`, `--font`, `--size`, `--max-words` sozlanadi
4. **Sinov kadrlari.** `burn.sh` → `preview.sh` → kadrlarni Read bilan ko'rib, joylashuv
   va o'lcham yuzni/muhim joyni yopmasligini tekshir. Egasiga ko'rsat.
5. **Yakuniy eksport.** H.264, CRF 18, AAC 192k, `+faststart`. Tayyor faylni SendUserFile bilan yubor.

## Qoidalar

- Asl videoni hech qachon ustidan yozma — natija har doim yangi fayl (`*_captions.mp4`).
- Video va audio fayllarni git'ga commit qilma.
- Caption matnini o'zingdan "chiroyli" qilib o'zgartirma — spiker aytganini yoz; qisqartirish
  yoki so'z almashtirish faqat egasi rozi bo'lsa.
- Har bosqich oxirida qisqa xulosa va keyingi qadamni ayt, tasdiq kut.

# Shaxsiy moliya ilovasi — loyiha qo'llanmasi

Bu fayl loyihaning asosiy spetsifikatsiyasi. Har bir sessiyada avval shu faylni o'qi va unga amal qil.

## Loyiha haqida

Bitta foydalanuvchi (egasi) uchun shaxsiy moliya web ilovasi. Egasi — frilanser performance marketolog: daromadi notekis, bir necha mijozdan, so'm va dollarda keladi; loyihalarda odatda oldindan to'lov oladi.

Ilovaning asosiy savoli: "Keyingi 30–90 kunda pulim yetadimi, majburiyatlarim qancha va maqsadlarimga qachon yetaman?"

- Interfeys tili: **o'zbek (lotin)**
- **Mobile-first**: asosan telefonda, home screen'ga qo'yilgan PWA sifatida ishlatiladi
- Telegram bot **yo'q** va rejalashtirilmagan — faqat web

## Texnologiyalar

- Next.js (App Router) + TypeScript
- Supabase (PostgreSQL + Auth), `@supabase/ssr`
- Tailwind CSS + shadcn/ui
- Recharts (grafiklar)
- PWA: web manifest + service worker (Serwist yoki qo'lda)
- Valyuta kursi: CBU API (cbu.uz), kunlik keshlanadi
- Hosting: Vercel

## Xavfsizlik qoidalari (majburiy)

- Supabase loyihasida "Automatically expose new tables" **o'chiq**, "automatic RLS" **yoqiq**.
- Har bir jadval uchun migratsiyada:
  - `alter table ... enable row level security;`
  - `user_id uuid not null default auth.uid() references auth.users` ustuni
  - RLS policy: faqat `auth.uid() = user_id` bo'lgan qatorlar (select/insert/update/delete)
  - `grant select, insert, update, delete on public.<jadval> to authenticated;`
- `service_role` kalitini hech qachon brauzer kodiga yoki repoga qo'yma.
- Maxfiy qiymatlar faqat `.env.local` da; `.env.local` `.gitignore` da bo'lishi shart. `.env.example` da faqat nomlar.
- Ro'yxatdan o'tish (signup) ochiq bo'lmaydi: foydalanuvchi Supabase dashboard'da qo'lda yaratiladi. Ilovada faqat login sahifasi.
- Login qilinmagan foydalanuvchi har qanday sahifadan `/login` ga yo'naltiriladi (middleware).
- Har bir yangi sahifa (`page.tsx`) `requireUser()` ni o'zi chaqiradi — ma'lumot so'rovlari bilan birga `Promise.all` ichida parallel. Tekshiruv `layout.tsx` ga qaytarilmaydi: layout'dagi `await` butun sahifani (skeletonni ham) to'sib qo'yadi va o'tishni sekinlashtiradi. Server action'lar ham `requireUser()` ni o'zi chaqiradi.

## Pul bilan ishlash qoidalari

- Summalar bazada `numeric(18,2)` — hech qachon float emas.
- Har bir tranzaksiya o'z valyutasida (`UZS` yoki `USD`) saqlanadi, yoniga o'sha kungi kurs (`rate_to_uzs`) yoziladi.
- Hisobotlar asosiy valyutada (standart: UZS) ko'rsatiladi.
- Balanslar, avans, kunlik limit kabi hosila raqamlar **saqlanmaydi** — har safar tranzaksiyalardan hisoblanadi (SQL view yoki funksiya orqali).
- Summalar formatlanishi: `1 250 000 so'm`, `$1,250`.

## Modullar

1. **Dashboard** — xavfsiz pul, jami pul, kunlik limit, bu oy daromad/xarajat, maqsadlar progressi, faol majburiyatlar.
2. **Tranzaksiyalar** — tezkor kiritish formasi (summa → kategoriya → hamyon), ro'yxat, filtr, tahrirlash.
3. **Hamyonlar** — naqd/karta, UZS/USD, hamyonlar orasida o'tkazma va valyuta ayirboshlash.
4. **Loyihalar** — mijoz loyihalari, olingan avans, bajarilish holati, majburiyat.
5. **Maqsadlar** — jamg'arma (to'y, mashina, uy) va qarz maqsadlari, ustuvorlik bilan.
6. **Budjet** — kategoriya bo'yicha oylik reja va fakt.
7. **Hisobotlar** — oyma-oy trend, kategoriyalar, mijoz ulushlari, 90 kunlik prognoz.

## Ma'lumotlar modeli

- `wallets`: id, name, currency (UZS/USD), kind (cash/card), opening_balance, archived
- `categories`: id, name, kind (income/expense), group (fixed/work/variable), icon, archived
- `transactions`: id, date, amount, currency, rate_to_uzs, wallet_id, category_id, project_id (null), goal_id (null), note
- `transfers`: id, date, from_wallet_id, to_wallet_id, from_amount, to_amount, rate, note
- `clients`: id, name, note
- `projects`: id, client_id, name, total_amount, currency, start_date, end_date, progress_percent (0–100), status (obligation/partial/done), is_retainer
- `goals`: id, name, kind (saving/debt), target_amount, currency, start_amount, deadline, priority, status
- `budgets`: id, month (date, oyning 1-kuni), category_id, planned_amount
- `exchange_rates`: date, usd_to_uzs (CBU'dan)

Barcha jadvallarda `user_id`, `created_at` bor.

## Hisob-kitob formulalari

**Hamyon balansi**
`opening_balance + daromadlar − xarajatlar + kiruvchi o'tkazmalar − chiquvchi o'tkazmalar`

**Loyiha avansi (majburiyat)**
- `olingan_to'lov` = loyihaga bog'langan daromad tranzaksiyalari yig'indisi
- `ishlab_topilgan = olingan_to'lov × progress_percent / 100`
- `majburiyat = olingan_to'lov − ishlab_topilgan`
- status `done` bo'lsa majburiyat = 0

**Jami pul va xavfsiz pul**
- `jami_pul` = barcha hamyonlar balansi (UZS ga o'girilgan)
- `xavfsiz_pul = jami_pul − barcha faol loyihalar majburiyati`

**Kunlik limit**
`(xavfsiz_pul − oy oxirigacha rejalashtirilgan majburiy to'lovlar − shu oyning maqsad ajratmalari) ÷ oyning qolgan kunlari` (0 dan kichik bo'lsa 0 va ogohlantirish)

**Xavfsiz daromad (reja uchun)**
Oxirgi 3–6 oydagi eng past oylik daromad.

**Maqsadlar**
- saving: `yig'ilgan` = goal_id ga bog'langan ajratmalar yig'indisi
- debt: `qolgan = target_amount − to'langan`
- `oylik_kerakli = qolgan ÷ muddatgacha qolgan oylar`
- `progress = bajarilgan ÷ target × 100`
- `real_muddat = qolgan ÷ oxirgi 3 oydagi o'rtacha oylik ajratma`
- real_muddat deadline'dan kech bo'lsa — qizil holat va "oyiga yana X kerak" xabari

**Pul taqsimoti tartibi (tavsiya ko'rinishida)**
1. Majburiy doimiy xarajatlar
2. Maqsadlar — `priority` bo'yicha (qarz odatda 1-o'rinda)
3. Zaxira (sozlanadigan foiz, masalan 10%)
4. Qolgani — erkin pul

**Runway**
`likvid pul ÷ oxirgi 3 oydagi o'rtacha oylik majburiy xarajat`

**Mijoz konsentratsiyasi**
Har bir mijozning oxirgi 6 oydagi daromad ulushi; 50% dan oshsa ogohlantirish.

**Prognoz (30/60/90 kun)**
`hozirgi pul + kutilayotgan mijoz to'lovlari − doimiy xarajatlar − maqsad/qarz to'lovlari`

## Qurish bosqichlari

1. Skelet: Next.js, Tailwind, shadcn/ui, Supabase ulanishi, login, middleware; hamyonlar, kategoriyalar, tranzaksiyalar (CRUD) + migratsiyalar
2. Dashboard, kunlik limit, CBU valyuta kursi
3. Loyihalar va avans moduli, xavfsiz pul
4. Maqsadlar va taqsimot
5. Budjet, hisobotlar, prognoz, PWA sozlash

Faqat joriy bosqich ustida ishla. Keyingi bosqichga egasi aytgandagina o't.

## Ish tartibi

- Katta o'zgarishdan oldin qisqa reja yoz va tasdiq kut.
- SQL migratsiyalar `supabase/migrations/` papkasida, raqamlangan fayllar sifatida. Egasi ularni Supabase SQL Editor'da ishga tushiradi — shuning uchun har bir migratsiyadan keyin qaysi faylni ishga tushirish kerakligini aniq ayt.
- Har bir bosqich oxirida: nima qilindi, qanday tekshirish kerak (qadamma-qadam), keyingi bosqichda nima bor.
- Egasi dasturchi emas (vibe coder) — tushuntirishlar sodda va o'zbek tilida bo'lsin.
- Mijozlarning reklama budjeti (tranzit pul) hozircha rejada yo'q.

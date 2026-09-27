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

## Interfeys qoidalari

- Mavzu: Yorug' / Qorong'i / Tizim (standart — Tizim), `next-themes` orqali, tanlov qurilmada (localStorage) saqlanadi. Ranglar faqat `globals.css` dagi tokenlar orqali (`bg-card`, `text-muted-foreground`, `text-income`, `--chart-*` va h.k.) — qattiq kodlangan rang ishlatilmaydi, har bir yangi sahifa ikkala rejimda tekshiriladi.
- PWA `theme-color` tanlangan mavzuga ergashadi (`src/components/theme.tsx`).
- Pastki menyu (5 tadan oshmaydi): Asosiy · Tranzaksiyalar · Loyihalar · Hamyonlar · Sozlamalar. Kategoriyalar — Sozlamalar ichida, Mijozlar — Loyihalar ichida.
- Asosiy sahifalarda doim dumaloq "+" tugma — `/transactions/new` (tezkor kiritish) ni ochadi.

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
- `clients`: id, name, note, archived
- `projects`: id, client_id, name, total_amount, currency, start_date, end_date, progress_mode (percent/units), progress_percent (0–100), units_total, units_done, is_retainer, previous_project_id (retainer oldingi davri), closed (qo'lda yopilgan), note
  - **status saqlanmaydi** — `project_summary` view'da hisoblanadi: `closed` yoki bajarilish 100% → `done`, 0% → `obligation`, qolgani → `partial`
- `goals`: id, name, kind (saving/debt), target_amount, currency, start_amount, deadline, priority, status
- `budgets`: id, month (date, oyning 1-kuni), category_id, planned_amount
- `exchange_rates`: date, usd_to_uzs (CBU'dan)
- `settings`: user_id (bitta qator), monthly_fixed_expenses — **vaqtinchalik**, 5-bosqichda budjet bilan almashtiriladi

Barcha jadvallarda `user_id`, `created_at` bor.

## Hisob-kitob formulalari

**Hamyon balansi**
`opening_balance + daromadlar − xarajatlar + kiruvchi o'tkazmalar − chiquvchi o'tkazmalar`

**Loyiha avansi (majburiyat)** — `project_summary` view
- `olingan_to'lov` = loyihaga bog'langan daromadlar − loyihaga bog'langan xarajatlar (qaytarilgan pul), har biri o'z `rate_to_uzs` kursida so'mga o'giriladi
- `bajarilish` = progress_percent / 100 yoki units_done / units_total (aniq nisbat; ekranda 1 xona kasr, masalan 41,7%)
- `ishlab_topilgan = olingan_to'lov × progress_percent / 100`
- `majburiyat = olingan_to'lov − ishlab_topilgan`
- status `done` bo'lsa majburiyat = 0 (ishlab topilgan = olingan)
- `kutilayotgan_to'lov` **loyiha valyutasida**: `max(total_amount − olingan_loyiha_valyutasida, 0)`; so'mda ko'rsatishda faqat shu qolgan qism bugungi CBU kursida o'giriladi (0014). Olingan to'lov loyiha valyutasiga: bir xil valyuta — summaning o'zi; USD to'lov → so'm loyiha — tranzaksiya kursida; so'm to'lov → USD loyiha — to'lov kunidagi CBU kursida
- `muddati_o'tgan` = tugallanmagan va end_date bugundan oldin
- Retainer "Keyingi oyni ochish": yangi davr = oldingi tugashdan keyingi kun … +1 oy − 1 kun, bajarilish 0 dan; "Oldingi davrni yopish" standart yoqilgan

**Jami pul va xavfsiz pul**
- `jami_pul` = barcha hamyonlar balansi (UZS ga o'girilgan)
- `xavfsiz_pul = jami_pul − barcha faol loyihalar majburiyati` (`dashboard_summary()`, 3-bosqichdan haqiqiy)

**Kunlik limit**
`(xavfsiz_pul − oy oxirigacha rejalashtirilgan majburiy to'lovlar − shu oyning maqsad ajratmalari) ÷ oyning qolgan kunlari` (0 dan kichik bo'lsa 0 va ogohlantirish)

- Hozircha (2-bosqichdan): `oy oxirigacha rejalashtirilgan majburiy to'lovlar = max(settings.monthly_fixed_expenses − shu oy "fixed" guruhda to'langan, 0)`. Sozlama kiritilmagan bo'lsa dashboard'da "Oylik majburiy xarajatlarni kiriting" eslatmasi chiqadi.
- **5-bosqichda** `monthly_fixed_expenses` o'rniga budjetdagi (`budgets`) "fixed" kategoriyalar rejasi ishlatiladi va sozlama olib tashlanadi.
- Oyning qolgan kunlari bugunni ham o'z ichiga oladi (Toshkent vaqti).

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

## Loyiha holati

**Tugagan bosqichlar:** 1 (skelet, CRUD), 2 (dashboard, kunlik limit, CBU, mavzu, sozlamalar), 3 (mijozlar, loyihalar, avans, xavfsiz pul). Migratsiyalar: `0001`–`0014`.

**Qabul qilingan qarorlar (keyingi sessiyalar uchun):**
- Next.js 16: middleware fayli `src/proxy.ts`. Auth tekshiruvi `getClaims()`; Supabase loyihasi ES256 (ECC P-256) kalitda — JWT mahalliy tekshiriladi. Legacy HS256 kaliti "previous" holatda qoladi (anon kalit u bilan imzolangan) — revoke qilinmaydi.
- `createClient()` / `requireUser()` React `cache()` bilan; ro'yxat qatorlaridagi `<Link>` larda `prefetch={false}`; har bir bo'limda `loading.tsx` skeleton.
- Formalar `useFormAction` (`src/hooks/use-form-action.ts`) orqali — React formani avtomatik tozalamasin.
- `categories` dagi guruh ustuni `group_type` deb nomlangan (`group` SQL'da band).
- Tranzaksiya valyutasi hamyondan trigger orqali olinadi; UZS da `rate_to_uzs = 1`. Tranzaksiya/o'tkazma boshqa foydalanuvchi hamyoniga yozilmasligi composite FK `(id, user_id)` bilan ta'minlanadi — yangi jadvallarda ham shu usul.
- CBU kursi `exchange_rates` da kuniga bir marta keshlanadi (`src/lib/cbu.ts`); CBU javob bermasa oxirgi saqlangan kurs + "olinmadi" belgisi. `CBU_API_URL` — faqat test uchun.
- Tezkor kiritish — `/transactions/new` (asosiy sahifalardagi "+" tugma); tranzaksiyalar sahifasida faqat ro'yxat va filtr.
- Loyiha statusi saqlanmaydi, faqat `closed`. Loyihaga bog'langan xarajat = qaytarilgan pul.
- Test muhiti: mahalliy Supabase CLI (Docker) + soxta CBU (sandbox'dan cbu.uz yopiq); shadcn registry ham yopiq bo'lishi mumkin — komponentlar GitHub'dan (`shadcn-ui/ui`, `apps/v4/registry/new-york-v4/ui`) qo'lda olinadi.

**4-bosqich nimadan boshlanadi:** avval reja va bitta asosiy qaror — maqsadga ajratma qanday yoziladi (masalan, `goal_id` bog'langan tranzaksiya "Jamg'arma" xarajat kategoriyasi bilan, yoki alohida jamg'arma hamyoniga o'tkazma). Keyin: `0015_goals.sql` (goals + `transactions.goal_id` FK), `goal_summary` view (yig'ilgan/to'langan, qolgan, oylik kerakli, progress, real muddat, kechikish), `dashboard_summary()` da shu oyning maqsad ajratmalari (hozir 0), Maqsadlar sahifasi va dashboard kartasi, pul taqsimoti tavsiyasi (majburiy → maqsadlar priority bo'yicha → zaxira % → erkin pul).

## Ish tartibi

- Katta o'zgarishdan oldin qisqa reja yoz va tasdiq kut.
- SQL migratsiyalar `supabase/migrations/` papkasida, raqamlangan fayllar sifatida. Egasi ularni Supabase SQL Editor'da ishga tushiradi — shuning uchun har bir migratsiyadan keyin qaysi faylni ishga tushirish kerakligini aniq ayt.
- Har bir bosqich oxirida: nima qilindi, qanday tekshirish kerak (qadamma-qadam), keyingi bosqichda nima bor.
- Egasi dasturchi emas (vibe coder) — tushuntirishlar sodda va o'zbek tilida bo'lsin.
- Mijozlarning reklama budjeti (tranzit pul) hozircha rejada yo'q.

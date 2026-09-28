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
- Pastki menyu (5 tadan oshmaydi): Asosiy · Tranzaksiyalar · Loyihalar · Maqsadlar · Hamyonlar. Sozlamalar — dashboard tepasidagi ⚙️, Kategoriyalar — Sozlamalar ichida, Mijozlar — Loyihalar ichida.
- Asosiy sahifalarda doim dumaloq "+" tugma — `/transactions/new` (tezkor kiritish) ni ochadi.
- Hisobotlar — Asosiy bo'limidagi tab (Bugun · Hisobotlar, `/reports`, `src/components/home-tabs.tsx`); menyu o'zgarmaydi. Pastki menyuda bo'lim faolligi `sections` xaritasi orqali (`/reports`, `/settings`, `/categories` → Asosiy).
- Grafiklar: Recharts, ranglar faqat `var(--chart-1..5)` (validatordan o'tgan palitra, yorug'/qorong'i alohida). Har grafikda legenda va "Jadval ko'rinishi"; qiymat matnlari seriya rangida emas.
- Budjet — Tranzaksiyalar bo'limidagi tab (Ro'yxat · Budjet, `/budget?month=YYYY-MM`); dashboard "Bu oy" kartasida "Budjet →" havolasi.
- PWA: `src/app/manifest.ts` (standalone), ikonkalar kod bilan chiziladi (`src/lib/app-icon.tsx`: `/icon`, `/apple-icon`, `/icons/192|512|maskable`), service worker — `src/app/sw.js/route.ts`, ro'yxatdan o'tkazish — `src/components/pwa.tsx`, offline sahifa — `/offline`. Bu yo'llar `src/proxy.ts` matcher'ida login'dan ozod.

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
- `projects`: id, client_id, name, total_amount, currency, start_date, end_date, progress_mode (percent/units), progress_percent (0–100), units_total, units_done, is_retainer, previous_project_id (retainer oldingi davri), closed (qo'lda yopilgan), continues (retainer davom etadi — prognoz uchun, standart `true`), note
  - **status saqlanmaydi** — `project_summary` view'da hisoblanadi: `closed` yoki bajarilish 100% → `done`, 0% → `obligation`, qolgani → `partial`
- `goals`: id, name, kind (saving/debt), target_amount, currency, start_amount, deadline, priority (1 — eng muhim), monthly_plan (ixtiyoriy oylik rejadagi to'lov), closed, note
  - **status saqlanmaydi** — `goal_summary` view'da: `closed` → `closed`, qolgan = 0 → `done`, aks holda `active`
- `goal_allocations`: id, goal_id, date, amount (maqsad valyutasida; musbat — ajratish, manfiy — bo'shatish), note — faqat jamg'arma maqsadiga (trigger)
- `budgets`: id, month (date, oyning 1-kuni), category_id, planned_amount (so'mda) — faqat xarajat kategoriyalariga (trigger); bir oyda kategoriyaga bitta reja
- `exchange_rates`: date, usd_to_uzs (CBU'dan)
- `settings`: user_id (bitta qator), monthly_fixed_expenses — **zaxira qiymat**: joriy oyda "fixed" budjeti bo'lmasa ishlatiladi (5a)

Barcha jadvallarda `user_id`, `created_at` bor.

## Hisob-kitob formulalari

**Hamyon balansi**
`opening_balance + daromadlar − xarajatlar + kiruvchi o'tkazmalar − chiquvchi o'tkazmalar`

**Loyiha avansi (majburiyat)** — `project_summary` view
- `olingan_to'lov` = loyihaga bog'langan daromadlar − loyihaga bog'langan xarajatlar (qaytarilgan pul), har biri o'z `rate_to_uzs` kursida so'mga o'giriladi
- `bajarilish` = progress_percent / 100 yoki units_done / units_total (aniq nisbat; ekranda 1 xona kasr, masalan 41,7%)
- Quyidagilar **loyiha valyutasida** hisoblanadi (0026), so'mga: UZS — o'zi, USD — bugungi CBU kursida (kurs bo'lmasa to'lovlardagi o'rtacha kurs):
  - `bajarilgan_ish = total_amount × bajarilish` (done/closed — 100%); view'da `work_amount`, so'mda `earned_uzs`; kartada "Bajarilgan ish"
  - `majburiyat = max(olingan − bajarilgan_ish, 0)`; status `done` bo'lsa 0 (`obligation_amount`, `obligation_uzs`)
  - `mijoz_qarzi = max(bajarilgan_ish − olingan, 0)` (`client_debt_amount`, `client_debt_uzs`); kartada 0 dan katta bo'lsa ko'rsatiladi
  - avvalgi `olingan × %` formulasi faqat to'liq oldindan to'langan loyihada to'g'ri edi — qisman to'lovda majburiyatni oshirib ko'rsatardi
- `kutilayotgan_to'lov` **loyiha valyutasida**: `max(total_amount − olingan_loyiha_valyutasida, 0)`; so'mda ko'rsatishda faqat shu qolgan qism bugungi CBU kursida o'giriladi (0014). Olingan to'lov loyiha valyutasiga: bir xil valyuta — summaning o'zi; USD to'lov → so'm loyiha — tranzaksiya kursida; so'm to'lov → USD loyiha — to'lov kunidagi CBU kursida
- `muddati_o'tgan` = tugallanmagan va end_date bugundan oldin
- Retainer "Keyingi oyni ochish": yangi davr = oldingi tugashdan keyingi kun … +1 oy − 1 kun, bajarilish 0 dan; "Oldingi davrni yopish" standart yoqilgan

**Jami pul va xavfsiz pul**
- `jami_pul` = barcha hamyonlar balansi (UZS ga o'girilgan)
- `xavfsiz_pul = jami_pul − barcha faol loyihalar majburiyati − jamg'armaga ajratilgan qoldiq` (`dashboard_summary()`; ajratilgan qoldiq yopilgan maqsadlarda ham ayriladi — pul bo'shatilmaguncha band)

**Kunlik limit**
`(xavfsiz_pul − oy oxirigacha rejalashtirilgan majburiy to'lovlar − shu oyning maqsad ajratmalari) ÷ oyning qolgan kunlari` (0 dan kichik bo'lsa 0 va ogohlantirish)

- `oy oxirigacha rejalashtirilgan majburiy to'lovlar` (5a, `dashboard_summary()` v4):
  - joriy oyda "fixed" guruh kategoriyalariga budjet bo'lsa — `Σ max(reja − fakt, 0)` **kategoriya bo'yicha** (bir kategoriyadagi ortiqcha to'lov boshqasining qoldig'ini kamaytirmaydi); `fixed_plan_source = 'budget'`
  - bo'lmasa — `max(settings.monthly_fixed_expenses − shu oy "fixed" guruhda to'langan, 0)`; `'settings'`
  - ikkalasi ham yo'q — 0 va dashboard'da "Oylik majburiy xarajatlarni kiriting" eslatmasi; `'none'`
- "Favqulodda zaxira" shabloni: `× 3` shu ishlatilayotgan majburiy rejadan (budjet yoki sozlama)
- Oyning qolgan kunlari bugunni ham o'z ichiga oladi (Toshkent vaqti).
- `shu oyning maqsad ajratmalari` = faol maqsadlar bo'yicha `max(reja − shu oy ajratilgan/to'langan, 0)`, `reja = monthly_plan`, bo'lmasa `oylik_kerakli`, muddat ham bo'lmasa 0 (4-bosqichdan).
- Bu oy xarajati qarz to'lovlarisiz (qarz maqsadiga bog'langan xarajatlar alohida — `debt_paid_month_uzs`).

**Budjet** — `budget_report(oy)` SQL funksiyasi (5a)
- `fakt` = shu oy kategoriya xarajatlari, har biri o'z kursida so'mga; qarz to'lovlari (qarz maqsadiga bog'langan) kirmaydi
- `qolgan = max(reja − fakt, 0)`, `oshib_ketgan = max(fakt − reja, 0)`; qatorlar — rejasi yoki fakti bor xarajat kategoriyalari
- "Oldingi oy rejasini nusxalash" faqat rejasi yo'q kategoriyalarni to'ldiradi (arxivlanganlar nusxalanmaydi)
- Budjetdan oshgan kategoriyalar soni dashboard'da eslatma bo'lib chiqadi (`budget_over_count`)

**Sof natija** (dashboard "Bu oy" va hisobotlar trendi) = `daromad − xarajat − qarz to'lovlari`.

**Xavfsiz daromad (reja uchun)** — `report_stats()`
Oxirgi `min(6, to'liq oylar)` to'liq oydagi eng past oylik daromad. To'liq oy = birinchi tranzaksiya oyidan (o'zi ham) joriy oydan oldingi oylar; 3 tadan kam bo'lsa `null` → "Ma'lumot yetarli emas".

**Maqsadlar** — `goal_summary` view (4-bosqich)
- Ajratma **virtual**: pul hamyonda qoladi. Jamg'arma — `goal_allocations`; qarz to'lovi — `goal_id` bog'langan xarajat ("Qarz to'lovi" kategoriyasi; qarz maqsadi yaratilganda bo'lmasa qo'shiladi). Maqsadga faqat xarajat bog'lanadi
- saving: `yig'ilgan = start_amount + ajratmalar` (progress); `ajratilgan_qoldiq = max(ajratmalar − maqsadga bog'langan xarajatlar, 0)` — maqsaddan ishlatilgan pul ajratmani o'z-o'zidan bo'shatadi, progress kamaymaydi; qo'lda "Bo'shatish" (manfiy ajratma) progressni ham kamaytiradi
- `start_amount` — ilova hamyonlaridan tashqaridagi pul: progressga kiradi, xavfsiz puldan ayrilmaydi
- debt: `to'langan = start_amount + bog'langan xarajatlar`; `qolgan = target_amount − to'langan`
- Tranzaksiya valyutasi maqsad valyutasiga 0014 dagi qoida bilan o'giriladi; `*_uzs` — bugungi CBU kursida
- `muddatgacha qolgan oylar` = muddat oyigacha, joriy oy ham (kamida 1)
- `oylik_kerakli = qolgan ÷ muddatgacha qolgan oylar`
- `progress = bajarilgan ÷ target × 100`
- `real_muddat = qolgan ÷ oxirgi 3 oydagi o'rtacha oylik ajratma`
- real_muddat deadline'dan kech bo'lsa (yoki 3 oyda hissa yo'q) — qizil holat va "oyiga yana X kerak" xabari, `X = oylik_kerakli − o'rtacha`

**Pul taqsimoti tartibi (tavsiya ko'rinishida, Maqsadlar sahifasida)**
Xavfsiz puldan: 1. Majburiy xarajatlarning oy oxirigacha qolgani → 2. Maqsadlar `priority` bo'yicha, har biriga shu oy rejada qolgani → 3. Qolgani — erkin pul. Zaxira foizi yo'q — zaxira oddiy jamg'arma maqsadi ("Favqulodda zaxira" shabloni)

**Runway** — `report_stats()`
`xavfsiz_pul ÷ asos`; asos = oxirgi 3 to'liq oydagi "fixed" guruh xarajatlari o'rtachasi (`'history'`, to'liq oy ≥ 3 va o'rtacha > 0 bo'lsa), aks holda joriy majburiy reja (`dashboard_summary.monthly_fixed_expenses`, `'plan'`), ikkalasi yo'q — `'none'`.

**Mijoz konsentratsiyasi**
`report_clients(6)`: mijoz daromadi = loyihaga bog'langan daromad − loyihaga bog'langan xarajat (qaytarilgan); loyihasiz daromad — "Boshqa daromad". Ulush jamidan; biror mijoz 50% dan oshsa ogohlantirish.

**Trend va kategoriyalar** — `report_monthly(n)` (oy: daromad, xarajat [qarzsiz], qarz to'lovlari, sof), `report_categories(from, to)` (qarz to'lovlari kirmaydi). Sahifada trend boshidagi bo'sh oylar kesiladi.

**Prognoz (30/60/90 kun)**
`forecast(p_days)` (kunlik qatorlar) va `forecast_params()` — 0025:
- Boshlanish: **xavfsiz pul** (bugun).
- Kirim: `project_summary.expected_uzs` loyiha `end_date` kunida. Sanasi yo'q yoki o'tib ketgan tugallanmagan loyihalar prognozga kirmaydi — alohida qator (`undated_expected_uzs`).
- Retainer: `is_retainer and continues` va keyingi davri ochilmagan loyiha keyingi davrlarda har davr boshida (`end_date + 1 + (k−1) oy`; end_date yo'q bo'lsa `start + k oy`) `total_amount` to'laydi — faqat "Retainer bilan" chizig'iga. Grafikda ikki chiziq ("Retainer bilan", "Retainersiz"), minusga tushish kuni har biri uchun alohida.
- Majburiy: joriy oy — oy oxirigacha qolgan (dashboard'dagidek) qolgan kunlarga teng bo'linadi; keyingi oylar — o'sha oyning fixed budjeti, bo'lmasa joriy majburiy reja, kunlarga bo'linib.
- Boshqa xarajatlar (o'zgaruvchan + ish guruhlari), manba tartibi: (a) `'budget'` — joriy oyda shu guruhlarga budjet bo'lsa (keyingi oylarda o'sha oy budjeti, bo'lmasa joriy); (b) `'history'` — oxirgi 3 to'liq oy o'rtachasi; (c) `'current'` — joriy oyning kunlik o'rtacha sarfi; `'none'` — 0. Manba grafik ostida yoziladi.
- Maqsad/qarz: joriy oy — rejada qolgani; keyingi oylar — `plan_amount` (bugungi kursda), maqsad qolganidan oshmaydi.

## Qurish bosqichlari

1. Skelet: Next.js, Tailwind, shadcn/ui, Supabase ulanishi, login, middleware; hamyonlar, kategoriyalar, tranzaksiyalar (CRUD) + migratsiyalar
2. Dashboard, kunlik limit, CBU valyuta kursi
3. Loyihalar va avans moduli, xavfsiz pul
4. Maqsadlar va taqsimot
5. Budjet, hisobotlar, prognoz, PWA sozlash

Faqat joriy bosqich ustida ishla. Keyingi bosqichga egasi aytgandagina o't.

## Loyiha holati

**Tugagan bosqichlar:** 1 (skelet, CRUD), 2 (dashboard, kunlik limit, CBU, mavzu, sozlamalar), 3 (mijozlar, loyihalar, avans, xavfsiz pul), 4 (maqsadlar, ajratmalar, qarz to'lovlari, taqsimot), 5a (budjet, PWA), 5b (hisobotlar, prognoz, eksport). Migratsiyalar: `0001`–`0026` (0026 — majburiyat formulasi tuzatildi).

**Qabul qilingan qarorlar (keyingi sessiyalar uchun):**
- Next.js 16: middleware fayli `src/proxy.ts`. Auth tekshiruvi `getClaims()`; Supabase loyihasi ES256 (ECC P-256) kalitda — JWT mahalliy tekshiriladi. Legacy HS256 kaliti "previous" holatda qoladi (anon kalit u bilan imzolangan) — revoke qilinmaydi.
- `createClient()` / `requireUser()` React `cache()` bilan; ro'yxat qatorlaridagi `<Link>` larda `prefetch={false}`; har bir bo'limda `loading.tsx` skeleton.
- Formalar `useFormAction` (`src/hooks/use-form-action.ts`) orqali — React formani avtomatik tozalamasin.
- `categories` dagi guruh ustuni `group_type` deb nomlangan (`group` SQL'da band).
- Tranzaksiya valyutasi hamyondan trigger orqali olinadi; UZS da `rate_to_uzs = 1`. Tranzaksiya/o'tkazma boshqa foydalanuvchi hamyoniga yozilmasligi composite FK `(id, user_id)` bilan ta'minlanadi — yangi jadvallarda ham shu usul.
- CBU kursi `exchange_rates` da kuniga bir marta keshlanadi (`src/lib/cbu.ts`); CBU javob bermasa oxirgi saqlangan kurs + "olinmadi" belgisi. `CBU_API_URL` — faqat test uchun.
- Tezkor kiritish — `/transactions/new` (asosiy sahifalardagi "+" tugma); tranzaksiyalar sahifasida faqat ro'yxat va filtr.
- Loyiha statusi saqlanmaydi, faqat `closed`. Loyihaga bog'langan xarajat = qaytarilgan pul.
- Maqsad statusi ham saqlanmaydi, faqat `closed`. Maqsad turi (jamg'arma/qarz) yaratilgandan keyin o'zgarmaydi. Ajratmani faqat ajratilgan qoldiqqacha bo'shatish mumkin.
- `dashboard_summary()` qaytaradigan ustunlar o'zgarsa — migratsiyada `drop function` + `create` (0019, 0022 dagidek).
- Service worker **versiyalangan**: `sw.js` build vaqtida yaratiladi, versiya = `VERCEL_DEPLOYMENT_ID` (yoki commit / build vaqti). Yangi deploy → yangi SW → `activate` da eski `moliya-*` keshlar o'chadi → `clients.claim()` → sahifa bir marta o'zi qayta yuklanadi (input fokusda bo'lsa — ilova yashiringanda). Yangilanish ilova ochilganda va qayta ko'rinishga kelganda tekshiriladi.
- Eksport: `/export/moliya.xlsx` (barcha jadvallar, 11 varaq, `write-excel-file`) va `/export/tranzaksiyalar.csv` (UTF-8 BOM, vergul) — route handler'lar `requireUser()` chaqiradi, nomlar ID o'rniga. `exceljs` ishlatilmaydi (zaif `uuid` bog'liqligi).
- Hisobot funksiyalari (0024, 0025) `security invoker`, anon'dan `revoke execute`.
- SW faqat `/_next/static/*` va `/icons/*` ni keshlaydi; sahifalar va moliyaviy ma'lumotlar **keshlanmaydi**, internet bo'lmasa faqat `/offline` ko'rsatiladi.
- Playwright'ning `setOffline()` service worker so'rovlariga ta'sir qilmaydi — offline'ni server to'xtatib sinash kerak.
- Test muhiti: mahalliy Supabase CLI (Docker) + soxta CBU (sandbox'dan cbu.uz yopiq); shadcn registry ham yopiq bo'lishi mumkin — komponentlar GitHub'dan (`shadcn-ui/ui`, `apps/v4/registry/new-york-v4/ui`) qo'lda olinadi.

**Keyingi qadam:** barcha 5 bosqich tugadi. Yangi ish faqat egasi aytganda (masalan: mijozlarning reklama budjeti — tranzit pul, hozircha rejada yo'q).

## Ish tartibi

- Katta o'zgarishdan oldin qisqa reja yoz va tasdiq kut.
- SQL migratsiyalar `supabase/migrations/` papkasida, raqamlangan fayllar sifatida. Egasi ularni Supabase SQL Editor'da ishga tushiradi — shuning uchun har bir migratsiyadan keyin qaysi faylni ishga tushirish kerakligini aniq ayt.
- Har bir bosqich oxirida: nima qilindi, qanday tekshirish kerak (qadamma-qadam), keyingi bosqichda nima bor.
- Egasi dasturchi emas (vibe coder) — tushuntirishlar sodda va o'zbek tilida bo'lsin.
- Mijozlarning reklama budjeti (tranzit pul) hozircha rejada yo'q.

# Moliya — shaxsiy moliya ilovasi

Loyiha spetsifikatsiyasi: [CLAUDE.md](CLAUDE.md).

## 1-bosqich: nima bor

- Login (faqat kirish, ro'yxatdan o'tish yo'q) — kirmagan foydalanuvchi har qanday sahifadan `/login` ga yo'naltiriladi
- **Hamyonlar**: qo'shish, tahrirlash, arxivlash, balans (tranzaksiya va o'tkazmalardan hisoblanadi)
- **O'tkazma**: hamyonlar orasida, valyuta ayirboshlash bilan (chiqqan va kirgan summa alohida, kurs avtomatik)
- **Kategoriyalar**: daromad/xarajat, guruh (majburiy doimiy / ish uchun / o'zgaruvchan), belgi, arxivlash, bir tugmada standart ro'yxat
- **Tranzaksiyalar**: tezkor forma (summa → kategoriya → hamyon), sana standart bugun, hamyon standart oxirgi ishlatilgani; oy/tur/hamyon/kategoriya bo'yicha filtr; tahrirlash va o'chirish

## 2-bosqich: nima bor

- **Dashboard**: xavfsiz pul, bugungi (kunlik) limit, jami pul (UZS + USD CBU kursida), bu oy daromad/xarajat, ogohlantirishlar
- **CBU kursi**: kuniga bir marta olinadi va bazada saqlanadi; CBU javob bermasa oxirgi saqlangan kurs ishlatiladi ("bugungi kurs olinmadi" belgisi bilan)
- **Tranzaksiya formasi**: USD hamyonda kurs tanlangan sana bo'yicha CBU'dan avtomatik yoziladi (qo'lda o'zgartirish mumkin)
- **Sozlamalar** (dashboard'dagi ⚙️): mavzu (Yorug' / Qorong'i / Tizim), oylik majburiy xarajatlar, chiqish

## 3-bosqich: nima bor

- **Loyihalar** (pastki menyuda): mijoz, summa (so'm yoki $), sanalar; bajarilish foizda yoki birlikda (12 ta video, 5 tasi tayyor → 41,7%); status avtomatik
- Har bir loyiha: olingan / ishlab topilgan / majburiyat / kutilayotgan to'lov, progress chizig'i, bajarilishni tez yangilash, muddati o'tgan bo'lsa qizil belgi
- **Oylik (retainer) loyiha**: "Keyingi oyni ochish" — oldingi davrni yopish ixtiyoriy, bajarilmagan qism haqida ogohlantirish bilan
- **Mijozlar** (Loyihalar → Mijozlar): ro'yxat, izoh, arxivlash
- Tranzaksiyada **Loyiha** maydoni: daromadda doim, xarajatda "Loyihaga bog'lash (qaytarilgan pul)"
- **Dashboard**: xavfsiz pul endi majburiyatlarni ayiradi, "Faol majburiyatlar" kartasi (jami + eng katta 3 ta)
- Pastki menyu: Asosiy · Tranzaksiyalar · Loyihalar · Hamyonlar · Sozlamalar (Kategoriyalar — Sozlamalar ichida); asosiy sahifalarda dumaloq **"+"** tugma

## 4-bosqich: nima bor

- **Maqsadlar** (pastki menyuda): jamg'arma va qarz, ustuvorlik, muddat, ixtiyoriy oylik reja; progress, qolgan, oyiga kerak, real muddat, kech qolsa "oyiga yana X kerak"
- **Jamg'arma**: "+ Ajratish" — pul hamyonda qoladi, xavfsiz puldan ayriladi; "Bo'shatish"; maqsaddan ishlatilgan pul (maqsadga bog'langan xarajat) ajratmani o'zi bo'shatadi
- **Qarz**: "To'lov qilish" — "Qarz to'lovi" xarajati shu maqsadga bog'lanadi; oylik xarajatga kirmaydi, alohida ko'rsatiladi
- **"Favqulodda zaxira" shabloni**: summa = oylik majburiy xarajat × 3
- **Taqsimot tavsiyasi**: majburiy xarajatlar → maqsadlar ustuvorlik bo'yicha → erkin pul
- **Dashboard**: xavfsiz pul jamg'armaga ajratilganni ayiradi, kunlik limit maqsadlar rejasini hisobga oladi, Maqsadlar kartasi; Sozlamalar — tepadagi ⚙️

## 5a: nima bor

- **Budjet** (Tranzaksiyalar → Budjet tabi): kategoriya bo'yicha oylik reja va fakt, qolgan, oshib ketgan (qizil), oy almashtirish, "Oldingi oy rejasini nusxalash"
- Kunlik limit: "Majburiy doimiy" kategoriyalarga budjet qo'yilsa — sozlamadagi summa o'rniga budjet (kategoriya bo'yicha qolgan)
- Dashboard: "N ta kategoriya budjetdan oshib ketdi" eslatmasi, "Budjet →" havolasi
- **PWA**: bosh ekranga o'rnatish (to'liq ekran, ikonka), yuqori panel rangi mavzuga mos, internet bo'lmasa "Internet yo'q" sahifasi, yangi versiyaga avtomatik o'tish; Sozlamalar → "Ilovani o'rnatish"

## 5b: nima bor

- **Hisobotlar** (Asosiy → Hisobotlar tabi): runway, xavfsiz daromad, oyma-oy trend (daromad, xarajat, qarz to'lovlari, sof natija), xarajat kategoriyalari (bu oy / 3 / 6 oy), mijozlar ulushi (6 oy, 50% dan oshsa ogohlantirish)
- **90 kunlik prognoz**: xavfsiz puldan boshlanadi; kutilayotgan loyiha to'lovlari, retainerlar, majburiy va boshqa xarajatlar, maqsad rejalari; "Retainer bilan" / "Retainersiz" chiziqlari, minusga tushish kuni; 30/60/90 kun jadvali
- Retainer loyihada **"Davom etadi"** belgisi (o'chirilsa prognozga keyingi davrlar kirmaydi)
- Dashboard "Sof natija" endi qarz to'lovlarini ham ayiradi
- **Sozlamalar → Ma'lumotlarni yuklab olish**: Excel (barcha ma'lumotlar) va CSV (tranzaksiyalar)

## O'rnatish — qadamma-qadam

### 1. Supabase sozlamalari
1. Supabase loyihasida **Settings → API** (yoki Data API) bo'limida "Automatically expose new tables" **o'chiq**, "automatic RLS" **yoqiq** ekanini tekshiring.
2. **Authentication → Sign In / Providers → Email**: "Allow new users to sign up" ni **o'chiring**.
3. **Authentication → Users → Add user → Create new user**: o'zingizning email va parolingizni kiriting, "Auto Confirm User" belgisini qo'ying.

### 2. SQL migratsiyalar
**SQL Editor** da `supabase/migrations/` papkasidagi fayllarni **shu tartibda**, har birini alohida ishga tushiring:

1. `0001_wallets.sql`
2. `0002_categories.sql`
3. `0003_transactions.sql`
4. `0004_transfers.sql`
5. `0005_wallet_balances.sql`
6. `0006_exchange_rates.sql` — 2-bosqich
7. `0007_settings.sql` — 2-bosqich
8. `0008_dashboard_summary.sql` — 2-bosqich
9. `0009_clients.sql` — 3-bosqich
10. `0010_projects.sql` — 3-bosqich
11. `0011_transactions_project_fk.sql` — 3-bosqich
12. `0012_project_summary.sql` — 3-bosqich
13. `0013_dashboard_summary_v2.sql` — 3-bosqich
14. `0014_project_expected_in_currency.sql` — kutilayotgan to'lov loyiha valyutasida
15. `0015_goals.sql` — 4-bosqich
16. `0016_goal_allocations.sql` — 4-bosqich
17. `0017_transactions_goal_fk.sql` — 4-bosqich
18. `0018_goal_summary.sql` — 4-bosqich
19. `0019_dashboard_summary_v3.sql` — 4-bosqich
20. `0020_budgets.sql` — 5a
21. `0021_budget_report.sql` — 5a
22. `0022_dashboard_summary_v4.sql` — 5a
23. `0023_projects_continues.sql` — 5b
24. `0024_reports.sql` — 5b
25. `0025_forecast.sql` — 5b
26. `0026_project_obligation_fix.sql` — majburiyat formulasi tuzatildi

Har biridan keyin "Success. No rows returned" chiqishi kerak.

### 3. Kalitlar
`.env.example` dan nusxa olib `.env.local` yarating va Supabase → **Project Settings → API** dagi URL va anon (yoki publishable) kalitini qo'ying.

### 4. Ishga tushirish (kompyuterda)
```bash
npm install
npm run dev
```
Brauzerda http://localhost:3000 ni oching.

## Tekshirish

1. http://localhost:3000/wallets ni oching → `/login` ga yo'naltirilishi kerak.
2. Noto'g'ri parol bilan kiring → "Email yoki parol noto'g'ri".
3. To'g'ri parol bilan kiring → bosh sahifa.
4. **Kategoriyalar** → "Standart kategoriyalarni qo'shish".
5. **Hamyonlar** → 3 ta hamyon qo'shing: "Naqd" (UZS, 1 000 000), "Uzcard" (UZS, 2 500 000), "Dollar" (USD, 500).
6. **Tranzaksiyalar** → 150 000 so'm, "Oziq-ovqat", "Naqd" → Qo'shish. Naqd balansi 850 000 bo'lishi kerak.
7. Daromad → 800, "Mijoz to'lovi", "Dollar", kurs 12 650 → Dollar balansi $1,300.
8. Sahifani yangilang → hamyon standart holda "Dollar" tanlangan bo'lishi kerak (oxirgi ishlatilgan).
9. **Hamyonlar → O'tkazma**: Dollar → Naqd, 100 → 1 265 000. Kurs "1 USD = 12 650 so'm" ko'rinadi. Dollar $1,200, Naqd 2 115 000 bo'ladi.
10. Tranzaksiyani bosib summasini o'zgartiring yoki o'chiring → balanslar mos o'zgaradi.
11. Yozuvi bor hamyonni o'chirishga urinib ko'ring → "arxivlang" degan xabar chiqadi.
12. Telefonda ham oching (Vercel'ga joylagandan keyin) va "Chiqish" ni tekshiring.

### 2-bosqichni tekshirish
1. Bosh sahifani oching → "Xavfsiz pul", "Bugungi limit" va "Oylik majburiy xarajatlarni kiriting" eslatmasi ko'rinadi. "Jami pul" kartasi ostida `1 USD = … so'm · CBU, <bugungi sana>` yozuvi bo'ladi — raqamni cbu.uz dagi kurs bilan solishtiring.
2. Qo'lda tekshiring: xavfsiz pul = so'm hamyonlar + dollar hamyonlar × kurs; bugungi limit = xavfsiz pul ÷ oy oxirigacha qolgan kunlar (bugun ham kiradi).
3. ⚙️ → **Sozlamalar** → oylik majburiy xarajatlarni kiriting (masalan ijara + kommunal) → Saqlash. Bosh sahifada limit kamayadi: `(xavfsiz pul − (kiritilgan summa − shu oy "Majburiy doimiy" guruhda to'langani)) ÷ qolgan kunlar`.
4. Juda katta summa kiriting (masalan 100 000 000) → limit 0 bo'ladi va "Oy oxirigacha pul yetmaydi: yana X so'm kerak" chiqadi. Keyin haqiqiy summaga qaytaring.
5. **Tranzaksiyalar** → Dollar hamyonni tanlang → kurs maydoni o'zi to'ladi ("CBU kursi, …"). Sanani o'tgan kunga o'zgartiring → kurs o'sha kunnikiga almashadi.
6. **Mavzu**: Sozlamalar → Qorong'i → butun ilova qorong'i bo'ladi, telefonning yuqori paneli ham. Sahifani yangilang — oq "miltillash" bo'lmasligi kerak. Tizim → telefon sozlamasiga ergashadi (telefonda qorong'i rejimni yoqib/o'chirib ko'ring).

### 3-bosqichni tekshirish
1. **Loyihalar → Mijozlar → Qo'shish**: bitta mijoz yarating.
2. **Loyihalar → Yangi**: $1,000 lik loyiha, bajarilish 40%. So'ng "+" → Daromad → $500, Dollar hamyon, **Loyiha** maydonida shu loyiha → Qo'shish.
   Loyiha kartasida: olingan = 500 × kurs; ishlab topilgan = olingan × 40%; majburiyat = olingan − ishlab topilgan. Masalan kurs 12 600 bo'lsa: 6 300 000 / 2 520 000 / 3 780 000.
3. Ikkinchi loyiha: **Birlikda**, jami 12, tayyor 5 → formada "41,7%" chiqadi. Kartadagi "Bajarilishni yangilash" → "+" → 6/12 · 50%.
4. Qaytarilgan pul: "+" → Xarajat → "+ Loyihaga bog'lash" → loyihani tanlang → olingan to'lov shu summaga kamayadi.
5. "To'liq bajarildi deb yopish" → majburiyat 0 bo'ladi, loyiha "Tugallangan" bo'limiga o'tadi ("Qayta ochish" bilan qaytariladi).
6. Oylik loyiha (✓ Oylik, masalan 1–30 sentabr) → "Keyingi oyni ochish": 1–31 oktabr davri yaratiladi; bajarilish 100% dan kam bo'lsa ogohlantirish chiqadi.
7. Tugash sanasi o'tgan loyiha qizil "Muddati o'tgan" belgisi bilan ko'rinadi.
8. **Asosiy**: xavfsiz pul = jami pul − barcha faol loyihalar majburiyati; "Faol majburiyatlar" kartasida jami va eng katta 3 ta loyiha.
9. To'lovi bor loyihani o'chirishga urinib ko'ring → "yoping" degan xabar chiqadi.

### 4-bosqichni tekshirish
1. ⚙️ Sozlamalar → oylik majburiy xarajat (masalan 2 000 000). **Maqsadlar → Yangi** → "Favqulodda zaxira" shabloni: summa 6 000 000 bo'lib chiqadi → Saqlash.
2. Jamg'arma: "To'y", 20 000 000, muddat 6–7 oy keyin. "+ Ajratish" 2 000 000 → Asosiy'da xavfsiz pul 2 000 000 ga kamayadi, hamyon balansi o'zgarmaydi.
3. "+" → Xarajat → "+ Maqsadga bog'lash" → To'y, 500 000 → maqsadda "Ajratilgan qoldiq" 1 500 000 bo'ladi, "Yig'ilgan" o'zgarmaydi; xavfsiz pul o'zgarmaydi (hamyondan ham, ajratmadan ham 500 000 kamaydi).
4. Maqsad sahifasida "Bo'shatish" 500 000 → yig'ilgan va qoldiq kamayadi, xavfsiz pul oshadi. Qoldiqdan ko'p bo'shatishga urinib ko'ring → xato.
5. Qarz: "Kredit", 12 000 000, allaqachon to'langan 4 000 000, muddat 3 oy keyin → "To'lov qilish" → forma "Qarz to'lovi" va shu maqsad bilan ochiladi → 1 000 000. Asosiy'da "Bu oy → Xarajat" o'zgarmaydi, "Qarz to'lovlari" qatori chiqadi.
6. Muddatga yetmaydigan maqsad qizil "Kech qolmoqda" va "oyiga yana X kerak" bilan ko'rinadi (X = oyiga kerak − oxirgi 3 oydagi o'rtacha).
7. Maqsadlar sahifasidagi "Taqsimot tavsiyasi": xavfsiz pul → majburiy xarajatlar → maqsadlar ustuvorlik bo'yicha → erkin pul; kunlik limit = (xavfsiz pul − majburiy qolgani − maqsadlarga shu oy qolgani) ÷ qolgan kunlar.

### 5a ni tekshirish
1. **Tranzaksiyalar → Budjet**: "Majburiy doimiy" kategoriyalarga (Ijara, Kommunal...) reja qo'ying. Asosiy'da "Majburiy (budjet)" qatori chiqadi, kunlik limit endi budjetdagi qolgan summaga tayanadi.
2. Biror kategoriyada rejadan ko'p xarajat qiling → qator qizil "X so'm oshib ketdi", Asosiy'da "1 ta kategoriya budjetdan oshib ketdi".
3. Keyingi oyga o'ting (›) → "… rejasini nusxalash" → rejalar ko'chadi; qayta bossangiz mavjud rejalar o'zgarmaydi.
4. Telefonda (Vercel manzili): iPhone — Safari → Ulashish → "Bosh ekranga qo'shish"; Android — Chrome menyusi → "Ilovani o'rnatish" (yoki Sozlamalar → "Ilovani o'rnatish"). Ikonkadan ochilganda brauzer panellari bo'lmaydi.
5. Ilova ochiq holda internetni o'chirib, boshqa bo'limga o'ting → "Internet yo'q" sahifasi (raqamlar ko'rinmaydi). Internetni yoqib "Qayta urinish".

### 5b ni tekshirish
1. Asosiy → **Hisobotlar** tabi. Pastki menyuda "Asosiy" faol bo'lib qoladi.
2. Runway va Xavfsiz daromad: ilovada 3 to'liq oydan kam ma'lumot bo'lsa "Ma'lumot yetarli emas" chiqadi — bu normal.
3. Prognoz: tugash sanasi kelajakda bo'lgan, to'liq to'lanmagan loyiha qo'shing → grafikda o'sha kuni balans ko'tariladi. Sanasi yo'q loyiha grafik ostida "prognozga kirmadi" qatorida.
4. Retainer loyiha → "Davom etadi" belgisini o'chiring → Hisobotlarda faqat bitta chiziq qoladi; yoqsangiz ikki chiziq.
5. Balans minusga tushsa grafik ustida qizil yozuv va nuqta: "Balans: sana kuni pul yetmay qoladi".
6. Mijozlar ulushida biror mijoz 50% dan oshsa sariq ogohlantirish.
7. Sozlamalar → "Excel" va "CSV" tugmalari → fayllar yuklanadi, Excel'da 11 ta varaq, o'zbekcha harflar to'g'ri.
8. Qorong'i mavzuda ham grafiklar aniq ko'rinishini tekshiring.

### Ilova yangilanmasa nima qilish kerak
Odatda yangi versiya o'zi o'rnatiladi: ilovani ochganingizda (yoki boshqa ilovadan qaytganingizda) yangilanish tekshiriladi va sahifa bir marta o'zi qayta yuklanadi.
Agar o'zgarish ko'rinmasa:
1. Ilovani to'liq yoping (so'nggi ilovalar ro'yxatidan surib chiqaring) va qayta oching — 1–2 marta.
2. Hali ham eski bo'lsa: **Android** — Chrome → Sozlamalar → Sayt sozlamalari → Barcha saytlar → sayt → "Ma'lumotlarni tozalash"; **iPhone** — Sozlamalar → Safari → Qo'shimcha → Veb-sayt ma'lumotlari → saytni o'chiring. So'ng qayta kiring (login so'raladi).
3. Oxirgi chora: ikonkani bosh ekrandan o'chirib, qayta o'rnating.
Moliyaviy ma'lumotlar telefonda saqlanmaydi — tozalash hech narsani yo'qotmaydi.

## Kodni `main` ga birlashtirish (Pull Request)

1. GitHub'da repo sahifasini oching: `uchkun-azimboev/my-moliya`.
2. Tepada sariq "**claude/youthful-ritchie-rw6lj4** had recent pushes" paneli chiqadi → **Compare & pull request** tugmasini bosing.
   (Chiqmasa: **Pull requests → New pull request**, `base: main`, `compare: claude/youthful-ritchie-rw6lj4`.)
3. Sarlavha yozing (masalan "1-bosqich: skelet, hamyonlar, tranzaksiyalar") → **Create pull request**.
4. **Files changed** bo'limida o'zgarishlarni ko'rib chiqing. `.env.local` yoki biror maxfiy kalit yo'qligiga ishonch hosil qiling.
5. **Merge pull request → Confirm merge** ni bosing.
6. (Ixtiyoriy) **Delete branch** — branch'ni o'chirish.

Vercel repo'ga ulangan bo'lsa, `main` ga birlashtirilgandan keyin sayt avtomatik yangilanadi. Vercel'da **Settings → Environment Variables** ga `.env.local` dagi ikki qiymatni qo'shishni unutmang.

## Tezlik

### JWT kalit turi
Loyiha **ECC (P-256) / ES256** kalitida ishlaydi (Supabase → Project Settings → JWT Keys: ECC — current, Legacy HS256 — previous). Migratsiya kerak emas.

- `getClaims()` JWT'ni serverda mahalliy tekshiradi, Auth serveriga so'rov ketmaydi (ochiq kalit 10 daqiqa keshlanadi).
- Legacy HS256 kalitini **revoke qilmang**: `.env.local` dagi anon kaliti u bilan imzolangan.
- Agar kelajakda ECC kalit o'chirilsa va loyiha HS256 ga qaytsa, har bir sahifa o'tishiga 2 ta qo'shimcha tarmoq so'rovi qo'shiladi (`DEBUG_TIMING` loglarida `GET /auth/v1/user` qatorlari chiqadi).

### Vercel regioni
Vercel funksiyalari Supabase bazasiga yaqin joyda ishlashi kerak. Supabase regionini **Project Settings → General** da ko'ring va Vercel'da **Settings → Functions → Function Region** ni shunga eng yaqin regionga qo'ying (masalan Supabase `eu-central-1` Frankfurt → Vercel `fra1`).

### O'lchash
Vercel'da **Settings → Environment Variables** ga `DEBUG_TIMING=1` qo'shing va qayta deploy qiling. **Logs** bo'limida har bir so'rov vaqti ko'rinadi:
```
[supabase] GET /rest/v1/wallet_balances 84ms
[supabase] GET /auth/v1/user 150ms        ← HS256 bo'lsa shunday qatorlar chiqadi
[auth] getClaims alg=ES256 2ms
```
O'lchab bo'lgach `DEBUG_TIMING` ni o'chirib qo'ying.

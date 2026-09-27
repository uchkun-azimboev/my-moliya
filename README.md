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

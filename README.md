# Moliya — shaxsiy moliya ilovasi

Loyiha spetsifikatsiyasi: [CLAUDE.md](CLAUDE.md).

## 1-bosqich: nima bor

- Login (faqat kirish, ro'yxatdan o'tish yo'q) — kirmagan foydalanuvchi har qanday sahifadan `/login` ga yo'naltiriladi
- **Hamyonlar**: qo'shish, tahrirlash, arxivlash, balans (tranzaksiya va o'tkazmalardan hisoblanadi)
- **O'tkazma**: hamyonlar orasida, valyuta ayirboshlash bilan (chiqqan va kirgan summa alohida, kurs avtomatik)
- **Kategoriyalar**: daromad/xarajat, guruh (majburiy doimiy / ish uchun / o'zgaruvchan), belgi, arxivlash, bir tugmada standart ro'yxat
- **Tranzaksiyalar**: tezkor forma (summa → kategoriya → hamyon), sana standart bugun, hamyon standart oxirgi ishlatilgani; oy/tur/hamyon/kategoriya bo'yicha filtr; tahrirlash va o'chirish

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

### JWT kalit turi (eng katta ta'sir)
Ilova foydalanuvchini `getClaims()` bilan tekshiradi. Uning tezligi Supabase loyihangizdagi JWT kalit turiga bog'liq:

- **ES256 / RS256 (asimmetrik kalit)** — JWT serverda mahalliy tekshiriladi, tarmoq so'rovi yo'q (ochiq kalit 10 daqiqa keshlanadi).
- **HS256 (eski "Legacy JWT secret")** — har bir tekshiruvda Supabase Auth serveriga so'rov ketadi. Har bir sahifa o'tishiga 2 ta qo'shimcha tarmoq so'rovi qo'shiladi.

Tekshirish va o'tkazish: Supabase → **Project Settings → JWT Keys**.
1. "Legacy JWT Secret" hozirgi (current) kalit bo'lsa — loyiha HS256 da.
2. **Migrate JWT secret** → so'ng yangi **ECC (P-256)** kalitni yarating va **Rotate keys** bilan uni asosiy qiling.
3. Eski secret'ni **revoke qilmang** — `.env.local` dagi anon kaliti hali u bilan imzolangan.
   Kod o'zgarishi kerak emas.

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

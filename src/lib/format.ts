import type { Currency } from "./types"

const TZ = "Asia/Tashkent"

/** 1250000 → "1 250 000 so'm", USD → "$1,250" (tiyin/sent bo'lsa ko'rsatiladi) */
export function formatMoney(value: number | string, currency: Currency) {
  const n = Number(value)
  const abs = Math.abs(n)
  const hasCents = Math.round(abs * 100) % 100 !== 0
  const sign = n < 0 ? "−" : ""

  if (currency === "USD") {
    const s = abs.toLocaleString("en-US", {
      minimumFractionDigits: hasCents ? 2 : 0,
      maximumFractionDigits: 2,
    })
    return `${sign}$${s}`
  }

  const [int, frac] = abs.toFixed(hasCents ? 2 : 0).split(".")
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, " ")
  return `${sign}${grouped}${frac ? "," + frac : ""} so'm`
}

/** Toshkent vaqti bo'yicha bugungi sana: "2026-09-27" */
export function today() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date())
}

/** Joriy oy: "2026-09" */
export function currentMonth() {
  return today().slice(0, 7)
}

const MONTHS = [
  "yanvar", "fevral", "mart", "aprel", "may", "iyun",
  "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr",
]

/** "2026-09-27" → "27-sentabr, 2026" */
export function formatDate(date: string) {
  const [y, m, d] = date.split("-").map(Number)
  return `${d}-${MONTHS[m - 1]}, ${y}`
}

/** "2026-09" → "Sentabr 2026" */
export function formatMonth(month: string) {
  const [y, m] = month.split("-").map(Number)
  const name = MONTHS[m - 1]
  return `${name[0].toUpperCase()}${name.slice(1)} ${y}`
}

/** "2026-09" → { from: "2026-09-01", to: "2026-10-01" } */
export function monthRange(month: string) {
  const [y, m] = month.split("-").map(Number)
  const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`
  return { from: `${month}-01`, to: `${next}-01` }
}

/** Oxirgi n oy ro'yxati (joriy oydan boshlab) */
export function recentMonths(n: number) {
  const [y, m] = currentMonth().split("-").map(Number)
  return Array.from({ length: n }, (_, i) => {
    const total = y * 12 + (m - 1) - i
    return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`
  })
}

/** 41.7 → "41,7%", 40 → "40%" */
export function formatPercent(value: number | string) {
  const n = Math.round(Number(value) * 10) / 10
  return `${String(n).replace(".", ",")}%`
}

/** "2026-01-31" + 1 oy → "2026-02-28" (oy oxiri qisqartiriladi) */
export function addMonths(date: string, months: number) {
  const [y, m, d] = date.split("-").map(Number)
  const total = y * 12 + (m - 1) + months
  const ny = Math.floor(total / 12)
  const nm = (total % 12) + 1
  const lastDay = new Date(Date.UTC(ny, nm, 0)).getUTCDate()
  return `${ny}-${String(nm).padStart(2, "0")}-${String(Math.min(d, lastDay)).padStart(2, "0")}`
}

/** "2026-09-01" → "1-sentabr" (yil joriy bo'lsa yozilmaydi) */
export function formatShortDate(date: string) {
  const [y, m, d] = date.split("-").map(Number)
  const current = Number(today().slice(0, 4))
  return `${d}-${MONTHS[m - 1]}${y !== current ? ` ${y}` : ""}`
}

export function addDays(date: string, days: number) {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/**
 * Retainer keyingi davri: yangi boshlanish = oldingi tugashdan keyingi kun,
 * yangi tugash = boshlanish + 1 oy − 1 kun (1–30 sentabr → 1–31 oktabr).
 * Tugash sanasi bo'lmasa — boshlanish 1 oy suriladi.
 */
export function nextPeriod(start: string, end: string | null) {
  if (!end) return { start: addMonths(start, 1), end: null }
  const nextStart = addDays(end, 1)
  return { start: nextStart, end: addDays(addMonths(nextStart, 1), -1) }
}

const SHORT_MONTHS = ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"]

/** "2026-10-01" → "1-okt" (grafik o'qlari uchun) */
export function formatTickDate(date: string) {
  const [, m, d] = date.split("-").map(Number)
  return `${d}-${SHORT_MONTHS[m - 1]}`
}

/** "2026-09-01" → "sen" yoki "sen 25" (yil boshqa bo'lsa) */
export function formatShortMonth(date: string) {
  const [y, m] = date.split("-").map(Number)
  const current = Number(today().slice(0, 4))
  return `${SHORT_MONTHS[m - 1]}${y !== current ? ` ${String(y).slice(2)}` : ""}`
}

/** 12 500 000 → "12,5 mln", 800 000 → "800 ming" (grafik o'qlari uchun qisqa) */
export function formatCompact(value: number) {
  const n = Math.abs(value)
  const sign = value < 0 ? "−" : ""
  const fmt = (v: number) => String(Math.round(v * 10) / 10).replace(".", ",")
  if (n >= 1e9) return `${sign}${fmt(n / 1e9)} mlrd`
  if (n >= 1e6) return `${sign}${fmt(n / 1e6)} mln`
  if (n >= 1e3) return `${sign}${Math.round(n / 1e3)} ming`
  return `${sign}${Math.round(n)}`
}

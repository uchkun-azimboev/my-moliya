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

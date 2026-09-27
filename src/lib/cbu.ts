import type { SupabaseClient } from "@supabase/supabase-js"

// Faqat serverda ishlatiladi. CBU_API_URL — faqat test uchun (standart: cbu.uz).
const CBU_URL = process.env.CBU_API_URL ?? "https://cbu.uz/uz/arkhiv-kursov-valyut/json"

type CbuItem = { Ccy?: string; Rate?: string; Nominal?: string; Date?: string }

/** CBU'dan berilgan sana uchun USD kursi. Javob bo'lmasa yoki 3 soniyada kelmasa — null. */
async function fetchCbuUsdRate(date: string): Promise<number | null> {
  try {
    const res = await fetch(`${CBU_URL}/USD/${date}/`, {
      signal: AbortSignal.timeout(3000),
      cache: "no-store",
    })
    if (!res.ok) return null
    const data = (await res.json()) as CbuItem[]
    const usd = Array.isArray(data) ? data.find((d) => d.Ccy === "USD") : undefined
    const rate = Number(usd?.Rate) / (Number(usd?.Nominal) || 1)
    return Number.isFinite(rate) && rate > 0 ? Math.round(rate * 10000) / 10000 : null
  } catch {
    return null
  }
}

/**
 * Sana uchun kurs bazada bo'lmasa CBU'dan olib saqlaydi (kuniga bir marta).
 * fetched = true — yangi kurs yozildi (dashboard raqamlarini qayta hisoblash kerak).
 */
export async function ensureUsdRate(supabase: SupabaseClient, date: string) {
  const { data } = await supabase.from("exchange_rates").select("usd_to_uzs").eq("date", date).maybeSingle()
  if (data) return { rate: Number(data.usd_to_uzs), fetched: false }

  const rate = await fetchCbuUsdRate(date)
  if (rate === null) return { rate: null, fetched: false }

  await supabase
    .from("exchange_rates")
    .upsert({ date, usd_to_uzs: rate }, { onConflict: "user_id,date", ignoreDuplicates: true })
  return { rate, fetched: true }
}

/** Sana uchun kurs: bazadan yoki CBU'dan; ikkalasi ham bo'lmasa — shu sanagacha oxirgi saqlangani */
export async function getUsdRate(supabase: SupabaseClient, date: string) {
  const ensured = await ensureUsdRate(supabase, date)
  if (ensured.rate !== null) return { rate: ensured.rate, date, stale: false }

  const { data } = await supabase
    .from("exchange_rates")
    .select("date, usd_to_uzs")
    .lte("date", date)
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle()
  return data ? { rate: Number(data.usd_to_uzs), date: data.date as string, stale: true } : null
}

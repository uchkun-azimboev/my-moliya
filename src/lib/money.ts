import { z } from "zod"

/**
 * Foydalanuvchi kiritgan summani tozalaydi: "1 250 000" → "1250000", "12,5" → "12.5".
 * Natija string bo'lib qoladi — bazaga float emas, aniq qiymat yuboriladi.
 */
export function normalizeAmount(raw: unknown) {
  return String(raw ?? "")
    .replace(/[\s ]/g, "")
    .replace(",", ".")
}

/** Musbat summa, ko'pi bilan 2 xonali kasr */
export const amountSchema = z
  .preprocess(normalizeAmount, z.string())
  .refine((s) => /^\d{1,16}(\.\d{1,2})?$/.test(s), "Summani to'g'ri kiriting")
  .refine((s) => Number(s) > 0, "Summa 0 dan katta bo'lishi kerak")

/** Kurs: 1 USD necha so'm */
export const rateSchema = z
  .preprocess(normalizeAmount, z.string())
  .refine((s) => /^\d{1,14}(\.\d{1,4})?$/.test(s) && Number(s) > 0, "Kursni to'g'ri kiriting")

/** Kiritish maydoni uchun: faqat raqam va bitta nuqta, butun qismi bo'sh joy bilan guruhlanadi */
export function formatAmountInput(raw: string, maxDecimals = 2) {
  const cleaned = raw.replace(/[^\d.,]/g, "").replace(",", ".")
  const [int = "", ...rest] = cleaned.split(".")
  const intPart = int.replace(/^0+(?=\d)/, "").replace(/\B(?=(\d{3})+(?!\d))/g, " ")
  if (rest.length === 0) return intPart
  return `${intPart || "0"}.${rest.join("").slice(0, maxDecimals)}`
}

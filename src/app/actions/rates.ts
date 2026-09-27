"use server"

import { z } from "zod"
import { getUsdRate } from "@/lib/cbu"
import { requireUser } from "@/lib/supabase/server"

/** Formalar uchun: tanlangan sanadagi CBU kursi (1 USD = ? so'm) */
export async function getUsdRateForDate(date: string) {
  const parsed = z.iso.date().safeParse(date)
  if (!parsed.success) return null
  const { supabase } = await requireUser()
  return getUsdRate(supabase, parsed.data)
}

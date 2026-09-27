"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { dbErrorMessage, type ActionState } from "@/lib/action-state"
import { normalizeAmount } from "@/lib/money"
import { requireUser } from "@/lib/supabase/server"

const monthSchema = z.string().regex(/^\d{4}-\d{2}$/, "Oy noto'g'ri")

function revalidate() {
  revalidatePath("/", "layout")
}

/** Kategoriya rejasini saqlaydi; bo'sh summa — rejani o'chiradi */
export async function saveBudget(month: string, categoryId: string, raw: string): Promise<ActionState> {
  const m = monthSchema.safeParse(month)
  const c = z.uuid().safeParse(categoryId)
  if (!m.success || !c.success) return { error: "Ma'lumot noto'g'ri" }
  const amount = normalizeAmount(raw)
  if (amount && !/^\d{1,16}(\.\d{1,2})?$/.test(amount)) return { error: "Summani to'g'ri kiriting" }

  const { supabase } = await requireUser()
  const monthDate = `${m.data}-01`
  const { error } = amount
    ? await supabase
        .from("budgets")
        .upsert({ month: monthDate, category_id: c.data, planned_amount: amount }, { onConflict: "user_id,month,category_id" })
    : await supabase.from("budgets").delete().eq("month", monthDate).eq("category_id", c.data)
  if (error) return { error: dbErrorMessage(error) }

  revalidate()
  return { ok: true }
}

/** Oldingi oy rejasini nusxalaydi — faqat shu oyda rejasi yo'q kategoriyalar to'ldiriladi */
export async function copyPreviousMonth(month: string): Promise<ActionState & { copied?: number }> {
  const m = monthSchema.safeParse(month)
  if (!m.success) return { error: "Oy noto'g'ri" }
  const [y, mo] = m.data.split("-").map(Number)
  const prev = mo === 1 ? `${y - 1}-12-01` : `${y}-${String(mo - 1).padStart(2, "0")}-01`
  const monthDate = `${m.data}-01`

  const { supabase } = await requireUser()
  const [{ data: prevRows }, { data: curRows }] = await Promise.all([
    supabase.from("budgets").select("category_id, planned_amount, category:categories!budgets_category_fkey(archived)").eq("month", prev),
    supabase.from("budgets").select("category_id").eq("month", monthDate),
  ])
  const existing = new Set((curRows ?? []).map((r) => r.category_id))
  const rows = ((prevRows ?? []) as unknown as { category_id: string; planned_amount: number; category: { archived: boolean } | null }[])
    .filter((r) => !existing.has(r.category_id) && !r.category?.archived)
    .map((r) => ({ month: monthDate, category_id: r.category_id, planned_amount: r.planned_amount }))
  if (rows.length === 0) return { error: "Oldingi oyda nusxalanadigan reja yo'q" }

  const { error } = await supabase.from("budgets").insert(rows)
  if (error) return { error: dbErrorMessage(error) }
  revalidate()
  return { ok: true, copied: rows.length }
}

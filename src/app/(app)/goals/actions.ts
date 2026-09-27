"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { dbErrorMessage, type ActionState } from "@/lib/action-state"
import { amountSchema, normalizeAmount } from "@/lib/money"
import { requireUser } from "@/lib/supabase/server"
import { DEBT_CATEGORY_NAME } from "@/lib/types"

const emptyToNull = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null)

const goalSchema = z.object({
  name: z.string().trim().min(1, "Nomini kiriting").max(80),
  kind: z.enum(["saving", "debt"]),
  target_amount: amountSchema,
  currency: z.enum(["UZS", "USD"]),
  start_amount: z
    .preprocess((v) => normalizeAmount(v) || "0", z.string())
    .refine((s) => /^\d{1,16}(\.\d{1,2})?$/.test(s), "Boshlang'ich summani to'g'ri kiriting"),
  deadline: z.preprocess(emptyToNull, z.iso.date().nullable()),
  priority: z.coerce.number().int().min(1, "Ustuvorlik 1 dan 99 gacha").max(99, "Ustuvorlik 1 dan 99 gacha"),
  monthly_plan: z.preprocess((v) => normalizeAmount(v) || null, amountSchema.nullable()),
  note: z.preprocess(emptyToNull, z.string().max(300).nullable()),
})

function revalidate() {
  revalidatePath("/", "layout")
}

/** Qarz maqsadi uchun "Qarz to'lovi" xarajat kategoriyasi bo'lmasa — qo'shadi */
async function ensureDebtCategory(supabase: Awaited<ReturnType<typeof requireUser>>["supabase"]) {
  const { data } = await supabase
    .from("categories")
    .select("id, archived")
    .eq("kind", "expense")
    .eq("name", DEBT_CATEGORY_NAME)
    .limit(1)
    .maybeSingle()
  if (!data) {
    await supabase.from("categories").insert({ name: DEBT_CATEGORY_NAME, kind: "expense", group_type: null, icon: "💳" })
  } else if (data.archived) {
    await supabase.from("categories").update({ archived: false }).eq("id", data.id)
  }
}

export async function createGoal(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = goalSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { supabase } = await requireUser()
  const { data, error } = await supabase.from("goals").insert(parsed.data).select("id").single()
  if (error) return { error: dbErrorMessage(error) }
  if (parsed.data.kind === "debt") await ensureDebtCategory(supabase)

  revalidate()
  redirect(`/goals/${data.id}`)
}

export async function updateGoal(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const id = z.uuid().safeParse(formData.get("id"))
  if (!id.success) return { error: "Maqsad topilmadi" }
  // Turi (jamg'arma/qarz) yaratilgandan keyin o'zgarmaydi — ajratmalar va to'lovlar unga bog'liq
  const parsed = goalSchema.omit({ kind: true }).safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { supabase } = await requireUser()
  const { error } = await supabase.from("goals").update(parsed.data).eq("id", id.data)
  if (error) return { error: dbErrorMessage(error) }

  revalidate()
  redirect(`/goals/${id.data}`)
}

/** Jamg'armaga ajratish (release = false) yoki ajratmani bo'shatish (release = true) */
export async function saveAllocation(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = z
    .object({
      goal_id: z.uuid(),
      amount: amountSchema,
      date: z.iso.date("Sanani tanlang"),
      release: z.preprocess((v) => v === "1", z.boolean()),
      note: z.preprocess(emptyToNull, z.string().max(200).nullable()),
    })
    .safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const a = parsed.data

  const { supabase } = await requireUser()
  if (a.release) {
    const { data: g } = await supabase.from("goal_summary").select("reserved_amount").eq("id", a.goal_id).maybeSingle()
    if (!g) return { error: "Maqsad topilmadi" }
    if (Number(a.amount) > Number(g.reserved_amount)) return { error: "Ajratilgan qoldiqdan ko'p bo'shatib bo'lmaydi" }
  }

  const { error } = await supabase.from("goal_allocations").insert({
    goal_id: a.goal_id,
    date: a.date,
    amount: a.release ? `-${a.amount}` : a.amount,
    note: a.note,
  })
  if (error) return { error: dbErrorMessage(error) }

  revalidate()
  return { ok: true }
}

export async function deleteAllocation(id: string) {
  const { supabase } = await requireUser()
  await supabase.from("goal_allocations").delete().eq("id", id)
  revalidate()
}

export async function setGoalClosed(id: string, closed: boolean): Promise<ActionState> {
  const { supabase } = await requireUser()
  const { error } = await supabase.from("goals").update({ closed }).eq("id", id)
  if (error) return { error: dbErrorMessage(error) }
  revalidate()
  return { ok: true }
}

export async function deleteGoal(id: string): Promise<ActionState> {
  const { supabase } = await requireUser()
  const { error } = await supabase.from("goals").delete().eq("id", id)
  if (error) {
    if (error.code === "23503") return { error: "Maqsadga tranzaksiyalar bog'langan — o'chirib bo'lmaydi. Uning o'rniga yoping." }
    return { error: dbErrorMessage(error) }
  }
  revalidate()
  redirect("/goals")
}

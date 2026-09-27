"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { dbErrorMessage, type ActionState } from "@/lib/action-state"
import { normalizeAmount } from "@/lib/money"
import { requireUser } from "@/lib/supabase/server"

const settingsSchema = z.object({
  // Bo'sh qoldirilsa — null (dashboard'da "kiriting" eslatmasi chiqadi)
  monthly_fixed_expenses: z
    .preprocess((v) => normalizeAmount(v) || null, z.string().nullable())
    .refine((s) => s === null || /^\d{1,16}(\.\d{1,2})?$/.test(s), "Summani to'g'ri kiriting"),
})

export async function saveSettings(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { supabase, userId } = await requireUser()
  const { error } = await supabase
    .from("settings")
    .upsert({ user_id: userId, ...parsed.data, updated_at: new Date().toISOString() })
  if (error) return { error: dbErrorMessage(error) }

  revalidatePath("/", "layout")
  return { ok: true }
}

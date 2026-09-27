"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { dbErrorMessage, type ActionState } from "@/lib/action-state"
import { amountSchema, rateSchema } from "@/lib/money"
import { requireUser } from "@/lib/supabase/server"

const transactionSchema = z.object({
  date: z.iso.date("Sanani tanlang"),
  amount: amountSchema,
  category_id: z.uuid("Kategoriyani tanlang"),
  wallet_id: z.uuid("Hamyonni tanlang"),
  rate_to_uzs: z.preprocess((v) => (v === "" ? undefined : v), rateSchema.optional()),
  note: z.string().trim().max(200).optional(),
})

async function buildRow(formData: FormData) {
  const parsed = transactionSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message } as const
  const t = parsed.data

  const { supabase } = await requireUser()
  const { data: wallet } = await supabase
    .from("wallets")
    .select("currency")
    .eq("id", t.wallet_id)
    .maybeSingle()
  if (!wallet) return { error: "Hamyon topilmadi" } as const

  // UZS da kurs doim 1 (bazadagi trigger ham shuni ta'minlaydi); USD da kurs majburiy
  if (wallet.currency === "USD" && !t.rate_to_uzs) return { error: "Dollar kursini kiriting" } as const

  return {
    supabase,
    row: {
      date: t.date,
      amount: t.amount,
      currency: wallet.currency,
      rate_to_uzs: wallet.currency === "UZS" ? "1" : t.rate_to_uzs!,
      wallet_id: t.wallet_id,
      category_id: t.category_id,
      note: t.note || null,
    },
  } as const
}

function revalidate() {
  revalidatePath("/", "layout")
}

export async function createTransaction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const built = await buildRow(formData)
  if ("error" in built) return { error: built.error }

  const { error } = await built.supabase.from("transactions").insert(built.row)
  if (error) return { error: dbErrorMessage(error) }

  revalidate()
  return { ok: true }
}

export async function updateTransaction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const id = z.uuid().safeParse(formData.get("id"))
  if (!id.success) return { error: "Tranzaksiya topilmadi" }
  const built = await buildRow(formData)
  if ("error" in built) return { error: built.error }

  const { error } = await built.supabase.from("transactions").update(built.row).eq("id", id.data)
  if (error) return { error: dbErrorMessage(error) }

  revalidate()
  redirect("/transactions")
}

export async function deleteTransaction(id: string): Promise<ActionState> {
  const { supabase } = await requireUser()
  const { error } = await supabase.from("transactions").delete().eq("id", id)
  if (error) return { error: dbErrorMessage(error) }
  revalidate()
  redirect("/transactions")
}

"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { dbErrorMessage, type ActionState } from "@/lib/action-state"
import { amountSchema, normalizeAmount } from "@/lib/money"
import { requireUser } from "@/lib/supabase/server"

const walletSchema = z.object({
  name: z.string().trim().min(1, "Nomini kiriting").max(60),
  kind: z.enum(["cash", "card"]),
  opening_balance: z
    .preprocess((v) => normalizeAmount(v) || "0", z.string())
    .refine((s) => /^-?\d{1,16}(\.\d{1,2})?$/.test(s), "Boshlang'ich balansni to'g'ri kiriting"),
})

function revalidate() {
  revalidatePath("/", "layout")
}

export async function createWallet(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = walletSchema
    .extend({ currency: z.enum(["UZS", "USD"]) })
    .safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { supabase } = await requireUser()
  const { error } = await supabase.from("wallets").insert(parsed.data)
  if (error) return { error: dbErrorMessage(error) }

  revalidate()
  redirect("/wallets")
}

export async function updateWallet(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const id = z.uuid().safeParse(formData.get("id"))
  const parsed = walletSchema.safeParse(Object.fromEntries(formData))
  if (!id.success) return { error: "Hamyon topilmadi" }
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { supabase } = await requireUser()
  const { error } = await supabase.from("wallets").update(parsed.data).eq("id", id.data)
  if (error) return { error: dbErrorMessage(error) }

  revalidate()
  redirect("/wallets")
}

export async function setWalletArchived(id: string, archived: boolean): Promise<ActionState> {
  const { supabase } = await requireUser()
  const { error } = await supabase.from("wallets").update({ archived }).eq("id", id)
  if (error) return { error: dbErrorMessage(error) }
  revalidate()
  redirect("/wallets")
}

export async function deleteWallet(id: string): Promise<ActionState> {
  const { supabase } = await requireUser()
  const { error } = await supabase.from("wallets").delete().eq("id", id)
  if (error) return { error: dbErrorMessage(error) }
  revalidate()
  redirect("/wallets")
}

const transferSchema = z.object({
  date: z.iso.date("Sanani tanlang"),
  from_wallet_id: z.uuid("Qaysi hamyondan"),
  to_wallet_id: z.uuid("Qaysi hamyonga"),
  from_amount: amountSchema,
  to_amount: z.preprocess((v) => (v === "" ? undefined : v), amountSchema.optional()),
  note: z.string().trim().max(200).optional(),
})

export async function createTransfer(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = transferSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const t = parsed.data
  if (t.from_wallet_id === t.to_wallet_id) return { error: "Ikki xil hamyonni tanlang" }

  const { supabase } = await requireUser()
  const { data: wallets } = await supabase
    .from("wallets")
    .select("id, currency")
    .in("id", [t.from_wallet_id, t.to_wallet_id])
  const from = wallets?.find((w) => w.id === t.from_wallet_id)
  const to = wallets?.find((w) => w.id === t.to_wallet_id)
  if (!from || !to) return { error: "Hamyon topilmadi" }

  // Bir xil valyutada kirgan summa chiqqan summaga teng; har xil valyutada ikkalasi ham kerak
  const toAmount = from.currency === to.currency ? t.from_amount : t.to_amount
  if (!toAmount) return { error: "Qabul qilingan summani kiriting" }

  const { error } = await supabase.from("transfers").insert({
    date: t.date,
    from_wallet_id: t.from_wallet_id,
    to_wallet_id: t.to_wallet_id,
    from_amount: t.from_amount,
    to_amount: toAmount,
    note: t.note || null,
  })
  if (error) return { error: dbErrorMessage(error) }

  revalidate()
  return { ok: true }
}

export async function deleteTransfer(id: string) {
  const { supabase } = await requireUser()
  await supabase.from("transfers").delete().eq("id", id)
  revalidate()
}

"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { dbErrorMessage, type ActionState } from "@/lib/action-state"
import { formatMonth } from "@/lib/format"
import { amountSchema, rateSchema } from "@/lib/money"
import { requireUser } from "@/lib/supabase/server"
import type { Currency } from "@/lib/types"

/** Daromad tanlangan loyiha qoldig'idan (kutilayotgan) oshsa — saqlashdan oldin tanlov so'raladi */
export type OverpayInfo = {
  currency: Currency
  /** loyiha valyutasida */
  remaining: number
  excess: number
  /** shu mijozning keyingi ochiq davri (bo'lmasa null — "Keyingi davrga" tugmasi ko'rinmaydi) */
  nextId: string | null
  nextLabel: string | null
}

export type TransactionActionState = ActionState & { overpay?: OverpayInfo }

const transactionSchema = z.object({
  date: z.iso.date("Sanani tanlang"),
  amount: amountSchema,
  category_id: z.uuid("Kategoriyani tanlang"),
  wallet_id: z.uuid("Hamyonni tanlang"),
  rate_to_uzs: z.preprocess((v) => (v === "" ? undefined : v), rateSchema.optional()),
  project_id: z.preprocess((v) => (v === "" ? null : v), z.uuid().nullable().optional()),
  goal_id: z.preprocess((v) => (v === "" ? null : v), z.uuid().nullable().optional()),
  note: z.string().trim().max(200).optional(),
})

async function buildRow(formData: FormData) {
  const parsed = transactionSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message } as const
  const t = parsed.data

  const { supabase } = await requireUser()
  const [{ data: wallet }, { data: category }] = await Promise.all([
    supabase.from("wallets").select("currency").eq("id", t.wallet_id).maybeSingle(),
    supabase.from("categories").select("kind").eq("id", t.category_id).maybeSingle(),
  ])
  if (!wallet) return { error: "Hamyon topilmadi" } as const
  if (!category) return { error: "Kategoriya topilmadi" } as const
  // Maqsadga faqat xarajat bog'lanadi (qarz to'lovi yoki jamg'armadan ishlatilgan pul)
  if (t.goal_id && category.kind !== "expense") return { error: "Maqsadga faqat xarajat bog'lanadi" } as const

  // UZS da kurs doim 1 (bazadagi trigger ham shuni ta'minlaydi); USD da kurs majburiy
  if (wallet.currency === "USD" && !t.rate_to_uzs) return { error: "Dollar kursini kiriting" } as const

  return {
    supabase,
    kind: category.kind as "income" | "expense",
    row: {
      date: t.date,
      amount: t.amount,
      currency: wallet.currency,
      rate_to_uzs: wallet.currency === "UZS" ? "1" : t.rate_to_uzs!,
      wallet_id: t.wallet_id,
      category_id: t.category_id,
      project_id: t.project_id ?? null,
      goal_id: t.goal_id ?? null,
      note: t.note || null,
    },
  } as const
}

function revalidate() {
  revalidatePath("/", "layout")
}

export async function createTransaction(_prev: TransactionActionState, formData: FormData): Promise<TransactionActionState> {
  const built = await buildRow(formData)
  if ("error" in built) return { error: built.error }
  const { supabase, row } = built

  // Loyihaga daromad: qoldiqdan oshsa — "Bonus" yoki "Keyingi davrga" tanlovi
  const choice = formData.get("overpay")
  if (built.kind === "income" && row.project_id && choice !== "bonus") {
    const { data, error } = await supabase
      .rpc("project_payment_preview", {
        p_project: row.project_id,
        p_wallet: row.wallet_id,
        p_amount: row.amount,
        p_rate: row.rate_to_uzs,
        p_date: row.date,
      })
      .maybeSingle<{ project_currency: Currency; remaining: number; excess: number; next_project_id: string | null; next_name: string | null; next_start: string | null }>()
    if (error) return { error: dbErrorMessage(error) }

    if (choice === "next") {
      if (!data?.next_project_id) return { error: "Keyingi davr topilmadi" }
      const { error: splitError } = await supabase.rpc("split_project_income", {
        p_date: row.date,
        p_amount: row.amount,
        p_rate: row.rate_to_uzs,
        p_wallet: row.wallet_id,
        p_category: row.category_id,
        p_project: row.project_id,
        p_next: data.next_project_id,
        p_note: row.note,
      })
      if (splitError) return { error: dbErrorMessage(splitError) }
      revalidate()
      return { ok: true }
    }

    if (data && Number(data.excess) > 0) {
      return {
        overpay: {
          currency: data.project_currency,
          remaining: Number(data.remaining),
          excess: Number(data.excess),
          nextId: data.next_project_id,
          nextLabel: data.next_project_id ? `${data.next_name} · ${formatMonth(data.next_start!.slice(0, 7))}` : null,
        },
      }
    }
  }

  const { error } = await supabase.from("transactions").insert(row)
  if (error) return { error: dbErrorMessage(error) }

  revalidate()
  return { ok: true }
}

export async function updateTransaction(_prev: TransactionActionState, formData: FormData): Promise<TransactionActionState> {
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

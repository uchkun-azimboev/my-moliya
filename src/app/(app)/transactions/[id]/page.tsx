import { notFound } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { today } from "@/lib/format"
import { requireUser } from "@/lib/supabase/server"
import type { Category, WalletBalance } from "@/lib/types"
import { DeleteTransactionButton, TransactionForm, type EditableTransaction } from "../transaction-form"

export default async function EditTransactionPage({ params }: PageProps<"/transactions/[id]">) {
  const { id } = await params
  const { supabase } = await requireUser()

  const [{ data: tx }, { data: walletData }, { data: categoryData }] = await Promise.all([
    supabase
      .from("transactions")
      .select("id, date, amount, rate_to_uzs, wallet_id, category_id, note")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("wallet_balances")
      .select("id, name, currency, kind, archived, opening_balance, balance")
      .order("created_at"),
    supabase.from("categories").select("id, name, kind, group_type, icon, archived").order("name"),
  ])
  if (!tx) notFound()
  const transaction = tx as EditableTransaction

  // Arxivlanganlar ko'rinmaydi, lekin shu yozuvniki bo'lsa qoladi
  const wallets = ((walletData ?? []) as WalletBalance[]).filter(
    (w) => !w.archived || w.id === transaction.wallet_id
  )
  const categories = ((categoryData ?? []) as Category[]).filter(
    (c) => !c.archived || c.id === transaction.category_id
  )

  return (
    <>
      <PageHeader title="Tahrirlash" back="/transactions" />
      <TransactionForm categories={categories} wallets={wallets} today={today()} transaction={transaction} />
      <DeleteTransactionButton id={transaction.id} />
    </>
  )
}

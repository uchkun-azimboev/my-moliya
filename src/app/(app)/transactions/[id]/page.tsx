import { notFound } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { today } from "@/lib/format"
import { createClient, requireUser } from "@/lib/supabase/server"
import type { Category, WalletBalance } from "@/lib/types"
import { DeleteTransactionButton, TransactionForm, type EditableTransaction, type GoalOption, type ProjectOption } from "../transaction-form"

export default async function EditTransactionPage({ params }: PageProps<"/transactions/[id]">) {
  const { id } = await params
  const supabase = await createClient()

  const [, { data: tx }, { data: walletData }, { data: categoryData }, { data: projectData }, { data: goalData }] = await Promise.all([
    requireUser(),
    supabase
      .from("transactions")
      .select("id, date, amount, rate_to_uzs, wallet_id, category_id, project_id, goal_id, note")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("wallet_balances")
      .select("id, name, currency, kind, archived, opening_balance, balance")
      .order("created_at"),
    supabase.from("categories").select("id, name, kind, group_type, icon, archived").order("name"),
    supabase.from("project_summary").select("id, name, client_name, status").order("client_name"),
    supabase.from("goal_summary").select("id, name, kind, status").order("priority"),
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

  // Faol loyihalar + shu yozuvga bog'langan loyiha (tugallangan bo'lsa ham)
  const projects = ((projectData ?? []) as (ProjectOption & { status: string })[]).filter(
    (p) => p.status !== "done" || p.id === transaction.project_id
  )

  const goals = ((goalData ?? []) as (GoalOption & { status: string })[]).filter(
    (g) => g.status === "active" || g.id === transaction.goal_id
  )

  return (
    <>
      <PageHeader title="Tahrirlash" back="/transactions" />
      <TransactionForm categories={categories} wallets={wallets} today={today()} transaction={transaction} projects={projects} goals={goals} />
      <DeleteTransactionButton id={transaction.id} />
    </>
  )
}

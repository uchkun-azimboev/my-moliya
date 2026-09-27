import { PageHeader } from "@/components/page-header"
import { getUsdRate } from "@/lib/cbu"
import { today } from "@/lib/format"
import { createClient, requireUser } from "@/lib/supabase/server"
import type { Category, WalletBalance } from "@/lib/types"
import { TransactionForm, type GoalOption, type ProjectOption } from "../transaction-form"

/** Tezkor kiritish ("+" tugmasi shu yerga olib keladi) */
export default async function NewTransactionPage({ searchParams }: PageProps<"/transactions/new">) {
  const supabase = await createClient()
  const [, sp, { data: walletData }, { data: categoryData }, { data: lastTx }, cbuRate, { data: projectData }, { data: goalData }] =
    await Promise.all([
      requireUser(),
      searchParams,
      supabase
        .from("wallet_balances")
        .select("id, name, currency, kind, archived, opening_balance, balance")
        .eq("archived", false)
        .order("created_at"),
      supabase.from("categories").select("id, name, kind, group_type, icon, archived").eq("archived", false).order("name"),
      supabase.from("transactions").select("wallet_id").order("created_at", { ascending: false }).limit(1).maybeSingle(),
      getUsdRate(supabase, today()),
      supabase.from("project_summary").select("id, name, client_name").neq("status", "done").order("client_name"),
      supabase.from("goal_summary").select("id, name, kind").eq("status", "active").order("priority"),
    ])

  const projects = (projectData ?? []) as ProjectOption[]
  const requested = typeof sp.project === "string" ? sp.project : undefined
  const defaultProjectId = projects.some((p) => p.id === requested) ? requested : undefined
  const goals = (goalData ?? []) as GoalOption[]
  const requestedGoal = typeof sp.goal === "string" ? sp.goal : undefined
  const defaultGoalId = goals.some((g) => g.id === requestedGoal) ? requestedGoal : undefined
  const back = defaultGoalId ? `/goals/${defaultGoalId}` : defaultProjectId ? `/projects/${defaultProjectId}` : "/transactions"

  return (
    <>
      <PageHeader title="Yangi tranzaksiya" back={back} />
      <TransactionForm
        categories={(categoryData ?? []) as Category[]}
        wallets={(walletData ?? []) as WalletBalance[]}
        today={today()}
        defaultWalletId={lastTx?.wallet_id}
        cbuRate={cbuRate}
        projects={projects}
        defaultProjectId={defaultProjectId}
        goals={goals}
        defaultGoalId={defaultGoalId}
      />
    </>
  )
}

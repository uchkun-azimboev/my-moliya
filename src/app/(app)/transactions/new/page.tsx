import { PageHeader } from "@/components/page-header"
import { getUsdRate } from "@/lib/cbu"
import { today } from "@/lib/format"
import { createClient, requireUser } from "@/lib/supabase/server"
import { PROJECT_OPTION_COLUMNS, type Category, type ProjectOption, type WalletBalance } from "@/lib/types"
import { TransactionForm, type GoalOption } from "../transaction-form"

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
      // Faol loyihalar + to'lanmagan qoldig'i bor tugallanganlar
      supabase.from("project_summary").select(PROJECT_OPTION_COLUMNS).or("status.neq.done,expected_amount.gt.0").order("client_name").order("start_date"),
      supabase.from("goal_summary").select("id, name, kind").eq("status", "active").order("priority"),
    ])

  const projects = (projectData ?? []) as unknown as ProjectOption[]
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

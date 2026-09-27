import { PageHeader } from "@/components/page-header"
import { createClient, requireUser } from "@/lib/supabase/server"
import { GoalForm } from "../goal-form"

export default async function NewGoalPage({ searchParams }: PageProps<"/goals/new">) {
  const supabase = await createClient()
  const [, sp, { data }] = await Promise.all([
    requireUser(),
    searchParams,
    // majburiy oylik reja: joriy oy budjetidan, bo'lmasa sozlamadan (dashboard_summary shuni qaytaradi)
    supabase.rpc("dashboard_summary").single<{ monthly_fixed_expenses: number | null }>(),
  ])
  const fixed = data?.monthly_fixed_expenses ? Number(data.monthly_fixed_expenses) : null

  return (
    <>
      <PageHeader title="Yangi maqsad" back="/goals" />
      <GoalForm monthlyFixed={fixed} template={sp.template === "reserve" ? "reserve" : undefined} />
    </>
  )
}

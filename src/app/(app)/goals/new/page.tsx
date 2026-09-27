import { PageHeader } from "@/components/page-header"
import { createClient, requireUser } from "@/lib/supabase/server"
import { GoalForm } from "../goal-form"

export default async function NewGoalPage({ searchParams }: PageProps<"/goals/new">) {
  const supabase = await createClient()
  const [, sp, { data }] = await Promise.all([
    requireUser(),
    searchParams,
    supabase.from("settings").select("monthly_fixed_expenses").maybeSingle(),
  ])
  const fixed = data?.monthly_fixed_expenses ? Number(data.monthly_fixed_expenses) : null

  return (
    <>
      <PageHeader title="Yangi maqsad" back="/goals" />
      <GoalForm monthlyFixed={fixed} template={sp.template === "reserve" ? "reserve" : undefined} />
    </>
  )
}

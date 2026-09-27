import { notFound } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { createClient, requireUser } from "@/lib/supabase/server"
import { GOAL_SUMMARY_COLUMNS, type GoalSummary } from "@/lib/types"
import { GoalForm } from "../../goal-form"

export default async function EditGoalPage({ params }: PageProps<"/goals/[id]/edit">) {
  const { id } = await params
  const supabase = await createClient()
  const [, { data }] = await Promise.all([
    requireUser(),
    supabase.from("goal_summary").select(GOAL_SUMMARY_COLUMNS).eq("id", id).maybeSingle(),
  ])
  if (!data) notFound()

  return (
    <>
      <PageHeader title="Maqsadni tahrirlash" back={`/goals/${id}`} />
      <GoalForm goal={data as unknown as GoalSummary} monthlyFixed={null} />
    </>
  )
}

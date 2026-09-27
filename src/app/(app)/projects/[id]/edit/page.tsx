import { notFound } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { today } from "@/lib/format"
import { createClient, requireUser } from "@/lib/supabase/server"
import { PROJECT_SUMMARY_COLUMNS, type Client, type ProjectSummary } from "@/lib/types"
import { ProjectForm } from "../../project-form"

export default async function EditProjectPage({ params }: PageProps<"/projects/[id]/edit">) {
  const { id } = await params
  const supabase = await createClient()
  const [, { data: project }, { data: clients }] = await Promise.all([
    requireUser(),
    supabase.from("project_summary").select(PROJECT_SUMMARY_COLUMNS).eq("id", id).maybeSingle(),
    supabase.from("clients").select("id, name, note, archived").order("name"),
  ])
  if (!project) notFound()
  const p = project as unknown as ProjectSummary
  // Arxivlangan mijoz ko'rinmaydi, lekin shu loyihaniki bo'lsa qoladi
  const list = ((clients ?? []) as Client[]).filter((c) => !c.archived || c.id === p.client_id)

  return (
    <>
      <PageHeader title="Loyihani tahrirlash" back={`/projects/${id}`} />
      <ProjectForm clients={list} today={today()} project={p} />
    </>
  )
}

import { PageHeader } from "@/components/page-header"
import { today } from "@/lib/format"
import { createClient, requireUser } from "@/lib/supabase/server"
import type { Client } from "@/lib/types"
import { ProjectForm } from "../project-form"

export default async function NewProjectPage() {
  const supabase = await createClient()
  const [, { data }] = await Promise.all([
    requireUser(),
    supabase.from("clients").select("id, name, note, archived").eq("archived", false).order("name"),
  ])

  return (
    <>
      <PageHeader title="Yangi loyiha" back="/projects" />
      <ProjectForm clients={(data ?? []) as Client[]} today={today()} />
    </>
  )
}

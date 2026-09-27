import { notFound } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { createClient, requireUser } from "@/lib/supabase/server"
import type { Client } from "@/lib/types"
import { ClientForm } from "../client-form"

export default async function EditClientPage({ params }: PageProps<"/clients/[id]">) {
  const { id } = await params
  const supabase = await createClient()
  const [, { data }] = await Promise.all([
    requireUser(),
    supabase.from("clients").select("id, name, note, archived").eq("id", id).maybeSingle(),
  ])
  if (!data) notFound()

  return (
    <>
      <PageHeader title="Mijoz" back="/clients" />
      <ClientForm client={data as Client} />
    </>
  )
}

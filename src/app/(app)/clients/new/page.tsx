import { PageHeader } from "@/components/page-header"
import { requireUser } from "@/lib/supabase/server"
import { ClientForm } from "../client-form"

export default async function NewClientPage({ searchParams }: PageProps<"/clients/new">) {
  const [, sp] = await Promise.all([requireUser(), searchParams])
  const back = sp.back === "/projects/new" ? "/projects/new" : undefined

  return (
    <>
      <PageHeader title="Yangi mijoz" back={back ?? "/clients"} />
      <ClientForm back={back} />
    </>
  )
}

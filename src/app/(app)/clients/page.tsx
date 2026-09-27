import Link from "next/link"
import { Plus } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { formatMoney } from "@/lib/format"
import { createClient, requireUser } from "@/lib/supabase/server"
import type { Client } from "@/lib/types"

export default async function ClientsPage() {
  const supabase = await createClient()
  const [, { data }, { data: projects }] = await Promise.all([
    requireUser(),
    supabase.from("clients").select("id, name, note, archived").order("name"),
    supabase.from("project_summary").select("client_id, status, obligation_uzs"),
  ])
  const clients = (data ?? []) as Client[]
  const stats = new Map<string, { active: number; obligation: number }>()
  for (const p of projects ?? []) {
    const s = stats.get(p.client_id) ?? { active: 0, obligation: 0 }
    if (p.status !== "done") s.active += 1
    s.obligation += Number(p.obligation_uzs)
    stats.set(p.client_id, s)
  }
  const active = clients.filter((c) => !c.archived)
  const archived = clients.filter((c) => c.archived)

  return (
    <>
      <PageHeader
        title="Mijozlar"
        back="/projects"
        action={
          <Button asChild size="sm" variant="outline">
            <Link href="/clients/new">
              <Plus /> Qo&apos;shish
            </Link>
          </Button>
        }
      />
      {clients.length === 0 && (
        <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          Hali mijoz yo&apos;q. Birinchi mijozingizni qo&apos;shing.
        </div>
      )}
      <ClientList clients={active} stats={stats} />
      {archived.length > 0 && (
        <details className="mt-6">
          <summary className="cursor-pointer text-sm text-muted-foreground">Arxivlangan ({archived.length})</summary>
          <div className="mt-3 opacity-70">
            <ClientList clients={archived} stats={stats} />
          </div>
        </details>
      )}
    </>
  )
}

function ClientList({ clients, stats }: { clients: Client[]; stats: Map<string, { active: number; obligation: number }> }) {
  if (clients.length === 0) return null
  return (
    <ul className="divide-y overflow-hidden rounded-xl border bg-card">
      {clients.map((c) => {
        const s = stats.get(c.id)
        return (
          <li key={c.id}>
            <Link href={`/clients/${c.id}`} prefetch={false} className="flex items-center gap-3 px-4 py-3 active:bg-accent">
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{c.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {s?.active ? `${s.active} ta faol loyiha` : "Faol loyiha yo'q"}
                  {c.note && ` · ${c.note}`}
                </span>
              </span>
              {s && s.obligation > 0 && (
                <span className="text-sm tabular-nums text-muted-foreground">{formatMoney(s.obligation, "UZS")}</span>
              )}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

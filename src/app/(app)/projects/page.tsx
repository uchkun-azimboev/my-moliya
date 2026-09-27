import Link from "next/link"
import { Plus, Users } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { formatMoney } from "@/lib/format"
import { createClient, requireUser } from "@/lib/supabase/server"
import { PROJECT_SUMMARY_COLUMNS, type ProjectSummary } from "@/lib/types"
import { cn } from "@/lib/utils"
import { ProjectCard } from "./project-card"

export default async function ProjectsPage({ searchParams }: PageProps<"/projects">) {
  const supabase = await createClient()
  const [, sp, { data }] = await Promise.all([
    requireUser(),
    searchParams,
    supabase.from("project_summary").select(PROJECT_SUMMARY_COLUMNS).order("start_date", { ascending: false }),
  ])
  const all = (data ?? []) as unknown as ProjectSummary[]
  const showDone = sp.tab === "done"

  // Faollar: avval muddati o'tganlar, keyin tugash sanasi yaqinlari
  const active = all
    .filter((p) => p.status !== "done")
    .sort((a, b) => Number(b.overdue) - Number(a.overdue) || (a.end_date ?? "9999").localeCompare(b.end_date ?? "9999"))
  const done = all.filter((p) => p.status === "done")
  const list = showDone ? done : active

  const obligation = active.reduce((s, p) => s + Number(p.obligation_uzs), 0)
  const expected = active.reduce((s, p) => s + Number(p.expected_uzs ?? 0), 0)

  return (
    <>
      <PageHeader
        title="Loyihalar"
        action={
          <div className="flex gap-2">
            <Button asChild size="sm" variant="ghost">
              <Link href="/clients">
                <Users /> Mijozlar
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/projects/new">
                <Plus /> Yangi
              </Link>
            </Button>
          </div>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border bg-card p-3">
          <p className="text-xs text-muted-foreground">Majburiyat</p>
          <p className="mt-1 font-semibold tabular-nums">{formatMoney(obligation, "UZS")}</p>
        </div>
        <div className="rounded-xl border bg-card p-3">
          <p className="text-xs text-muted-foreground">Kutilayotgan to&apos;lov</p>
          <p className="mt-1 font-semibold tabular-nums">{formatMoney(expected, "UZS")}</p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
        {[
          { href: "/projects", label: `Faol (${active.length})`, on: !showDone },
          { href: "/projects?tab=done", label: `Tugallangan (${done.length})`, on: showDone },
        ].map((t) => (
          <Link
            key={t.href}
            href={t.href}
            replace
            className={cn(
              "flex h-9 items-center justify-center rounded-md text-sm font-medium",
              t.on ? "bg-background shadow-sm" : "text-muted-foreground"
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {all.length === 0 ? (
        <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          Hali loyiha yo&apos;q. Avval{" "}
          <Link href="/clients/new" className="underline">
            mijoz
          </Link>
          , keyin{" "}
          <Link href="/projects/new" className="underline">
            loyiha
          </Link>{" "}
          qo&apos;shing.
        </div>
      ) : list.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {showDone ? "Tugallangan loyiha yo'q." : "Faol loyiha yo'q."}
        </p>
      ) : (
        <div className="space-y-3">
          {list.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </>
  )
}

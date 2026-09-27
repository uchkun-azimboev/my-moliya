import Link from "next/link"
import { Plus } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { formatMoney, today } from "@/lib/format"
import { createClient, requireUser } from "@/lib/supabase/server"
import { GOAL_SUMMARY_COLUMNS, type GoalSummary } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Distribution } from "./distribution"
import { GoalCard } from "./goal-card"

export default async function GoalsPage({ searchParams }: PageProps<"/goals">) {
  const supabase = await createClient()
  const [, sp, { data }, { data: summary }] = await Promise.all([
    requireUser(),
    searchParams,
    supabase.from("goal_summary").select(GOAL_SUMMARY_COLUMNS).order("priority").order("created_at"),
    supabase.rpc("dashboard_summary").single<{ safe_uzs: number; fixed_remaining_uzs: number }>(),
  ])
  const all = (data ?? []) as unknown as GoalSummary[]
  const showDone = sp.tab === "done"
  const active = all.filter((g) => g.status === "active")
  const finished = all.filter((g) => g.status !== "active")
  const list = showDone ? finished : active

  const reserved = all.reduce((s, g) => s + Number(g.reserved_uzs), 0)
  const monthLeft = active.reduce((s, g) => s + Number(g.month_left_uzs), 0)

  return (
    <>
      <PageHeader
        title="Maqsadlar"
        action={
          <Button asChild size="sm" variant="outline">
            <Link href="/goals/new">
              <Plus /> Yangi
            </Link>
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border bg-card p-3">
          <p className="text-xs text-muted-foreground">Jamg&apos;armaga ajratilgan</p>
          <p className="mt-1 font-semibold tabular-nums">{formatMoney(reserved, "UZS")}</p>
        </div>
        <div className="rounded-xl border bg-card p-3">
          <p className="text-xs text-muted-foreground">Bu oy rejada qolgan</p>
          <p className="mt-1 font-semibold tabular-nums">{formatMoney(monthLeft, "UZS")}</p>
        </div>
      </div>

      {summary && active.length > 0 && (
        <div className="mb-4">
          <Distribution safe={Number(summary.safe_uzs)} fixedRemaining={Number(summary.fixed_remaining_uzs)} goals={active} />
        </div>
      )}

      <div className="mb-4 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
        {[
          { href: "/goals", label: `Faol (${active.length})`, on: !showDone },
          { href: "/goals?tab=done", label: `Tugallangan (${finished.length})`, on: showDone },
        ].map((t) => (
          <Link
            key={t.href}
            href={t.href}
            replace
            className={cn("flex h-9 items-center justify-center rounded-md text-sm font-medium", t.on ? "bg-background shadow-sm" : "text-muted-foreground")}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {all.length === 0 ? (
        <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          Hali maqsad yo&apos;q. Boshlash uchun{" "}
          <Link href="/goals/new?template=reserve" className="underline">
            favqulodda zaxira
          </Link>{" "}
          yoki{" "}
          <Link href="/goals/new" className="underline">
            boshqa maqsad
          </Link>{" "}
          qo&apos;shing.
        </div>
      ) : list.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">{showDone ? "Tugallangan maqsad yo'q." : "Faol maqsad yo'q."}</p>
      ) : (
        <div className="space-y-3">
          {list.map((g) => (
            <GoalCard key={g.id} goal={g} today={today()} />
          ))}
        </div>
      )}
    </>
  )
}

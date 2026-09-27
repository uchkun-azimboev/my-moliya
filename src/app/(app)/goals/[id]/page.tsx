import Link from "next/link"
import { notFound } from "next/navigation"
import { Pencil } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { formatDate, formatMoney, today } from "@/lib/format"
import { createClient, requireUser } from "@/lib/supabase/server"
import { GOAL_SUMMARY_COLUMNS, type Currency, type GoalSummary } from "@/lib/types"
import { cn } from "@/lib/utils"
import { AllocationForm } from "../allocation-form"
import { GoalBadges, GoalFacts, GoalQuickAction } from "../goal-card"
import { DeleteAllocationButton, GoalActions } from "./goal-actions"

type HistoryRow = {
  id: string
  date: string
  kind: "allocation" | "transaction"
  amount: number
  currency: Currency
  label: string
  sub?: string
  created: string
}

export default async function GoalPage({ params }: PageProps<"/goals/[id]">) {
  const { id } = await params
  const supabase = await createClient()
  const [, { data }, { data: allocs }, { data: txs }] = await Promise.all([
    requireUser(),
    supabase.from("goal_summary").select(GOAL_SUMMARY_COLUMNS).eq("id", id).maybeSingle(),
    supabase.from("goal_allocations").select("id, date, amount, note, created_at").eq("goal_id", id),
    supabase
      .from("transactions")
      .select("id, date, amount, currency, note, created_at, wallet:wallets!transactions_wallet_fkey(name), category:categories!transactions_category_fkey(name)")
      .eq("goal_id", id),
  ])
  if (!data) notFound()
  const g = data as unknown as GoalSummary

  // Ajratmalar va bog'langan xarajatlar bitta tarixda, yangisi tepada
  const history: HistoryRow[] = [
    ...(allocs ?? []).map((a) => ({
      id: a.id,
      date: a.date,
      kind: "allocation" as const,
      amount: Number(a.amount),
      currency: g.currency,
      label: Number(a.amount) > 0 ? "Ajratildi" : "Bo'shatildi",
      sub: a.note ?? undefined,
      created: a.created_at,
    })),
    ...((txs ?? []) as unknown as {
      id: string
      date: string
      amount: number
      currency: Currency
      note: string | null
      created_at: string
      wallet: { name: string } | null
      category: { name: string } | null
    }[]).map((t) => ({
      id: t.id,
      date: t.date,
      kind: "transaction" as const,
      amount: Number(t.amount),
      currency: t.currency,
      label: g.kind === "debt" ? "To'lov" : `Ishlatildi · ${t.category?.name ?? ""}`,
      sub: [t.wallet?.name, t.note].filter(Boolean).join(" · "),
      created: t.created_at,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date) || b.created.localeCompare(a.created))

  return (
    <>
      <PageHeader
        title={g.name}
        back="/goals"
        action={
          <Button asChild size="icon" variant="ghost" aria-label="Tahrirlash">
            <Link href={`/goals/${id}/edit`}>
              <Pencil className="size-4" />
            </Link>
          </Button>
        }
      />

      <section className="mb-4 rounded-xl border bg-card p-4">
        <div className="mb-3">
          <GoalBadges goal={g} />
        </div>
        <GoalFacts goal={g} />
        {g.status === "active" && (
          <div className="mt-4 border-t pt-4">
            {g.kind === "saving" ? <AllocationForm goal={g} today={today()} allowRelease /> : <GoalQuickAction goal={g} today={today()} />}
          </div>
        )}
        {g.note && <p className="mt-4 border-t pt-3 text-sm text-muted-foreground">{g.note}</p>}
      </section>

      <h2 className="mb-2 text-sm font-medium text-muted-foreground">
        {g.kind === "saving" ? "Ajratmalar va ishlatilgan pul" : "To'lovlar"} ({history.length})
      </h2>
      {history.length === 0 ? (
        <p className="mb-6 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
          {g.kind === "saving"
            ? "Hali ajratma yo'q. \"+ Ajratish\" bilan pulni shu maqsadga band qiling — pul hamyonda qoladi."
            : "Hali to'lov yo'q. \"To'lov qilish\" — Qarz to'lovi xarajatini shu maqsadga bog'lab kiritadi."}
        </p>
      ) : (
        <ul className="mb-6 divide-y overflow-hidden rounded-xl border bg-card">
          {history.map((h) => {
            const positive = h.kind === "allocation" ? h.amount > 0 : g.kind === "debt"
            const row = (
              <>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{h.label}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {formatDate(h.date)}
                    {h.sub && ` · ${h.sub}`}
                  </span>
                </span>
                <span className={cn("text-sm font-semibold tabular-nums", positive ? "text-income" : "text-expense")}>
                  {h.kind === "allocation" ? (h.amount > 0 ? "+" : "−") : g.kind === "debt" ? "" : "−"}
                  {formatMoney(Math.abs(h.amount), h.currency)}
                </span>
              </>
            )
            return (
              <li key={`${h.kind}-${h.id}`}>
                {h.kind === "transaction" ? (
                  <Link href={`/transactions/${h.id}`} prefetch={false} className="flex items-center gap-3 px-4 py-3 active:bg-accent">
                    {row}
                  </Link>
                ) : (
                  <div className="flex items-center gap-3 py-3 pr-2 pl-4">
                    {row}
                    <DeleteAllocationButton id={h.id} />
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <GoalActions goal={g} hasTransactions={(txs ?? []).length > 0} />
    </>
  )
}

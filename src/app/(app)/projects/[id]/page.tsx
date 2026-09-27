import Link from "next/link"
import { notFound } from "next/navigation"
import { Pencil, Plus } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { formatDate, formatMoney } from "@/lib/format"
import { createClient, requireUser } from "@/lib/supabase/server"
import { PROJECT_SUMMARY_COLUMNS, type CategoryKind, type Currency, type ProjectSummary } from "@/lib/types"
import { cn } from "@/lib/utils"
import { MoneyGrid, ProgressBar, StatusBadge, periodText, progressText } from "../project-card"
import { ProgressQuickUpdate } from "../progress-quick-update"
import { ProjectActions } from "./project-actions"

type Payment = {
  id: string
  date: string
  amount: number
  currency: Currency
  rate_to_uzs: number
  note: string | null
  wallet: { name: string } | null
  category: { name: string; kind: CategoryKind; icon: string | null } | null
}

export default async function ProjectPage({ params }: PageProps<"/projects/[id]">) {
  const { id } = await params
  const supabase = await createClient()
  const [, { data }, { data: paymentData }, { data: next }] = await Promise.all([
    requireUser(),
    supabase.from("project_summary").select(PROJECT_SUMMARY_COLUMNS).eq("id", id).maybeSingle(),
    supabase
      .from("transactions")
      .select(
        "id, date, amount, currency, rate_to_uzs, note, wallet:wallets!transactions_wallet_fkey(name), category:categories!transactions_category_fkey(name, kind, icon)"
      )
      .eq("project_id", id)
      .order("date", { ascending: false }),
    supabase.from("projects").select("id").eq("previous_project_id", id).limit(1).maybeSingle(),
  ])
  if (!data) notFound()
  const p = data as unknown as ProjectSummary
  const payments = (paymentData ?? []) as unknown as Payment[]

  return (
    <>
      <PageHeader
        title={p.name}
        back="/projects"
        action={
          <Button asChild size="icon" variant="ghost" aria-label="Tahrirlash">
            <Link href={`/projects/${id}/edit`}>
              <Pencil className="size-4" />
            </Link>
          </Button>
        }
      />

      <section className="mb-4 rounded-xl border bg-card p-4">
        <p className="text-sm text-muted-foreground">{p.client_name}</p>
        <p className={cn("text-xs", p.overdue ? "text-destructive" : "text-muted-foreground")}>{periodText(p)}</p>
        <div className="mt-2">
          <StatusBadge project={p} />
        </div>
        <div className="mt-4 mb-1.5 flex items-baseline justify-between text-xs">
          <span className="text-muted-foreground">Bajarilish</span>
          <span className="font-medium tabular-nums">{progressText(p)}</span>
        </div>
        <ProgressBar project={p} />
        <div className="mt-4">
          <MoneyGrid project={p} />
        </div>
        {p.status !== "done" && (
          <div className="mt-4 border-t pt-4">
            <ProgressQuickUpdate project={p} />
          </div>
        )}
        {p.note && <p className="mt-4 border-t pt-3 text-sm text-muted-foreground">{p.note}</p>}
      </section>

      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">To&apos;lovlar ({payments.length})</h2>
        <Button asChild size="sm" variant="ghost">
          <Link href={`/transactions/new?project=${id}`}>
            <Plus /> To&apos;lov qo&apos;shish
          </Link>
        </Button>
      </div>
      {payments.length === 0 ? (
        <p className="mb-6 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
          Hali to&apos;lov bog&apos;lanmagan. Daromad kiritishda &quot;Loyiha&quot; maydonidan shu loyihani tanlang.
        </p>
      ) : (
        <ul className="mb-6 divide-y overflow-hidden rounded-xl border bg-card">
          {payments.map((t) => {
            const income = t.category?.kind === "income"
            return (
              <li key={t.id}>
                <Link href={`/transactions/${t.id}`} prefetch={false} className="flex items-center gap-3 px-4 py-3 active:bg-accent">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {t.category?.icon && `${t.category.icon} `}
                      {t.category?.name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {formatDate(t.date)} · {t.wallet?.name}
                      {t.currency === "USD" && ` · kurs ${formatMoney(t.rate_to_uzs, "UZS")}`}
                    </span>
                  </span>
                  <span className={cn("text-right text-sm font-semibold tabular-nums", income ? "text-income" : "text-expense")}>
                    {income ? "+" : "−"}
                    {formatMoney(t.amount, t.currency)}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}

      <ProjectActions project={p} nextPeriodId={next?.id ?? null} />
    </>
  )
}

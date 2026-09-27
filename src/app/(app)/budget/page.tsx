import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { TransactionTabs } from "@/components/transaction-tabs"
import { currentMonth, formatMoney, formatMonth } from "@/lib/format"
import { createClient, requireUser } from "@/lib/supabase/server"
import { CATEGORY_GROUP_LABEL, type CategoryGroup } from "@/lib/types"
import { cn } from "@/lib/utils"
import { AddBudgetRow, BudgetRow, CopyPreviousButton, type BudgetLine } from "./budget-rows"

function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split("-").map(Number)
  const total = y * 12 + (m - 1) + delta
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`
}

const GROUP_ORDER: (CategoryGroup | "none")[] = ["fixed", "work", "variable", "none"]

export default async function BudgetPage({ searchParams }: PageProps<"/budget">) {
  const supabase = await createClient()
  const sp = await searchParams
  const month = typeof sp.month === "string" && /^\d{4}-\d{2}$/.test(sp.month) ? sp.month : currentMonth()
  const prev = shiftMonth(month, -1)

  const [, { data: report }, { data: categories }, { count: prevCount }] = await Promise.all([
    requireUser(),
    supabase.rpc("budget_report", { p_month: `${month}-01` }),
    supabase.from("categories").select("id, name, icon").eq("kind", "expense").eq("archived", false).order("name"),
    supabase.from("budgets").select("id", { count: "exact", head: true }).eq("month", `${prev}-01`),
  ])
  const lines = (report ?? []) as BudgetLine[]
  const planned = lines.filter((l) => l.planned !== null)
  const unplanned = lines.filter((l) => l.planned === null)

  const totalPlan = planned.reduce((s, l) => s + Number(l.planned), 0)
  const totalFact = planned.reduce((s, l) => s + Number(l.actual), 0)
  const totalLeft = planned.reduce((s, l) => s + Number(l.remaining), 0)
  const overCount = planned.filter((l) => Number(l.over) > 0).length
  const hasFixed = planned.some((l) => l.group_type === "fixed")
  const addable = (categories ?? []).filter((c) => !lines.some((l) => l.category_id === c.id))

  return (
    <>
      <PageHeader title="Tranzaksiyalar" />
      <TransactionTabs active="budget" month={month} />

      <div className="mb-4 flex items-center justify-between">
        <Link href={`/budget?month=${prev}`} replace className="rounded-md p-2 hover:bg-accent" aria-label="Oldingi oy">
          <ChevronLeft className="size-5" />
        </Link>
        <span className="font-medium">{formatMonth(month)}</span>
        <Link href={`/budget?month=${shiftMonth(month, 1)}`} replace className="rounded-md p-2 hover:bg-accent" aria-label="Keyingi oy">
          <ChevronRight className="size-5" />
        </Link>
      </div>

      <div className="mb-3 grid grid-cols-3 gap-2">
        {[
          { label: "Reja", value: totalPlan },
          { label: "Fakt", value: totalFact, danger: totalFact > totalPlan && totalPlan > 0 },
          { label: "Qolgan", value: totalLeft },
        ].map((t) => (
          <div key={t.label} className="rounded-xl border bg-card p-3">
            <p className="text-xs text-muted-foreground">{t.label}</p>
            <p className={cn("mt-1 text-sm font-semibold whitespace-nowrap tabular-nums", t.danger && "text-destructive")}>
              {formatMoney(t.value, "UZS").replace(" so'm", "")}
            </p>
          </div>
        ))}
      </div>
      <p className="mb-4 text-xs text-muted-foreground">
        Summalar so&apos;mda. Qarz to&apos;lovlari budjetga kirmaydi.{" "}
        {hasFixed
          ? "Kunlik limit majburiy to'lovlarni shu budjetdan oladi."
          : "\"Majburiy doimiy\" kategoriyalarga reja qo'yilsa, kunlik limit sozlamadagi summa o'rniga budjetni ishlatadi."}
      </p>

      {overCount > 0 && (
        <p className="mb-4 rounded-xl bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          {overCount} ta kategoriya budjetdan oshib ketdi.
        </p>
      )}

      {planned.length === 0 && (
        <div className="mb-4 rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
          Bu oy uchun reja yo&apos;q. Pastdan kategoriyaga reja qo&apos;shing{(prevCount ?? 0) > 0 && " yoki oldingi oy rejasini nusxalang"}.
        </div>
      )}
      {(prevCount ?? 0) > 0 && <CopyPreviousButton month={month} prevLabel={formatMonth(prev)} />}

      {GROUP_ORDER.map((g) => {
        const rows = planned.filter((l) => (l.group_type ?? "none") === g)
        if (rows.length === 0) return null
        return (
          <section key={g} className="mb-4">
            <h2 className="mb-2 text-sm font-medium text-muted-foreground">
              {g === "none" ? "Boshqa" : CATEGORY_GROUP_LABEL[g]}
            </h2>
            <ul className="divide-y overflow-hidden rounded-xl border bg-card">
              {rows.map((l) => (
                <BudgetRow key={l.category_id} line={l} month={month} />
              ))}
            </ul>
          </section>
        )
      })}

      {unplanned.length > 0 && (
        <section className="mb-4">
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">Rejasiz xarajatlar</h2>
          <ul className="divide-y overflow-hidden rounded-xl border bg-card">
            {unplanned.map((l) => (
              <BudgetRow key={l.category_id} line={l} month={month} />
            ))}
          </ul>
        </section>
      )}

      {addable.length > 0 && <AddBudgetRow month={month} categories={addable} />}
    </>
  )
}

import Link from "next/link"
import { AlertTriangle, ChevronRight, Settings } from "lucide-react"
import { HomeTabs } from "@/components/home-tabs"
import { ensureUsdRate } from "@/lib/cbu"
import { formatDate, formatMoney, formatPercent, today } from "@/lib/format"
import { createClient, requireUser } from "@/lib/supabase/server"
import { GOAL_SUMMARY_COLUMNS, type GoalSummary } from "@/lib/types"
import { cn } from "@/lib/utils"
import { GoalProgress } from "./goals/goal-card"

type TopProject = {
  id: string
  name: string
  client_name: string
  obligation_uzs: number
  progress: number
  overdue: boolean
}

type Summary = {
  today: string
  days_left: number
  usd_rate: number | null
  usd_rate_date: string | null
  uzs_balance: number
  usd_balance: number
  total_uzs: number
  obligations_uzs: number
  safe_uzs: number
  month_income_uzs: number
  month_expense_uzs: number
  monthly_fixed_expenses: number | null
  fixed_paid_uzs: number
  fixed_remaining_uzs: number
  goal_allocations_uzs: number
  daily_limit_uzs: number
  limit_negative: boolean
  shortfall_uzs: number
  goals_reserved_uzs: number
  debt_paid_month_uzs: number
  fixed_plan_source: "budget" | "settings" | "none"
  budget_planned_uzs: number
  budget_over_count: number
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const summaryQuery = () => supabase.rpc("dashboard_summary").single<Summary>()

  // Auth, bugungi CBU kursi va hisob-kitob parallel. Kurs bugun birinchi marta olingan
  // bo'lsa (kuniga bir marta), raqamlar yangi kurs bilan qayta hisoblanadi.
  const [, rate, first, { data: topData }, { data: goalData }] = await Promise.all([
    requireUser(),
    ensureUsdRate(supabase, today()),
    summaryQuery(),
    supabase
      .from("project_summary")
      .select("id, name, client_name, obligation_uzs, progress, overdue")
      .neq("status", "done")
      .gt("obligation_uzs", 0)
      .order("obligation_uzs", { ascending: false })
      .limit(3),
    supabase
      .from("goal_summary")
      .select(GOAL_SUMMARY_COLUMNS)
      .eq("status", "active")
      .order("priority")
      .order("created_at")
      .limit(3),
  ])
  const topProjects = (topData ?? []) as TopProject[]
  const topGoals = (goalData ?? []) as unknown as GoalSummary[]
  const s = rate.fetched ? (await summaryQuery()).data : first.data

  if (!s) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Ma&apos;lumotni yuklab bo&apos;lmadi.</p>
  }

  const usdBalance = Number(s.usd_balance)
  const rateMissing = usdBalance !== 0 && s.usd_rate === null
  const rateStale = s.usd_rate_date !== null && s.usd_rate_date < s.today
  // Sof natija = daromad − xarajat − qarz to'lovlari (pul oqimi, hisobotlardagi bilan bir xil)
  const monthNet = Number(s.month_income_uzs) - Number(s.month_expense_uzs) - Number(s.debt_paid_month_uzs)

  return (
    <>
      <header className="mb-4 flex min-h-10 items-center justify-between">
        <h1 className="text-xl font-semibold">Moliya</h1>
        <Link href="/settings" aria-label="Sozlamalar" className="-mr-2 rounded-md p-2 hover:bg-accent">
          <Settings className="size-5" />
        </Link>
      </header>
      <HomeTabs active="today" />

      {/* Xavfsiz pul va kunlik limit */}
      {/* Qorong'i rejimda oq plita ko'zni qamashtirmasin — karta rangida, chegara bilan */}
      <section className="mb-3 rounded-2xl bg-primary p-5 text-primary-foreground dark:border dark:bg-card dark:text-card-foreground">
        <p className="text-sm opacity-70">Xavfsiz pul</p>
        <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">{formatMoney(s.safe_uzs, "UZS")}</p>
        <div className="mt-4 border-t border-primary-foreground/15 pt-4 dark:border-border">
          <p className="text-sm opacity-70">Bugungi limit</p>
          <p className="mt-0.5 text-2xl font-semibold tabular-nums">
            {formatMoney(s.daily_limit_uzs, "UZS")}
            <span className="ml-1 text-sm font-normal opacity-70">/ kun</span>
          </p>
          <p className="mt-1 text-xs opacity-70">
            Oy oxirigacha {s.days_left} kun
            {Number(s.fixed_remaining_uzs) > 0 && ` · majburiy to'lovlarga ${formatMoney(s.fixed_remaining_uzs, "UZS")}`}
            {Number(s.goal_allocations_uzs) > 0 && ` · maqsadlarga ${formatMoney(s.goal_allocations_uzs, "UZS")}`}
          </p>
        </div>
      </section>

      {s.limit_negative && (
        <Notice>
          Oy oxirigacha pul yetmaydi: majburiy to&apos;lovlar va maqsadlar rejasi uchun yana{" "}
          <b className="tabular-nums">{formatMoney(s.shortfall_uzs, "UZS")}</b> kerak.
        </Notice>
      )}
      {s.budget_over_count > 0 && (
        <Notice>
          <Link href="/budget" className="underline underline-offset-2">
            {s.budget_over_count} ta kategoriya budjetdan oshib ketdi
          </Link>
        </Notice>
      )}
      {s.fixed_plan_source === "none" && (
        <Notice>
          <Link href="/settings" className="underline underline-offset-2">
            Oylik majburiy xarajatlarni kiriting
          </Link>{" "}
          (Sozlamalarda yoki Budjetda &quot;Majburiy doimiy&quot; kategoriyalarga reja qo&apos;ying)
          — busiz kunlik limit ijara, kommunal kabi to&apos;lovlarni hisobga olmaydi.
        </Notice>
      )}
      {rateMissing && <Notice>Dollar kursini olib bo&apos;lmadi — jami pulga USD hamyonlar qo&apos;shilmadi.</Notice>}

      <div className="h-1" />

      {/* Jami pul */}
      <section className="mb-3 rounded-xl border bg-card p-4">
        <div className="flex items-baseline justify-between">
          <p className="text-sm text-muted-foreground">Jami pul</p>
          <p className="text-lg font-semibold tabular-nums">{formatMoney(s.total_uzs, "UZS")}</p>
        </div>
        <dl className="mt-3 space-y-1.5 text-sm">
          <Row label="So'm hamyonlar" value={formatMoney(s.uzs_balance, "UZS")} />
          {usdBalance !== 0 && <Row label="Dollar hamyonlar" value={formatMoney(usdBalance, "USD")} />}
          <Row label="Majburiyatlar" value={`${Number(s.obligations_uzs) > 0 ? "−" : ""}${formatMoney(s.obligations_uzs, "UZS")}`} />
          {Number(s.goals_reserved_uzs) > 0 && (
            <Row label="Jamg'armaga ajratilgan" value={`−${formatMoney(s.goals_reserved_uzs, "UZS")}`} />
          )}
        </dl>
        {s.usd_rate !== null && (
          <p className={cn("mt-3 text-xs", rateStale ? "text-warning-foreground" : "text-muted-foreground")}>
            1 USD = {formatMoney(s.usd_rate, "UZS")} · CBU, {formatDate(s.usd_rate_date!)}
            {rateStale && " (bugungi kurs olinmadi)"}
          </p>
        )}
      </section>

      {/* Bu oy */}
      <section className="mb-3 rounded-xl border bg-card p-4">
        <p className="mb-3 text-sm text-muted-foreground">Bu oy</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Daromad</p>
            <p className="font-semibold text-income tabular-nums">{formatMoney(s.month_income_uzs, "UZS")}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Xarajat</p>
            <p className="font-semibold text-expense tabular-nums">{formatMoney(s.month_expense_uzs, "UZS")}</p>
          </div>
        </div>
        <dl className="mt-3 space-y-1.5 border-t pt-3 text-sm">
          <Row label="Sof natija" value={formatMoney(monthNet, "UZS")} />
          {Number(s.debt_paid_month_uzs) > 0 && <Row label="Qarz to'lovlari" value={formatMoney(s.debt_paid_month_uzs, "UZS")} />}
          {Number(s.budget_planned_uzs) > 0 && (
            <Link href="/budget" className="flex items-baseline justify-between gap-3">
              <dt className="text-muted-foreground underline-offset-2 hover:underline">Budjet →</dt>
              <dd className="text-right whitespace-nowrap tabular-nums">
                {formatMoney(s.month_expense_uzs, "UZS").replace(" so'm", "")} / {formatMoney(s.budget_planned_uzs, "UZS")}
              </dd>
            </Link>
          )}
          {s.monthly_fixed_expenses !== null && (
            <Row
              label={s.fixed_plan_source === "budget" ? "Majburiy (budjet)" : "Majburiy to'langan"}
              value={`${formatMoney(s.fixed_paid_uzs, "UZS").replace(" so'm", "")} / ${formatMoney(s.monthly_fixed_expenses, "UZS")}`}
            />
          )}
        </dl>
      </section>

      {/* Faol majburiyatlar */}
      <section className="mb-3 rounded-xl border bg-card p-4">
        <Link href="/projects" className="flex items-baseline justify-between">
          <p className="text-sm text-muted-foreground">Faol majburiyatlar</p>
          <p className="flex items-center gap-1 font-semibold tabular-nums">
            {formatMoney(s.obligations_uzs, "UZS")}
            <ChevronRight className="size-4 text-muted-foreground" />
          </p>
        </Link>
        {topProjects.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Olingan avanslar bo&apos;yicha bajarilmagan ish yo&apos;q.
          </p>
        ) : (
          <ul className="mt-3 space-y-2 border-t pt-3 text-sm">
            {topProjects.map((p) => (
              <li key={p.id}>
                <Link href={`/projects/${p.id}`} prefetch={false} className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate">
                    <span className="text-muted-foreground">{p.client_name} · </span>
                    {p.name}
                    <span
                      className={cn("ml-1 text-xs", p.overdue ? "text-destructive" : "text-muted-foreground")}
                      title={p.overdue ? "Muddati o'tgan" : undefined}
                    >
                      {formatPercent(p.progress)}
                    </span>
                  </span>
                  <span className="shrink-0 tabular-nums">{formatMoney(p.obligation_uzs, "UZS")}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Maqsadlar: ustuvorlik bo'yicha 3 ta */}
      <section className="mb-3 rounded-xl border bg-card p-4">
        <Link href="/goals" className="flex items-baseline justify-between">
          <p className="text-sm text-muted-foreground">Maqsadlar</p>
          <ChevronRight className="size-4 text-muted-foreground" />
        </Link>
        {topGoals.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Hali maqsad yo&apos;q.{" "}
            <Link href="/goals/new?template=reserve" className="underline">
              Favqulodda zaxiradan boshlang
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-3 space-y-3 border-t pt-3">
            {topGoals.map((g) => (
              <li key={g.id}>
                <Link href={`/goals/${g.id}`} prefetch={false} className="block">
                  <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate">
                      {g.name}
                      {g.late && <span className="ml-1 text-xs text-destructive">kech qolmoqda</span>}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                      {formatMoney(g.done_amount, g.currency)} / {formatMoney(g.target_amount, g.currency)}
                    </span>
                  </div>
                  <GoalProgress goal={g} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}

function Row({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted-foreground">
        {label}
        {hint && <span className="ml-1 text-xs opacity-70">({hint})</span>}
      </dt>
      <dd className="text-right whitespace-nowrap tabular-nums">{value}</dd>
    </div>
  )
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 flex gap-2 rounded-xl bg-warning px-3 py-2.5 text-sm text-warning-foreground">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </p>
  )
}

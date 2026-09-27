import Link from "next/link"
import { AlertTriangle, CheckCircle2, Settings } from "lucide-react"
import { HomeTabs } from "@/components/home-tabs"
import { ensureUsdRate } from "@/lib/cbu"
import { currentMonth, formatDate, formatMoney, formatShortMonth, monthRange, today } from "@/lib/format"
import { createClient, requireUser } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"
import { ForecastChart, TrendChart, type ForecastPoint, type TrendPoint } from "./charts"

type Stats = {
  full_months: number
  safe_income: number | null
  safe_income_months: number | null
  runway_months: number | null
  runway_base: number | null
  runway_source: "history" | "plan" | "none"
}
type ForecastRow = {
  day: string
  balance_with: number
  balance_without: number
  projects_in: number
  retainer_in: number
  fixed_out: number
  other_out: number
  goals_out: number
}
type Params = {
  start_uzs: number
  fixed_source: string
  other_source: "budget" | "history" | "current" | "none"
  other_month: number
  other_daily: number
  undated_expected_uzs: number
  undated_count: number
}
type CategoryRow = { category_id: string; name: string; icon: string | null; amount: number; share: number }
type ClientRow = { client_id: string | null; name: string; amount: number; share: number }

const OTHER_SOURCE_TEXT: Record<Params["other_source"], string> = {
  budget: "budjetdagi o'zgaruvchan va ish xarajatlari rejasidan",
  history: "oxirgi to'liq oylar o'rtachasidan",
  current: "joriy oyning kunlik o'rtacha sarfidan (tarix hali yo'q)",
  none: "ma'lumot yo'q — hisobga olinmadi",
}

const PERIODS = [
  { key: "1", label: "Bu oy", months: 1 },
  { key: "3", label: "3 oy", months: 3 },
  { key: "6", label: "6 oy", months: 6 },
]

function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split("-").map(Number)
  const total = y * 12 + (m - 1) + delta
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`
}

export default async function ReportsPage({ searchParams }: PageProps<"/reports">) {
  const supabase = await createClient()
  const sp = await searchParams
  const period = PERIODS.find((p) => p.key === sp.cat) ?? PERIODS[0]
  const t = today()
  const catFrom = monthRange(shiftMonth(currentMonth(), -(period.months - 1))).from

  const [, , statsRes, fcRes, paramsRes, monthlyRes, catRes, clientRes, retainerRes] = await Promise.all([
    requireUser(),
    ensureUsdRate(supabase, t),
    supabase.rpc("report_stats").single<Stats>(),
    supabase.rpc("forecast", { p_days: 90 }),
    supabase.rpc("forecast_params").single<Params>(),
    supabase.rpc("report_monthly", { p_months: 6 }),
    supabase.rpc("report_categories", { p_from: catFrom, p_to: t }),
    supabase.rpc("report_clients", { p_months: 6 }),
    supabase.from("projects").select("id", { count: "exact", head: true }).eq("is_retainer", true).eq("continues", true),
  ])

  const stats = statsRes.data
  const params = paramsRes.data
  const fc = (fcRes.data ?? []) as ForecastRow[]
  const points: ForecastPoint[] = fc.map((r) => ({ day: r.day, with: Number(r.balance_with), without: Number(r.balance_without) }))
  const hasRetainer = (retainerRes.count ?? 0) > 0 && fc.some((r) => Number(r.retainer_in) > 0)
  const minusWith = points.find((p) => p.with < 0) ?? null
  const minusWithout = points.find((p) => p.without < 0) ?? null
  const sum = (k: keyof ForecastRow) => fc.reduce((s, r) => s + Number(r[k]), 0)

  const allMonths = ((monthlyRes.data ?? []) as TrendPoint[]).map((r) => ({
    month: r.month,
    income: Number(r.income),
    expense: Number(r.expense),
    debt_paid: Number(r.debt_paid),
    net: Number(r.net),
  }))
  // Ilova ishlatilishidan oldingi bo'sh oylar ko'rsatilmaydi (joriy oy doim qoladi)
  const firstActive = allMonths.findIndex((r) => r.income || r.expense || r.debt_paid)
  const monthly = allMonths.slice(firstActive === -1 ? allMonths.length - 1 : firstActive)
  const cats = (catRes.data ?? []) as CategoryRow[]
  const topCats = cats.slice(0, 6)
  const restCats = cats.slice(6)
  const restAmount = restCats.reduce((s, c) => s + Number(c.amount), 0)
  const restShare = restCats.reduce((s, c) => s + Number(c.share), 0)
  const catMax = Math.max(...cats.map((c) => Number(c.amount)), restAmount, 1)
  const clients = (clientRes.data ?? []) as ClientRow[]
  const dominant = clients.find((c) => c.client_id && Number(c.share) > 50)

  return (
    <>
      <header className="mb-4 flex min-h-10 items-center justify-between">
        <h1 className="text-xl font-semibold">Moliya</h1>
        <Link href="/settings" aria-label="Sozlamalar" className="-mr-2 rounded-md p-2 hover:bg-accent">
          <Settings className="size-5" />
        </Link>
      </header>
      <HomeTabs active="reports" />

      {/* Runway va xavfsiz daromad */}
      <div className="mb-3 grid grid-cols-2 gap-3">
        <div className="rounded-xl border bg-card p-3">
          <p className="text-xs text-muted-foreground">Runway</p>
          {stats?.runway_months !== null && stats?.runway_months !== undefined ? (
            <>
              <p className="mt-1 text-xl font-semibold tabular-nums">{String(stats.runway_months).replace(".", ",")} oy</p>
              <p className="mt-1 text-xs text-muted-foreground">
                xavfsiz pul ÷ {formatMoney(stats.runway_base ?? 0, "UZS")}/oy majburiy
                {stats.runway_source === "plan" ? " (joriy reja)" : " (3 oy o'rtachasi)"}
              </p>
            </>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">Majburiy xarajat kiritilmagan</p>
          )}
        </div>
        <div className="rounded-xl border bg-card p-3">
          <p className="text-xs text-muted-foreground">Xavfsiz daromad</p>
          {stats?.safe_income !== null && stats?.safe_income !== undefined ? (
            <>
              <p className="mt-1 text-xl font-semibold tabular-nums">{formatMoney(stats.safe_income, "UZS").replace(" so'm", "")}</p>
              <p className="mt-1 text-xs text-muted-foreground">oxirgi {stats.safe_income_months} oydagi eng past oylik daromad, so&apos;m</p>
            </>
          ) : (
            <>
              <p className="mt-1 text-sm font-medium">Ma&apos;lumot yetarli emas</p>
              <p className="mt-1 text-xs text-muted-foreground">{stats?.full_months ?? 0} to&apos;liq oy bor, kamida 3 kerak</p>
            </>
          )}
        </div>
      </div>

      {/* Prognoz */}
      <section className="mb-3 rounded-xl border bg-card p-4">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-sm font-medium">Prognoz · 90 kun</h2>
          <span className="text-xs text-muted-foreground">boshlanish: {formatMoney(params?.start_uzs ?? 0, "UZS")}</span>
        </div>
        <Legend
          items={[
            ...(hasRetainer ? [{ color: "var(--chart-1)", label: "Retainer bilan", line: true }] : []),
            { color: "var(--chart-2)", label: hasRetainer ? "Retainersiz" : "Balans", line: true },
          ]}
        />
        <div className="mb-2 space-y-1">
          {hasRetainer && <MinusLine label="Retainer bilan" point={minusWith} value={minusWith?.with} />}
          <MinusLine label={hasRetainer ? "Retainersiz" : "Balans"} point={minusWithout} value={minusWithout?.without} />
        </div>
        <ForecastChart data={points} minusWith={minusWith} minusWithout={minusWithout} hasRetainer={hasRetainer} />
        <table className="mt-3 w-full text-xs tabular-nums">
          <thead className="text-muted-foreground">
            <tr>
              <th className="py-1 text-left font-normal">Kun</th>
              {hasRetainer && <th className="py-1 text-right font-normal">Retainer bilan</th>}
              <th className="py-1 text-right font-normal">{hasRetainer ? "Retainersiz" : "Balans"}</th>
            </tr>
          </thead>
          <tbody>
            {[29, 59, 89].filter((i) => points[i]).map((i) => (
              <tr key={i} className="border-t">
                <td className="py-1.5">
                  {i + 1}-kun · {formatDate(points[i].day)}
                </td>
                {hasRetainer && <td className={cn("py-1.5 text-right", points[i].with < 0 && "text-destructive")}>{formatMoney(Math.round(points[i].with), "UZS")}</td>}
                <td className={cn("py-1.5 text-right", points[i].without < 0 && "text-destructive")}>{formatMoney(Math.round(points[i].without), "UZS")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <dl className="mt-3 space-y-1 border-t pt-3 text-xs">
          <p className="mb-1 font-medium">90 kun ichida:</p>
          <Flow label="Kutilayotgan loyiha to'lovlari" value={sum("projects_in")} />
          {hasRetainer && <Flow label="Retainer keyingi davrlari (faqat “bilan”)" value={sum("retainer_in")} />}
          <Flow label={`Majburiy xarajatlar (${params?.fixed_source === "budget" ? "budjetdan" : params?.fixed_source === "settings" ? "sozlamadan" : "kiritilmagan"})`} value={-sum("fixed_out")} />
          <Flow label="Boshqa xarajatlar" value={-sum("other_out")} />
          <Flow label="Maqsad va qarz rejalari" value={-sum("goals_out")} />
          <p className="pt-1 text-muted-foreground">
            Boshqa xarajatlar {params ? OTHER_SOURCE_TEXT[params.other_source] : "—"}
            {params?.other_source === "current"
              ? ` (${formatMoney(params.other_daily, "UZS")}/kun)`
              : params && params.other_source !== "none"
                ? ` (${formatMoney(params.other_month, "UZS")}/oy)`
                : ""}
            .
          </p>
          {params && Number(params.undated_expected_uzs) > 0 && (
            <p className="text-muted-foreground">
              Sanasi noma&apos;lum yoki o&apos;tib ketgan kutilayotgan to&apos;lovlar ({params.undated_count} ta loyiha):{" "}
              <span className="font-medium text-foreground">{formatMoney(params.undated_expected_uzs, "UZS")}</span> — prognozga kirmadi.
            </p>
          )}
        </dl>
      </section>

      {/* Oyma-oy trend */}
      <section className="mb-3 rounded-xl border bg-card p-4">
        <h2 className="mb-2 text-sm font-medium">Oyma-oy · {monthly.length} oy</h2>
        <Legend
          items={[
            { color: "var(--chart-3)", label: "Daromad" },
            { color: "var(--chart-2)", label: "Xarajat" },
            { color: "var(--chart-1)", label: "Qarz to'lovlari" },
            { color: "var(--foreground)", label: "Sof natija", line: true },
          ]}
        />
        <TrendChart data={monthly} />
        <details className="mt-2 text-xs">
          <summary className="cursor-pointer text-muted-foreground">Jadval ko&apos;rinishi</summary>
          <table className="mt-2 w-full tabular-nums">
            <thead className="text-muted-foreground">
              <tr>
                <th className="py-1 text-left font-normal">Oy</th>
                <th className="py-1 text-right font-normal">Daromad</th>
                <th className="py-1 text-right font-normal">Xarajat</th>
                <th className="py-1 text-right font-normal">Qarz</th>
                <th className="py-1 text-right font-normal">Sof</th>
              </tr>
            </thead>
            <tbody>
              {monthly.map((r) => (
                <tr key={r.month} className="border-t">
                  <td className="py-1.5">{formatShortMonth(r.month)}</td>
                  {[r.income, r.expense, r.debt_paid, r.net].map((v, i) => (
                    <td key={i} className={cn("py-1.5 text-right", i === 3 && v < 0 && "text-destructive")}>
                      {formatMoney(v, "UZS").replace(" so'm", "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-1 text-muted-foreground">Summalar so&apos;mda. Sof natija = daromad − xarajat − qarz to&apos;lovlari.</p>
        </details>
      </section>

      {/* Kategoriyalar */}
      <section className="mb-3 rounded-xl border bg-card p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium">Xarajat kategoriyalari</h2>
          <div className="flex gap-1 rounded-lg bg-muted p-0.5 text-xs">
            {PERIODS.map((p) => (
              <Link
                key={p.key}
                href={`/reports?cat=${p.key}`}
                replace
                scroll={false}
                className={cn("rounded-md px-2 py-1", p.key === period.key ? "bg-background shadow-sm" : "text-muted-foreground")}
              >
                {p.label}
              </Link>
            ))}
          </div>
        </div>
        {cats.length === 0 ? (
          <p className="text-sm text-muted-foreground">Bu davrda xarajat yo&apos;q.</p>
        ) : (
          <ul className="space-y-2.5">
            {[...topCats.map((c) => ({ key: c.category_id, label: `${c.icon ? `${c.icon} ` : ""}${c.name}`, amount: Number(c.amount), share: Number(c.share) })),
              ...(restCats.length ? [{ key: "rest", label: `Boshqa (${restCats.length} ta)`, amount: restAmount, share: restShare }] : [])].map((c) => (
              <Bar key={c.key} label={c.label} amount={c.amount} share={c.share} width={(c.amount / catMax) * 100} />
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-muted-foreground">Qarz to&apos;lovlari kirmaydi.</p>
      </section>

      {/* Mijozlar */}
      <section className="mb-3 rounded-xl border bg-card p-4">
        <h2 className="mb-3 text-sm font-medium">Mijozlar ulushi · 6 oy</h2>
        {dominant && (
          <p className="mb-3 flex gap-2 rounded-lg bg-warning px-3 py-2 text-sm text-warning-foreground">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>
              Daromadning {String(dominant.share).replace(".", ",")}% i bitta mijozdan — <b>{dominant.name}</b>. U ketsa, daromad keskin tushadi.
            </span>
          </p>
        )}
        {clients.length === 0 ? (
          <p className="text-sm text-muted-foreground">Oxirgi 6 oyda daromad yo&apos;q.</p>
        ) : (
          <ul className="space-y-2.5">
            {clients.map((c) => (
              <Bar
                key={c.client_id ?? "other"}
                label={c.name}
                amount={Number(c.amount)}
                share={Number(c.share)}
                width={Math.max(Number(c.share), 0)}
                flag={Boolean(c.client_id) && Number(c.share) > 50}
                muted={!c.client_id}
              />
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-muted-foreground">Loyihalarga bog&apos;langan daromad (qaytarilgan pul ayrilgan); &quot;Boshqa daromad&quot; — loyihasiz.</p>
      </section>
    </>
  )
}

function Legend({ items }: { items: { color: string; label: string; line?: boolean }[] }) {
  return (
    <ul className="mb-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          <span className={cn("inline-block", i.line ? "h-0.5 w-3.5" : "size-2.5 rounded-sm")} style={{ background: i.color }} />
          {i.label}
        </li>
      ))}
    </ul>
  )
}

function MinusLine({ label, point, value }: { label: string; point: ForecastPoint | null; value?: number }) {
  return point ? (
    <p className="flex items-center gap-1.5 text-xs text-destructive">
      <AlertTriangle className="size-3.5 shrink-0" />
      <span>
        {label}: <b>{formatDate(point.day)}</b> kuni pul yetmay qoladi ({formatMoney(Math.round(value ?? 0), "UZS")})
      </span>
    </p>
  ) : (
    <p className="flex items-center gap-1.5 text-xs text-income">
      <CheckCircle2 className="size-3.5 shrink-0" />
      <span>{label}: 90 kun ichida pul yetadi</span>
    </p>
  )
}

function Flow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="whitespace-nowrap tabular-nums">
        {value > 0 ? "+" : value < 0 ? "−" : ""}
        {formatMoney(Math.abs(Math.round(value)), "UZS")}
      </dd>
    </div>
  )
}

function Bar({ label, amount, share, width, flag, muted }: { label: string; amount: number; share: number; width: number; flag?: boolean; muted?: boolean }) {
  return (
    <li>
      <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
        <span className="flex min-w-0 items-center gap-1 truncate">
          {flag && <AlertTriangle className="size-3.5 shrink-0 text-warning-foreground" aria-label="50% dan ko'p" />}
          {label}
        </span>
        <span className="shrink-0 tabular-nums">
          {formatMoney(amount, "UZS").replace(" so'm", "")} <span className="text-xs text-muted-foreground">{String(share).replace(".", ",")}%</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.min(width, 100)}%`, background: muted ? "var(--muted-foreground)" : "var(--chart-1)" }}
        />
      </div>
    </li>
  )
}

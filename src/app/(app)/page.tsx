import Link from "next/link"
import { AlertTriangle, Plus, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ensureUsdRate } from "@/lib/cbu"
import { formatDate, formatMoney, today } from "@/lib/format"
import { createClient, requireUser } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"

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
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const summaryQuery = () => supabase.rpc("dashboard_summary").single<Summary>()

  // Auth, bugungi CBU kursi va hisob-kitob parallel. Kurs bugun birinchi marta olingan
  // bo'lsa (kuniga bir marta), raqamlar yangi kurs bilan qayta hisoblanadi.
  const [, rate, first] = await Promise.all([requireUser(), ensureUsdRate(supabase, today()), summaryQuery()])
  const s = rate.fetched ? (await summaryQuery()).data : first.data

  if (!s) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Ma&apos;lumotni yuklab bo&apos;lmadi.</p>
  }

  const usdBalance = Number(s.usd_balance)
  const rateMissing = usdBalance !== 0 && s.usd_rate === null
  const rateStale = s.usd_rate_date !== null && s.usd_rate_date < s.today
  const monthNet = Number(s.month_income_uzs) - Number(s.month_expense_uzs)

  return (
    <>
      <header className="mb-4 flex min-h-10 items-center justify-between">
        <h1 className="text-xl font-semibold">Moliya</h1>
        <Button asChild variant="ghost" size="icon" aria-label="Sozlamalar">
          <Link href="/settings">
            <Settings className="size-5" />
          </Link>
        </Button>
      </header>

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
            {Number(s.fixed_remaining_uzs) > 0 &&
              ` · majburiy to'lovlarga ${formatMoney(s.fixed_remaining_uzs, "UZS")} ajratilgan`}
          </p>
        </div>
      </section>

      {s.limit_negative && (
        <Notice>
          Oy oxirigacha pul yetmaydi: majburiy to&apos;lovlar uchun yana{" "}
          <b className="tabular-nums">{formatMoney(s.shortfall_uzs, "UZS")}</b> kerak.
        </Notice>
      )}
      {s.monthly_fixed_expenses === null && (
        <Notice>
          <Link href="/settings" className="underline underline-offset-2">
            Oylik majburiy xarajatlarni kiriting
          </Link>{" "}
          — busiz kunlik limit ijara, kommunal kabi to&apos;lovlarni hisobga olmaydi.
        </Notice>
      )}
      {rateMissing && <Notice>Dollar kursini olib bo&apos;lmadi — jami pulga USD hamyonlar qo&apos;shilmadi.</Notice>}

      <Button asChild className="my-4 h-12 w-full text-base">
        <Link href="/transactions">
          <Plus /> Tranzaksiya qo&apos;shish
        </Link>
      </Button>

      {/* Jami pul */}
      <section className="mb-3 rounded-xl border bg-card p-4">
        <div className="flex items-baseline justify-between">
          <p className="text-sm text-muted-foreground">Jami pul</p>
          <p className="text-lg font-semibold tabular-nums">{formatMoney(s.total_uzs, "UZS")}</p>
        </div>
        <dl className="mt-3 space-y-1.5 text-sm">
          <Row label="So'm hamyonlar" value={formatMoney(s.uzs_balance, "UZS")} />
          {usdBalance !== 0 && <Row label="Dollar hamyonlar" value={formatMoney(usdBalance, "USD")} />}
          <Row label="Majburiyatlar" value={formatMoney(s.obligations_uzs, "UZS")} hint="3-bosqichda" />
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
          {s.monthly_fixed_expenses !== null && (
            <Row
              label="Majburiy to'langan"
              value={`${formatMoney(s.fixed_paid_uzs, "UZS").replace(" so'm", "")} / ${formatMoney(s.monthly_fixed_expenses, "UZS")}`}
            />
          )}
        </dl>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Placeholder title="Faol majburiyatlar" stage="3-bosqichda" />
        <Placeholder title="Maqsadlar" stage="4-bosqichda" />
      </div>
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

function Placeholder({ title, stage }: { title: string; stage: string }) {
  return (
    <div className="rounded-xl border border-dashed p-4">
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{stage}</p>
    </div>
  )
}

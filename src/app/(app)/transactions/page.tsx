import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { NativeSelect } from "@/components/ui/native-select"
import { formatDate, formatMoney, formatMonth, currentMonth, monthRange, recentMonths, today } from "@/lib/format"
import { requireUser } from "@/lib/supabase/server"
import type { Category, CategoryKind, Currency, WalletBalance } from "@/lib/types"
import { cn } from "@/lib/utils"
import { TransactionForm } from "./transaction-form"

type Row = {
  id: string
  date: string
  amount: number
  currency: Currency
  rate_to_uzs: number
  note: string | null
  wallet: { name: string } | null
  category: { name: string; kind: CategoryKind; icon: string | null } | null
}

export default async function TransactionsPage({ searchParams }: PageProps<"/transactions">) {
  const sp = await searchParams
  const pick = (k: string) => (typeof sp[k] === "string" && sp[k] ? (sp[k] as string) : undefined)
  const month = /^\d{4}-\d{2}$/.test(pick("month") ?? "") ? pick("month")! : currentMonth()
  const walletFilter = pick("wallet")
  const categoryFilter = pick("category")
  const kindFilter = pick("kind") as CategoryKind | undefined

  const { supabase } = await requireUser()
  const { from, to } = monthRange(month)

  let query = supabase
    .from("transactions")
    .select(
      "id, date, amount, currency, rate_to_uzs, note, wallet:wallets!transactions_wallet_fkey(name), category:categories!transactions_category_fkey!inner(name, kind, icon)"
    )
    .gte("date", from)
    .lt("date", to)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1000)
  if (walletFilter) query = query.eq("wallet_id", walletFilter)
  if (categoryFilter) query = query.eq("category_id", categoryFilter)
  if (kindFilter === "income" || kindFilter === "expense") query = query.eq("category.kind", kindFilter)

  const [{ data: txData }, { data: walletData }, { data: categoryData }, { data: lastTx }, { data: lastUsd }] =
    await Promise.all([
      query,
      supabase
        .from("wallet_balances")
        .select("id, name, currency, kind, archived, opening_balance, balance")
        .order("created_at"),
      supabase.from("categories").select("id, name, kind, group_type, icon, archived").order("name"),
      supabase.from("transactions").select("wallet_id").order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase
        .from("transactions")
        .select("rate_to_uzs")
        .eq("currency", "USD")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

  const rows = (txData ?? []) as unknown as Row[]
  const wallets = (walletData ?? []) as WalletBalance[]
  const categories = (categoryData ?? []) as Category[]

  // Filtrlangan davr bo'yicha jami (USD yozuvlar o'z kursida so'mga o'giriladi)
  const totals = rows.reduce(
    (acc, r) => {
      const uzs = Number(r.amount) * Number(r.rate_to_uzs)
      if (r.category?.kind === "income") acc.income += uzs
      else acc.expense += uzs
      return acc
    },
    { income: 0, expense: 0 }
  )

  const byDate = new Map<string, Row[]>()
  for (const r of rows) byDate.set(r.date, [...(byDate.get(r.date) ?? []), r])

  const hasFilters = Boolean(walletFilter || categoryFilter || kindFilter)

  return (
    <>
      <PageHeader title="Tranzaksiyalar" />

      <section className="mb-8 rounded-xl border bg-card p-4">
        <TransactionForm
          categories={categories.filter((c) => !c.archived)}
          wallets={wallets.filter((w) => !w.archived)}
          today={today()}
          defaultWalletId={lastTx?.wallet_id}
          lastUsdRate={lastUsd ? Number(lastUsd.rate_to_uzs) : undefined}
        />
      </section>

      <form className="mb-4 space-y-2" action="/transactions">
        <NativeSelect name="month" defaultValue={month} aria-label="Oy">
          {recentMonths(24).map((m) => (
            <option key={m} value={m}>
              {formatMonth(m)}
            </option>
          ))}
        </NativeSelect>
        <div className="grid grid-cols-3 gap-2">
          <NativeSelect name="kind" defaultValue={kindFilter ?? ""} aria-label="Turi" className="text-sm">
            <option value="">Hammasi</option>
            <option value="expense">Xarajat</option>
            <option value="income">Daromad</option>
          </NativeSelect>
          <NativeSelect name="wallet" defaultValue={walletFilter ?? ""} aria-label="Hamyon" className="text-sm">
            <option value="">Hamyon</option>
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </NativeSelect>
          <NativeSelect name="category" defaultValue={categoryFilter ?? ""} aria-label="Kategoriya" className="text-sm">
            <option value="">Kategoriya</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon ? `${c.icon} ` : ""}
                {c.name}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="flex gap-2">
          <Button type="submit" variant="secondary" className="h-10 flex-1">
            Ko&apos;rsatish
          </Button>
          {hasFilters && (
            <Button asChild variant="ghost" className="h-10">
              <Link href={`/transactions?month=${month}`}>Tozalash</Link>
            </Button>
          )}
        </div>
      </form>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border bg-card p-3">
          <p className="text-xs text-muted-foreground">Daromad</p>
          <p className="mt-1 font-semibold text-income tabular-nums">{formatMoney(totals.income, "UZS")}</p>
        </div>
        <div className="rounded-xl border bg-card p-3">
          <p className="text-xs text-muted-foreground">Xarajat</p>
          <p className="mt-1 font-semibold text-expense tabular-nums">{formatMoney(totals.expense, "UZS")}</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Bu davrda yozuv yo&apos;q.</p>
      ) : (
        <div className="space-y-4">
          {[...byDate.entries()].map(([date, items]) => (
            <section key={date}>
              <h3 className="mb-1.5 text-xs font-medium text-muted-foreground">{formatDate(date)}</h3>
              <ul className="divide-y overflow-hidden rounded-xl border bg-card">
                {items.map((r) => {
                  const income = r.category?.kind === "income"
                  return (
                    <li key={r.id}>
                      <Link href={`/transactions/${r.id}`} className="flex items-center gap-3 px-4 py-3 active:bg-accent">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-lg">
                          {r.category?.icon ?? "•"}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{r.category?.name}</span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {r.wallet?.name}
                            {r.note && ` · ${r.note}`}
                          </span>
                        </span>
                        <span className={cn("text-right text-sm font-semibold tabular-nums", income ? "text-income" : "")}>
                          {income ? "+" : "−"}
                          {formatMoney(r.amount, r.currency)}
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  )
}

import Link from "next/link"
import { ArrowLeftRight, Banknote, CreditCard, Plus } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { formatMoney } from "@/lib/format"
import { createClient, requireUser } from "@/lib/supabase/server"
import { WALLET_KIND_LABEL, type Currency, type WalletBalance } from "@/lib/types"
import { cn } from "@/lib/utils"

export default async function WalletsPage() {
  const supabase = await createClient()
  // Auth tekshiruvi va ma'lumot so'rovi parallel (ma'lumotni RLS himoya qiladi)
  const [, { data }] = await Promise.all([
    requireUser(),
    supabase
      .from("wallet_balances")
      .select("id, name, currency, kind, archived, opening_balance, balance")
      .order("created_at"),
  ])
  const wallets = (data ?? []) as WalletBalance[]
  const active = wallets.filter((w) => !w.archived)
  const archived = wallets.filter((w) => w.archived)

  const totals = (["UZS", "USD"] as Currency[])
    .map((c) => ({
      currency: c,
      sum: active.filter((w) => w.currency === c).reduce((s, w) => s + Number(w.balance), 0),
      count: active.filter((w) => w.currency === c).length,
    }))
    .filter((t) => t.count > 0)

  return (
    <>
      <PageHeader
        title="Hamyonlar"
        action={
          <Button asChild size="sm" variant="outline">
            <Link href="/wallets/new">
              <Plus /> Qo&apos;shish
            </Link>
          </Button>
        }
      />

      {totals.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-3">
          {totals.map((t) => (
            <div key={t.currency} className="rounded-xl border bg-card p-3">
              <p className="text-xs text-muted-foreground">Jami {t.currency}</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">{formatMoney(t.sum, t.currency)}</p>
            </div>
          ))}
        </div>
      )}

      {active.length >= 2 && (
        <Button asChild className="mb-4 h-11 w-full">
          <Link href="/wallets/transfer">
            <ArrowLeftRight /> O&apos;tkazma
          </Link>
        </Button>
      )}

      {active.length === 0 && (
        <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          Hali hamyon yo&apos;q. Birinchi hamyoningizni qo&apos;shing — masalan, &quot;Naqd so&apos;m&quot; yoki &quot;Uzcard&quot;.
        </div>
      )}

      <WalletList wallets={active} />

      {archived.length > 0 && (
        <details className="mt-6">
          <summary className="cursor-pointer text-sm text-muted-foreground">
            Arxivlangan ({archived.length})
          </summary>
          <div className="mt-3 opacity-70">
            <WalletList wallets={archived} />
          </div>
        </details>
      )}
    </>
  )
}

function WalletList({ wallets }: { wallets: WalletBalance[] }) {
  return (
    <ul className="divide-y overflow-hidden rounded-xl border bg-card">
      {wallets.map((w) => {
        const Icon = w.kind === "cash" ? Banknote : CreditCard
        const balance = Number(w.balance)
        return (
          <li key={w.id}>
            <Link
                href={`/wallets/${w.id}`}
                // Ro'yxatdagi har bir qatorni oldindan yuklash yuzlab fon so'rovini keltiradi
                prefetch={false}
                className="flex items-center gap-3 px-4 py-3 active:bg-accent">
              <span className="flex size-9 items-center justify-center rounded-full bg-muted">
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{w.name}</span>
                <span className="text-xs text-muted-foreground">
                  {WALLET_KIND_LABEL[w.kind]} · {w.currency}
                </span>
              </span>
              <span className={cn("font-semibold tabular-nums", balance < 0 && "text-expense")}>
                {formatMoney(balance, w.currency)}
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

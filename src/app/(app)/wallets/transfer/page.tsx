import { PageHeader } from "@/components/page-header"
import { formatDate, formatMoney, today } from "@/lib/format"
import { createClient, requireUser } from "@/lib/supabase/server"
import type { Currency, WalletBalance } from "@/lib/types"
import { DeleteTransferButton, TransferForm } from "./transfer-form"

type TransferRow = {
  id: string
  date: string
  from_amount: number
  to_amount: number
  rate: number
  note: string | null
  from: { name: string; currency: Currency } | null
  to: { name: string; currency: Currency } | null
}

export default async function TransferPage() {
  const supabase = await createClient()
  const [, { data: wallets }, { data: transfers }] = await Promise.all([
    requireUser(),
    supabase
      .from("wallet_balances")
      .select("id, name, currency, kind, archived, opening_balance, balance")
      .eq("archived", false)
      .order("created_at"),
    supabase
      .from("transfers")
      .select(
        "id, date, from_amount, to_amount, rate, note, from:wallets!transfers_from_wallet_fkey(name, currency), to:wallets!transfers_to_wallet_fkey(name, currency)"
      )
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(30),
  ])

  const rows = (transfers ?? []) as unknown as TransferRow[]

  return (
    <>
      <PageHeader title="O'tkazma" back="/wallets" />
      <TransferForm wallets={(wallets ?? []) as WalletBalance[]} today={today()} />

      <h2 className="mt-8 mb-3 text-sm font-medium text-muted-foreground">Oxirgi o&apos;tkazmalar</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Hali o&apos;tkazma yo&apos;q.</p>
      ) : (
        <ul className="divide-y overflow-hidden rounded-xl border bg-card">
          {rows.map((t) => (
            <li key={t.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {t.from?.name} → {t.to?.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(t.date)}
                  {t.from && t.to && t.from.currency !== t.to.currency && ` · kurs ${formatMoney(t.rate, "UZS")}`}
                  {t.note && ` · ${t.note}`}
                </p>
              </div>
              <div className="text-right text-sm tabular-nums">
                {t.from && <p>{formatMoney(t.from_amount, t.from.currency)}</p>}
                {t.from && t.to && t.from.currency !== t.to.currency && (
                  <p className="text-xs text-muted-foreground">→ {formatMoney(t.to_amount, t.to.currency)}</p>
                )}
              </div>
              <DeleteTransferButton id={t.id} />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

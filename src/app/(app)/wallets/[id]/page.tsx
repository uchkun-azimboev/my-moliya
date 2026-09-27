import { notFound } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { formatMoney } from "@/lib/format"
import { requireUser } from "@/lib/supabase/server"
import type { WalletBalance } from "@/lib/types"
import { WalletForm } from "../wallet-form"

export default async function EditWalletPage({ params }: PageProps<"/wallets/[id]">) {
  const { id } = await params
  const { supabase } = await requireUser()
  const { data } = await supabase
    .from("wallet_balances")
    .select("id, name, currency, kind, archived, opening_balance, balance")
    .eq("id", id)
    .maybeSingle()
  if (!data) notFound()
  const wallet = data as WalletBalance

  return (
    <>
      <PageHeader title={wallet.name} back="/wallets" />
      <div className="mb-6 rounded-xl border bg-card p-4">
        <p className="text-xs text-muted-foreground">Hozirgi balans</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">{formatMoney(wallet.balance, wallet.currency)}</p>
      </div>
      <WalletForm wallet={wallet} />
    </>
  )
}

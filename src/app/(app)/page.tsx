import Link from "next/link"
import { Plus } from "lucide-react"
import { logout } from "@/app/login/actions"
import { Button } from "@/components/ui/button"
import { formatMoney } from "@/lib/format"
import { createClient, requireUser } from "@/lib/supabase/server"
import type { WalletBalance } from "@/lib/types"

export default async function HomePage() {
  const supabase = await createClient()
  // Auth tekshiruvi va ma'lumot so'rovi parallel (ma'lumotni RLS himoya qiladi)
  const [, { data }] = await Promise.all([
    requireUser(),
    supabase
      .from("wallet_balances")
      .select("id, name, currency, kind, archived, opening_balance, balance")
      .eq("archived", false)
      .order("created_at"),
  ])
  const wallets = (data ?? []) as WalletBalance[]

  return (
    <>
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Moliya</h1>
        <form action={logout}>
          <Button type="submit" variant="ghost" size="sm" className="text-muted-foreground">
            Chiqish
          </Button>
        </form>
      </header>

      <Button asChild className="mb-6 h-12 w-full text-base">
        <Link href="/transactions">
          <Plus /> Tranzaksiya qo&apos;shish
        </Link>
      </Button>

      <h2 className="mb-2 text-sm font-medium text-muted-foreground">Hamyonlar</h2>
      {wallets.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Hali hamyon yo&apos;q. <Link href="/wallets/new" className="underline">Qo&apos;shish</Link>
        </p>
      ) : (
        <ul className="divide-y overflow-hidden rounded-xl border bg-card">
          {wallets.map((w) => (
            <li key={w.id} className="flex items-center justify-between px-4 py-3">
              <span className="font-medium">{w.name}</span>
              <span className="font-semibold tabular-nums">{formatMoney(w.balance, w.currency)}</span>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-8 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
        To&apos;liq dashboard (xavfsiz pul, kunlik limit, oylik daromad/xarajat) 2-bosqichda qo&apos;shiladi.
      </p>
    </>
  )
}

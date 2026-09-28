"use client"

import { useState, useTransition } from "react"
import { ArrowDown, Trash2 } from "lucide-react"
import { AmountInput } from "@/components/amount-input"
import { FormError } from "@/components/form-error"
import { Button } from "@/components/ui/button"
import { useCbuRate, type CbuRate } from "@/hooks/use-cbu-rate"
import { useFormAction } from "@/hooks/use-form-action"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { formatMoney } from "@/lib/format"
import { normalizeAmount } from "@/lib/money"
import type { ActionState } from "@/lib/action-state"
import type { WalletBalance } from "@/lib/types"
import { createTransfer, deleteTransfer } from "../actions"

export function TransferForm({
  wallets,
  today,
  cbuRate,
}: {
  wallets: WalletBalance[]
  today: string
  cbuRate: CbuRate
}) {
  const cbu = useCbuRate(cbuRate)
  const [fromId, setFromId] = useState(wallets[0]?.id ?? "")
  const [toId, setToId] = useState(wallets[1]?.id ?? "")
  const [fromAmount, setFromAmount] = useState("")
  const [toAmount, setToAmount] = useState("")

  const [state, action, pending] = useFormAction(async (prev: ActionState, fd: FormData) => {
    const result = await createTransfer(prev, fd)
    if (result.ok) {
      setFromAmount("")
      setToAmount("")
    }
    return result
  }, {})

  if (wallets.length < 2) {
    return <p className="text-sm text-muted-foreground">O&apos;tkazma uchun kamida 2 ta faol hamyon kerak.</p>
  }

  const from = wallets.find((w) => w.id === fromId)
  const to = wallets.find((w) => w.id === toId)
  const exchange = Boolean(from && to && from.currency !== to.currency)

  // Ayirboshlash kursi: 1 USD = ? so'm
  const f = Number(normalizeAmount(fromAmount))
  const t = Number(normalizeAmount(toAmount))
  const rate = exchange && f > 0 && t > 0 ? (from!.currency === "USD" ? t / f : f / t) : null

  return (
    <form onSubmit={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="from_wallet_id">Qaysi hamyondan</Label>
        <NativeSelect id="from_wallet_id" name="from_wallet_id" value={fromId} onChange={(e) => {
            const v = e.target.value
            setFromId(v)
            if (v === toId) setToId(wallets.find((w) => w.id !== v)?.id ?? "")
          }}>
          {wallets.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name} ({formatMoney(w.balance, w.currency)})
            </option>
          ))}
        </NativeSelect>
      </div>

      <div className="space-y-2">
        <Label htmlFor="from_amount">Summa{from && `, ${from.currency}`}</Label>
        <AmountInput id="from_amount" name="from_amount" value={fromAmount} onChange={setFromAmount} placeholder="0" required />
      </div>

      <div className="flex justify-center text-muted-foreground">
        <ArrowDown className="size-5" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="to_wallet_id">Qaysi hamyonga</Label>
        <NativeSelect id="to_wallet_id" name="to_wallet_id" value={toId} onChange={(e) => setToId(e.target.value)}>
          {wallets.map((w) => (
            <option key={w.id} value={w.id} disabled={w.id === fromId}>
              {w.name} ({formatMoney(w.balance, w.currency)})
            </option>
          ))}
        </NativeSelect>
      </div>

      {exchange && (
        <div className="space-y-2">
          <Label htmlFor="to_amount">Qabul qilingan summa, {to!.currency}</Label>
          <AmountInput id="to_amount" name="to_amount" value={toAmount} onChange={setToAmount} placeholder="0" required />
          <p className="text-xs text-muted-foreground">
            {rate ? `Kurs: 1 USD = ${formatMoney(rate.toFixed(2), "UZS")}` : "Kurs ikki summadan avtomatik hisoblanadi."}
            {cbu.info && ` · CBU: ${formatMoney(cbu.info.rate, "UZS")}`}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="min-w-0 space-y-2">
          <Label htmlFor="date">Sana</Label>
          <Input
            id="date"
            name="date"
            type="date"
            defaultValue={today}
            onChange={(e) => e.target.value && cbu.load(e.target.value)}
            required
            className="h-11 text-base"
          />
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor="note">Izoh</Label>
          <Input id="note" name="note" maxLength={200} className="h-11 text-base" />
        </div>
      </div>

      <FormError message={state.error} />
      {state.ok && <p className="text-sm text-income">O&apos;tkazma saqlandi ✓</p>}
      <Button type="submit" className="h-11 w-full" disabled={pending || fromId === toId}>
        {pending ? "Saqlanmoqda..." : "O'tkazish"}
      </Button>
    </form>
  )
}

export function DeleteTransferButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition()
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="O'chirish"
      disabled={pending}
      onClick={() => {
        if (confirm("O'tkazmani o'chirasizmi?")) startTransition(() => deleteTransfer(id))
      }}
    >
      <Trash2 className="text-muted-foreground" />
    </Button>
  )
}

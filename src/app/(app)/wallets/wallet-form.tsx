"use client"

import { useState, useTransition } from "react"
import { FormError } from "@/components/form-error"
import { Button } from "@/components/ui/button"
import { useFormAction } from "@/hooks/use-form-action"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { formatAmountInput } from "@/lib/money"
import type { ActionState } from "@/lib/action-state"
import type { WalletBalance } from "@/lib/types"
import { createWallet, deleteWallet, setWalletArchived, updateWallet } from "./actions"

export function WalletForm({ wallet }: { wallet?: WalletBalance }) {
  const [state, action, pending] = useFormAction(wallet ? updateWallet : createWallet, {})
  const [opening, setOpening] = useState(
    wallet ? formatAmountInput(String(wallet.opening_balance)) : ""
  )
  const [negative, setNegative] = useState(wallet ? Number(wallet.opening_balance) < 0 : false)
  const [extra, setExtra] = useState<ActionState>({})
  const [busy, startTransition] = useTransition()

  const run = (fn: () => Promise<ActionState>) =>
    startTransition(async () => setExtra(await fn()))

  return (
    <>
      <form onSubmit={action} className="space-y-4">
        {wallet && <input type="hidden" name="id" value={wallet.id} />}

        <div className="space-y-2">
          <Label htmlFor="name">Nomi</Label>
          <Input id="name" name="name" defaultValue={wallet?.name} required maxLength={60} className="h-11 text-base" placeholder="Masalan: Uzcard" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="kind">Turi</Label>
            <NativeSelect id="kind" name="kind" defaultValue={wallet?.kind ?? "card"}>
              <option value="card">Karta</option>
              <option value="cash">Naqd</option>
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Valyuta</Label>
            <NativeSelect
              id="currency"
              name="currency"
              defaultValue={wallet?.currency ?? "UZS"}
              disabled={Boolean(wallet)}
            >
              <option value="UZS">UZS — so&apos;m</option>
              <option value="USD">USD — dollar</option>
            </NativeSelect>
          </div>
        </div>
        {wallet && (
          <p className="-mt-2 text-xs text-muted-foreground">Valyutani keyin o&apos;zgartirib bo&apos;lmaydi.</p>
        )}

        <div className="space-y-2">
          <Label htmlFor="opening">Boshlang&apos;ich balans</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-11 w-11 shrink-0 text-lg"
              onClick={() => setNegative((n) => !n)}
              aria-label="Ishorani almashtirish"
            >
              {negative ? "−" : "+"}
            </Button>
            <Input
              id="opening"
              inputMode="decimal"
              autoComplete="off"
              value={opening}
              onChange={(e) => setOpening(formatAmountInput(e.target.value.replace("-", "")))}
              className="h-11 text-base tabular-nums"
              placeholder="0"
            />
          </div>
          <input type="hidden" name="opening_balance" value={(negative && opening ? "-" : "") + opening} />
          <p className="text-xs text-muted-foreground">Ilovadan foydalanishni boshlagan kundagi qoldiq.</p>
        </div>

        <FormError message={state.error} />
        <Button type="submit" className="h-11 w-full" disabled={pending}>
          {pending ? "Saqlanmoqda..." : "Saqlash"}
        </Button>
      </form>

      {wallet && (
        <div className="mt-8 space-y-3 border-t pt-6">
          <FormError message={extra.error} />
          <Button
            variant="outline"
            className="h-11 w-full"
            disabled={busy}
            onClick={() => run(() => setWalletArchived(wallet.id, !wallet.archived))}
          >
            {wallet.archived ? "Arxivdan chiqarish" : "Arxivlash"}
          </Button>
          <Button
            variant="ghost"
            className="h-11 w-full text-destructive"
            disabled={busy}
            onClick={() => {
              if (confirm(`"${wallet.name}" hamyonini o'chirasizmi?`)) run(() => deleteWallet(wallet.id))
            }}
          >
            O&apos;chirish
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Yozuvlari bor hamyonni o&apos;chirib bo&apos;lmaydi — uni arxivlang.
          </p>
        </div>
      )}
    </>
  )
}

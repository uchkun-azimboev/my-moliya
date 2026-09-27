"use client"

import { useState } from "react"
import { AmountInput } from "@/components/amount-input"
import { FormError } from "@/components/form-error"
import { Button } from "@/components/ui/button"
import { useFormAction } from "@/hooks/use-form-action"
import { formatAmountInput } from "@/lib/money"
import { saveSettings } from "./actions"

export function FixedExpensesForm({ value }: { value: number | null }) {
  const [amount, setAmount] = useState(value === null ? "" : formatAmountInput(String(value)))
  const [state, action, pending] = useFormAction(saveSettings, {})

  return (
    <form onSubmit={action} className="space-y-3">
      <div className="relative">
        <AmountInput
          name="monthly_fixed_expenses"
          aria-label="Oylik majburiy xarajatlar"
          value={amount}
          onChange={setAmount}
          placeholder="Masalan: 4 500 000"
          className="pr-14"
        />
        <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm text-muted-foreground">
          so&apos;m
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        Har oy albatta to&apos;lanadigan xarajatlar jami: ijara, kommunal, aloqa, obunalar. Kunlik limit oy oxirigacha
        shundan &quot;Majburiy doimiy&quot; guruhda to&apos;lanmagan qismini ayirib hisoblanadi. 5-bosqichda budjet
        bilan almashtiriladi.
      </p>
      <FormError message={state.error} />
      {state.ok && !pending && <p className="text-sm text-income">Saqlandi ✓</p>}
      <Button type="submit" className="h-11 w-full" disabled={pending}>
        {pending ? "Saqlanmoqda..." : "Saqlash"}
      </Button>
    </form>
  )
}

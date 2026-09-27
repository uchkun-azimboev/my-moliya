"use client"

import { useState } from "react"
import { AmountInput } from "@/components/amount-input"
import { FormError } from "@/components/form-error"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useFormAction } from "@/hooks/use-form-action"
import type { ActionState } from "@/lib/action-state"
import { formatMoney } from "@/lib/format"
import { formatAmountInput } from "@/lib/money"
import type { GoalSummary } from "@/lib/types"
import { cn } from "@/lib/utils"
import { saveAllocation } from "./actions"

/**
 * Jamg'armaga ajratish (pul hamyonda qoladi, xavfsiz puldan ayriladi).
 * allowRelease — maqsad sahifasida "Bo'shatish" ham mumkin.
 */
export function AllocationForm({ goal, today, allowRelease }: { goal: GoalSummary; today: string; allowRelease?: boolean }) {
  const suggested = Number(goal.month_left_amount) > 0 ? formatAmountInput(String(goal.month_left_amount)) : ""
  const [open, setOpen] = useState(false)
  const [release, setRelease] = useState(false)
  const [amount, setAmount] = useState(suggested)
  const [state, action, pending] = useFormAction(async (prev: ActionState, fd: FormData) => {
    const result = await saveAllocation(prev, fd)
    if (result.ok) {
      setOpen(false)
      setRelease(false)
    }
    return result
  }, {})

  if (!open) {
    return (
      <div className="space-y-2">
        {state.ok && <p className="text-center text-sm text-income">Saqlandi ✓</p>}
        <Button variant="secondary" className="h-10 w-full" onClick={() => setOpen(true)}>
          + Ajratish
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={action} className="space-y-3">
      <input type="hidden" name="goal_id" value={goal.id} />
      <input type="hidden" name="release" value={release ? "1" : "0"} />
      {allowRelease && (
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
          {[
            { v: false, label: "Ajratish" },
            { v: true, label: "Bo'shatish" },
          ].map((o) => (
            <button
              key={o.label}
              type="button"
              aria-pressed={release === o.v}
              onClick={() => {
                setRelease(o.v)
                setAmount(o.v ? "" : suggested)
              }}
              className={cn("h-9 rounded-md text-sm font-medium", release === o.v ? "bg-background shadow-sm" : "text-muted-foreground")}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <AmountInput name="amount" aria-label="Summa" value={amount} onChange={setAmount} required placeholder="0" className="pr-14" />
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">
            {goal.currency === "USD" ? "USD" : "so'm"}
          </span>
        </div>
        <Input name="date" type="date" defaultValue={today} aria-label="Sana" className="h-11 w-36 text-base" />
      </div>
      <p className="text-xs text-muted-foreground">
        {release
          ? `Bo'shatilgan pul xavfsiz pulga qaytadi, progress kamayadi. Ajratilgan qoldiq: ${formatMoney(goal.reserved_amount, goal.currency)}.`
          : "Pul hamyonda qoladi, lekin xavfsiz puldan ayriladi."}
      </p>
      <FormError message={state.error} />
      <div className="flex gap-2">
        <Button type="submit" className="h-10 flex-1" disabled={pending}>
          {pending ? "Saqlanmoqda..." : release ? "Bo'shatish" : "Ajratish"}
        </Button>
        <Button type="button" variant="ghost" className="h-10" onClick={() => setOpen(false)}>
          Yopish
        </Button>
      </div>
    </form>
  )
}

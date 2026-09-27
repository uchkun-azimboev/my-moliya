"use client"

import { useState, useTransition } from "react"
import { Trash2 } from "lucide-react"
import { FormError } from "@/components/form-error"
import { Button } from "@/components/ui/button"
import type { ActionState } from "@/lib/action-state"
import { formatMoney } from "@/lib/format"
import type { GoalSummary } from "@/lib/types"
import { deleteAllocation, deleteGoal, setGoalClosed } from "../actions"

export function GoalActions({ goal, hasTransactions }: { goal: GoalSummary; hasTransactions: boolean }) {
  const [result, setResult] = useState<ActionState>({})
  const [busy, startTransition] = useTransition()
  const run = (fn: () => Promise<ActionState>) => startTransition(async () => setResult(await fn()))

  return (
    <div className="space-y-3 border-t pt-6">
      <FormError message={result.error} />
      {goal.closed ? (
        <Button variant="outline" className="h-11 w-full" disabled={busy} onClick={() => run(() => setGoalClosed(goal.id, false))}>
          Qayta ochish
        </Button>
      ) : (
        <Button
          variant="outline"
          className="h-11 w-full"
          disabled={busy}
          onClick={() => {
            const note =
              goal.kind === "saving" && Number(goal.reserved_amount) > 0
                ? `\n\nAjratilgan ${formatMoney(goal.reserved_amount, goal.currency)} band bo'lib qoladi — kerak bo'lsa avval "Bo'shatish" qiling.`
                : ""
            if (confirm(`Maqsadni yopasizmi? U kunlik limit va taqsimotdan chiqadi.${note}`)) run(() => setGoalClosed(goal.id, true))
          }}
        >
          Maqsadni yopish
        </Button>
      )}
      <Button
        variant="ghost"
        className="h-11 w-full text-destructive"
        disabled={busy}
        onClick={() => {
          if (confirm(`"${goal.name}" maqsadini o'chirasizmi? Ajratmalar ham o'chadi.`)) run(() => deleteGoal(goal.id))
        }}
      >
        O&apos;chirish
      </Button>
      {hasTransactions && (
        <p className="text-center text-xs text-muted-foreground">Tranzaksiyalari bor maqsadni o&apos;chirib bo&apos;lmaydi — uni yoping.</p>
      )}
    </div>
  )
}

export function DeleteAllocationButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition()
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Ajratmani o'chirish"
      disabled={pending}
      onClick={() => {
        if (confirm("Bu yozuvni o'chirasizmi?")) startTransition(() => deleteAllocation(id))
      }}
    >
      <Trash2 className="text-muted-foreground" />
    </Button>
  )
}

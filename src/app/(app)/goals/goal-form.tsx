"use client"

import { useState } from "react"
import { AmountInput } from "@/components/amount-input"
import { FormError } from "@/components/form-error"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useFormAction } from "@/hooks/use-form-action"
import { formatMoney } from "@/lib/format"
import { formatAmountInput } from "@/lib/money"
import type { Currency, GoalKind, GoalSummary } from "@/lib/types"
import { cn } from "@/lib/utils"
import { createGoal, updateGoal } from "./actions"

export const RESERVE_NAME = "Favqulodda zaxira"

export function GoalForm({
  goal,
  monthlyFixed,
  template,
}: {
  goal?: GoalSummary
  /** Sozlamadagi oylik majburiy xarajat — zaxira shabloni uchun (× 3) */
  monthlyFixed: number | null
  template?: "reserve"
}) {
  const [state, action, pending] = useFormAction(goal ? updateGoal : createGoal, {})
  const reserveTarget = monthlyFixed ? formatAmountInput(String(monthlyFixed * 3)) : ""
  const [name, setName] = useState(goal?.name ?? (template === "reserve" ? RESERVE_NAME : ""))
  const [kind, setKind] = useState<GoalKind>(goal?.kind ?? "saving")
  const [currency, setCurrency] = useState<Currency>(goal?.currency ?? "UZS")
  const [target, setTarget] = useState(goal ? formatAmountInput(String(goal.target_amount)) : template === "reserve" ? reserveTarget : "")
  const [start, setStart] = useState(goal && Number(goal.start_amount) > 0 ? formatAmountInput(String(goal.start_amount)) : "")
  const [plan, setPlan] = useState(goal?.monthly_plan ? formatAmountInput(String(goal.monthly_plan)) : "")
  const [priority, setPriority] = useState(String(goal?.priority ?? 1))

  const applyReserve = () => {
    setName(RESERVE_NAME)
    setKind("saving")
    setCurrency("UZS")
    setTarget(reserveTarget)
    setPriority("1")
  }

  return (
    <form onSubmit={action} className="space-y-4">
      {goal && <input type="hidden" name="id" value={goal.id} />}
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="currency" value={currency} />

      {!goal && (
        <button
          type="button"
          onClick={applyReserve}
          className={cn(
            "w-full rounded-xl border p-3 text-left",
            name === RESERVE_NAME ? "border-primary ring-1 ring-primary" : "bg-card"
          )}
        >
          <span className="block text-sm font-medium">🛟 Favqulodda zaxira (shablon)</span>
          <span className="block text-xs text-muted-foreground">
            {monthlyFixed
              ? `Oylik majburiy xarajat × 3 = ${formatMoney(monthlyFixed * 3, "UZS")} (budjet yoki sozlamadan, o'zgartirish mumkin)`
              : "Summa uchun avval Budjetda \"Majburiy doimiy\" rejani yoki Sozlamalarda oylik majburiy xarajatni kiriting — yoki summani o'zingiz yozing"}
          </span>
        </button>
      )}

      {!goal && (
        <Segmented
          value={kind}
          onChange={(v) => setKind(v as GoalKind)}
          options={[
            { value: "saving", label: "Jamg'arma" },
            { value: "debt", label: "Qarz" },
          ]}
        />
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Nomi</Label>
        <Input
          id="name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={80}
          className="h-11 text-base"
          placeholder={kind === "saving" ? "Masalan: To'y, mashina" : "Masalan: Kredit, do'stdan qarz"}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="target_amount">{kind === "saving" ? "Maqsad summasi" : "Qarz summasi"}</Label>
        <div className="flex gap-2">
          <AmountInput id="target_amount" name="target_amount" value={target} onChange={setTarget} required placeholder="0" className="flex-1" />
          <div className="w-28">
            <Segmented
              value={currency}
              onChange={(v) => setCurrency(v as Currency)}
              options={[
                { value: "UZS", label: "so'm" },
                { value: "USD", label: "$" },
              ]}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="start_amount">{kind === "saving" ? "Allaqachon yig'ilgan (ilovadan tashqarida)" : "Allaqachon to'langan"}</Label>
        <AmountInput id="start_amount" name="start_amount" value={start} onChange={setStart} placeholder="0" />
        {kind === "saving" && (
          <p className="text-xs text-muted-foreground">
            Masalan depozitdagi pul. Progressga kiradi, xavfsiz puldan ayrilmaydi. Pul ilova hamyonida bo&apos;lsa — maqsad yaratilgach &quot;Ajratish&quot; qiling.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="deadline">Muddat</Label>
          <Input id="deadline" name="deadline" type="date" defaultValue={goal?.deadline ?? ""} className="h-11 text-base" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="priority">Ustuvorlik</Label>
          <Input
            id="priority"
            name="priority"
            inputMode="numeric"
            value={priority}
            onChange={(e) => setPriority(e.target.value.replace(/\D/g, ""))}
            className="h-11 text-base tabular-nums"
          />
        </div>
      </div>
      <p className="-mt-2 text-xs text-muted-foreground">Ustuvorlik: 1 — eng muhim (qarz odatda 1-o&apos;rinda).</p>

      <div className="space-y-2">
        <Label htmlFor="monthly_plan">Oylik rejadagi to&apos;lov (ixtiyoriy)</Label>
        <AmountInput id="monthly_plan" name="monthly_plan" value={plan} onChange={setPlan} placeholder="Bo'sh — muddatdan avtomatik" />
        <p className="text-xs text-muted-foreground">Kunlik limit shu summaga tayanadi. Bo&apos;sh bo&apos;lsa: qolgan summa ÷ muddatgacha qolgan oylar.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="note">Izoh</Label>
        <Textarea id="note" name="note" defaultValue={goal?.note ?? ""} maxLength={300} className="text-base" />
      </div>

      <FormError message={state.error} />
      <Button type="submit" className="h-11 w-full" disabled={pending}>
        {pending ? "Saqlanmoqda..." : "Saqlash"}
      </Button>
    </form>
  )
}

function Segmented({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn("h-9 rounded-md text-sm font-medium", value === o.value ? "bg-background shadow-sm" : "text-muted-foreground")}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

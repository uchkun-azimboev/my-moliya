"use client"

import { useState, useTransition } from "react"
import { AmountInput } from "@/components/amount-input"
import { FormError } from "@/components/form-error"
import { Button } from "@/components/ui/button"
import { NativeSelect } from "@/components/ui/native-select"
import { formatMoney } from "@/lib/format"
import { formatAmountInput } from "@/lib/money"
import { cn } from "@/lib/utils"
import { copyPreviousMonth, saveBudget } from "./actions"

export type BudgetLine = {
  category_id: string
  name: string
  icon: string | null
  group_type: string | null
  archived: boolean
  planned: number | null
  actual: number
  remaining: number | null
  over: number | null
}

const sum = (v: number) => formatMoney(v, "UZS").replace(" so'm", "")

/** Bitta kategoriya: fakt / reja, progress, qolgan yoki oshib ketgan; bosilsa rejani o'zgartirish */
export function BudgetRow({ line, month }: { line: BudgetLine; month: string }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(line.planned !== null ? formatAmountInput(String(line.planned)) : "")
  const [error, setError] = useState<string>()
  const [pending, startTransition] = useTransition()

  const planned = line.planned === null ? null : Number(line.planned)
  const actual = Number(line.actual)
  const over = Number(line.over ?? 0)
  const pct = planned ? Math.min((actual / planned) * 100, 100) : actual > 0 ? 100 : 0

  const save = () =>
    startTransition(async () => {
      const r = await saveBudget(month, line.category_id, value)
      setError(r.error)
      if (!r.error) setEditing(false)
    })

  return (
    <li className="px-4 py-3">
      <button type="button" className="block w-full text-left" onClick={() => setEditing((e) => !e)} aria-expanded={editing}>
        <div className="flex items-baseline justify-between gap-3">
          <span className="min-w-0 truncate text-sm font-medium">
            {line.icon && `${line.icon} `}
            {line.name}
          </span>
          <span className="shrink-0 text-sm tabular-nums">
            <span className={cn(over > 0 && "font-semibold text-destructive")}>{sum(actual)}</span>
            <span className="text-muted-foreground"> / {planned === null ? "reja yo'q" : sum(planned)}</span>
          </span>
        </div>
        {planned !== null && (
          <>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className={cn("h-full rounded-full", over > 0 ? "bg-destructive" : "bg-primary")} style={{ width: `${pct}%` }} />
            </div>
            <p className={cn("mt-1 text-xs", over > 0 ? "text-destructive" : "text-muted-foreground")}>
              {over > 0 ? `${formatMoney(over, "UZS")} oshib ketdi` : `qolgan ${formatMoney(line.remaining ?? 0, "UZS")}`}
            </p>
          </>
        )}
        {planned === null && !editing && <p className="mt-1 text-xs text-muted-foreground">+ reja qo&apos;shish</p>}
      </button>
      {editing && (
        <div className="mt-3 space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <AmountInput aria-label={`${line.name} rejasi`} value={value} onChange={setValue} placeholder="Reja" className="pr-14" autoFocus />
              <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">so&apos;m</span>
            </div>
            <Button className="h-11" disabled={pending} onClick={save}>
              Saqlash
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Bo&apos;sh qoldirib saqlasangiz — reja o&apos;chadi.</p>
          <FormError message={error} />
        </div>
      )}
    </li>
  )
}

/** Hali rejasi va xarajati yo'q kategoriyaga reja qo'shish */
export function AddBudgetRow({ month, categories }: { month: string; categories: { id: string; name: string; icon: string | null }[] }) {
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "")
  const [value, setValue] = useState("")
  const [error, setError] = useState<string>()
  const [pending, startTransition] = useTransition()

  return (
    <section className="rounded-xl border border-dashed p-4">
      <h2 className="mb-3 text-sm font-medium">Kategoriyaga reja qo&apos;shish</h2>
      <div className="space-y-2">
        <NativeSelect aria-label="Kategoriya" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon ? `${c.icon} ` : ""}
              {c.name}
            </option>
          ))}
        </NativeSelect>
        <div className="flex gap-2">
          <AmountInput aria-label="Reja summasi" value={value} onChange={setValue} placeholder="Reja, so'm" className="flex-1" />
          <Button
            className="h-11"
            disabled={pending || !value}
            onClick={() =>
              startTransition(async () => {
                const r = await saveBudget(month, categoryId, value)
                setError(r.error)
                if (!r.error) setValue("")
              })
            }
          >
            Qo&apos;shish
          </Button>
        </div>
        <FormError message={error} />
      </div>
    </section>
  )
}

export function CopyPreviousButton({ month, prevLabel }: { month: string; prevLabel: string }) {
  const [message, setMessage] = useState<{ ok: boolean; text: string }>()
  const [pending, startTransition] = useTransition()
  return (
    <div className="mb-4">
      <Button
        variant="outline"
        className="h-10 w-full"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const r = await copyPreviousMonth(month)
            setMessage(r.error ? { ok: false, text: r.error } : { ok: true, text: `${r.copied} ta reja nusxalandi` })
          })
        }
      >
        {prevLabel} rejasini nusxalash
      </Button>
      {message && (
        <p className={cn("mt-1 text-center text-xs", message.ok ? "text-income" : "text-muted-foreground")}>{message.text}</p>
      )}
      <p className="mt-1 text-center text-xs text-muted-foreground">Faqat rejasi yo&apos;q kategoriyalar to&apos;ldiriladi.</p>
    </div>
  )
}

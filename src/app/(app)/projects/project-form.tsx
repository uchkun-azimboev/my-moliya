"use client"

import Link from "next/link"
import { useState } from "react"
import { AmountInput } from "@/components/amount-input"
import { FormError } from "@/components/form-error"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"
import { useFormAction } from "@/hooks/use-form-action"
import { formatPercent } from "@/lib/format"
import { formatAmountInput } from "@/lib/money"
import type { Client, Currency, ProgressMode, ProjectSummary } from "@/lib/types"
import { cn } from "@/lib/utils"
import { createProject, updateProject } from "./actions"

export function ProjectForm({ clients, today, project }: { clients: Client[]; today: string; project?: ProjectSummary }) {
  const [state, action, pending] = useFormAction(project ? updateProject : createProject, {})
  const [currency, setCurrency] = useState<Currency>(project?.currency ?? "UZS")
  const [amount, setAmount] = useState(project ? formatAmountInput(String(project.total_amount)) : "")
  const [mode, setMode] = useState<ProgressMode>(project?.progress_mode ?? "percent")
  const [unitsTotal, setUnitsTotal] = useState(String(project?.units_total ?? ""))
  const [unitsDone, setUnitsDone] = useState(String(project?.units_done ?? 0))

  if (clients.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        Avval{" "}
        <Link href="/clients/new?back=/projects/new" className="underline">
          mijoz qo&apos;shing
        </Link>
        .
      </div>
    )
  }

  const total = Number(unitsTotal)
  const done = Number(unitsDone)
  const unitsPercent = total > 0 && done >= 0 && done <= total ? formatPercent((done / total) * 100) : null

  return (
    <form onSubmit={action} className="space-y-4">
      {project && <input type="hidden" name="id" value={project.id} />}
      <input type="hidden" name="currency" value={currency} />
      <input type="hidden" name="progress_mode" value={mode} />

      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <Label htmlFor="client_id">Mijoz</Label>
          {!project && (
            <Link href="/clients/new?back=/projects/new" className="text-xs text-muted-foreground underline">
              + Yangi mijoz
            </Link>
          )}
        </div>
        <NativeSelect id="client_id" name="client_id" defaultValue={project?.client_id ?? clients[0].id}>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Loyiha nomi</Label>
        <Input id="name" name="name" defaultValue={project?.name} required maxLength={100} className="h-11 text-base" placeholder="Masalan: Instagram reklama" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="total_amount">Umumiy summa</Label>
        <div className="flex gap-2">
          <AmountInput id="total_amount" name="total_amount" value={amount} onChange={setAmount} required placeholder="0" className="flex-1" />
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="min-w-0 space-y-2">
          <Label htmlFor="start_date">Boshlanish</Label>
          <Input id="start_date" name="start_date" type="date" defaultValue={project?.start_date ?? today} required className="h-11 text-base" />
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor="end_date">Tugash</Label>
          <Input id="end_date" name="end_date" type="date" defaultValue={project?.end_date ?? ""} className="h-11 text-base" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Bajarilish</Label>
        <Segmented
          full
          value={mode}
          onChange={(v) => setMode(v as ProgressMode)}
          options={[
            { value: "percent", label: "Foizda" },
            { value: "units", label: "Birlikda" },
          ]}
        />
        {mode === "percent" ? (
          <div className="relative">
            <Input
              name="progress_percent"
              aria-label="Bajarilish foizi"
              inputMode="decimal"
              defaultValue={String(Number(project?.progress_percent ?? 0))}
              className="h-11 pr-8 text-base tabular-nums"
            />
            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">%</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Input
                name="units_total"
                aria-label="Jami birlik"
                inputMode="numeric"
                placeholder="Jami (masalan 12)"
                value={unitsTotal}
                onChange={(e) => setUnitsTotal(e.target.value.replace(/\D/g, ""))}
                className="h-11 text-base tabular-nums"
              />
              <Input
                name="units_done"
                aria-label="Tayyor birlik"
                inputMode="numeric"
                placeholder="Tayyor (masalan 5)"
                value={unitsDone}
                onChange={(e) => setUnitsDone(e.target.value.replace(/\D/g, ""))}
                className="h-11 text-base tabular-nums"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {unitsPercent ? `Bajarilish: ${unitsPercent}` : "Masalan: 12 ta video, 5 tasi tayyor → 41,7%"}
            </p>
          </>
        )}
      </div>

      <label className="flex items-start gap-3 rounded-xl border bg-card p-3">
        <input type="checkbox" name="is_retainer" defaultChecked={project?.is_retainer} className="mt-0.5 size-5 accent-primary" />
        <span>
          <span className="block text-sm font-medium">Oylik (retainer) loyiha</span>
          <span className="block text-xs text-muted-foreground">Har oy &quot;Keyingi oyni ochish&quot; bilan yangi davr yaratiladi.</span>
        </span>
      </label>

      <div className="space-y-2">
        <Label htmlFor="note">Izoh</Label>
        <Textarea id="note" name="note" defaultValue={project?.note ?? ""} maxLength={300} className="text-base" />
      </div>

      <FormError message={state.error} />
      <Button type="submit" className="h-11 w-full" disabled={pending}>
        {pending ? "Saqlanmoqda..." : "Saqlash"}
      </Button>
    </form>
  )
}

function Segmented({
  value,
  onChange,
  options,
  full,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  full?: boolean
}) {
  return (
    <div className={cn("grid gap-1 rounded-lg bg-muted p-1", full ? "grid-cols-2" : "w-28 grid-cols-2")}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "h-9 rounded-md text-sm font-medium",
            value === o.value ? "bg-background shadow-sm" : "text-muted-foreground"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

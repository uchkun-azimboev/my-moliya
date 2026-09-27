"use client"

import { useState, useTransition } from "react"
import { Minus, Plus } from "lucide-react"
import { FormError } from "@/components/form-error"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { ProjectSummary } from "@/lib/types"
import { updateProgress } from "./actions"

/** Bajarilishni tez yangilash: birlikda −1/+1 yoki aniq son, foizda 25/50/75/100 yoki aniq foiz */
export function ProgressQuickUpdate({ project }: { project: ProjectSummary }) {
  const units = project.progress_mode === "units"
  const current = units ? String(project.units_done ?? 0) : String(Number(project.progress_percent))
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(current)
  const [error, setError] = useState<string>()
  const [pending, startTransition] = useTransition()

  const save = (v: string) =>
    startTransition(async () => {
      const result = await updateProgress(project.id, v)
      setError(result.error)
      if (!result.error) {
        setValue(v)
        if (!units) setOpen(false)
      }
    })

  if (!open) {
    return (
      <Button variant="secondary" className="h-10 w-full" onClick={() => setOpen(true)}>
        Bajarilishni yangilash
      </Button>
    )
  }

  const done = Number(value)
  return (
    <div className="space-y-3">
      {units ? (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="size-10" aria-label="Bittaga kamaytirish" disabled={pending || done <= 0} onClick={() => save(String(done - 1))}>
            <Minus />
          </Button>
          <div className="flex flex-1 items-center justify-center gap-1.5 text-sm">
            <Input
              aria-label="Tayyor birliklar"
              inputMode="numeric"
              value={value}
              onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))}
              className="h-10 w-16 text-center text-base tabular-nums"
            />
            <span className="text-muted-foreground">/ {project.units_total} tayyor</span>
          </div>
          <Button variant="outline" size="icon" className="size-10" aria-label="Bittaga oshirish" disabled={pending || done >= (project.units_total ?? 0)} onClick={() => save(String(done + 1))}>
            <Plus />
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {[25, 50, 75, 100].map((p) => (
            <Button key={p} variant={Number(value) === p ? "default" : "outline"} className="h-10" disabled={pending} onClick={() => save(String(p))}>
              {p}%
            </Button>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        {!units && (
          <div className="relative flex-1">
            <Input
              aria-label="Bajarilish foizi"
              inputMode="decimal"
              value={value}
              onChange={(e) => setValue(e.target.value.replace(/[^\d.,]/g, "").replace(",", "."))}
              className="h-10 pr-8 text-base tabular-nums"
            />
            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">%</span>
          </div>
        )}
        <Button className="h-10 flex-1" disabled={pending || value === ""} onClick={() => save(value)}>
          {pending ? "Saqlanmoqda..." : "Saqlash"}
        </Button>
        <Button variant="ghost" className="h-10" onClick={() => setOpen(false)}>
          Yopish
        </Button>
      </div>
      <FormError message={error} />
    </div>
  )
}

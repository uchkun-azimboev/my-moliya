"use client"

import { useState, useTransition } from "react"
import { FormError } from "@/components/form-error"
import { Button } from "@/components/ui/button"
import { useFormAction } from "@/hooks/use-form-action"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import type { ActionState } from "@/lib/action-state"
import { CATEGORY_GROUP_LABEL, type Category, type CategoryGroup } from "@/lib/types"
import { cn } from "@/lib/utils"
import { createCategory, deleteCategory, setCategoryArchived, updateCategory } from "./actions"

export function CategoryForm({ category }: { category?: Category }) {
  const [state, action, pending] = useFormAction(category ? updateCategory : createCategory, {})
  const [kind, setKind] = useState(category?.kind ?? "expense")
  const [extra, setExtra] = useState<ActionState>({})
  const [busy, startTransition] = useTransition()

  const run = (fn: () => Promise<ActionState>) =>
    startTransition(async () => setExtra(await fn()))

  return (
    <>
      <form onSubmit={action} className="space-y-4">
        {category && <input type="hidden" name="id" value={category.id} />}
        <input type="hidden" name="kind" value={kind} />

        <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
          {(["expense", "income"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={cn(
                "h-9 rounded-md text-sm font-medium",
                kind === k ? "bg-background shadow-sm" : "text-muted-foreground"
              )}
            >
              {k === "expense" ? "Xarajat" : "Daromad"}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-[4.5rem_1fr] gap-3">
          <div className="space-y-2">
            <Label htmlFor="icon">Belgi</Label>
            <Input id="icon" name="icon" defaultValue={category?.icon ?? ""} maxLength={8} className="h-11 text-center text-xl" placeholder="🛒" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Nomi</Label>
            <Input id="name" name="name" defaultValue={category?.name} required maxLength={40} className="h-11 text-base" />
          </div>
        </div>

        {kind === "expense" ? (
          <div className="space-y-2">
            <Label htmlFor="group_type">Guruh</Label>
            <NativeSelect id="group_type" name="group_type" defaultValue={category?.group_type ?? "variable"}>
              {(Object.keys(CATEGORY_GROUP_LABEL) as CategoryGroup[]).map((g) => (
                <option key={g} value={g}>
                  {CATEGORY_GROUP_LABEL[g]}
                </option>
              ))}
            </NativeSelect>
            <p className="text-xs text-muted-foreground">
              &quot;Majburiy doimiy&quot; — har oy albatta to&apos;lanadigan xarajatlar (ijara, kommunal). Kunlik limit va runway shunga tayanadi.
            </p>
          </div>
        ) : (
          <input type="hidden" name="group_type" value="" />
        )}

        <FormError message={state.error} />
        <Button type="submit" className="h-11 w-full" disabled={pending}>
          {pending ? "Saqlanmoqda..." : "Saqlash"}
        </Button>
      </form>

      {category && (
        <div className="mt-8 space-y-3 border-t pt-6">
          <FormError message={extra.error} />
          <Button
            variant="outline"
            className="h-11 w-full"
            disabled={busy}
            onClick={() => run(() => setCategoryArchived(category.id, !category.archived))}
          >
            {category.archived ? "Arxivdan chiqarish" : "Arxivlash"}
          </Button>
          <Button
            variant="ghost"
            className="h-11 w-full text-destructive"
            disabled={busy}
            onClick={() => {
              if (confirm(`"${category.name}" kategoriyasini o'chirasizmi?`)) run(() => deleteCategory(category.id))
            }}
          >
            O&apos;chirish
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Tranzaksiyalari bor kategoriyani o&apos;chirib bo&apos;lmaydi — uni arxivlang.
          </p>
        </div>
      )}
    </>
  )
}

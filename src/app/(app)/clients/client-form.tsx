"use client"

import { useState, useTransition } from "react"
import { FormError } from "@/components/form-error"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useFormAction } from "@/hooks/use-form-action"
import type { ActionState } from "@/lib/action-state"
import type { Client } from "@/lib/types"
import { createClientAction, deleteClientAction, setClientArchived, updateClientAction } from "./actions"

export function ClientForm({ client, back }: { client?: Client; back?: string }) {
  const [state, action, pending] = useFormAction(client ? updateClientAction : createClientAction, {})
  const [extra, setExtra] = useState<ActionState>({})
  const [busy, startTransition] = useTransition()

  const run = (fn: () => Promise<ActionState>) => startTransition(async () => setExtra(await fn()))

  return (
    <>
      <form onSubmit={action} className="space-y-4">
        {client && <input type="hidden" name="id" value={client.id} />}
        {back && <input type="hidden" name="back" value={back} />}
        <div className="space-y-2">
          <Label htmlFor="name">Nomi</Label>
          <Input id="name" name="name" defaultValue={client?.name} required maxLength={80} className="h-11 text-base" placeholder="Masalan: Alfa Market" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="note">Izoh</Label>
          <Textarea id="note" name="note" defaultValue={client?.note ?? ""} maxLength={300} className="text-base" placeholder="Aloqa, shartlar..." />
        </div>
        <FormError message={state.error} />
        <Button type="submit" className="h-11 w-full" disabled={pending}>
          {pending ? "Saqlanmoqda..." : "Saqlash"}
        </Button>
      </form>

      {client && (
        <div className="mt-8 space-y-3 border-t pt-6">
          <FormError message={extra.error} />
          <Button
            variant="outline"
            className="h-11 w-full"
            disabled={busy}
            onClick={() => run(() => setClientArchived(client.id, !client.archived))}
          >
            {client.archived ? "Arxivdan chiqarish" : "Arxivlash"}
          </Button>
          <Button
            variant="ghost"
            className="h-11 w-full text-destructive"
            disabled={busy}
            onClick={() => {
              if (confirm(`"${client.name}" mijozini o'chirasizmi?`)) run(() => deleteClientAction(client.id))
            }}
          >
            O&apos;chirish
          </Button>
        </div>
      )}
    </>
  )
}

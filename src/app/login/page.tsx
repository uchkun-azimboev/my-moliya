"use client"

import { Button } from "@/components/ui/button"
import { useFormAction } from "@/hooks/use-form-action"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { login } from "./actions"

export default function LoginPage() {
  const [state, action, pending] = useFormAction(login, {})

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6">
      <h1 className="mb-1 text-2xl font-semibold">Moliya</h1>
      <p className="mb-8 text-sm text-muted-foreground">Davom etish uchun tizimga kiring</p>

      <form onSubmit={action} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required className="h-11 text-base" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Parol</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="h-11 text-base"
          />
        </div>
        {state.error && <p className="text-sm text-destructive">{state.error}</p>}
        <Button type="submit" className="h-11 w-full" disabled={pending}>
          {pending ? "Kirilmoqda..." : "Kirish"}
        </Button>
      </form>
    </main>
  )
}

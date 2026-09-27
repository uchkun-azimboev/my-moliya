import { logout } from "@/app/login/actions"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { createClient, requireUser } from "@/lib/supabase/server"
import { FixedExpensesForm } from "./fixed-expenses-form"
import { ThemePicker } from "./theme-picker"

export default async function SettingsPage() {
  const supabase = await createClient()
  const [, { data }] = await Promise.all([
    requireUser(),
    supabase.from("settings").select("monthly_fixed_expenses").maybeSingle(),
  ])

  return (
    <>
      <PageHeader title="Sozlamalar" back="/" />

      <section className="mb-8">
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Mavzu</h2>
        <ThemePicker />
        <p className="mt-2 text-xs text-muted-foreground">Tanlov shu qurilmada saqlanadi.</p>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Oylik majburiy xarajatlar</h2>
        <FixedExpensesForm value={data?.monthly_fixed_expenses ?? null} />
      </section>

      <form action={logout} className="border-t pt-6">
        <Button type="submit" variant="outline" className="h-11 w-full">
          Chiqish
        </Button>
      </form>
    </>
  )
}

import Link from "next/link"
import { ChevronRight, Download, Tags } from "lucide-react"
import { logout } from "@/app/login/actions"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { createClient, requireUser } from "@/lib/supabase/server"
import { FixedExpensesForm } from "./fixed-expenses-form"
import { InstallApp } from "./install-app"
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
        <Link href="/categories" className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 active:bg-accent">
          <Tags className="size-5 text-muted-foreground" />
          <span className="flex-1 font-medium">Kategoriyalar</span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </Link>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Mavzu</h2>
        <ThemePicker />
        <p className="mt-2 text-xs text-muted-foreground">Tanlov shu qurilmada saqlanadi.</p>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Oylik majburiy xarajatlar</h2>
        <FixedExpensesForm value={data?.monthly_fixed_expenses ?? null} />
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Ma&apos;lumotlarni yuklab olish</h2>
        <div className="grid grid-cols-2 gap-2">
          <a href="/export/moliya.xlsx" download className="flex h-11 items-center justify-center gap-2 rounded-md border bg-card text-sm font-medium active:bg-accent">
            <Download className="size-4" /> Excel (hammasi)
          </a>
          <a href="/export/tranzaksiyalar.csv" download className="flex h-11 items-center justify-center gap-2 rounded-md border bg-card text-sm font-medium active:bg-accent">
            <Download className="size-4" /> CSV (tranzaksiyalar)
          </a>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Zaxira nusxa: Excel faylida barcha jadvallar alohida varaqlarda (hamyonlar, tranzaksiyalar, loyihalar, maqsadlar, budjet...).
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Ilovani o&apos;rnatish</h2>
        <InstallApp />
      </section>

      <form action={logout} className="border-t pt-6">
        <Button type="submit" variant="outline" className="h-11 w-full">
          Chiqish
        </Button>
      </form>
    </>
  )
}

import { loadTransactions, toCsv } from "@/lib/export-data"
import { today } from "@/lib/format"
import { requireUser } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const { supabase } = await requireUser()
  const csv = toCsv(await loadTransactions(supabase))
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="tranzaksiyalar-${today()}.csv"`,
      "Cache-Control": "no-store",
    },
  })
}

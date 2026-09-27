import writeXlsxFile from "write-excel-file/node"
import { loadAllTables } from "@/lib/export-data"
import { today } from "@/lib/format"
import { requireUser } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

/** Barcha ma'lumotlar Excel'da — har bir jadval alohida varaqda (zaxira nusxa) */
export async function GET() {
  const { supabase } = await requireUser()
  const tables = await loadAllTables(supabase)
  const buffer = await writeXlsxFile(
    tables.map((t) => ({
      sheet: t.name,
      stickyRowsCount: 1,
      columns: t.header.map((h) => ({ width: Math.min(Math.max(h.length + 2, 12), 28) })),
      data: [
        t.header.map((h) => ({ value: h, fontWeight: "bold" as const })),
        ...t.rows.map((r) => r.map((v) => (v === null ? null : v))),
      ],
    }))
  ).toBuffer()

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="moliya-${today()}.xlsx"`,
      "Cache-Control": "no-store",
    },
  })
}

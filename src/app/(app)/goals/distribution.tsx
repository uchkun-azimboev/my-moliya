import Link from "next/link"
import { formatMoney } from "@/lib/format"
import type { GoalSummary } from "@/lib/types"
import { cn } from "@/lib/utils"

/**
 * Pul taqsimoti tavsiyasi (faqat ko'rsatadi, hech narsa yozmaydi):
 * xavfsiz pul → 1) majburiy xarajatlar qolgani → 2) maqsadlar ustuvorlik bo'yicha (shu oy kerakli) → 3) erkin pul
 */
export function Distribution({
  safe,
  fixedRemaining,
  goals,
}: {
  safe: number
  fixedRemaining: number
  goals: GoalSummary[]
}) {
  let pool = Math.max(safe, 0)
  const rows: { key: string; label: string; need: number; give: number; href?: string }[] = []

  const fixedGive = Math.min(pool, fixedRemaining)
  pool -= fixedGive
  rows.push({ key: "fixed", label: "Majburiy xarajatlar", need: fixedRemaining, give: fixedGive })

  for (const g of goals
    .filter((g) => g.status === "active" && Number(g.month_left_uzs) > 0)
    .sort((a, b) => a.priority - b.priority)) {
    const need = Number(g.month_left_uzs)
    const give = Math.min(pool, need)
    pool -= give
    rows.push({ key: g.id, label: `#${g.priority} ${g.name}`, need, give, href: `/goals/${g.id}` })
  }

  const short = rows.reduce((s, r) => s + (r.need - r.give), 0)

  return (
    <section className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-medium">Taqsimot tavsiyasi</h2>
        <span className="text-xs text-muted-foreground">xavfsiz pul: {formatMoney(safe, "UZS")}</span>
      </div>
      <ol className="space-y-2 text-sm">
        {rows.map((r, i) => (
          <li key={r.key} className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate">
              <span className="text-muted-foreground">{i + 1}. </span>
              {r.href ? (
                <Link href={r.href} prefetch={false} className="underline-offset-2 hover:underline">
                  {r.label}
                </Link>
              ) : (
                r.label
              )}
            </span>
            <span className={cn("shrink-0 tabular-nums", r.give < r.need && "text-destructive")}>
              {formatMoney(r.give, "UZS")}
              {r.give < r.need && <span className="text-xs"> / {formatMoney(r.need, "UZS")}</span>}
            </span>
          </li>
        ))}
        <li className="flex items-baseline justify-between gap-3 border-t pt-2 font-semibold">
          <span>{rows.length + 1}. Erkin pul</span>
          <span className="tabular-nums">{formatMoney(pool, "UZS")}</span>
        </li>
      </ol>
      {short > 0 && (
        <p className="mt-3 text-xs text-destructive">Shu oy rejaga {formatMoney(short, "UZS")} yetmayapti.</p>
      )}
    </section>
  )
}

"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { AlertTriangle, CalendarPlus } from "lucide-react"
import { FormError } from "@/components/form-error"
import { Button } from "@/components/ui/button"
import type { ActionState } from "@/lib/action-state"
import { formatMoney, formatPercent, formatShortDate, nextPeriod } from "@/lib/format"
import type { ProjectSummary } from "@/lib/types"
import { deleteProject, openNextPeriod, setProjectClosed, setProjectContinues } from "../actions"

export function ProjectActions({ project, nextPeriodId }: { project: ProjectSummary; nextPeriodId: string | null }) {
  const [closePrevious, setClosePrevious] = useState(true)
  const [continues, setContinues] = useState(project.continues)
  const [result, setResult] = useState<ActionState>({})
  const [busy, startTransition] = useTransition()
  const run = (fn: () => Promise<ActionState>) => startTransition(async () => setResult(await fn()))

  const period = nextPeriod(project.start_date, project.end_date)
  const unfinished = Number(project.progress) < 100 && project.status !== "done"

  return (
    <div className="space-y-3 border-t pt-6">
      {project.is_retainer && (
        <label className="flex items-start gap-3 rounded-xl border bg-card p-3">
          <input
            type="checkbox"
            checked={continues}
            onChange={(e) => {
              // darhol ko'rinadi; server xato qaytarsa — eski holatga qaytadi
              const v = e.target.checked
              setContinues(v)
              startTransition(async () => {
                const r = await setProjectContinues(project.id, v)
                setResult(r)
                if (r.error) setContinues(!v)
              })
            }}
            className="mt-0.5 size-5 accent-primary"
          />
          <span>
            <span className="block text-sm font-medium">Davom etadi</span>
            <span className="block text-xs text-muted-foreground">
              Prognozda keyingi oylarda ham har davr boshida {formatMoney(project.total_amount, project.currency)} tushadi deb hisoblanadi
              (&quot;Retainer bilan&quot; chizig&apos;i).
            </span>
          </span>
        </label>
      )}
      {project.is_retainer &&
        (nextPeriodId ? (
          <Button asChild variant="outline" className="h-11 w-full">
            <Link href={`/projects/${nextPeriodId}`}>Keyingi davrga o&apos;tish →</Link>
          </Button>
        ) : (
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <p className="text-sm">
              Keyingi davr: <b>{formatShortDate(period.start)}</b>
              {period.end && (
                <>
                  {" – "}
                  <b>{formatShortDate(period.end)}</b>
                </>
              )}
              , {formatMoney(project.total_amount, project.currency)}
            </p>
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={closePrevious}
                onChange={(e) => setClosePrevious(e.target.checked)}
                className="size-5 accent-primary"
              />
              Oldingi davrni yopish
            </label>
            {closePrevious && unfinished && (
              <p className="flex gap-2 rounded-lg bg-warning px-3 py-2 text-sm text-warning-foreground">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <span>
                  Oldingi davr {formatPercent(project.progress)} bajarilgan, yopilsa{" "}
                  <b className="tabular-nums">{formatMoney(project.obligation_uzs, "UZS")}</b> majburiyat hisobdan chiqadi.
                </span>
              </p>
            )}
            <Button className="h-11 w-full" disabled={busy} onClick={() => run(() => openNextPeriod(project.id, closePrevious))}>
              <CalendarPlus /> Keyingi oyni ochish
            </Button>
          </div>
        ))}

      <FormError message={result.error} />

      {project.closed ? (
        <Button variant="outline" className="h-11 w-full" disabled={busy} onClick={() => run(() => setProjectClosed(project.id, false))}>
          Qayta ochish
        </Button>
      ) : (
        project.status !== "done" && (
          <Button
            variant="outline"
            className="h-11 w-full"
            disabled={busy}
            onClick={() => {
              const warn =
                Number(project.obligation_uzs) > 0
                  ? `\n\nLoyiha ${formatPercent(project.progress)} bajarilgan — ${formatMoney(project.obligation_uzs, "UZS")} majburiyat hisobdan chiqadi.`
                  : ""
              if (confirm(`Loyihani "To'liq bajarildi" deb yopasizmi?${warn}`)) run(() => setProjectClosed(project.id, true))
            }}
          >
            To&apos;liq bajarildi deb yopish
          </Button>
        )
      )}

      <Button
        variant="ghost"
        className="h-11 w-full text-destructive"
        disabled={busy}
        onClick={() => {
          if (confirm(`"${project.name}" loyihasini o'chirasizmi?`)) run(() => deleteProject(project.id))
        }}
      >
        O&apos;chirish
      </Button>
      {project.payments > 0 && (
        <p className="text-center text-xs text-muted-foreground">To&apos;lovlari bor loyihani o&apos;chirib bo&apos;lmaydi — uni yoping.</p>
      )}
    </div>
  )
}

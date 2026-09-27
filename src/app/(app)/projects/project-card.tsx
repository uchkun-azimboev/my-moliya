import Link from "next/link"
import { formatMoney, formatPercent, formatShortDate } from "@/lib/format"
import { PROJECT_STATUS_LABEL, type ProjectSummary } from "@/lib/types"
import { cn } from "@/lib/utils"
import { ProgressQuickUpdate } from "./progress-quick-update"

export function StatusBadge({ project }: { project: ProjectSummary }) {
  return (
    <span className="flex flex-wrap gap-1.5">
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-xs font-medium",
          project.status === "done" && "bg-income/15 text-income",
          project.status === "partial" && "bg-muted text-foreground",
          project.status === "obligation" && "bg-warning text-warning-foreground"
        )}
      >
        {PROJECT_STATUS_LABEL[project.status]}
      </span>
      {project.overdue && (
        <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-medium text-destructive">
          Muddati o&apos;tgan
        </span>
      )}
      {project.is_retainer && (
        <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">Oylik</span>
      )}
    </span>
  )
}

export function ProgressBar({ project }: { project: ProjectSummary }) {
  const width = project.status === "done" ? 100 : Math.min(Number(project.progress), 100)
  return (
    <div
      className="h-2 overflow-hidden rounded-full bg-muted"
      role="progressbar"
      aria-valuenow={Number(project.progress)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn("h-full rounded-full", project.status === "done" ? "bg-income" : project.overdue ? "bg-destructive" : "bg-primary")}
        style={{ width: `${width}%` }}
      />
    </div>
  )
}

export function progressText(p: ProjectSummary) {
  const pct = formatPercent(p.progress)
  return p.progress_mode === "units" ? `${p.units_done} / ${p.units_total} tayyor · ${pct}` : pct
}

export function periodText(p: ProjectSummary) {
  if (!p.end_date) return `${formatShortDate(p.start_date)} dan`
  return `${formatShortDate(p.start_date)} – ${formatShortDate(p.end_date)}`
}

/** 1 250 000 (so'msiz) */
const sum = (v: number) => formatMoney(v, "UZS").replace(" so'm", "")

/** Olingan / ishlab topilgan / majburiyat va kutilayotgan to'lov */
export function MoneyGrid({ project }: { project: ProjectSummary }) {
  return (
    <>
      {/* Uch ustun telefonda sig'ishi uchun raqamlar "so'm"siz — birlik bitta izohda */}
      <p className="mb-1 text-right text-[11px] text-muted-foreground">summalar so&apos;mda</p>
      <dl className="grid grid-cols-3 gap-2 text-sm">
        {[
          { label: "Olingan", value: project.received_uzs },
          { label: "Ishlab topilgan", value: project.earned_uzs },
          { label: "Majburiyat", value: project.obligation_uzs, strong: true },
        ].map((x) => (
          <div key={x.label} className="min-w-0">
            <dt className="truncate text-xs text-muted-foreground">{x.label}</dt>
            <dd
              className={cn(
                "whitespace-nowrap tabular-nums",
                x.strong ? "font-semibold" : "font-medium",
                x.strong && Number(x.value) > 0 && "text-expense"
              )}
            >
              {sum(x.value)}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-xs text-muted-foreground">
        Shartnoma: {formatMoney(project.total_amount, project.currency)}
        {project.expected_uzs !== null && Number(project.expected_uzs) > 0 && (
          <>
            {" · "}kutilayotgan to&apos;lov:{" "}
            <span className="font-medium whitespace-nowrap text-foreground tabular-nums">
              {formatMoney(project.expected_uzs, "UZS")}
            </span>
          </>
        )}
      </p>
    </>
  )
}

export function ProjectCard({ project }: { project: ProjectSummary }) {
  return (
    <article className="rounded-xl border bg-card p-4">
      <Link href={`/projects/${project.id}`} prefetch={false} className="block">
        <p className="text-xs text-muted-foreground">{project.client_name}</p>
        <h3 className="font-semibold">{project.name}</h3>
        <p className={cn("mt-0.5 text-xs", project.overdue ? "text-destructive" : "text-muted-foreground")}>
          {periodText(project)}
        </p>
        <div className="mt-2">
          <StatusBadge project={project} />
        </div>
        <div className="mt-3 mb-1.5 flex items-baseline justify-between text-xs">
          <span className="text-muted-foreground">Bajarilish</span>
          <span className="font-medium tabular-nums">{progressText(project)}</span>
        </div>
        <ProgressBar project={project} />
        <div className="mt-3">
          <MoneyGrid project={project} />
        </div>
      </Link>
      {project.status !== "done" && (
        <div className="mt-3 border-t pt-3">
          <ProgressQuickUpdate project={project} />
        </div>
      )}
    </article>
  )
}

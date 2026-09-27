import Link from "next/link"
import { formatMoney, formatPercent, formatShortDate } from "@/lib/format"
import { GOAL_KIND_LABEL, type GoalSummary } from "@/lib/types"
import { cn } from "@/lib/utils"
import { AllocationForm } from "./allocation-form"

export function GoalBadges({ goal }: { goal: GoalSummary }) {
  return (
    <span className="flex flex-wrap gap-1.5">
      <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
        {GOAL_KIND_LABEL[goal.kind]} · #{goal.priority}
      </span>
      {goal.status === "done" && (
        <span className="rounded-full bg-income/15 px-2 py-0.5 text-xs font-medium text-income">Bajarildi</span>
      )}
      {goal.status === "closed" && <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">Yopilgan</span>}
      {goal.late && (
        <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-medium text-destructive">Kech qolmoqda</span>
      )}
    </span>
  )
}

export function GoalProgress({ goal }: { goal: GoalSummary }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={Number(goal.progress)} aria-valuemin={0} aria-valuemax={100}>
      <div
        className={cn("h-full rounded-full", goal.status === "done" ? "bg-income" : goal.late ? "bg-destructive" : "bg-primary")}
        style={{ width: `${Math.min(Number(goal.progress), 100)}%` }}
      />
    </div>
  )
}

/** Maqsad raqamlari: bajarilgan / qolgan, oylik reja, muddat va real muddat */
export function GoalFacts({ goal }: { goal: GoalSummary }) {
  const m = (v: number | string) => formatMoney(v, goal.currency)
  const doneLabel = goal.kind === "saving" ? "Yig'ilgan" : "To'langan"
  const planIsManual = goal.monthly_plan !== null
  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-muted-foreground">
          {doneLabel}: <span className="font-medium text-foreground tabular-nums">{m(goal.done_amount)}</span> /{" "}
          <span className="tabular-nums">{m(goal.target_amount)}</span>
        </span>
        <span className="font-medium tabular-nums">{formatPercent(goal.progress)}</span>
      </div>
      <GoalProgress goal={goal} />
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
        <Fact label="Qolgan" value={m(goal.remaining_amount)} />
        {goal.kind === "saving" && <Fact label="Ajratilgan qoldiq" value={m(goal.reserved_amount)} />}
        {goal.status === "active" && Number(goal.plan_amount) > 0 && (
          <Fact
            label={planIsManual ? "Oylik reja" : "Oyiga kerak"}
            value={m(goal.plan_amount)}
            hint={`bu oy: ${m(goal.month_contrib)}`}
          />
        )}
        {goal.deadline && <Fact label="Muddat" value={formatShortDate(goal.deadline)} hint={goal.months_left ? `${goal.months_left} oy` : undefined} />}
        {goal.status === "active" && Number(goal.remaining_amount) > 0 && (
          <Fact
            label="Real muddat"
            value={goal.real_date ? formatShortDate(goal.real_date) : "—"}
            hint={goal.real_date ? `o'rtacha ${m(goal.avg_3m)}/oy` : "3 oyda hissa yo'q"}
            danger={goal.late}
          />
        )}
      </dl>
      {goal.late && goal.extra_needed !== null && Number(goal.extra_needed) > 0 && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Muddatga yetish uchun oyiga yana <b className="tabular-nums">{m(goal.extra_needed)}</b> kerak.
        </p>
      )}
    </div>
  )
}

function Fact({ label, value, hint, danger }: { label: string; value: string; hint?: string; danger?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn("font-medium whitespace-nowrap tabular-nums", danger && "text-destructive")}>{value}</dd>
      {hint && <dd className="truncate text-xs text-muted-foreground">{hint}</dd>}
    </div>
  )
}

export function GoalQuickAction({ goal, today }: { goal: GoalSummary; today: string }) {
  if (goal.status !== "active") return null
  return goal.kind === "saving" ? (
    <AllocationForm goal={goal} today={today} />
  ) : (
    <Link
      href={`/transactions/new?goal=${goal.id}`}
      className="flex h-10 w-full items-center justify-center rounded-md bg-secondary text-sm font-medium text-secondary-foreground"
    >
      To&apos;lov qilish
    </Link>
  )
}

export function GoalCard({ goal, today }: { goal: GoalSummary; today: string }) {
  return (
    <article className="rounded-xl border bg-card p-4">
      <Link href={`/goals/${goal.id}`} prefetch={false} className="block">
        <h3 className="font-semibold">{goal.name}</h3>
        <div className="mt-1.5 mb-3">
          <GoalBadges goal={goal} />
        </div>
        <GoalFacts goal={goal} />
      </Link>
      {goal.status === "active" && (
        <div className="mt-3 border-t pt-3">
          <GoalQuickAction goal={goal} today={today} />
        </div>
      )}
    </article>
  )
}

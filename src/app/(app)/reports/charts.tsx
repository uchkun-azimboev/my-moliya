"use client"

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { formatCompact, formatDate, formatMoney, formatShortMonth, formatTickDate } from "@/lib/format"

// Ranglar faqat tokenlardan (globals.css): --chart-* validatordan o'tgan, ikkala mavzuda alohida
const C = {
  with: "var(--chart-1)",
  without: "var(--chart-2)",
  income: "var(--chart-3)",
  expense: "var(--chart-2)",
  debt: "var(--chart-1)",
  ink: "var(--foreground)",
  grid: "var(--border)",
  muted: "var(--muted-foreground)",
  surface: "var(--card)",
  danger: "var(--destructive)",
}

const axis = { fontSize: 11, fill: C.muted }

function TipBox({ title, rows }: { title: string; rows: { color: string; label: string; value: number; dash?: boolean }[] }) {
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      <p className="mb-1 font-medium">{title}</p>
      {rows.map((r) => (
        <p key={r.label} className="flex items-center gap-2 tabular-nums">
          <span className="inline-block h-0.5 w-3" style={{ background: r.color }} />
          <span className="text-muted-foreground">{r.label}:</span> {formatMoney(Math.round(r.value), "UZS")}
        </p>
      ))}
    </div>
  )
}

export type ForecastPoint = { day: string; with: number; without: number }

/** 90 kunlik prognoz: ikki chiziq, nol chizig'i, minusga tushish kunlari */
export function ForecastChart({
  data,
  minusWith,
  minusWithout,
  hasRetainer,
}: {
  data: ForecastPoint[]
  minusWith: ForecastPoint | null
  minusWithout: ForecastPoint | null
  hasRetainer: boolean
}) {
  const ticks = [0, 29, 59, 89].filter((i) => data[i]).map((i) => data[i].day)
  return (
    <div className="h-56 w-full" role="img" aria-label="90 kunlik balans prognozi grafigi">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={C.grid} strokeDasharray="0" vertical={false} />
          <XAxis dataKey="day" ticks={ticks} tickFormatter={formatTickDate} tick={axis} tickLine={false} axisLine={false} />
          <YAxis tickFormatter={formatCompact} tick={axis} tickLine={false} axisLine={false} width={64} />
          <ReferenceLine y={0} stroke={C.muted} strokeDasharray="4 4" />
          <Tooltip
            cursor={{ stroke: C.muted, strokeWidth: 1 }}
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <TipBox
                  title={formatDate(String(label))}
                  rows={[
                    ...(hasRetainer ? [{ color: C.with, label: "Retainer bilan", value: Number(payload[0]?.payload.with) }] : []),
                    { color: C.without, label: "Retainersiz", value: Number(payload[0]?.payload.without) },
                  ]}
                />
              ) : null
            }
          />
          {hasRetainer && <Line dataKey="with" name="Retainer bilan" stroke={C.with} strokeWidth={2} dot={false} isAnimationActive={false} />}
          <Line dataKey="without" name="Retainersiz" stroke={C.without} strokeWidth={2} dot={false} isAnimationActive={false} />
          {minusWith && hasRetainer && (
            <ReferenceDot x={minusWith.day} y={minusWith.with} r={5} fill={C.danger} stroke={C.surface} strokeWidth={2} />
          )}
          {minusWithout && (
            <ReferenceDot x={minusWithout.day} y={minusWithout.without} r={5} fill={C.danger} stroke={C.surface} strokeWidth={2} />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export type TrendPoint = { month: string; income: number; expense: number; debt_paid: number; net: number }

/** Oyma-oy: daromad / xarajat / qarz to'lovlari ustunlari + sof natija chizig'i (bitta o'q, bir xil birlik) */
export function TrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <div className="h-56 w-full" role="img" aria-label="Oyma-oy daromad, xarajat va sof natija grafigi">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barGap={2} barCategoryGap="22%">
          <CartesianGrid stroke={C.grid} vertical={false} />
          <XAxis dataKey="month" tickFormatter={formatShortMonth} tick={axis} tickLine={false} axisLine={false} />
          <YAxis tickFormatter={formatCompact} tick={axis} tickLine={false} axisLine={false} width={64} />
          <ReferenceLine y={0} stroke={C.muted} />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.5 }}
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <TipBox
                  title={formatShortMonth(String(label))}
                  rows={[
                    { color: C.income, label: "Daromad", value: Number(payload[0]?.payload.income) },
                    { color: C.expense, label: "Xarajat", value: Number(payload[0]?.payload.expense) },
                    { color: C.debt, label: "Qarz to'lovlari", value: Number(payload[0]?.payload.debt_paid) },
                    { color: C.ink, label: "Sof natija", value: Number(payload[0]?.payload.net) },
                  ]}
                />
              ) : null
            }
          />
          <Bar dataKey="income" fill={C.income} radius={[4, 4, 0, 0]} maxBarSize={12} isAnimationActive={false} />
          <Bar dataKey="expense" fill={C.expense} radius={[4, 4, 0, 0]} maxBarSize={12} isAnimationActive={false} />
          <Bar dataKey="debt_paid" fill={C.debt} radius={[4, 4, 0, 0]} maxBarSize={12} isAnimationActive={false} />
          <Line
            dataKey="net"
            stroke={C.ink}
            strokeWidth={2}
            dot={{ r: 4, fill: C.ink, stroke: C.surface, strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

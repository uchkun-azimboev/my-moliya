import Link from "next/link"
import { cn } from "@/lib/utils"

/** Tranzaksiyalar bo'limi ichidagi tablar: Ro'yxat · Budjet */
export function TransactionTabs({ active, month }: { active: "list" | "budget"; month?: string }) {
  const q = month ? `?month=${month}` : ""
  return (
    <div className="mb-4 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
      {[
        { key: "list", href: `/transactions${q}`, label: "Ro'yxat" },
        { key: "budget", href: `/budget${q}`, label: "Budjet" },
      ].map((t) => (
        <Link
          key={t.key}
          href={t.href}
          replace
          className={cn(
            "flex h-9 items-center justify-center rounded-md text-sm font-medium",
            active === t.key ? "bg-background shadow-sm" : "text-muted-foreground"
          )}
        >
          {t.label}
        </Link>
      ))}
    </div>
  )
}

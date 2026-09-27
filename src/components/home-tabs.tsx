import Link from "next/link"
import { cn } from "@/lib/utils"

/** Asosiy sahifa tablari: Bugun · Hisobotlar */
export function HomeTabs({ active }: { active: "today" | "reports" }) {
  return (
    <div className="mb-4 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
      {[
        { key: "today", href: "/", label: "Bugun" },
        { key: "reports", href: "/reports", label: "Hisobotlar" },
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

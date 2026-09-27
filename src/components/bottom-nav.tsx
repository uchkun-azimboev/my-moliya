"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowLeftRight, House, Tags, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"

const items = [
  { href: "/", label: "Asosiy", icon: House },
  { href: "/transactions", label: "Tranzaksiyalar", icon: ArrowLeftRight },
  { href: "/wallets", label: "Hamyonlar", icon: Wallet },
  { href: "/categories", label: "Kategoriyalar", icon: Tags },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href)
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px]",
                  active ? "text-foreground" : "text-muted-foreground"
                )}
              >
                <Icon className="size-5" strokeWidth={active ? 2.4 : 1.8} />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

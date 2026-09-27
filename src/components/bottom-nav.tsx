"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowLeftRight, Briefcase, House, Plus, Settings, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"

const items = [
  { href: "/", label: "Asosiy", icon: House },
  { href: "/transactions", label: "Tranzaksiyalar", icon: ArrowLeftRight },
  { href: "/projects", label: "Loyihalar", icon: Briefcase },
  { href: "/wallets", label: "Hamyonlar", icon: Wallet },
  { href: "/settings", label: "Sozlamalar", icon: Settings },
]

// Sozlamalar ichidagi bo'limlar (kategoriyalar, mijozlar loyihalar ichida)
const sections: Record<string, string> = { "/categories": "/settings", "/clients": "/projects" }

/** "+" tugmasi faqat asosiy sahifalarda — formalar va tahrirlashda xalaqit bermasin */
const FAB_PAGES = ["/", "/transactions", "/projects", "/wallets", "/settings"]

export function BottomNav() {
  const pathname = usePathname()
  const section = Object.entries(sections).find(([p]) => pathname.startsWith(p))?.[1]

  return (
    <>
      {FAB_PAGES.includes(pathname) && (
        <Link
          href="/transactions/new"
          aria-label="Tranzaksiya qo'shish"
          className="fixed right-[max(1rem,calc(50%-14rem+1rem))] bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-black/20 transition-transform active:scale-95"
        >
          <Plus className="size-7" />
        </Link>
      )}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <ul className="mx-auto grid max-w-md grid-cols-5">
          {items.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href) || section === href
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2.5 text-[10px] leading-none",
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
    </>
  )
}

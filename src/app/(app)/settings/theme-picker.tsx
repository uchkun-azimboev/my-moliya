"use client"

import { useSyncExternalStore } from "react"
import { useTheme } from "next-themes"
import { Monitor, Moon, Sun } from "lucide-react"
import { cn } from "@/lib/utils"

const OPTIONS = [
  { value: "light", label: "Yorug'", icon: Sun },
  { value: "dark", label: "Qorong'i", icon: Moon },
  { value: "system", label: "Tizim", icon: Monitor },
] as const

const subscribe = () => () => {}

export function ThemePicker() {
  const { theme, setTheme } = useTheme()
  // Serverda tanlov noma'lum — faqat brauzerda belgilanadi (hydration xatosi bo'lmasin)
  const mounted = useSyncExternalStore(subscribe, () => true, () => false)
  const current = mounted ? (theme ?? "system") : null

  return (
    <div role="radiogroup" aria-label="Mavzu" className="grid grid-cols-3 gap-2">
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={current === value}
          onClick={() => setTheme(value)}
          className={cn(
            "flex flex-col items-center gap-1.5 rounded-xl border bg-card py-3 text-sm transition-colors",
            current === value ? "border-primary ring-1 ring-primary" : "text-muted-foreground"
          )}
        >
          <Icon className="size-5" />
          {label}
        </button>
      ))}
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

type Mode = "loading" | "installed" | "prompt" | "ios" | "other"

function detect(): Mode {
  const standalone =
    matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone
  if (standalone) return "installed"
  if (window.__moliyaInstall) return "prompt"
  if (/iPhone|iPad|iPod/.test(navigator.userAgent)) return "ios"
  return "other"
}

/** "Ilovani o'rnatish": Android — tugma, iPhone — yo'riqnoma, o'rnatilgan bo'lsa — belgi */
export function InstallApp() {
  const [mode, setMode] = useState<Mode>("loading")

  useEffect(() => {
    const update = () => setMode(detect())
    update()
    window.addEventListener("moliya-install-ready", update)
    return () => window.removeEventListener("moliya-install-ready", update)
  }, [])

  if (mode === "loading") return <div className="h-12" />
  if (mode === "installed") return <p className="text-sm text-income">Ilova bosh ekranga o&apos;rnatilgan ✓</p>
  if (mode === "prompt") {
    return (
      <Button
        className="h-11 w-full"
        onClick={async () => {
          const e = window.__moliyaInstall
          if (!e) return
          await e.prompt()
          await e.userChoice
          window.__moliyaInstall = undefined
          setMode(detect())
        }}
      >
        Ilovani o&apos;rnatish
      </Button>
    )
  }
  return (
    <p className="text-sm text-muted-foreground">
      {mode === "ios"
        ? "Safari'da pastdagi \"Ulashish\" (□↑) tugmasi → \"Bosh ekranga qo'shish\" (Add to Home Screen)."
        : "Brauzer menyusi (⋮) → \"Ilovani o'rnatish\" yoki \"Bosh ekranga qo'shish\"."}{" "}
      Ilova to&apos;liq ekranda, brauzer panellarisiz ochiladi.
    </p>
  )
}

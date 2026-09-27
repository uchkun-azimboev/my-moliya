import type { Metadata } from "next"
import { WifiOff } from "lucide-react"
import { RetryButton } from "./retry-button"

export const metadata: Metadata = { title: "Internet yo'q — Moliya" }

// SW bu sahifani internet yo'q paytda so'ralgan manzil o'rniga ko'rsatadi — "Qayta urinish" o'sha manzilni qayta yuklaydi.
// Login talab qilmaydi va ma'lumot ko'rsatmaydi — service worker uni oldindan keshlaydi
export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center px-6 text-center">
      <WifiOff className="mb-4 size-10 text-muted-foreground" />
      <h1 className="mb-2 text-xl font-semibold">Internet yo&apos;q</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Moliyaviy ma&apos;lumotlar xavfsizlik uchun telefonda saqlanmaydi. Internet qaytgach, qayta urinib ko&apos;ring.
      </p>
      <RetryButton />
    </main>
  )
}

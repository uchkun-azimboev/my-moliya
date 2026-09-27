"use client"

import { useEffect } from "react"

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }
declare global {
  interface Window {
    __moliyaInstall?: InstallPromptEvent
  }
}

/**
 * Service worker'ni ro'yxatdan o'tkazadi va yangilanishni boshqaradi:
 * - ilova ochilganda / qayta ko'rinishga kelganda yangi versiya tekshiriladi (reg.update);
 * - yangi SW faollashsa (controllerchange) sahifa bir marta qayta yuklanadi — foydalanuvchi
 *   forma to'ldirayotgan bo'lsa (input fokusda), qayta yuklash ilova yashiringanda bajariladi.
 * Android'dagi "o'rnatish" taklifini (beforeinstallprompt) ham ushlab qoladi — Sozlamalarda ishlatiladi.
 */
export function PwaSetup() {
  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      window.__moliyaInstall = e as InstallPromptEvent
      window.dispatchEvent(new Event("moliya-install-ready"))
    }
    window.addEventListener("beforeinstallprompt", onPrompt)

    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) {
      return () => window.removeEventListener("beforeinstallprompt", onPrompt)
    }

    const hadController = Boolean(navigator.serviceWorker.controller)
    let reloaded = false
    const reload = () => {
      if (reloaded) return
      reloaded = true
      location.reload()
    }
    const onControllerChange = () => {
      if (!hadController) return // birinchi o'rnatish — qayta yuklash shart emas
      const typing = document.activeElement?.matches("input, textarea, select")
      if (!typing || document.visibilityState === "hidden") reload()
      else document.addEventListener("visibilitychange", () => document.visibilityState === "hidden" && reload())
    }
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange)

    let registration: ServiceWorkerRegistration | undefined
    const checkUpdate = () => document.visibilityState === "visible" && registration?.update().catch(() => {})
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then((reg) => (registration = reg))
      .catch(() => {})
    document.addEventListener("visibilitychange", checkUpdate)

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt)
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange)
      document.removeEventListener("visibilitychange", checkUpdate)
    }
  }, [])
  return null
}

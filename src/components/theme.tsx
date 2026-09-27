"use client"

import { useEffect } from "react"
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"

/** Telefonning yuqori paneli (PWA) rangi — --background bilan bir xil */
export const THEME_COLORS = { light: "#fafafa", dark: "#0a0a0a" } as const

/**
 * Sahifa chizilishidan oldin ishlaydi: tanlangan mavzuga qarab theme-color ni qo'yadi
 * (next-themes esa <html> ga "dark" klassini xuddi shunday oldindan qo'yadi — oq miltillash yo'q).
 */
export const themeColorScript = `(function(){try{var t=localStorage.getItem("theme")||"system";var d=t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);document.querySelector('meta[name="theme-color"]').setAttribute("content",d?"${THEME_COLORS.dark}":"${THEME_COLORS.light}")}catch(e){}})()`

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <ThemeColorSync />
      {children}
    </NextThemesProvider>
  )
}

/** Mavzu o'zgarganda (sozlamada yoki telefon tizimida) theme-color ni yangilaydi */
function ThemeColorSync() {
  const { resolvedTheme } = useTheme()
  useEffect(() => {
    if (!resolvedTheme) return
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", resolvedTheme === "dark" ? THEME_COLORS.dark : THEME_COLORS.light)
  }, [resolvedTheme])
  return null
}

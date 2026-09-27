import type { Metadata, Viewport } from "next"
import { THEME_COLORS, ThemeProvider, themeColorScript } from "@/components/theme"
import "./globals.css"

export const metadata: Metadata = {
  title: "Moliya",
  description: "Shaxsiy moliya",
  appleWebApp: { capable: true, title: "Moliya", statusBarStyle: "default" },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: next-themes <html> ga "dark" klassini React'dan oldin qo'yadi
    <html lang="uz" className="h-full" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content={THEME_COLORS.light} suppressHydrationWarning />
        <script dangerouslySetInnerHTML={{ __html: themeColorScript }} />
      </head>
      <body className="min-h-full">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}

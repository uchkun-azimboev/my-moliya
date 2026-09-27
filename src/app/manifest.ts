import type { MetadataRoute } from "next"
import { THEME_COLORS } from "@/components/theme"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Moliya — shaxsiy moliya",
    short_name: "Moliya",
    description: "Pulim yetadimi, majburiyatlarim qancha, maqsadlarimga qachon yetaman",
    lang: "uz",
    start_url: "/",
    scope: "/",
    // brauzer panellarisiz, alohida ilova oynasida
    display: "standalone",
    orientation: "portrait",
    background_color: THEME_COLORS.light,
    // Manifestda bitta rang bo'ladi; ochilgandan keyin <meta name="theme-color"> mavzuga qarab almashtiriladi
    theme_color: THEME_COLORS.light,
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }
}

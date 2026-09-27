import type { NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/proxy"

// Login qilinmagan foydalanuvchini har qanday sahifadan /login ga yo'naltiradi.
export async function proxy(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: [
    // Statik fayllar, rasmlar va PWA fayllari (manifest, ikonkalar, service worker, offline sahifa)
    // login talab qilmaydi — qolgan hamma yo'llar himoyalangan
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icons/|icon|apple-icon|offline|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}

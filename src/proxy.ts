import type { NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/proxy"

// Login qilinmagan foydalanuvchini har qanday sahifadan /login ga yo'naltiradi.
export async function proxy(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: [
    // Statik fayllar va rasmlardan tashqari hamma yo'llar
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}

import { cache } from "react"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { supabaseFetch, supabaseKey, supabaseUrl } from "./env"

/** Bitta so'rov (render) davomida bitta klient — layout va sahifa uni bo'lishadi */
export const createClient = cache(async () => {
  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseKey, {
    global: supabaseFetch ? { fetch: supabaseFetch } : undefined,
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Server Component ichida cookie yozib bo'lmaydi — sessiyani proxy yangilaydi.
        }
      },
    },
  })
})

/**
 * Tizimga kirgan foydalanuvchini tekshiradi; kirmagan bo'lsa /login ga yuboradi.
 * cache(): bitta render ichida necha marta chaqirilsa ham tekshiruv bir marta bo'ladi.
 *
 * getClaims() JWT'ni asimmetrik kalit (ES256/RS256) bilan mahalliy tekshiradi — tarmoqsiz.
 * Loyiha eski HS256 "JWT secret"da bo'lsa, kutubxona Auth serveriga so'rov yuboradi (sekin).
 */
export const requireUser = cache(async () => {
  const supabase = await createClient()
  const t0 = performance.now()
  const { data } = await supabase.auth.getClaims()
  if (process.env.DEBUG_TIMING === "1") {
    console.log(`[auth] getClaims alg=${data?.header.alg ?? "-"} ${Math.round(performance.now() - t0)}ms`)
  }
  if (!data?.claims) redirect("/login")
  return { supabase, userId: data.claims.sub as string }
})

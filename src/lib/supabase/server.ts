import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { supabaseKey, supabaseUrl } from "./env"

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseKey, {
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
}

/** Tizimga kirgan foydalanuvchini tekshiradi; kirmagan bo'lsa /login ga yuboradi. */
export async function requireUser() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  if (!data?.claims) redirect("/login")
  return { supabase, userId: data.claims.sub as string }
}

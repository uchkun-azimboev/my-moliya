export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
// Supabase'ning "anon" (eski) yoki "publishable" (yangi, sb_publishable_...) kaliti
export const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * DEBUG_TIMING=1 bo'lsa (faqat server), har bir Supabase so'rovi vaqti logga yoziladi:
 *   [supabase] GET /rest/v1/wallet_balances 84ms
 * Vercel'da: Settings → Environment Variables → DEBUG_TIMING=1, keyin Logs bo'limida ko'rinadi.
 */
export const supabaseFetch: typeof fetch | undefined =
  process.env.DEBUG_TIMING === "1"
    ? async (input, init) => {
        const t0 = performance.now()
        const res = await fetch(input, init)
        const url = new URL(input instanceof Request ? input.url : String(input))
        const method = init?.method ?? (input instanceof Request ? input.method : "GET")
        console.log(`[supabase] ${method} ${url.pathname} ${Math.round(performance.now() - t0)}ms`)
        return res
      }
    : undefined

import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { supabaseKey, supabaseUrl } from "./env"

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  // Muhim: createServerClient va getClaims orasiga boshqa kod qo'ymang.
  const { data } = await supabase.auth.getClaims()
  const isLoggedIn = Boolean(data?.claims)
  const isLoginPage = request.nextUrl.pathname === "/login"

  if (!isLoggedIn && !isLoginPage) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.search = ""
    return redirectWithCookies(url, response)
  }

  if (isLoggedIn && isLoginPage) {
    const url = request.nextUrl.clone()
    url.pathname = "/"
    url.search = ""
    return redirectWithCookies(url, response)
  }

  return response
}

function redirectWithCookies(url: URL, from: NextResponse) {
  const redirect = NextResponse.redirect(url)
  from.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie))
  return redirect
}

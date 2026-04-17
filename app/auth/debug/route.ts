import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

type CookieToSet = {
  name: string
  value: string
  options?: Record<string, unknown>
}

export async function GET(request: NextRequest) {
  const cookieNames = request.cookies.getAll().map(cookie => cookie.name)
  const supabaseCookieNames = cookieNames.filter(name => name.startsWith('sb-'))
  let cookiesToSet: CookieToSet[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(newCookies) {
          cookiesToSet = newCookies as CookieToSet[]
        },
      },
    }
  )

  const { data: { user }, error } = await supabase.auth.getUser()

  const response = NextResponse.json({
    host: request.nextUrl.host,
    path: request.nextUrl.pathname,
    hasSupabaseCookies: supabaseCookieNames.length > 0,
    supabaseCookieCount: supabaseCookieNames.length,
    supabaseCookieNames,
    userPresent: Boolean(user),
    userId: user?.id ?? null,
    userEmail: user?.email ?? null,
    authError: error?.message ?? null,
  })

  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options)
  })

  return response
}

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const response = NextResponse.json({})
  const cookieNames = request.cookies.getAll().map(cookie => cookie.name)
  const supabaseCookieNames = cookieNames.filter(name => name.startsWith('sb-'))

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user }, error } = await supabase.auth.getUser()

  const body = {
    host: request.nextUrl.host,
    path: request.nextUrl.pathname,
    hasSupabaseCookies: supabaseCookieNames.length > 0,
    supabaseCookieCount: supabaseCookieNames.length,
    supabaseCookieNames,
    userPresent: Boolean(user),
    userId: user?.id ?? null,
    userEmail: user?.email ?? null,
    authError: error?.message ?? null,
  }

  return NextResponse.json(body, {
    headers: response.headers,
  })
}

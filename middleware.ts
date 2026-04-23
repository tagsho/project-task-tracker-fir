import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const AUTH_HEADER_KEYS = [
  'x-auth-user-id',
  'x-auth-user-email',
  'x-auth-user-name',
  'x-auth-user-role',
] as const

function clearSupabaseCookies(request: NextRequest, response: NextResponse) {
  request.cookies.getAll().forEach(({ name }) => {
    if (name.startsWith('sb-')) {
      response.cookies.set(name, '', { maxAge: 0, path: '/' })
    }
  })
}

function clearAuthHeaders(headers: Headers) {
  AUTH_HEADER_KEYS.forEach(key => headers.delete(key))
}

function buildForwardedResponse(requestHeaders: Headers, currentResponse?: NextResponse) {
  const nextResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  currentResponse?.cookies.getAll().forEach(cookie => {
    nextResponse.cookies.set(cookie)
  })

  return nextResponse
}

export async function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers)
  let supabaseResponse = buildForwardedResponse(requestHeaders)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = buildForwardedResponse(requestHeaders)
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as Parameters<typeof supabaseResponse.cookies.set>[2]),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname
  const isPublicPath = pathname.startsWith('/login')

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('name, role, is_active')
      .eq('id', user.id)
      .maybeSingle()

    if (profile?.is_active === false) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('error', 'inactive')
      const redirectResponse = NextResponse.redirect(url)
      clearSupabaseCookies(request, redirectResponse)
      return redirectResponse
    }

    requestHeaders.set('x-auth-user-id', user.id)
    requestHeaders.set('x-auth-user-email', user.email ?? '')
    requestHeaders.set('x-auth-user-name', profile?.name ?? '')
    requestHeaders.set('x-auth-user-role', profile?.role ?? '')
    supabaseResponse = buildForwardedResponse(requestHeaders, supabaseResponse)
  } else {
    clearAuthHeaders(requestHeaders)
  }

  if (user && pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|auth(?:/|$)|.*\\.png$).*)'],
}

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // 自动设置 session_id cookie
  if (!request.cookies.get('session_id')) {
    response.cookies.set('session_id', uuidv4(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 365 * 24 * 60 * 60,
    })
  }

  const { pathname } = request.nextUrl
  const userToken = request.cookies.get('user_token')?.value
  const adminToken = request.cookies.get('admin_token')?.value

  // 已登录顾客访问登录页 → 跳转到首页或 redirect 参数指定的页面
  if (pathname === '/login') {
    if (userToken) {
      const redirectTo = request.nextUrl.searchParams.get('redirect') || '/'
      return NextResponse.redirect(new URL(redirectTo, request.url))
    }
    return response
  }

  // 已登录管理员访问管理登录/注册页 → 跳转到管理后台
  if (pathname === '/admin/login' || pathname === '/admin/register') {
    if (adminToken) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    return response
  }

  // 管理端页面鉴权
  if (pathname.startsWith('/admin')) {
    if (!adminToken) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  // C端需要登录的页面
  const customerAuthPaths = ['/orders', '/profile', '/order/confirm', '/order/']
  const needsAuth = customerAuthPaths.some((p) =>
    p.endsWith('/') ? pathname.startsWith(p) : pathname === p || pathname.startsWith(p + '/')
  )

  if (needsAuth) {
    if (!userToken) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|icons|uploads|manifest.json|sw.js).*)',
  ],
}

export const BASE_URL = 'http://localhost:3001'

/**
 * Parse Set-Cookie headers from a Response
 */
export function parseCookies(response: Response): Record<string, string> {
  const cookies: Record<string, string> = {}
  const setCookieHeaders = response.headers.getSetCookie?.() ?? []
  for (const header of setCookieHeaders) {
    const [nameValue] = header.split(';')
    const eqIndex = nameValue.indexOf('=')
    if (eqIndex > 0) {
      const name = nameValue.substring(0, eqIndex).trim()
      const value = nameValue.substring(eqIndex + 1).trim()
      cookies[name] = value
    }
  }
  return cookies
}

/**
 * Build a cookie header string from a cookie record
 */
export function buildCookieHeader(cookies: Record<string, string>): string {
  return Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ')
}

/**
 * Convenient fetch wrapper that prepends BASE_URL and handles cookies
 */
export async function fetchApi(
  path: string,
  options: RequestInit & { cookies?: Record<string, string> } = {}
): Promise<Response> {
  const { cookies, headers, ...rest } = options
  const h = new Headers(headers)

  if (cookies && Object.keys(cookies).length > 0) {
    h.set('Cookie', buildCookieHeader(cookies))
  }

  return fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: h,
    redirect: 'manual',
  })
}

/**
 * Login as admin and return the admin_token cookie value
 */
export async function loginAdmin(
  email = 'admin@example.com',
  password = 'admin123'
): Promise<{ token: string; cookies: Record<string, string> }> {
  const res = await fetchApi('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  const resCookies = parseCookies(res)
  const token = resCookies['admin_token'] || ''

  return { token, cookies: { admin_token: token } }
}

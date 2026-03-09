import { NextResponse } from 'next/server'
import { getAdminUser } from './auth'

export async function requireAdmin() {
  const user = await getAdminUser()
  if (!user) {
    return { error: NextResponse.json({ error: '未授权' }, { status: 401 }), user: null }
  }
  return { error: null, user }
}

import { NextResponse } from 'next/server'
import { getCustomerUser } from '@/lib/auth'

export async function GET() {
  const user = await getCustomerUser()
  if (!user) {
    return NextResponse.json({ user: null })
  }
  return NextResponse.json({
    user: { id: user.id, phone: user.phone, name: user.name, role: user.role },
  })
}

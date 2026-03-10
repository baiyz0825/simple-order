import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, signToken } from '@/lib/auth'
import { getSessionId } from '@/lib/session'

export async function POST(request: Request) {
  try {
    const { phone, password } = await request.json()

    if (!phone || !password) {
      return NextResponse.json({ error: '请填写手机号和密码' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { phone } })
    if (!user) {
      return NextResponse.json({ error: '手机号或密码错误' }, { status: 401 })
    }

    const valid = await verifyPassword(password, user.password)
    if (!valid) {
      return NextResponse.json({ error: '手机号或密码错误' }, { status: 401 })
    }

    // 将当前 session 的匿名订单关联到登录用户
    const sessionId = await getSessionId()
    await prisma.order.updateMany({
      where: { sessionId, userId: null },
      data: { userId: user.id },
    })

    const token = signToken({ userId: user.id, role: user.role })

    const response = NextResponse.json({
      user: { id: user.id, phone: user.phone, name: user.name, role: user.role },
    })

    response.cookies.set('user_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    })

    return response
  } catch {
    return NextResponse.json({ error: '登录失败' }, { status: 500 })
  }
}

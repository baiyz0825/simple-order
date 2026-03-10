import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, signToken } from '@/lib/auth'
import { getSessionId } from '@/lib/session'

export async function POST(request: Request) {
  try {
    const { phone, password, name } = await request.json()

    if (!phone || !password || !name) {
      return NextResponse.json({ error: '请填写所有字段' }, { status: 400 })
    }

    if (!/^1\d{10}$/.test(phone)) {
      return NextResponse.json({ error: '手机号格式不正确' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: '密码至少6位' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { phone } })
    if (existing) {
      return NextResponse.json({ error: '该手机号已注册' }, { status: 400 })
    }

    const hashedPassword = await hashPassword(password)
    const user = await prisma.user.create({
      data: { phone, password: hashedPassword, name, role: 'customer' },
    })

    // 将当前 session 的匿名订单关联到新注册用户
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
      maxAge: 30 * 24 * 60 * 60, // 30天
      path: '/',
    })

    return response
  } catch {
    return NextResponse.json({ error: '注册失败' }, { status: 500 })
  }
}

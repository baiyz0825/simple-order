import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminUser, hashPassword, verifyPassword, signToken } from '@/lib/auth'

// GET /api/admin/account - 获取当前管理员信息
export async function GET() {
  const user = await getAdminUser()
  if (!user) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
  })
}

// PUT /api/admin/account - 修改管理员账户信息
export async function PUT(request: NextRequest) {
  const user = await getAdminUser()
  if (!user) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, email, currentPassword, newPassword } = body

    const data: Record<string, unknown> = {}

    // 修改名称
    if (name !== undefined) {
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json({ error: '名称不能为空' }, { status: 400 })
      }
      data.name = name.trim()
    }

    // 修改邮箱
    if (email !== undefined) {
      if (!email || typeof email !== 'string') {
        return NextResponse.json({ error: '邮箱格式无效' }, { status: 400 })
      }
      // 检查邮箱是否已被使用
      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing && existing.id !== user.id) {
        return NextResponse.json({ error: '该邮箱已被使用' }, { status: 409 })
      }
      data.email = email.trim()
    }

    // 修改密码
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: '请输入当前密码' }, { status: 400 })
      }
      const valid = await verifyPassword(currentPassword, user.password)
      if (!valid) {
        return NextResponse.json({ error: '当前密码错误' }, { status: 401 })
      }
      if (newPassword.length < 6) {
        return NextResponse.json({ error: '新密码至少6位' }, { status: 400 })
      }
      data.password = await hashPassword(newPassword)
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: '没有需要更新的内容' }, { status: 400 })
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data,
    })

    // 如果修改了密码或邮箱，重新签发 token
    const needNewToken = !!data.password || !!data.email
    const response = NextResponse.json({
      id: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role,
    })

    if (needNewToken) {
      const token = signToken({ userId: updated.id, role: updated.role })
      response.cookies.set('admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
      })
    }

    return response
  } catch (err) {
    console.error('更新账户失败:', err)
    return NextResponse.json({ error: '更新账户失败' }, { status: 500 })
  }
}

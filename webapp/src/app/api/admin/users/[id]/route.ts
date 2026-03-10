import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'

// GET /api/admin/users/:id - 获取用户详情
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const { id } = await params
    const userId = parseInt(id)
    if (isNaN(userId)) {
      return NextResponse.json({ error: '无效的用户ID' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
    })

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    return NextResponse.json({
      ...user,
      orderCount: user._count.orders,
      _count: undefined,
    })
  } catch (err) {
    console.error('获取用户详情失败:', err)
    return NextResponse.json({ error: '获取用户详情失败' }, { status: 500 })
  }
}

// PUT /api/admin/users/:id - 编辑用户信息
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, user: admin } = await requireAdmin()
  if (error) return error

  try {
    const { id } = await params
    const userId = parseInt(id)
    if (isNaN(userId)) {
      return NextResponse.json({ error: '无效的用户ID' }, { status: 400 })
    }

    const target = await prisma.user.findUnique({ where: { id: userId } })
    if (!target) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    // 只有 admin 角色才能修改其他 admin/staff 的角色
    if (admin!.role !== 'admin' && (target.role === 'admin' || target.role === 'staff')) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 })
    }

    // 不允许降级自己的角色
    if (admin!.id === userId) {
      return NextResponse.json({ error: '不能修改自己的信息，请使用账户设置' }, { status: 400 })
    }

    const body = await request.json()
    const data: Record<string, unknown> = {}

    if (body.name !== undefined) data.name = body.name
    if (body.role !== undefined) {
      if (!['admin', 'staff', 'customer'].includes(body.role)) {
        return NextResponse.json({ error: '无效的角色' }, { status: 400 })
      }
      data.role = body.role
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        createdAt: true,
      },
    data,
    })

    return NextResponse.json(updated)
  } catch (err) {
    console.error('更新用户失败:', err)
    return NextResponse.json({ error: '更新用户失败' }, { status: 500 })
  }
}

// DELETE /api/admin/users/:id - 删除用户
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, user: admin } = await requireAdmin()
  if (error) return error

  try {
    const { id } = await params
    const userId = parseInt(id)
    if (isNaN(userId)) {
      return NextResponse.json({ error: '无效的用户ID' }, { status: 400 })
    }

    if (admin!.id === userId) {
      return NextResponse.json({ error: '不能删除自己的账户' }, { status: 400 })
    }

    const target = await prisma.user.findUnique({ where: { id: userId } })
    if (!target) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    // 只有 admin 可以删除 admin/staff
    if (admin!.role !== 'admin' && (target.role === 'admin' || target.role === 'staff')) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 })
    }

    await prisma.user.delete({ where: { id: userId } })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('删除用户失败:', err)
    return NextResponse.json({ error: '删除用户失败' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'
import bcrypt from 'bcryptjs'

// GET /api/admin/users - 获取用户列表
export async function GET(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const { searchParams } = new URL(request.url)
    const keyword = searchParams.get('keyword') || ''
    const role = searchParams.get('role') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') || '20')))

    const where: Record<string, unknown> = {}

    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { email: { contains: keyword } },
        { phone: { contains: keyword } },
      ]
    }

    if (role && ['admin', 'staff', 'customer'].includes(role)) {
      where.role = role
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          phone: true,
          name: true,
          role: true,
          createdAt: true,
          _count: { select: { orders: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({
      users: users.map((u) => ({
        ...u,
        orderCount: u._count.orders,
        _count: undefined,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (err) {
    console.error('获取用户列表失败:', err)
    return NextResponse.json({ error: '获取用户列表失败' }, { status: 500 })
  }
}

// POST /api/admin/users - 新增用户
export async function POST(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const body = await request.json()
    const { name, email, phone, password, role } = body

    if (!name || !password) {
      return NextResponse.json({ error: '用户名和密码不能为空' }, { status: 400 })
    }

    if (!['admin', 'staff', 'customer'].includes(role)) {
      return NextResponse.json({ error: '无效的角色类型' }, { status: 400 })
    }

    // 检查邮箱是否已存在
    if (email) {
      const existingEmail = await prisma.user.findUnique({ where: { email } })
      if (existingEmail) {
        return NextResponse.json({ error: '该邮箱已被使用' }, { status: 400 })
      }
    }

    // 检查手机号是否已存在
    if (phone) {
      const existingPhone = await prisma.user.findUnique({ where: { phone } })
      if (existingPhone) {
        return NextResponse.json({ error: '该手机号已被使用' }, { status: 400 })
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        password: hashedPassword,
        role,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ user })
  } catch (err) {
    console.error('创建用户失败:', err)
    return NextResponse.json({ error: '创建用户失败' }, { status: 500 })
  }
}

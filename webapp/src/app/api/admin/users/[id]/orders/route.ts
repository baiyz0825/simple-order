import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'

// GET /api/admin/users/:id/orders - 获取用户的订单列表
export async function GET(
  request: NextRequest,
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

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') || '20')))
    const status = searchParams.get('status') || ''
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''
    const minAmount = searchParams.get('minAmount') ? parseInt(searchParams.get('minAmount')!) : null
    const maxAmount = searchParams.get('maxAmount') ? parseInt(searchParams.get('maxAmount')!) : null

    const where: Record<string, unknown> = { userId }
    
    if (status) {
      where.status = status
    }
    
    // 日期筛选
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        (where.createdAt as Record<string, Date>).gte = new Date(startDate)
      }
      if (endDate) {
        // 结束日期设为当天23:59:59
        const end: Date = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        (where.createdAt as Record<string, Date>).lte = end
      }
    }
    
    // 金额筛选
    if (minAmount !== null || maxAmount !== null) {
      where.totalPrice = {}
      if (minAmount !== null) {
        (where.totalPrice as Record<string, number>).gte = minAmount
      }
      if (maxAmount !== null) {
        (where.totalPrice as Record<string, number>).lte = maxAmount
      }
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.order.count({ where }),
    ])
    
    // 统计筛选条件下的总金额
    const stats = await prisma.order.aggregate({
      where,
      _sum: { totalPrice: true },
      _count: true,
    })

    return NextResponse.json({
      orders,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      stats: {
        totalAmount: stats._sum.totalPrice || 0,
        orderCount: stats._count,
      },
    })
  } catch (err) {
    console.error('获取用户订单失败:', err)
    return NextResponse.json({ error: '获取用户订单失败' }, { status: 500 })
  }
}

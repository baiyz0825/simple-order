import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { getAdminUser, getCustomerUser } from '@/lib/auth'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const order = await prisma.order.findUnique({
      where: { id: Number(id) },
    })

    if (!order) {
      return NextResponse.json({ error: '订单不存在' }, { status: 404 })
    }

    // 权限校验：管理员可查看所有订单，普通用户只能查看自己的订单
    const adminUser = await getAdminUser()
    if (!adminUser) {
      const customerUser = await getCustomerUser()
      if (customerUser) {
        // 已登录用户只能查看自己的订单
        if (order.userId !== customerUser.id) {
          return NextResponse.json({ error: '无权查看该订单' }, { status: 403 })
        }
      } else {
        // 未登录用户通过 sessionId 匹配
        const cookieStore = await cookies()
        const sessionId = cookieStore.get('session_id')?.value
        if (!sessionId || order.sessionId !== sessionId) {
          return NextResponse.json({ error: '无权查看该订单' }, { status: 403 })
        }
      }
    }

    return NextResponse.json({
      ...order,
      items: JSON.parse(order.items),
    })
  } catch (error) {
    console.error('查询订单失败:', error)
    return NextResponse.json({ error: '查询订单失败' }, { status: 500 })
  }
}

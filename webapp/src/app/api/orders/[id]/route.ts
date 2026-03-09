import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

    return NextResponse.json({
      ...order,
      items: JSON.parse(order.items),
    })
  } catch (error) {
    console.error('查询订单失败:', error)
    return NextResponse.json({ error: '查询订单失败' }, { status: 500 })
  }
}

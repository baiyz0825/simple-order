import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'
import { checkAllItemsDone } from '@/lib/order-utils'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error: authError } = await requireAdmin()
    if (authError) return authError

    const { id } = await params
    const { itemIndex, stepIndex } = await request.json()

    if (itemIndex === undefined || stepIndex === undefined) {
      return NextResponse.json({ error: '缺少 itemIndex 或 stepIndex' }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { id: Number(id) },
    })

    if (!order) {
      return NextResponse.json({ error: '订单不存在' }, { status: 404 })
    }

    // 解析并更新 items
    const items = JSON.parse(order.items)

    if (itemIndex < 0 || itemIndex >= items.length) {
      return NextResponse.json({ error: 'itemIndex 越界' }, { status: 400 })
    }

    const item = items[itemIndex]
    if (!item.process || stepIndex < 0 || stepIndex >= item.process.length) {
      return NextResponse.json({ error: 'stepIndex 越界' }, { status: 400 })
    }

    item.process[stepIndex].done = true

    // 检查是否所有商品都完成
    const updateData: any = {
      items: JSON.stringify(items),
    }

    if (checkAllItemsDone(items)) {
      updateData.status = 'ready'
      updateData.readyAt = new Date()
    }

    const updatedOrder = await prisma.order.update({
      where: { id: Number(id) },
      data: updateData,
    })

    // 广播订单更新
    if (typeof (global as any).broadcastOrderUpdate === 'function') {
      ;(global as any).broadcastOrderUpdate(updatedOrder.id, {
        status: updatedOrder.status,
        items: updatedOrder.items,
      })
    }

    return NextResponse.json({
      ...updatedOrder,
      items: JSON.parse(updatedOrder.items),
    })
  } catch (error) {
    console.error('更新制作进度失败:', error)
    return NextResponse.json({ error: '更新制作进度失败' }, { status: 500 })
  }
}

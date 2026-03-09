import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'

// 合法的状态流转
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['ready', 'cancelled'],
  ready: ['completed', 'cancelled'],
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error: authError } = await requireAdmin()
    if (authError) return authError

    const { id } = await params
    const { status, estimatedTime } = await request.json()

    if (!status) {
      return NextResponse.json({ error: '状态不能为空' }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { id: Number(id) },
    })

    if (!order) {
      return NextResponse.json({ error: '订单不存在' }, { status: 404 })
    }

    // 校验状态流转合法性
    const allowedStatuses = VALID_TRANSITIONS[order.status]
    if (!allowedStatuses || !allowedStatuses.includes(status)) {
      return NextResponse.json(
        { error: `不允许从 ${order.status} 变更为 ${status}` },
        { status: 400 }
      )
    }

    // 构建更新数据
    const updateData: any = { status }

    if (estimatedTime !== undefined) {
      updateData.estimatedTime = estimatedTime
    }

    const now = new Date()
    if (status === 'confirmed') {
      updateData.confirmedAt = now
    } else if (status === 'ready') {
      updateData.readyAt = now
    } else if (status === 'completed') {
      updateData.completedAt = now
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
    console.error('更新订单状态失败:', error)
    return NextResponse.json({ error: '更新订单状态失败' }, { status: 500 })
  }
}

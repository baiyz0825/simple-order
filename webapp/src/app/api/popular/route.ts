import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/popular
 *
 * 基于历史订单数据统计商品销量，返回热门推荐商品列表。
 *
 * 推荐策略（多维度综合排序）：
 * 1. 从已完成/已确认/待取餐的有效订单中统计每个商品的总销量
 * 2. 近 7 天的订单权重 ×3，近 30 天权重 ×2，更早的权重 ×1（时间衰减）
 * 3. 没有销量数据时 fallback 到全部上架商品（按 sort 排序）
 *
 * Query params:
 *   limit: 返回数量（默认 8，最大 20）
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '8', 10) || 8, 1), 20)

    // 时间边界
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // 查询有效订单（排除 cancelled 和 pending 状态）
    const orders = await prisma.order.findMany({
      where: {
        status: { in: ['confirmed', 'ready', 'completed'] },
      },
      select: {
        items: true,
        createdAt: true,
      },
    })

    // 统计每个商品的加权销量
    const salesMap = new Map<number, { totalSales: number; weightedScore: number }>()

    for (const order of orders) {
      let items: Array<{ productId: number; quantity: number }>
      try {
        items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items
      } catch {
        continue
      }

      // 时间权重
      let timeWeight = 1
      if (order.createdAt >= sevenDaysAgo) {
        timeWeight = 3
      } else if (order.createdAt >= thirtyDaysAgo) {
        timeWeight = 2
      }

      for (const item of items) {
        if (!item.productId || !item.quantity) continue
        const existing = salesMap.get(item.productId) || { totalSales: 0, weightedScore: 0 }
        existing.totalSales += item.quantity
        existing.weightedScore += item.quantity * timeWeight
        salesMap.set(item.productId, existing)
      }
    }

    // 按加权分数降序排列，取前 N 个 productId
    const sortedProductIds = Array.from(salesMap.entries())
      .sort((a, b) => b[1].weightedScore - a[1].weightedScore)
      .slice(0, limit)
      .map(([id]) => id)

    let products: Array<{
      id: number
      name: string
      description: string
      price: number
      imageUrl: string
      salesCount: number
    }> = []

    if (sortedProductIds.length > 0) {
      // 查询这些商品的详情（仅上架的）
      const dbProducts = await prisma.product.findMany({
        where: {
          id: { in: sortedProductIds },
          isOnSale: true,
        },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          imageUrl: true,
        },
      })

      // 按加权分数排序，并附上销量
      const productMap = new Map(dbProducts.map((p) => [p.id, p]))
      for (const pid of sortedProductIds) {
        const p = productMap.get(pid)
        if (!p) continue
        const stats = salesMap.get(pid)!
        products.push({
          ...p,
          salesCount: stats.totalSales,
        })
      }
    }

    // 如果有效推荐不足 limit 个，用其他上架商品补齐
    if (products.length < limit) {
      const existingIds = products.map((p) => p.id)
      const fallback = await prisma.product.findMany({
        where: {
          isOnSale: true,
          id: { notIn: existingIds },
        },
        orderBy: { sort: 'asc' },
        take: limit - products.length,
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          imageUrl: true,
        },
      })
      products = [
        ...products,
        ...fallback.map((p) => ({ ...p, salesCount: 0 })),
      ]
    }

    return NextResponse.json(products)
  } catch (error) {
    console.error('获取热门推荐失败:', error)
    return NextResponse.json({ error: '获取热门推荐失败' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'
import { getSessionId } from '@/lib/session'
import { generateOrderNo } from '@/lib/order-utils'

export async function POST(request: NextRequest) {
  try {
    const sessionId = await getSessionId()
    const { items, remark } = await request.json()

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: '订单商品不能为空' }, { status: 400 })
    }

    // 查询所有相关商品（含分类信息）
    const productIds = items.map((item: any) => item.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isOnSale: true },
      include: { category: true },
    })

    if (products.length !== productIds.length) {
      return NextResponse.json({ error: '部分商品不存在或已下架' }, { status: 400 })
    }

    const productMap = new Map(products.map(p => [p.id, p]))

    // 查询所有规格模板和制作流程模板
    const specTemplates = await prisma.specTemplate.findMany()
    const specTemplateMap = new Map(specTemplates.map(s => [s.id, s]))

    const processTemplates = await prisma.processTemplate.findMany()
    const processTemplateMap = new Map(processTemplates.map(p => [p.id, p]))

    let totalPrice = 0
    const orderItems: any[] = []

    for (const item of items) {
      const product = productMap.get(item.productId)
      if (!product) continue

      // 计算基础价格
      let itemPrice = product.price

      // 计算规格加价
      const selectedSpecs: any[] = item.selectedSpecs || []
      for (const spec of selectedSpecs) {
        const template = specTemplateMap.get(spec.templateId)
        if (!template) continue
        const options = JSON.parse(template.options) as { name: string; priceDelta: number }[]
        for (const selectedName of (spec.selected || [])) {
          const option = options.find(o => o.name === selectedName)
          if (option && option.priceDelta) {
            itemPrice += option.priceDelta
          }
        }
      }

      // 初始化制作流程
      const processTemplateId = product.processTemplateId ?? product.category.processTemplateId
      let process: { name: string; sort: number; done: boolean }[] = []
      if (processTemplateId) {
        const processTemplate = processTemplateMap.get(processTemplateId)
        if (processTemplate) {
          const steps = JSON.parse(processTemplate.steps) as { name: string; sort: number }[]
          process = steps
            .sort((a, b) => a.sort - b.sort)
            .map(step => ({ name: step.name, sort: step.sort, done: false }))
        }
      }

      totalPrice += itemPrice * item.quantity

      orderItems.push({
        productId: product.id,
        productName: product.name,
        price: itemPrice,
        quantity: item.quantity,
        selectedSpecs,
        process,
      })
    }

    const orderNo = generateOrderNo()

    const order = await prisma.order.create({
      data: {
        orderNo,
        sessionId,
        items: JSON.stringify(orderItems),
        totalPrice,
        status: 'pending',
        remark: remark || '',
      },
    })

    // 广播新订单
    if (typeof (global as any).broadcastNewOrder === 'function') {
      ;(global as any).broadcastNewOrder(order)
    }

    return NextResponse.json({
      ...order,
      items: JSON.parse(order.items),
    }, { status: 201 })
  } catch (error) {
    console.error('创建订单失败:', error)
    return NextResponse.json({ error: '创建订单失败' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isAdmin = searchParams.get('admin') === 'true'
    const statusFilter = searchParams.get('status')

    let where: any = {}

    if (isAdmin) {
      const { error } = await requireAdmin()
      if (error) return error
    } else {
      const sessionId = await getSessionId()
      where.sessionId = sessionId
    }

    if (statusFilter) {
      const statuses = statusFilter.split(',').map(s => s.trim())
      where.status = { in: statuses }
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(
      orders.map(order => ({
        ...order,
        items: JSON.parse(order.items),
      }))
    )
  } catch (error) {
    console.error('查询订单列表失败:', error)
    return NextResponse.json({ error: '查询订单列表失败' }, { status: 500 })
  }
}

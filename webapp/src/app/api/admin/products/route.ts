import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {}
    if (categoryId) {
      where.categoryId = Number(categoryId)
    }
    if (search) {
      where.name = { contains: search }
    }

    const products = await prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { sort: 'asc' },
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error('获取商品列表失败:', error)
    return NextResponse.json({ error: '获取商品列表失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const body = await request.json()
    const product = await prisma.product.create({
      data: {
        categoryId: body.categoryId,
        name: body.name,
        description: body.description ?? '',
        price: body.price,
        imageUrl: body.imageUrl ?? '',
        isOnSale: body.isOnSale ?? true,
        sort: body.sort ?? 0,
        specs: body.specs ?? '[]',
        processTemplateId: body.processTemplateId ?? null,
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('创建商品失败:', error)
    return NextResponse.json({ error: '创建商品失败' }, { status: 500 })
  }
}

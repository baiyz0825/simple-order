import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const { id } = await params
    const product = await prisma.product.findUnique({
      where: { id: Number(id) },
    })

    if (!product) {
      return NextResponse.json({ error: '商品不存在' }, { status: 404 })
    }

    const updated = await prisma.product.update({
      where: { id: Number(id) },
      data: { isOnSale: !product.isOnSale },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('切换上下架失败:', error)
    return NextResponse.json({ error: '切换上下架失败' }, { status: 500 })
  }
}

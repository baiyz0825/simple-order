import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const { id } = await params
    const body = await request.json()
    const product = await prisma.product.update({
      where: { id: Number(id) },
      data: body,
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('更新商品失败:', error)
    return NextResponse.json({ error: '更新商品失败' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const { id } = await params
    await prisma.product.delete({
      where: { id: Number(id) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('删除商品失败:', error)
    return NextResponse.json({ error: '删除商品失败' }, { status: 500 })
  }
}

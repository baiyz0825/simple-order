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

    // 如果 options 传入的是对象/数组，转换为 JSON 字符串
    if (body.options && typeof body.options !== 'string') {
      body.options = JSON.stringify(body.options)
    }

    const spec = await prisma.specTemplate.update({
      where: { id: Number(id) },
      data: body,
    })

    return NextResponse.json(spec)
  } catch (error) {
    console.error('更新属性模板失败:', error)
    return NextResponse.json({ error: '更新属性模板失败' }, { status: 500 })
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
    await prisma.specTemplate.delete({
      where: { id: Number(id) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('删除属性模板失败:', error)
    return NextResponse.json({ error: '删除属性模板失败' }, { status: 500 })
  }
}

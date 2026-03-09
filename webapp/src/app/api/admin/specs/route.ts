import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const specs = await prisma.specTemplate.findMany({
      orderBy: { id: 'asc' },
    })

    return NextResponse.json(specs)
  } catch (error) {
    console.error('获取属性模板列表失败:', error)
    return NextResponse.json({ error: '获取属性模板列表失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const body = await request.json()
    const spec = await prisma.specTemplate.create({
      data: {
        name: body.name,
        type: body.type ?? 'single',
        options: typeof body.options === 'string'
          ? body.options
          : JSON.stringify(body.options ?? []),
      },
    })

    return NextResponse.json(spec, { status: 201 })
  } catch (error) {
    console.error('创建属性模板失败:', error)
    return NextResponse.json({ error: '创建属性模板失败' }, { status: 500 })
  }
}

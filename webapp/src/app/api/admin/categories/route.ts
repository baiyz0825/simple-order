import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const categories = await prisma.category.findMany({
      orderBy: { sort: 'asc' },
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('获取分类列表失败:', error)
    return NextResponse.json({ error: '获取分类列表失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const body = await request.json()
    const category = await prisma.category.create({
      data: {
        name: body.name,
        sort: body.sort ?? 0,
        isActive: body.isActive ?? true,
        processTemplateId: body.processTemplateId ?? null,
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('创建分类失败:', error)
    return NextResponse.json({ error: '创建分类失败' }, { status: 500 })
  }
}

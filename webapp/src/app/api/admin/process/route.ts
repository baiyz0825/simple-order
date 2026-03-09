import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const processes = await prisma.processTemplate.findMany({
      orderBy: { id: 'asc' },
    })

    return NextResponse.json(processes)
  } catch (error) {
    console.error('获取制作流程列表失败:', error)
    return NextResponse.json({ error: '获取制作流程列表失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const body = await request.json()
    const process = await prisma.processTemplate.create({
      data: {
        name: body.name,
        steps: typeof body.steps === 'string'
          ? body.steps
          : JSON.stringify(body.steps ?? []),
      },
    })

    return NextResponse.json(process, { status: 201 })
  } catch (error) {
    console.error('创建制作流程失败:', error)
    return NextResponse.json({ error: '创建制作流程失败' }, { status: 500 })
  }
}

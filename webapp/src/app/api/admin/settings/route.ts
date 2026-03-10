import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireAdmin } from '@/lib/admin-guard'

const prisma = new PrismaClient()

// 默认配置项
const DEFAULT_SETTINGS: Record<string, string> = {
  shopName: '精品咖啡烘焙店',
  shopSubtitle: '专注手冲与手工烘焙',
  aboutText:
    '我们是一家专注于精品咖啡的烘焙店，精选来自世界各地的优质咖啡豆，采用专业烘焙工艺，为您带来每一杯都值得细细品味的好咖啡。',
  businessHours: '每日 08:00 - 22:00',
  address: '请到店咨询',
  contactInfo: '',
  homeWelcomeText: '欢迎光临，开启美好的一天',
  homeAnnouncementText: '',
  homeBannerUrl: '',
}

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const rows = await prisma.shopSetting.findMany()
    const settings: Record<string, string> = { ...DEFAULT_SETTINGS }

    for (const row of rows) {
      settings[row.key] = row.value
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('获取店铺设置失败:', error)
    return NextResponse.json(DEFAULT_SETTINGS)
  }
}

export async function PUT(request: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const body = await request.json()

    const allowedKeys = Object.keys(DEFAULT_SETTINGS)
    const updates: { key: string; value: string }[] = []

    for (const key of allowedKeys) {
      if (key in body && typeof body[key] === 'string') {
        updates.push({ key, value: body[key] })
      }
    }

    // 使用事务批量 upsert
    await prisma.$transaction(
      updates.map(({ key, value }) =>
        prisma.shopSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('保存店铺设置失败:', error)
    return NextResponse.json({ error: '保存失败' }, { status: 500 })
  }
}

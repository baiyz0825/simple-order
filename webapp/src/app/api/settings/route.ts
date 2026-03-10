import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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

// 公开接口，前端顾客页面读取店铺信息
export async function GET() {
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

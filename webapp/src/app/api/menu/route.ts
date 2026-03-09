import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // 查询所有启用分类（按 sort 排序）+ 上架商品
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sort: 'asc' },
      include: {
        products: {
          where: { isOnSale: true },
          orderBy: { sort: 'asc' },
        },
      },
    })

    // 查询所有属性模板
    const specTemplates = await prisma.specTemplate.findMany()

    // 查询所有制作流程模板
    const processTemplates = await prisma.processTemplate.findMany()

    // 构建模板查找映射
    const specTemplateMap = new Map(
      specTemplates.map((t) => [t.id, t])
    )

    // 为每个商品解析 resolvedSpecs
    const categoriesWithResolved = categories.map((category) => ({
      id: category.id,
      name: category.name,
      sort: category.sort,
      processTemplateId: category.processTemplateId,
      products: category.products.map((product) => {
        const specs = JSON.parse(product.specs) as Array<{
          templateId: number
          required: boolean
          overrideOptions?: Array<{ name: string; priceDelta: number }>
        }>

        const resolvedSpecs = specs
          .map((spec) => {
            const template = specTemplateMap.get(spec.templateId)
            if (!template) return null

            const templateOptions = JSON.parse(template.options) as Array<{
              name: string
              priceDelta: number
            }>

            return {
              templateId: template.id,
              templateName: template.name,
              type: template.type,
              required: spec.required,
              options: spec.overrideOptions ?? templateOptions,
            }
          })
          .filter(Boolean)

        return {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          imageUrl: product.imageUrl,
          sort: product.sort,
          resolvedSpecs,
          processTemplateId: product.processTemplateId,
        }
      }),
    }))

    return NextResponse.json({
      categories: categoriesWithResolved,
      specTemplates,
      processTemplates,
    })
  } catch (error) {
    console.error('获取菜单失败:', error)
    return NextResponse.json({ error: '获取菜单失败' }, { status: 500 })
  }
}

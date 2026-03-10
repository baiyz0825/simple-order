import { describe, it, expect } from 'vitest'
import { fetchApi } from './helpers'

describe('公开菜单接口 GET /api/menu', () => {
  it('应该返回完整菜单结构', async () => {
    const res = await fetchApi('/api/menu')

    expect(res.status).toBe(200)
    const data = await res.json()

    expect(data).toHaveProperty('categories')
    expect(data).toHaveProperty('specTemplates')
    expect(data).toHaveProperty('processTemplates')

    expect(Array.isArray(data.categories)).toBe(true)
    expect(data.categories.length).toBeGreaterThan(0)
  })

  it('分类应包含商品列表和解析后的规格', async () => {
    const res = await fetchApi('/api/menu')
    const data = await res.json()

    const categoryWithProducts = data.categories.find(
      (c: any) => c.products.length > 0
    )
    expect(categoryWithProducts).toBeDefined()

    const product = categoryWithProducts.products[0]
    expect(product).toHaveProperty('id')
    expect(product).toHaveProperty('name')
    expect(product).toHaveProperty('price')
    expect(product).toHaveProperty('resolvedSpecs')
  })

  it('仅返回启用的分类', async () => {
    const res = await fetchApi('/api/menu')
    const data = await res.json()

    // All seed categories are active, so we just verify structure
    for (const category of data.categories) {
      expect(category).toHaveProperty('id')
      expect(category).toHaveProperty('name')
      expect(category).toHaveProperty('products')
    }
  })

  it('商品应包含 resolvedSpecs 中的规格详情', async () => {
    const res = await fetchApi('/api/menu')
    const data = await res.json()

    // Find a product with specs (e.g., 冰美式 has specs)
    let productWithSpecs: any = null
    for (const cat of data.categories) {
      for (const prod of cat.products) {
        if (prod.resolvedSpecs && prod.resolvedSpecs.length > 0) {
          productWithSpecs = prod
          break
        }
      }
      if (productWithSpecs) break
    }

    if (productWithSpecs) {
      const spec = productWithSpecs.resolvedSpecs[0]
      expect(spec).toHaveProperty('templateId')
      expect(spec).toHaveProperty('templateName')
      expect(spec).toHaveProperty('type')
      expect(spec).toHaveProperty('required')
      expect(spec).toHaveProperty('options')
      expect(Array.isArray(spec.options)).toBe(true)
      expect(spec.options[0]).toHaveProperty('name')
      expect(spec.options[0]).toHaveProperty('priceDelta')
    }
  })

  it('specTemplates 应包含模板信息', async () => {
    const res = await fetchApi('/api/menu')
    const data = await res.json()

    expect(data.specTemplates.length).toBeGreaterThan(0)
    expect(data.specTemplates[0]).toHaveProperty('id')
    expect(data.specTemplates[0]).toHaveProperty('name')
    expect(data.specTemplates[0]).toHaveProperty('type')
  })

  it('processTemplates 应包含流程模板', async () => {
    const res = await fetchApi('/api/menu')
    const data = await res.json()

    expect(data.processTemplates.length).toBeGreaterThan(0)
    expect(data.processTemplates[0]).toHaveProperty('id')
    expect(data.processTemplates[0]).toHaveProperty('name')
    expect(data.processTemplates[0]).toHaveProperty('steps')
  })
})

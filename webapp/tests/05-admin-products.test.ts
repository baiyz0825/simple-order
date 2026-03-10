import { describe, it, expect, beforeAll } from 'vitest'
import { fetchApi, loginAdmin } from './helpers'

describe('商品管理 /api/admin/products', () => {
  let adminCookies: Record<string, string>
  let createdProductId: number
  let firstCategoryId: number

  beforeAll(async () => {
    const { cookies } = await loginAdmin()
    adminCookies = cookies

    // Get a category ID from seed data
    const catRes = await fetchApi('/api/admin/categories', {
      cookies: adminCookies,
    })
    const categories = await catRes.json()
    firstCategoryId = categories[0].id
  })

  describe('未授权访问', () => {
    it('GET 无 token 应返回 401', async () => {
      const res = await fetchApi('/api/admin/products')
      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/admin/products', () => {
    it('应该返回商品列表', async () => {
      const res = await fetchApi('/api/admin/products', {
        cookies: adminCookies,
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeGreaterThan(0)
      expect(data[0]).toHaveProperty('id')
      expect(data[0]).toHaveProperty('name')
      expect(data[0]).toHaveProperty('price')
      expect(data[0]).toHaveProperty('category')
    })

    it('应该支持 categoryId 过滤', async () => {
      const res = await fetchApi(`/api/admin/products?categoryId=${firstCategoryId}`, {
        cookies: adminCookies,
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(Array.isArray(data)).toBe(true)
      for (const product of data) {
        expect(product.categoryId).toBe(firstCategoryId)
      }
    })

    it('应该支持 search 过滤', async () => {
      const res = await fetchApi('/api/admin/products?search=美式', {
        cookies: adminCookies,
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(Array.isArray(data)).toBe(true)
      for (const product of data) {
        expect(product.name).toContain('美式')
      }
    })
  })

  describe('POST /api/admin/products', () => {
    it('应该成功创建商品', async () => {
      const res = await fetchApi('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cookies: adminCookies,
        body: JSON.stringify({
          categoryId: firstCategoryId,
          name: '测试商品',
          description: '这是测试商品描述',
          price: 2500,
          isOnSale: true,
          sort: 100,
          specs: '[]',
        }),
      })

      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data.name).toBe('测试商品')
      expect(data.price).toBe(2500)
      expect(data.categoryId).toBe(firstCategoryId)
      expect(data.isOnSale).toBe(true)
      createdProductId = data.id
    })
  })

  describe('PATCH /api/admin/products/:id', () => {
    it('应该成功更新商品', async () => {
      const res = await fetchApi(`/api/admin/products/${createdProductId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        cookies: adminCookies,
        body: JSON.stringify({
          name: '测试商品-已更新',
          price: 3000,
        }),
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.name).toBe('测试商品-已更新')
      expect(data.price).toBe(3000)
    })
  })

  describe('POST /api/admin/products/:id/toggle', () => {
    it('应该成功切换上下架状态', async () => {
      // Current: isOnSale = true, toggle should make it false
      const res = await fetchApi(`/api/admin/products/${createdProductId}/toggle`, {
        method: 'POST',
        cookies: adminCookies,
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.isOnSale).toBe(false)
    })

    it('再次切换应恢复上架', async () => {
      const res = await fetchApi(`/api/admin/products/${createdProductId}/toggle`, {
        method: 'POST',
        cookies: adminCookies,
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.isOnSale).toBe(true)
    })
  })

  describe('DELETE /api/admin/products/:id', () => {
    it('应该成功删除商品', async () => {
      const res = await fetchApi(`/api/admin/products/${createdProductId}`, {
        method: 'DELETE',
        cookies: adminCookies,
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.success).toBe(true)
    })
  })
})

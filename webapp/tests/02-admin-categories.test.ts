import { describe, it, expect, beforeAll } from 'vitest'
import { fetchApi, loginAdmin } from './helpers'

describe('分类管理 /api/admin/categories', () => {
  let adminCookies: Record<string, string>
  let createdCategoryId: number

  beforeAll(async () => {
    const { cookies } = await loginAdmin()
    adminCookies = cookies
  })

  describe('未授权访问', () => {
    it('GET 无 token 应返回 401', async () => {
      const res = await fetchApi('/api/admin/categories')
      expect(res.status).toBe(401)
    })

    it('POST 无 token 应返回 401', async () => {
      const res = await fetchApi('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '测试分类' }),
      })
      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/admin/categories', () => {
    it('应该返回分类列表', async () => {
      const res = await fetchApi('/api/admin/categories', {
        cookies: adminCookies,
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeGreaterThan(0)
      // Seed data should have categories
      expect(data[0]).toHaveProperty('id')
      expect(data[0]).toHaveProperty('name')
      expect(data[0]).toHaveProperty('sort')
      expect(data[0]).toHaveProperty('isActive')
    })
  })

  describe('POST /api/admin/categories', () => {
    it('应该成功创建分类', async () => {
      const res = await fetchApi('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cookies: adminCookies,
        body: JSON.stringify({
          name: '测试新分类',
          sort: 99,
          isActive: true,
        }),
      })

      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data.name).toBe('测试新分类')
      expect(data.sort).toBe(99)
      expect(data.isActive).toBe(true)
      createdCategoryId = data.id
    })
  })

  describe('PATCH /api/admin/categories/:id', () => {
    it('应该成功更新分类', async () => {
      const res = await fetchApi(`/api/admin/categories/${createdCategoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        cookies: adminCookies,
        body: JSON.stringify({ name: '已更新分类名' }),
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.name).toBe('已更新分类名')
      expect(data.id).toBe(createdCategoryId)
    })
  })

  describe('DELETE /api/admin/categories/:id', () => {
    it('应该成功删除分类', async () => {
      const res = await fetchApi(`/api/admin/categories/${createdCategoryId}`, {
        method: 'DELETE',
        cookies: adminCookies,
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.success).toBe(true)
    })

    it('删除后列表中不应包含该分类', async () => {
      const res = await fetchApi('/api/admin/categories', {
        cookies: adminCookies,
      })
      const data = await res.json()
      const found = data.find((c: any) => c.id === createdCategoryId)
      expect(found).toBeUndefined()
    })
  })
})

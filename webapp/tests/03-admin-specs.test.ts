import { describe, it, expect, beforeAll } from 'vitest'
import { fetchApi, loginAdmin } from './helpers'

describe('规格模板管理 /api/admin/specs', () => {
  let adminCookies: Record<string, string>
  let createdSpecId: number

  beforeAll(async () => {
    const { cookies } = await loginAdmin()
    adminCookies = cookies
  })

  describe('未授权访问', () => {
    it('GET 无 token 应返回 401', async () => {
      const res = await fetchApi('/api/admin/specs')
      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/admin/specs', () => {
    it('应该返回规格模板列表', async () => {
      const res = await fetchApi('/api/admin/specs', {
        cookies: adminCookies,
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeGreaterThan(0)
      // Seed data has spec templates
      expect(data[0]).toHaveProperty('id')
      expect(data[0]).toHaveProperty('name')
      expect(data[0]).toHaveProperty('type')
      expect(data[0]).toHaveProperty('options')
    })
  })

  describe('POST /api/admin/specs', () => {
    it('应该成功创建规格模板', async () => {
      const res = await fetchApi('/api/admin/specs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cookies: adminCookies,
        body: JSON.stringify({
          name: '测试温度',
          type: 'single',
          options: [
            { name: '常温', priceDelta: 0 },
            { name: '加热', priceDelta: 100 },
          ],
        }),
      })

      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data.name).toBe('测试温度')
      expect(data.type).toBe('single')
      createdSpecId = data.id

      // options should be stored as JSON string
      const options = JSON.parse(data.options)
      expect(options).toHaveLength(2)
      expect(options[0].name).toBe('常温')
    })
  })

  describe('PATCH /api/admin/specs/:id', () => {
    it('应该成功更新规格模板', async () => {
      const res = await fetchApi(`/api/admin/specs/${createdSpecId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        cookies: adminCookies,
        body: JSON.stringify({
          name: '温度选择-已更新',
          options: [
            { name: '常温', priceDelta: 0 },
            { name: '加热', priceDelta: 200 },
            { name: '冷藏', priceDelta: 0 },
          ],
        }),
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.name).toBe('温度选择-已更新')

      const options = JSON.parse(data.options)
      expect(options).toHaveLength(3)
    })
  })

  describe('DELETE /api/admin/specs/:id', () => {
    it('应该成功删除规格模板', async () => {
      const res = await fetchApi(`/api/admin/specs/${createdSpecId}`, {
        method: 'DELETE',
        cookies: adminCookies,
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.success).toBe(true)
    })
  })
})

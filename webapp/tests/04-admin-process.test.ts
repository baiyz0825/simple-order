import { describe, it, expect, beforeAll } from 'vitest'
import { fetchApi, loginAdmin } from './helpers'

describe('制作流程模板管理 /api/admin/process', () => {
  let adminCookies: Record<string, string>
  let createdProcessId: number

  beforeAll(async () => {
    const { cookies } = await loginAdmin()
    adminCookies = cookies
  })

  describe('未授权访问', () => {
    it('GET 无 token 应返回 401', async () => {
      const res = await fetchApi('/api/admin/process')
      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/admin/process', () => {
    it('应该返回制作流程模板列表', async () => {
      const res = await fetchApi('/api/admin/process', {
        cookies: adminCookies,
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeGreaterThan(0)
      expect(data[0]).toHaveProperty('id')
      expect(data[0]).toHaveProperty('name')
      expect(data[0]).toHaveProperty('steps')
    })
  })

  describe('POST /api/admin/process', () => {
    it('应该成功创建制作流程模板', async () => {
      const res = await fetchApi('/api/admin/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cookies: adminCookies,
        body: JSON.stringify({
          name: '测试流程',
          steps: [
            { name: '步骤一', sort: 1 },
            { name: '步骤二', sort: 2 },
            { name: '步骤三', sort: 3 },
          ],
        }),
      })

      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data.name).toBe('测试流程')
      createdProcessId = data.id

      const steps = JSON.parse(data.steps)
      expect(steps).toHaveLength(3)
      expect(steps[0].name).toBe('步骤一')
    })
  })

  describe('PATCH /api/admin/process/:id', () => {
    it('应该成功更新制作流程模板', async () => {
      const res = await fetchApi(`/api/admin/process/${createdProcessId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        cookies: adminCookies,
        body: JSON.stringify({
          name: '测试流程-已更新',
          steps: [
            { name: '新步骤A', sort: 1 },
            { name: '新步骤B', sort: 2 },
          ],
        }),
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.name).toBe('测试流程-已更新')

      const steps = JSON.parse(data.steps)
      expect(steps).toHaveLength(2)
    })
  })

  describe('DELETE /api/admin/process/:id', () => {
    it('应该成功删除制作流程模板', async () => {
      const res = await fetchApi(`/api/admin/process/${createdProcessId}`, {
        method: 'DELETE',
        cookies: adminCookies,
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.success).toBe(true)
    })
  })
})

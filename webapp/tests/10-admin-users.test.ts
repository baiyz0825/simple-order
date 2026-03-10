import { describe, it, expect, beforeAll } from 'vitest'
import { fetchApi, loginAdmin, parseCookies } from './helpers'

describe('管理员用户管理 /api/admin/users', () => {
  let adminCookies: Record<string, string>
  let testCustomerId: number

  beforeAll(async () => {
    const { cookies } = await loginAdmin()
    adminCookies = cookies

    // 注册一个顾客端用户用于测试
    const res = await fetchApi('/api/user/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: '13800001111',
        password: 'cust123',
        name: '测试顾客A',
      }),
    })
    if (res.ok) {
      const data = await res.json()
      testCustomerId = data.user.id
    }
  })

  describe('GET /api/admin/users', () => {
    it('应该返回用户列表', async () => {
      const res = await fetchApi('/api/admin/users', {
        cookies: adminCookies,
      })
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.users).toBeDefined()
      expect(Array.isArray(data.users)).toBe(true)
      expect(data.total).toBeGreaterThanOrEqual(1)
      expect(data.page).toBe(1)
      expect(data.totalPages).toBeGreaterThanOrEqual(1)
    })

    it('应该支持按角色筛选', async () => {
      const res = await fetchApi('/api/admin/users?role=admin', {
        cookies: adminCookies,
      })
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.users.every((u: { role: string }) => u.role === 'admin')).toBe(true)
    })

    it('应该支持关键字搜索', async () => {
      const res = await fetchApi('/api/admin/users?keyword=admin', {
        cookies: adminCookies,
      })
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.users.length).toBeGreaterThanOrEqual(1)
    })

    it('应该支持分页', async () => {
      const res = await fetchApi('/api/admin/users?page=1&pageSize=2', {
        cookies: adminCookies,
      })
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.users.length).toBeLessThanOrEqual(2)
      expect(data.pageSize).toBe(2)
    })

    it('未登录应返回 401', async () => {
      const res = await fetchApi('/api/admin/users')
      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/admin/users/:id', () => {
    it('应该返回用户详情', async () => {
      const listRes = await fetchApi('/api/admin/users', {
        cookies: adminCookies,
      })
      const { users } = await listRes.json()
      const userId = users[0].id

      const res = await fetchApi(`/api/admin/users/${userId}`, {
        cookies: adminCookies,
      })
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.id).toBe(userId)
      expect(data.name).toBeDefined()
      expect(data.role).toBeDefined()
    })

    it('不存在的用户应返回 404', async () => {
      const res = await fetchApi('/api/admin/users/99999', {
        cookies: adminCookies,
      })
      expect(res.status).toBe(404)
    })

    it('无效ID应返回 400', async () => {
      const res = await fetchApi('/api/admin/users/abc', {
        cookies: adminCookies,
      })
      expect(res.status).toBe(400)
    })
  })

  describe('PUT /api/admin/users/:id', () => {
    it('应该成功修改用户名称', async () => {
      if (!testCustomerId) return

      const res = await fetchApi(`/api/admin/users/${testCustomerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '改名顾客' }),
        cookies: adminCookies,
      })
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.name).toBe('改名顾客')
    })

    it('应该成功修改用户角色', async () => {
      if (!testCustomerId) return

      const res = await fetchApi(`/api/admin/users/${testCustomerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'staff' }),
        cookies: adminCookies,
      })
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.role).toBe('staff')

      // 恢复为 customer
      await fetchApi(`/api/admin/users/${testCustomerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'customer' }),
        cookies: adminCookies,
      })
    })

    it('无效角色应返回 400', async () => {
      if (!testCustomerId) return

      const res = await fetchApi(`/api/admin/users/${testCustomerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'superadmin' }),
        cookies: adminCookies,
      })
      expect(res.status).toBe(400)
    })

    it('不能修改自己的信息', async () => {
      // 获取当前管理员ID
      const meRes = await fetchApi('/api/admin/account', {
        cookies: adminCookies,
      })
      const me = await meRes.json()

      const res = await fetchApi(`/api/admin/users/${me.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '新名称' }),
        cookies: adminCookies,
      })
      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/admin/users/:id/orders', () => {
    it('应该返回用户的订单列表', async () => {
      if (!testCustomerId) return

      const res = await fetchApi(`/api/admin/users/${testCustomerId}/orders`, {
        cookies: adminCookies,
      })
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.orders).toBeDefined()
      expect(Array.isArray(data.orders)).toBe(true)
      expect(data.total).toBeDefined()
    })

    it('不存在的用户应返回 404', async () => {
      const res = await fetchApi('/api/admin/users/99999/orders', {
        cookies: adminCookies,
      })
      expect(res.status).toBe(404)
    })

    it('未登录应返回 401', async () => {
      const res = await fetchApi('/api/admin/users/1/orders')
      expect(res.status).toBe(401)
    })
  })

  describe('DELETE /api/admin/users/:id', () => {
    it('不能删除自己', async () => {
      const meRes = await fetchApi('/api/admin/account', {
        cookies: adminCookies,
      })
      const me = await meRes.json()

      const res = await fetchApi(`/api/admin/users/${me.id}`, {
        method: 'DELETE',
        cookies: adminCookies,
      })
      expect(res.status).toBe(400)
    })

    it('应该成功删除顾客用户', async () => {
      // 先创建一个要删除的用户
      const regRes = await fetchApi('/api/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: '13800009999',
          password: 'delete123',
          name: '待删除用户',
        }),
      })

      if (!regRes.ok) return
      const { user } = await regRes.json()

      const res = await fetchApi(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
        cookies: adminCookies,
      })
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.success).toBe(true)

      // 确认已删除
      const checkRes = await fetchApi(`/api/admin/users/${user.id}`, {
        cookies: adminCookies,
      })
      expect(checkRes.status).toBe(404)
    })

    it('不存在的用户应返回 404', async () => {
      const res = await fetchApi('/api/admin/users/99999', {
        method: 'DELETE',
        cookies: adminCookies,
      })
      expect(res.status).toBe(404)
    })
  })
})

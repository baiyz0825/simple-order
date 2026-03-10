import { describe, it, expect, beforeAll } from 'vitest'
import { fetchApi, loginAdmin } from './helpers'

describe('管理员账户设置 /api/admin/account', () => {
  let adminCookies: Record<string, string>

  beforeAll(async () => {
    const { cookies } = await loginAdmin()
    adminCookies = cookies
  })

  describe('GET /api/admin/account', () => {
    it('应该返回当前管理员信息', async () => {
      const res = await fetchApi('/api/admin/account', {
        cookies: adminCookies,
      })
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.id).toBeDefined()
      expect(data.email).toBe('admin@example.com')
      expect(data.name).toBeDefined()
      expect(data.role).toBe('admin')
    })

    it('未登录应返回 401', async () => {
      const res = await fetchApi('/api/admin/account')
      expect(res.status).toBe(401)
    })
  })

  describe('PUT /api/admin/account - 修改名称', () => {
    const originalName = 'Admin'

    it('应该成功修改名称', async () => {
      const res = await fetchApi('/api/admin/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '新管理员名称' }),
        cookies: adminCookies,
      })
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.name).toBe('新管理员名称')
    })

    it('空名称应返回 400', async () => {
      const res = await fetchApi('/api/admin/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '' }),
        cookies: adminCookies,
      })
      expect(res.status).toBe(400)
    })

    it('恢复原始名称', async () => {
      const res = await fetchApi('/api/admin/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: originalName }),
        cookies: adminCookies,
      })
      expect(res.status).toBe(200)
    })
  })

  describe('PUT /api/admin/account - 修改邮箱', () => {
    it('应该成功修改邮箱', async () => {
      const res = await fetchApi('/api/admin/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'new-admin@example.com' }),
        cookies: adminCookies,
      })
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.email).toBe('new-admin@example.com')
    })

    it('恢复原始邮箱', async () => {
      // 修改邮箱会重新签发token，需要获取新cookie
      const res = await fetchApi('/api/admin/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@example.com' }),
        cookies: adminCookies,
      })
      expect(res.status).toBe(200)
    })
  })

  describe('PUT /api/admin/account - 修改密码', () => {
    it('无当前密码应返回 400', async () => {
      const res = await fetchApi('/api/admin/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: 'newpass123' }),
        cookies: adminCookies,
      })
      expect(res.status).toBe(400)
    })

    it('当前密码错误应返回 401', async () => {
      const res = await fetchApi('/api/admin/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: 'wrongpassword',
          newPassword: 'newpass123',
        }),
        cookies: adminCookies,
      })
      expect(res.status).toBe(401)
    })

    it('新密码太短应返回 400', async () => {
      const res = await fetchApi('/api/admin/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: 'admin123',
          newPassword: '123',
        }),
        cookies: adminCookies,
      })
      expect(res.status).toBe(400)
    })

    it('应该成功修改密码并恢复', async () => {
      // 修改密码
      const res = await fetchApi('/api/admin/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: 'admin123',
          newPassword: 'newadmin123',
        }),
        cookies: adminCookies,
      })
      expect(res.status).toBe(200)

      // 用新密码登录
      const { cookies: newCookies } = await loginAdmin('admin@example.com', 'newadmin123')
      expect(newCookies.admin_token).toBeDefined()

      // 恢复原密码
      const restoreRes = await fetchApi('/api/admin/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: 'newadmin123',
          newPassword: 'admin123',
        }),
        cookies: newCookies,
      })
      expect(restoreRes.status).toBe(200)
    })
  })

  describe('PUT /api/admin/account - 无更新内容', () => {
    it('没有需要更新的字段应返回 400', async () => {
      const res = await fetchApi('/api/admin/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
        cookies: adminCookies,
      })
      expect(res.status).toBe(400)
    })
  })
})

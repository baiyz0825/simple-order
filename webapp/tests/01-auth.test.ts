import { describe, it, expect, beforeAll } from 'vitest'
import { fetchApi, parseCookies } from './helpers'

describe('认证接口 /api/auth', () => {
  // Seed data already has admin@example.com / admin123

  describe('POST /api/auth/register', () => {
    it('应该成功注册新用户', async () => {
      const res = await fetchApi('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test-register@example.com',
          password: 'test123',
          name: '测试用户',
        }),
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.user).toBeDefined()
      expect(data.user.email).toBe('test-register@example.com')
      expect(data.user.name).toBe('测试用户')
      // Not the first user, so role should be staff
      expect(data.user.role).toBe('staff')

      // Should set admin_token cookie
      const cookies = parseCookies(res)
      expect(cookies['admin_token']).toBeDefined()
      expect(cookies['admin_token'].length).toBeGreaterThan(0)
    })

    it('重复邮箱注册应返回 400', async () => {
      const res = await fetchApi('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@example.com',
          password: 'test123',
          name: '重复用户',
        }),
      })

      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toContain('已被注册')
    })

    it('缺少必填字段应返回 400', async () => {
      const res = await fetchApi('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'missing@example.com' }),
      })

      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toBeDefined()
    })
  })

  describe('POST /api/auth/login', () => {
    it('应该成功登录管理员', async () => {
      const res = await fetchApi('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@example.com',
          password: 'admin123',
        }),
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.user).toBeDefined()
      expect(data.user.email).toBe('admin@example.com')
      expect(data.user.role).toBe('admin')

      const cookies = parseCookies(res)
      expect(cookies['admin_token']).toBeDefined()
    })

    it('错误密码应返回 401', async () => {
      const res = await fetchApi('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@example.com',
          password: 'wrongpassword',
        }),
      })

      expect(res.status).toBe(401)
      const data = await res.json()
      expect(data.error).toBeDefined()
    })

    it('不存在的邮箱应返回 401', async () => {
      const res = await fetchApi('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'admin123',
        }),
      })

      expect(res.status).toBe(401)
    })

    it('缺少字段应返回 400', async () => {
      const res = await fetchApi('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@example.com' }),
      })

      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/auth/me', () => {
    let adminToken: string

    beforeAll(async () => {
      const res = await fetchApi('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@example.com',
          password: 'admin123',
        }),
      })
      const cookies = parseCookies(res)
      adminToken = cookies['admin_token']
    })

    it('应该返回当前登录用户信息', async () => {
      const res = await fetchApi('/api/auth/me', {
        cookies: { admin_token: adminToken },
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.user).toBeDefined()
      expect(data.user.email).toBe('admin@example.com')
      expect(data.user.role).toBe('admin')
    })

    it('未登录应返回 401', async () => {
      const res = await fetchApi('/api/auth/me')

      expect(res.status).toBe(401)
      const data = await res.json()
      expect(data.error).toBeDefined()
    })
  })

  describe('POST /api/auth/logout', () => {
    it('应该成功退出登录并清除 token', async () => {
      // First login
      const loginRes = await fetchApi('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@example.com',
          password: 'admin123',
        }),
      })
      const loginCookies = parseCookies(loginRes)
      const adminToken = loginCookies['admin_token']

      // Logout
      const logoutRes = await fetchApi('/api/auth/logout', {
        method: 'POST',
        cookies: { admin_token: adminToken },
      })

      expect(logoutRes.status).toBe(200)
      const data = await logoutRes.json()
      expect(data.success).toBe(true)

      // The response should clear the cookie (maxAge=0)
      const logoutCookies = parseCookies(logoutRes)
      // admin_token should be set to empty or the Set-Cookie should have maxAge=0
      expect(logoutCookies['admin_token']).toBeDefined()
    })
  })
})

import { describe, it, expect, beforeAll } from 'vitest'
import { fetchApi, parseCookies, loginAdmin } from './helpers'

describe('订单全流程 /api/orders', () => {
  let adminCookies: Record<string, string>
  let sessionId: string
  let createdOrderId: number
  let productId: number

  beforeAll(async () => {
    const { cookies } = await loginAdmin()
    adminCookies = cookies

    // Get a product from menu for order creation
    const menuRes = await fetchApi('/api/menu')
    const menu = await menuRes.json()
    const categoryWithProducts = menu.categories.find(
      (c: any) => c.products.length > 0
    )
    productId = categoryWithProducts.products[0].id

    // Make an initial request to get a session_id cookie
    const initRes = await fetchApi('/api/menu')
    const initCookies = parseCookies(initRes)
    sessionId = initCookies['session_id'] || 'test-session-id'
  })

  describe('POST /api/orders - 创建订单', () => {
    it('应该成功创建订单', async () => {
      const res = await fetchApi('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cookies: { session_id: sessionId },
        body: JSON.stringify({
          items: [
            {
              productId,
              quantity: 2,
              selectedSpecs: [],
            },
          ],
          remark: '少糖',
        }),
      })

      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data).toHaveProperty('id')
      expect(data).toHaveProperty('orderNo')
      expect(data.status).toBe('pending')
      expect(data.remark).toBe('少糖')
      expect(Array.isArray(data.items)).toBe(true)
      expect(data.items.length).toBe(1)
      expect(data.items[0].quantity).toBe(2)
      expect(data.totalPrice).toBeGreaterThan(0)

      createdOrderId = data.id
    })

    it('空商品列表应返回 400', async () => {
      const res = await fetchApi('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cookies: { session_id: sessionId },
        body: JSON.stringify({ items: [] }),
      })

      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toBeDefined()
    })

    it('不存在的商品 ID 应返回 400', async () => {
      const res = await fetchApi('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cookies: { session_id: sessionId },
        body: JSON.stringify({
          items: [{ productId: 99999, quantity: 1, selectedSpecs: [] }],
        }),
      })

      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/orders - 查询订单列表', () => {
    it('应该返回当前 session 的订单列表', async () => {
      const res = await fetchApi('/api/orders', {
        cookies: { session_id: sessionId },
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeGreaterThan(0)
    })

    it('管理端应返回所有订单', async () => {
      const res = await fetchApi('/api/orders?admin=true', {
        cookies: adminCookies,
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeGreaterThan(0)
    })

    it('管理端无 token 应返回 401', async () => {
      const res = await fetchApi('/api/orders?admin=true')
      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/orders/:id - 查询订单详情', () => {
    it('应该返回订单详情', async () => {
      const res = await fetchApi(`/api/orders/${createdOrderId}`)

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.id).toBe(createdOrderId)
      expect(data.status).toBe('pending')
      expect(Array.isArray(data.items)).toBe(true)
    })

    it('不存在的订单应返回 404', async () => {
      const res = await fetchApi('/api/orders/99999')
      expect(res.status).toBe(404)
    })
  })

  describe('PATCH /api/orders/:id/status - 订单状态流转', () => {
    it('应该成功将订单从 pending -> confirmed', async () => {
      const res = await fetchApi(`/api/orders/${createdOrderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        cookies: adminCookies,
        body: JSON.stringify({
          status: 'confirmed',
          estimatedTime: 15,
        }),
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.status).toBe('confirmed')
      expect(data.estimatedTime).toBe(15)
      expect(data.confirmedAt).toBeDefined()
    })

    it('应该成功将订单从 confirmed -> ready', async () => {
      const res = await fetchApi(`/api/orders/${createdOrderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        cookies: adminCookies,
        body: JSON.stringify({ status: 'ready' }),
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.status).toBe('ready')
      expect(data.readyAt).toBeDefined()
    })

    it('应该成功将订单从 ready -> completed', async () => {
      const res = await fetchApi(`/api/orders/${createdOrderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        cookies: adminCookies,
        body: JSON.stringify({ status: 'completed' }),
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.status).toBe('completed')
      expect(data.completedAt).toBeDefined()
    })

    it('非法状态流转应返回 400 (completed -> pending)', async () => {
      const res = await fetchApi(`/api/orders/${createdOrderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        cookies: adminCookies,
        body: JSON.stringify({ status: 'pending' }),
      })

      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toContain('不允许')
    })

    it('未授权应返回 401', async () => {
      const res = await fetchApi(`/api/orders/${createdOrderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'confirmed' }),
      })

      expect(res.status).toBe(401)
    })

    it('缺少 status 字段应返回 400', async () => {
      const res = await fetchApi(`/api/orders/${createdOrderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        cookies: adminCookies,
        body: JSON.stringify({}),
      })

      expect(res.status).toBe(400)
    })
  })

  describe('取消订单', () => {
    let cancelOrderId: number

    beforeAll(async () => {
      // Create a new order to cancel
      const res = await fetchApi('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cookies: { session_id: sessionId },
        body: JSON.stringify({
          items: [{ productId, quantity: 1, selectedSpecs: [] }],
        }),
      })
      const data = await res.json()
      cancelOrderId = data.id
    })

    it('应该成功取消 pending 订单', async () => {
      const res = await fetchApi(`/api/orders/${cancelOrderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        cookies: adminCookies,
        body: JSON.stringify({ status: 'cancelled' }),
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.status).toBe('cancelled')
    })
  })

  describe('PATCH /api/orders/:id/process - 制作进度更新', () => {
    let processOrderId: number

    beforeAll(async () => {
      // Create a new order for process testing
      // Use a product from a category with processTemplate (咖啡系列)
      const menuRes = await fetchApi('/api/menu')
      const menu = await menuRes.json()

      // Find a product in a category that has processTemplateId
      let processProductId: number | null = null
      for (const cat of menu.categories) {
        if (cat.processTemplateId && cat.products.length > 0) {
          processProductId = cat.products[0].id
          break
        }
      }

      if (!processProductId) {
        // Fallback to any product
        processProductId = productId
      }

      const res = await fetchApi('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cookies: { session_id: sessionId },
        body: JSON.stringify({
          items: [{ productId: processProductId, quantity: 1, selectedSpecs: [] }],
        }),
      })
      const data = await res.json()
      processOrderId = data.id

      // Confirm the order first
      await fetchApi(`/api/orders/${processOrderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        cookies: adminCookies,
        body: JSON.stringify({ status: 'confirmed' }),
      })
    })

    it('应该成功更新制作进度', async () => {
      const res = await fetchApi(`/api/orders/${processOrderId}/process`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        cookies: adminCookies,
        body: JSON.stringify({ itemIndex: 0, stepIndex: 0 }),
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.items[0].process[0].done).toBe(true)
    })

    it('缺少参数应返回 400', async () => {
      const res = await fetchApi(`/api/orders/${processOrderId}/process`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        cookies: adminCookies,
        body: JSON.stringify({ itemIndex: 0 }),
      })

      expect(res.status).toBe(400)
    })

    it('itemIndex 越界应返回 400', async () => {
      const res = await fetchApi(`/api/orders/${processOrderId}/process`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        cookies: adminCookies,
        body: JSON.stringify({ itemIndex: 999, stepIndex: 0 }),
      })

      expect(res.status).toBe(400)
    })

    it('stepIndex 越界应返回 400', async () => {
      const res = await fetchApi(`/api/orders/${processOrderId}/process`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        cookies: adminCookies,
        body: JSON.stringify({ itemIndex: 0, stepIndex: 999 }),
      })

      expect(res.status).toBe(400)
    })

    it('未授权应返回 401', async () => {
      const res = await fetchApi(`/api/orders/${processOrderId}/process`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIndex: 0, stepIndex: 0 }),
      })

      expect(res.status).toBe(401)
    })
  })
})

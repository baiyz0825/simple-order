const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { WebSocketServer } = require('ws')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
app.prepare().then(() => {
  const handle = app.getRequestHandler()
  const upgrade = app.getUpgradeHandler()
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  })

  // 不绑定到 server，手动处理 upgrade
  const wss = new WebSocketServer({ noServer: true })

  // 存储连接
  const adminClients = new Set()
  const orderSubscriptions = new Map() // orderId -> Set<ws>

  wss.on('connection', (ws) => {
    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString())
        if (msg.type === 'subscribe_admin') {
          adminClients.add(ws)
        } else if (msg.type === 'subscribe_order') {
          const orderId = Number(msg.orderId)
          if (!orderSubscriptions.has(orderId)) {
            orderSubscriptions.set(orderId, new Set())
          }
          orderSubscriptions.get(orderId).add(ws)
        }
      } catch (e) {
        // ignore invalid messages
      }
    })

    ws.on('close', () => {
      adminClients.delete(ws)
      orderSubscriptions.forEach(subs => subs.delete(ws))
    })
  })

  // 手动处理 WebSocket upgrade 请求
  server.on('upgrade', (req, socket, head) => {
    const { pathname } = parse(req.url, true)
    if (pathname === '/ws') {
      // 我们的业务 WebSocket
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req)
      })
    } else {
      // Next.js HMR 等其他 WebSocket 请求
      upgrade(req, socket, head)
    }
  })

  // 暴露广播函数到全局，供 API 路由调用
  global.broadcastNewOrder = (order) => {
    const msg = JSON.stringify({ type: 'new_order', order })
    adminClients.forEach(client => {
      if (client.readyState === 1) client.send(msg)
    })
  }

  global.broadcastOrderUpdate = (orderId, data) => {
    const msg = JSON.stringify({ type: 'order_updated', orderId, ...data })
    const subs = orderSubscriptions.get(orderId) || new Set()
    subs.forEach(client => {
      if (client.readyState === 1) client.send(msg)
    })
    // 也通知管理端
    adminClients.forEach(client => {
      if (client.readyState === 1) client.send(msg)
    })
  }

  const port = process.env.PORT || 3000
  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`)
  })
})

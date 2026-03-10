import { describe, it, expect } from 'vitest'
import WebSocket from 'ws'

const WS_URL = 'ws://localhost:3001/ws'

function createWs(): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL)
    ws.on('open', () => resolve(ws))
    ws.on('error', reject)
    setTimeout(() => reject(new Error('WebSocket connection timeout')), 5000)
  })
}

function waitForMessage(ws: WebSocket, timeoutMs = 3000): Promise<any> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Message timeout')), timeoutMs)
    ws.once('message', (data) => {
      clearTimeout(timeout)
      resolve(JSON.parse(data.toString()))
    })
  })
}

describe('WebSocket /ws', () => {
  it('应该成功建立 WebSocket 连接', async () => {
    const ws = await createWs()
    expect(ws.readyState).toBe(WebSocket.OPEN)
    ws.close()
  })

  it('应该支持 subscribe_admin 消息', async () => {
    const ws = await createWs()

    ws.send(JSON.stringify({ type: 'subscribe_admin' }))

    // The server doesn't send a confirmation back, so we just verify
    // the connection stays open after sending the subscribe message
    await new Promise((resolve) => setTimeout(resolve, 500))
    expect(ws.readyState).toBe(WebSocket.OPEN)

    ws.close()
  })

  it('应该支持 subscribe_order 消息', async () => {
    const ws = await createWs()

    ws.send(JSON.stringify({ type: 'subscribe_order', orderId: 1 }))

    await new Promise((resolve) => setTimeout(resolve, 500))
    expect(ws.readyState).toBe(WebSocket.OPEN)

    ws.close()
  })

  it('应该在连接关闭后正确清理', async () => {
    const ws = await createWs()
    ws.send(JSON.stringify({ type: 'subscribe_admin' }))

    await new Promise((resolve) => setTimeout(resolve, 200))

    ws.close()

    await new Promise<void>((resolve) => {
      ws.on('close', () => resolve())
      setTimeout(resolve, 2000)
    })

    expect(ws.readyState).toBe(WebSocket.CLOSED)
  })

  it('应该忽略无效 JSON 消息', async () => {
    const ws = await createWs()

    // Send invalid JSON - should not crash the connection
    ws.send('this is not json')

    await new Promise((resolve) => setTimeout(resolve, 500))
    expect(ws.readyState).toBe(WebSocket.OPEN)

    ws.close()
  })
})

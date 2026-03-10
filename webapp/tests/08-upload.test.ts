import { describe, it, expect } from 'vitest'
import { BASE_URL } from './helpers'

describe('文件上传 POST /api/upload', () => {
  it('应该成功上传文件', async () => {
    const formData = new FormData()
    const fileContent = new Blob(['test file content'], { type: 'text/plain' })
    formData.append('file', fileContent, 'test.txt')

    const res = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    })

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveProperty('url')
    expect(data.url).toContain('/uploads/')
    expect(data.url).toContain('.txt')
  })

  it('无文件应返回 400', async () => {
    const formData = new FormData()

    const res = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    })

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBeDefined()
  })

  it('应该支持上传图片文件', async () => {
    const formData = new FormData()
    // Create a minimal PNG-like blob
    const pngContent = new Blob([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], {
      type: 'image/png',
    })
    formData.append('file', pngContent, 'test-image.png')

    const res = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    })

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.url).toContain('.png')
  })
})

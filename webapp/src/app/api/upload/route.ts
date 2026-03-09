import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: '未选择文件' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // 生成文件名：时间戳 + 随机数 + 原始扩展名
    const ext = path.extname(file.name) || '.jpg'
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 1000000)
    const filename = `${timestamp}_${random}${ext}`

    // 确保 uploads 目录存在
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadDir, { recursive: true })

    // 写入文件
    const filePath = path.join(uploadDir, filename)
    await writeFile(filePath, buffer)

    return NextResponse.json({ url: `/uploads/${filename}` })
  } catch (error) {
    console.error('文件上传失败:', error)
    return NextResponse.json({ error: '文件上传失败' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/placeholder/[size]?text=xxx
 * 生成占位图片（SVG格式）
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size: sizeParam } = await params
  const size = parseInt(sizeParam, 10) || 400
  const text = request.nextUrl.searchParams.get('text') || 'Image'

  // 限制尺寸范围
  const safeSize = Math.min(Math.max(size, 50), 1200)

  // 生成 SVG
  const svg = `
    <svg width="${safeSize}" height="${safeSize}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#e5e7eb"/>
      <rect x="10%" y="10%" width="80%" height="80%" fill="#d1d5db" rx="8"/>
      <text
        x="50%"
        y="50%"
        font-family="system-ui, -apple-system, sans-serif"
        font-size="${Math.max(safeSize / 10, 16)}"
        fill="#6b7280"
        text-anchor="middle"
        dominant-baseline="middle"
      >${escapeXml(text)}</text>
    </svg>
  `

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

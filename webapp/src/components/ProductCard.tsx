'use client'

import Image from 'next/image'

export interface ProductInfo {
  id: number
  name: string
  description: string | null
  price: number // 分
  imageUrl: string | null
  resolvedSpecs: ResolvedSpec[]
}

export interface ResolvedSpec {
  templateId: number
  templateName: string
  type: string // 'single' | 'multiple'
  required: boolean
  options: { name: string; priceDelta: number }[]
}

interface ProductCardProps {
  product: ProductInfo
  onAdd: (product: ProductInfo) => void
  onDetail: (product: ProductInfo) => void
}

export default function ProductCard({
  product,
  onAdd,
  onDetail,
}: ProductCardProps) {
  const hasSpecs = product.resolvedSpecs && product.resolvedSpecs.length > 0
  const priceYuan = (product.price / 100).toFixed(product.price % 100 === 0 ? 0 : 2)

  const handleAdd = () => {
    if (hasSpecs) {
      onDetail(product)
    } else {
      onAdd(product)
    }
  }

  return (
    <div className="flex gap-3 border-b border-border-color/30 bg-white px-3 py-3">
      {/* 商品图片 */}
      <div className="relative h-[80px] w-[80px] shrink-0 overflow-hidden rounded-lg bg-gray-100">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            sizes="80px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-lg bg-gradient-to-br from-orange-50 to-amber-100">
            <span className="text-3xl">☕</span>
          </div>
        )}
      </div>

      {/* 商品信息 */}
      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
        <div>
          <h3 className="text-[15px] font-bold leading-snug text-text-main">
            {product.name}
          </h3>
          {product.description && (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-text-secondary">
              {product.description}
            </p>
          )}
        </div>

        <div className="flex items-end justify-between">
          <div className="flex items-baseline gap-0.5">
            <span className="text-xs font-semibold text-text-main">&#xA5;</span>
            <span className="text-[18px] font-bold leading-none text-text-main">
              {priceYuan}
            </span>
          </div>

          {/* 加入购物车按钮 */}
          <button
            onClick={handleAdd}
            className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-primary text-white shadow-sm transition-transform active:scale-90"
            aria-label={hasSpecs ? '选择规格' : '加入购物车'}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

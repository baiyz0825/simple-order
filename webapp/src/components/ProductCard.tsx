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
    <div className="flex gap-3 bg-white p-3">
      {/* 商品图片 */}
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-100">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            sizes="80px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl text-text-light">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* 商品信息 */}
      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
        <div>
          <h3 className="text-[15px] font-semibold leading-snug text-text-main">
            {product.name}
          </h3>
          {product.description && (
            <p className="mt-0.5 truncate text-xs text-text-secondary">
              {product.description}
            </p>
          )}
        </div>

        <div className="flex items-end justify-between">
          <div className="flex items-baseline gap-0.5">
            <span className="text-xs text-primary">&#xA5;</span>
            <span className="text-[17px] font-bold leading-none text-primary">
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

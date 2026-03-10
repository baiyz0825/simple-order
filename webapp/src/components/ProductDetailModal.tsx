'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import type { ProductInfo, ResolvedSpec } from './ProductCard'

interface ProductDetailModalProps {
  product: ProductInfo | null
  visible: boolean
  onClose: () => void
  onAddToCart: (
    product: ProductInfo,
    quantity: number,
    selectedSpecs: {
      templateId: number
      templateName: string
      type: string
      selected: string[]
    }[],
    totalPrice: number
  ) => void
}

export default function ProductDetailModal({
  product,
  visible,
  onClose,
  onAddToCart,
}: ProductDetailModalProps) {
  const [quantity, setQuantity] = useState(1)
  const [selections, setSelections] = useState<Record<number, string[]>>({})
  const [animateIn, setAnimateIn] = useState(false)

  // 重置状态当商品变化
  useEffect(() => {
    if (product && visible) {
      setQuantity(1)
      // 初始化默认选择：单选类型默认选第一个，多选不选
      const initial: Record<number, string[]> = {}
      product.resolvedSpecs.forEach((spec) => {
        if (spec.type === 'single' && spec.options.length > 0) {
          initial[spec.templateId] = [spec.options[0].name]
        } else {
          initial[spec.templateId] = []
        }
      })
      setSelections(initial)
      // 触发进入动画
      requestAnimationFrame(() => {
        setAnimateIn(true)
      })
    } else {
      setAnimateIn(false)
    }
  }, [product, visible])

  // 计算总价（基础价 + 加价）* 数量
  const computePrice = useCallback(() => {
    if (!product) return 0
    let total = product.price
    product.resolvedSpecs.forEach((spec) => {
      const selected = selections[spec.templateId] || []
      spec.options.forEach((opt) => {
        if (selected.includes(opt.name)) {
          total += opt.priceDelta
        }
      })
    })
    return total * quantity
  }, [product, selections, quantity])

  const unitPrice = useCallback(() => {
    if (!product) return 0
    let total = product.price
    product.resolvedSpecs.forEach((spec) => {
      const selected = selections[spec.templateId] || []
      spec.options.forEach((opt) => {
        if (selected.includes(opt.name)) {
          total += opt.priceDelta
        }
      })
    })
    return total
  }, [product, selections])

  const handleSpecSelect = (spec: ResolvedSpec, optionName: string) => {
    setSelections((prev) => {
      const current = prev[spec.templateId] || []
      if (spec.type === 'single') {
        return { ...prev, [spec.templateId]: [optionName] }
      } else {
        // 多选 toggle
        if (current.includes(optionName)) {
          return {
            ...prev,
            [spec.templateId]: current.filter((n) => n !== optionName),
          }
        } else {
          return {
            ...prev,
            [spec.templateId]: [...current, optionName],
          }
        }
      }
    })
  }

  const handleAdd = () => {
    if (!product) return
    const selectedSpecs = product.resolvedSpecs.map((spec) => ({
      templateId: spec.templateId,
      templateName: spec.templateName,
      type: spec.type,
      selected: selections[spec.templateId] || [],
    }))
    onAddToCart(product, quantity, selectedSpecs, unitPrice())
    handleClose()
  }

  const handleClose = () => {
    setAnimateIn(false)
    setTimeout(() => {
      onClose()
    }, 250)
  }

  if (!visible || !product) return null

  const totalPrice = computePrice()
  const priceYuan = (totalPrice / 100).toFixed(totalPrice % 100 === 0 ? 0 : 2)

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* 遮罩 */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-250 ${
          animateIn ? 'opacity-50' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* 弹窗内容 */}
      <div
        className={`relative z-10 mx-auto w-full max-h-[85vh] overflow-hidden rounded-t-2xl bg-white transition-transform duration-250 ease-out ${
          animateIn ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxWidth: 'var(--app-max-width)' }}
      >
        {/* 拖拽指示条 */}
        <div className="flex justify-center py-2">
          <div className="h-1 w-10 rounded-full bg-gray-300" />
        </div>

        {/* 可滚动区域 */}
        <div className="max-h-[calc(85vh-140px)] overflow-y-auto px-4 pb-4 scrollbar-hide">
          {/* 商品图片 */}
          <div className="relative mx-auto mb-3 aspect-[4/3] w-full max-w-[320px] overflow-hidden rounded-xl bg-gray-100">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover"
                sizes="320px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-text-light">
                <svg
                  width="48"
                  height="48"
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

          {/* 商品名称 + 描述 */}
          <h2 className="text-lg font-bold text-text-main">{product.name}</h2>
          {product.description && (
            <p className="mt-1 text-sm text-text-secondary">
              {product.description}
            </p>
          )}

          {/* 分割线 */}
          <div className="my-4 h-px bg-border-color" />

          {/* 规格选择 */}
          {product.resolvedSpecs.map((spec) => (
            <div key={spec.templateId} className="mb-4">
              <div className="mb-2 flex items-center gap-1.5">
                <span className="text-sm font-semibold text-text-main">
                  {spec.templateName}
                </span>
                {spec.required && (
                  <span className="text-[10px] text-danger-red">必选</span>
                )}
                <span className="text-xs text-text-light">
                  {spec.type === 'single' ? '(单选)' : '(多选)'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {spec.options.map((opt) => {
                  const isSelected = (
                    selections[spec.templateId] || []
                  ).includes(opt.name)
                  return (
                    <button
                      key={opt.name}
                      onClick={() => handleSpecSelect(spec, opt.name)}
                      className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary/10 font-medium text-primary'
                          : 'border-border-color bg-white text-text-main hover:border-gray-300'
                      }`}
                    >
                      {opt.name}
                      {opt.priceDelta > 0 && (
                        <span className="ml-1 text-xs text-text-secondary">
                          +&#xA5;{(opt.priceDelta / 100).toFixed(opt.priceDelta % 100 === 0 ? 0 : 2)}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* 底部操作栏 */}
        <div className="flex items-center gap-4 border-t border-border-color bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {/* 数量加减 */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border-color text-text-secondary transition-colors disabled:opacity-30"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <span className="min-w-[20px] text-center text-base font-semibold text-text-main">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-primary text-primary transition-colors"
            >
              <svg
                width="14"
                height="14"
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

          {/* 加入购物车按钮 */}
          <button
            onClick={handleAdd}
            className="flex-1 rounded-full bg-primary py-3 text-center text-[15px] font-semibold text-white shadow-sm transition-colors active:bg-primary-dark"
          >
            加入购物车 &#xA5;{priceYuan}
          </button>
        </div>
      </div>
    </div>
  )
}

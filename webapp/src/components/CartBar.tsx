'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useCart } from '@/lib/cart'

export default function CartBar() {
  const router = useRouter()
  const { items, totalPrice, totalCount, updateQuantity, removeFromCart, clearCart } =
    useCart()
  const [showDetail, setShowDetail] = useState(false)
  const [animateDetail, setAnimateDetail] = useState(false)

  const priceYuan = (totalPrice / 100).toFixed(totalPrice % 100 === 0 ? 0 : 2)
  const isEmpty = totalCount === 0

  const handleOpenDetail = () => {
    if (isEmpty) return
    setShowDetail(true)
    requestAnimationFrame(() => {
      setAnimateDetail(true)
    })
  }

  const handleCloseDetail = () => {
    setAnimateDetail(false)
    setTimeout(() => {
      setShowDetail(false)
    }, 250)
  }

  const handleCheckout = () => {
    if (isEmpty) return
    router.push('/order/confirm')
  }

  const handleClear = () => {
    clearCart()
    handleCloseDetail()
  }

  return (
    <>
      {/* 购物车详情弹窗 */}
      {showDetail && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end">
          {/* 遮罩 */}
          <div
            className={`absolute inset-0 bg-black transition-opacity duration-250 ${
              animateDetail ? 'opacity-40' : 'opacity-0'
            }`}
            onClick={handleCloseDetail}
          />

          {/* 内容 */}
          <div
            className={`relative z-10 mx-auto w-full max-h-[60vh] rounded-t-2xl bg-white transition-transform duration-250 ease-out ${
              animateDetail ? 'translate-y-0' : 'translate-y-full'
            }`}
            style={{ marginBottom: '60px', maxWidth: 'var(--app-max-width)' }}
          >
            {/* 头部 */}
            <div className="flex items-center justify-between border-b border-border-color px-4 py-3">
              <span className="text-base font-semibold text-text-main">
                购物车
              </span>
              <button
                onClick={handleClear}
                className="text-sm text-text-secondary"
              >
                清空
              </button>
            </div>

            {/* 商品列表 */}
            <div className="max-h-[calc(60vh-50px)] overflow-y-auto scrollbar-hide">
              {items.map((item) => {
                const itemPriceYuan = (item.price / 100).toFixed(
                  item.price % 100 === 0 ? 0 : 2
                )
                return (
                  <div
                    key={item.cartId}
                    className="flex items-center gap-3 border-b border-border-color/50 px-4 py-3"
                  >
                    {/* 商品图片 */}
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.productName}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-lg bg-gradient-to-br from-orange-50 to-amber-100">
                          <span className="text-xl">☕</span>
                        </div>
                      )}
                    </div>

                    {/* 商品信息 */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text-main">
                        {item.productName}
                      </p>
                      {item.selectedSpecs.length > 0 && (
                        <p className="mt-0.5 truncate text-xs text-text-secondary">
                          {item.selectedSpecs
                            .filter((s) => s.selected.length > 0)
                            .map((s) => s.selected.join('/'))
                            .join(', ')}
                        </p>
                      )}
                      <p className="mt-0.5 text-sm font-semibold text-primary">
                        &#xA5;{itemPriceYuan}
                      </p>
                    </div>

                    {/* 数量操作 */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          item.quantity <= 1
                            ? removeFromCart(item.cartId)
                            : updateQuantity(item.cartId, item.quantity - 1)
                        }
                        className="flex h-6 w-6 items-center justify-center rounded-full border border-border-color text-text-secondary"
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        >
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </button>
                      <span className="min-w-[18px] text-center text-sm font-medium text-text-main">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.cartId, item.quantity + 1)
                        }
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white"
                      >
                        <svg
                          width="12"
                          height="12"
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
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* 底部购物车浮层 — 位于 BottomNav 上方 */}
      <div className="fixed-bar bottom-[56px] z-50 pb-[env(safe-area-inset-bottom)]">
        <div className="mx-3 mb-2 flex items-center rounded-full bg-[#2C2C2E]/95 px-4 py-2 shadow-lg backdrop-blur-xl">
          {/* 左侧：购物袋 + 总价 */}
          <button
            className="flex flex-1 items-center gap-3"
            onClick={handleOpenDetail}
          >
            {/* 购物袋图标 */}
            <div className="relative">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke={isEmpty ? '#8E8E93' : '#FF8D4D'}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
              {/* 数量角标 */}
              {totalCount > 0 && (
                <span className="absolute -right-2 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                  {totalCount > 99 ? '99+' : totalCount}
                </span>
              )}
            </div>

            {/* 总价 */}
            {isEmpty ? (
              <span className="text-sm text-text-secondary">购物车是空的</span>
            ) : (
              <div className="flex items-baseline gap-0.5">
                <span className="text-xs text-white">&#xA5;</span>
                <span className="text-xl font-bold text-white">{priceYuan}</span>
              </div>
            )}
          </button>

          {/* 右侧：去结算按钮 */}
          <button
            onClick={handleCheckout}
            disabled={isEmpty}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
              isEmpty
                ? 'bg-gray-600 text-gray-400'
                : 'bg-primary text-white active:bg-primary-dark'
            }`}
          >
            去结算
          </button>
        </div>
      </div>
    </>
  )
}

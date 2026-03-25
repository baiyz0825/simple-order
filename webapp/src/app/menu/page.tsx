'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/cart'
import CategoryNav from '@/components/CategoryNav'
import ProductCard from '@/components/ProductCard'
import type { ProductInfo } from '@/components/ProductCard'
import ProductDetailModal from '@/components/ProductDetailModal'
import CartBar from '@/components/CartBar'

// ─── API 数据类型 ───────────────────────────────────────────────

interface MenuCategory {
  id: number
  name: string
  sort: number
  products: MenuProduct[]
}

interface MenuProduct {
  id: number
  name: string
  description: string | null
  price: number
  imageUrl: string | null
  sort: number
  resolvedSpecs: {
    templateId: number
    templateName: string
    type: string
    required: boolean
    options: { name: string; priceDelta: number }[]
  }[]
}

// ─── 主页面组件 ──────────────────────────────────────────────────

export default function MenuPage() {
  const router = useRouter()
  const { addToCart } = useCart()

  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [activeCategory, setActiveCategory] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [shopName, setShopName] = useState('精品咖啡烘焙店')
  const [shopSubtitle, setShopSubtitle] = useState('专注手冲与手工烘焙')

  // 商品规格弹窗
  const [detailProduct, setDetailProduct] = useState<ProductInfo | null>(null)
  const [detailVisible, setDetailVisible] = useState(false)

  // 分类区域 ref，用于滚动定位
  const sectionRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isClickScrolling = useRef(false)

  // ─── 加载菜单数据 ──────────────────────────────────────────────

  useEffect(() => {
    async function fetchMenu() {
      try {
        setLoading(true)
        const [menuRes, settingsRes] = await Promise.all([
          fetch('/api/menu'),
          fetch('/api/settings'),
        ])
        if (!menuRes.ok) throw new Error('获取菜单失败')
        const data = await menuRes.json()
        // 过滤掉没有商品的空分类
        const nonEmpty = (data.categories || []).filter(
          (c: MenuCategory) => c.products.length > 0
        )
        setCategories(nonEmpty)
        if (data.categories?.length > 0) {
          setActiveCategory(data.categories[0].id)
        }
        // 读取店铺设置
        if (settingsRes.ok) {
          const s = await settingsRes.json()
          if (s.shopName) setShopName(s.shopName)
          if (s.shopSubtitle) setShopSubtitle(s.shopSubtitle)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '网络错误')
      } finally {
        setLoading(false)
      }
    }
    fetchMenu()
  }, [])

  // ─── 滚动监听：更新当前分类高亮 ────────────────────────────────

  const handleScroll = useCallback(() => {
    if (isClickScrolling.current) return
    const container = scrollContainerRef.current
    if (!container) return

    const containerRect = container.getBoundingClientRect()
    let currentId = categories.length > 0 ? categories[0].id : activeCategory

    for (const cat of categories) {
      const el = sectionRefs.current.get(cat.id)
      if (!el) continue
      const elRect = el.getBoundingClientRect()
      // 该 section 的顶部相对容器顶部的距离
      if (elRect.top - containerRect.top <= 30) {
        currentId = cat.id
      }
    }

    setActiveCategory(currentId)
  }, [categories, activeCategory])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return
    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  // ─── 点击分类滚动 ──────────────────────────────────────────────

  const handleCategoryClick = (categoryId: number) => {
    setActiveCategory(categoryId)
    const section = sectionRefs.current.get(categoryId)
    const container = scrollContainerRef.current
    if (section && container) {
      isClickScrolling.current = true
      // 使用 getBoundingClientRect 计算精确的滚动目标位置
      const containerRect = container.getBoundingClientRect()
      const sectionRect = section.getBoundingClientRect()
      const scrollTarget = container.scrollTop + (sectionRect.top - containerRect.top)
      container.scrollTo({
        top: scrollTarget,
        behavior: 'smooth',
      })
      setTimeout(() => {
        isClickScrolling.current = false
      }, 600)
    }
  }

  // ─── 直接加入购物车（无规格商品）─────────────────────────────────

  const handleDirectAdd = (product: ProductInfo) => {
    addToCart({
      productId: product.id,
      productName: product.name,
      imageUrl: product.imageUrl || '',
      price: product.price,
      quantity: 1,
      selectedSpecs: [],
    })
  }

  // ─── 打开规格弹窗 ─────────────────────────────────────────────

  const handleOpenDetail = (product: ProductInfo) => {
    setDetailProduct(product)
    setDetailVisible(true)
  }

  // ─── 从规格弹窗加入购物车 ──────────────────────────────────────

  const handleAddFromModal = (
    product: ProductInfo,
    quantity: number,
    selectedSpecs: {
      templateId: number
      templateName: string
      type: string
      selected: string[]
    }[],
    unitPrice: number
  ) => {
    addToCart({
      productId: product.id,
      productName: product.name,
      imageUrl: product.imageUrl || '',
      price: unitPrice,
      quantity,
      selectedSpecs,
    })
  }

  // ─── 加载状态 ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ios-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
          <span className="text-sm text-text-secondary">加载中...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ios-bg px-6">
        <div className="text-4xl">&#x26A0;&#xFE0F;</div>
        <p className="text-center text-text-secondary">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-full bg-primary px-6 py-2 text-sm text-white"
        >
          重试
        </button>
      </div>
    )
  }

  // ─── 渲染 ──────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen flex-col bg-ios-bg">
      {/* 顶部标题区 */}
      <header className="bg-white px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-ios-bg text-text-secondary active:bg-gray-200"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <path d="m12 19-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-text-main">{shopName}</h1>
            <p className="mt-0.5 text-sm text-text-secondary">
              {shopSubtitle}
            </p>
          </div>
        </div>
      </header>

      {/* 主体区域：分类导航 + 商品列表 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧分类导航 */}
        <CategoryNav
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
          activeCategory={activeCategory}
          onCategoryClick={handleCategoryClick}
        />

        {/* 右侧商品列表 */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto bg-white pb-36 scrollbar-hide"
        >
          {categories.map((cat) => (
            <div
              key={cat.id}
              ref={(el) => {
                if (el) sectionRefs.current.set(cat.id, el)
              }}
            >
              {/* 分类标题 */}
              <div className="px-3 pb-1 pt-3">
                <h2 className="text-[15px] font-bold text-text-main">
                  {cat.name}
                </h2>
              </div>

              {/* 商品卡片列表 */}
              <div className="sm:grid sm:grid-cols-2 sm:gap-1">
                {cat.products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={{
                      id: product.id,
                      name: product.name,
                      description: product.description,
                      price: product.price,
                      imageUrl: product.imageUrl,
                      resolvedSpecs: product.resolvedSpecs,
                    }}
                    onAdd={handleDirectAdd}
                    onDetail={handleOpenDetail}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 商品规格弹窗 */}
      <ProductDetailModal
        product={detailProduct}
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
        onAddToCart={handleAddFromModal}
      />

      {/* 底部购物车浮层 */}
      <CartBar />
    </div>
  )
}

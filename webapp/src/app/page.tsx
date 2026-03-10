'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface ShopSettings {
  shopName: string
  shopSubtitle: string
  aboutText: string
  businessHours: string
  address: string
  contactInfo: string
  homeWelcomeText: string
  homeAnnouncementText: string
  homeBannerUrl: string
}

interface PopularProduct {
  id: number
  name: string
  description: string | null
  price: number
  imageUrl: string | null
  salesCount: number
}

export default function HomePage() {
  const router = useRouter()
  const [settings, setSettings] = useState<ShopSettings | null>(null)
  const [popular, setPopular] = useState<PopularProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/settings').then((r) => r.json()),
      fetch('/api/popular?limit=8').then((r) => r.json()),
    ])
      .then(([settingsData, popularData]) => {
        setSettings(settingsData)
        setPopular(Array.isArray(popularData) ? popularData : [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

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

  const shopName = settings?.shopName || '精品咖啡烘焙店'
  const shopSubtitle = settings?.shopSubtitle || '专注手冲与手工烘焙'
  const welcomeText = settings?.homeWelcomeText || '欢迎光临，开启美好的一天'
  const announcement = settings?.homeAnnouncementText || ''
  const bannerUrl = settings?.homeBannerUrl || ''

  return (
    <div className="min-h-screen bg-ios-bg pb-24">
      {/* Hero 区域 */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/90 to-orange-400 px-5 pb-8 pt-[max(3rem,env(safe-area-inset-top))]">
        {/* 背景装饰 */}
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-6 -left-6 h-28 w-28 rounded-full bg-white/10" />

        {/* Banner 图片 */}
        {bannerUrl && (
          <div className="relative mb-4 h-40 w-full overflow-hidden rounded-2xl">
            <Image
              src={bannerUrl}
              alt="banner"
              fill
              className="object-cover"
              sizes="100vw"
            />
          </div>
        )}

        <div className="relative z-10">
          {/* 店铺 Logo */}
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <svg
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 8h1a4 4 0 0 1 0 8h-1" />
              <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8Z" />
              <line x1="6" y1="2" x2="6" y2="4" />
              <line x1="10" y1="2" x2="10" y2="4" />
              <line x1="14" y1="2" x2="14" y2="4" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-white">{shopName}</h1>
          <p className="mt-1 text-sm text-white/80">{shopSubtitle}</p>
          <p className="mt-3 text-[13px] leading-relaxed text-white/70">{welcomeText}</p>
        </div>
      </div>

      {/* 公告栏 */}
      {announcement && (
        <div className="mx-4 -mt-4 relative z-10 flex items-center gap-2 rounded-xl bg-white px-4 py-3 shadow-sm">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FF8D4D"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21.73 18l-8-14a2 2 0 00-3.48 0l-8 14A2 2 0 004.27 21h15.46A2 2 0 0021.73 18z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <p className="flex-1 text-sm text-text-secondary">{announcement}</p>
        </div>
      )}

      {/* 快捷操作 */}
      <div className={`mx-4 grid grid-cols-2 gap-3 sm:grid-cols-2 ${announcement ? 'mt-4' : '-mt-4 relative z-10'}`}>
        <button
          onClick={() => router.push('/menu')}
          className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm active:scale-[0.98] transition-transform"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FF8D4D"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 8h1a4 4 0 0 1 0 8h-1" />
              <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8Z" />
              <line x1="6" y1="2" x2="6" y2="4" />
              <line x1="10" y1="2" x2="10" y2="4" />
              <line x1="14" y1="2" x2="14" y2="4" />
            </svg>
          </div>
          <div className="text-left">
            <p className="text-[15px] font-semibold text-text-main">开始点单</p>
            <p className="mt-0.5 text-xs text-text-secondary">浏览完整菜单</p>
          </div>
        </button>

        <button
          onClick={() => router.push('/orders')}
          className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm active:scale-[0.98] transition-transform"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#3B82F6"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
              <path d="M14 2v6h6" />
              <line x1="8" y1="13" x2="16" y2="13" />
              <line x1="8" y1="17" x2="13" y2="17" />
            </svg>
          </div>
          <div className="text-left">
            <p className="text-[15px] font-semibold text-text-main">我的订单</p>
            <p className="mt-0.5 text-xs text-text-secondary">查看订单状态</p>
          </div>
        </button>
      </div>

      {/* 推荐商品 */}
      {popular.length > 0 && (
        <div className="mt-6 px-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-text-main">人气推荐</h2>
            <button
              onClick={() => router.push('/menu')}
              className="text-sm text-primary"
            >
              查看全部
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {popular.map((product) => {
              const priceYuan = (product.price / 100).toFixed(
                product.price % 100 === 0 ? 0 : 2
              )
              return (
                <div
                  key={product.id}
                  onClick={() => router.push('/menu')}
                  className="cursor-pointer overflow-hidden rounded-2xl bg-white shadow-sm active:scale-[0.98] transition-transform"
                >
                  {/* 商品图片 */}
                  <div className="relative aspect-square bg-gray-50">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="50vw"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100">
                        <span className="text-4xl">☕</span>
                      </div>
                    )}
                    {/* 销量角标 */}
                    {product.salesCount > 0 && (
                      <div className="absolute left-0 top-0 rounded-br-xl bg-primary/90 px-2 py-0.5">
                        <span className="text-[10px] font-medium text-white">
                          {product.salesCount >= 100
                            ? `${Math.floor(product.salesCount / 10) * 10}+已售`
                            : `${product.salesCount}杯已售`}
                        </span>
                      </div>
                    )}
                  </div>
                  {/* 商品信息 */}
                  <div className="p-3">
                    <p className="text-sm font-semibold text-text-main truncate">
                      {product.name}
                    </p>
                    {product.description && (
                      <p className="mt-0.5 text-xs text-text-secondary line-clamp-1">
                        {product.description}
                      </p>
                    )}
                    <p className="mt-1.5 text-sm font-bold text-primary">
                      &#xA5;{priceYuan}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 店铺信息 */}
      <div className="mx-4 mt-6 overflow-hidden rounded-2xl bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-base font-bold text-text-main">店铺信息</h3>
        <div className="space-y-2.5">
          {settings?.businessHours && (
            <div className="flex items-start gap-3">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#8E8E93"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mt-0.5 shrink-0"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <div>
                <p className="text-xs text-text-secondary">营业时间</p>
                <p className="text-sm text-text-main">{settings.businessHours}</p>
              </div>
            </div>
          )}
          {settings?.address && (
            <div className="flex items-start gap-3">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#8E8E93"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mt-0.5 shrink-0"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <div>
                <p className="text-xs text-text-secondary">地址</p>
                <p className="text-sm text-text-main">{settings.address}</p>
              </div>
            </div>
          )}
          {settings?.contactInfo && (
            <div className="flex items-start gap-3">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#8E8E93"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mt-0.5 shrink-0"
              >
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
              </svg>
              <div>
                <p className="text-xs text-text-secondary">联系方式</p>
                <p className="text-sm text-text-main">{settings.contactInfo}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 关于我们 */}
      {settings?.aboutText && (
        <div className="mx-4 mt-3 overflow-hidden rounded-2xl bg-white p-4 shadow-sm">
          <h3 className="mb-2 text-base font-bold text-text-main">关于我们</h3>
          <p className="text-sm leading-relaxed text-text-secondary">
            {settings.aboutText}
          </p>
        </div>
      )}
    </div>
  )
}

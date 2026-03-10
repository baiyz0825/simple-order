'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface UserInfo {
  id: number
  phone: string
  name: string
  role: string
}

interface ShopSettings {
  shopName: string
  businessHours: string
  address: string
  contactInfo: string
  aboutText: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<UserInfo | null>(null)
  const [settings, setSettings] = useState<ShopSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/user/me').then((r) => r.json()),
      fetch('/api/settings').then((r) => r.json()),
    ])
      .then(([userData, settingsData]) => {
        setUser(userData.user || null)
        setSettings(settingsData)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleLogout = async () => {
    await fetch('/api/user/logout', { method: 'POST' })
    setUser(null)
    router.refresh()
  }

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

  return (
    <div className="min-h-screen bg-ios-bg pb-24">
      {/* 用户信息区 */}
      <div className="bg-white px-4 pb-6 pt-12">
        {user ? (
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <span className="text-2xl font-bold text-primary">
                {user.name.charAt(0)}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-main">{user.name}</h2>
              <p className="mt-0.5 text-sm text-text-secondary">
                {user.phone?.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}
              </p>
            </div>
          </div>
        ) : (
          <div
            className="flex cursor-pointer items-center gap-4"
            onClick={() => router.push('/login')}
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#C7C7CC"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-main">
                点击登录
              </h2>
              <p className="mt-0.5 text-sm text-text-secondary">
                登录后查看订单记录
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 功能菜单 */}
      <div className="mx-4 mt-4 overflow-hidden rounded-xl bg-white">
        <button
          onClick={() => router.push('/orders')}
          className="flex w-full items-center justify-between px-4 py-3.5 active:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FF8D4D"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
              <path d="M14 2v6h6" />
              <line x1="8" y1="13" x2="16" y2="13" />
              <line x1="8" y1="17" x2="13" y2="17" />
            </svg>
            <span className="text-[15px] text-text-main">我的订单</span>
          </div>
          <svg
            width="8"
            height="14"
            viewBox="0 0 8 14"
            fill="none"
            stroke="#C7C7CC"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M1 1L7 7L1 13" />
          </svg>
        </button>

        <div className="mx-4 h-px bg-border-color/50" />

        <button
          onClick={() => router.push('/about')}
          className="flex w-full items-center justify-between px-4 py-3.5 active:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FF8D4D"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span className="text-[15px] text-text-main">关于我们</span>
          </div>
          <svg
            width="8"
            height="14"
            viewBox="0 0 8 14"
            fill="none"
            stroke="#C7C7CC"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M1 1L7 7L1 13" />
          </svg>
        </button>
      </div>

      {/* 店铺信息 */}
      <div className="mx-4 mt-4 overflow-hidden rounded-xl bg-white p-4">
        <h3 className="mb-2 text-sm font-medium text-text-main">{shopName}</h3>
        <div className="space-y-1.5 text-sm text-text-secondary">
          {settings?.businessHours && <p>营业时间：{settings.businessHours}</p>}
          {settings?.address && <p>地址：{settings.address}</p>}
          {settings?.contactInfo && <p>联系方式：{settings.contactInfo}</p>}
        </div>
      </div>

      {/* 退出登录 */}
      {user && (
        <div className="mx-4 mt-4">
          <button
            onClick={handleLogout}
            className="w-full rounded-xl bg-white py-3.5 text-center text-[15px] text-danger-red active:bg-gray-50"
          >
            退出登录
          </button>
        </div>
      )}

      {/* 版本号 */}
      <div className="mt-8 text-center text-xs text-text-light">
        <p>v1.0.0</p>
      </div>
    </div>
  )
}

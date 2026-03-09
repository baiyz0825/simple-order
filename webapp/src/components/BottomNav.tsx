'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  {
    label: '点单',
    href: '/',
    icon: (active: boolean) => (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke={active ? '#FF8D4D' : '#8E8E93'}
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
    ),
  },
  {
    label: '订单',
    href: '/orders',
    icon: (active: boolean) => (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke={active ? '#FF8D4D' : '#8E8E93'}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6" />
        <line x1="8" y1="13" x2="16" y2="13" />
        <line x1="8" y1="17" x2="13" y2="17" />
      </svg>
    ),
  },
  {
    label: '关于',
    href: '/about',
    icon: (active: boolean) => (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke={active ? '#FF8D4D' : '#8E8E93'}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
  },
]

/** 隐藏底部导航的路径前缀 */
const HIDDEN_PREFIXES = ['/admin', '/order/confirm']
/** 隐藏底部导航的动态路由匹配（/order/:id） */
const HIDDEN_PATTERN = /^\/order\/[^/]+$/

export default function BottomNav() {
  const pathname = usePathname()

  // 在特定路径下不显示底部导航
  const shouldHide =
    HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    HIDDEN_PATTERN.test(pathname)

  if (shouldHide) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border-color bg-white pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-lg items-center justify-around">
        {tabs.map((tab) => {
          const isActive =
            tab.href === '/'
              ? pathname === '/'
              : pathname.startsWith(tab.href)

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs transition-colors ${
                isActive ? 'text-primary' : 'text-text-secondary'
              }`}
            >
              {tab.icon(isActive)}
              <span>{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

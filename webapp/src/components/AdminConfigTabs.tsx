'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const configTabs = [
  { label: '分类管理', href: '/admin/categories' },
  { label: '属性模板', href: '/admin/specs' },
  { label: '制作流程', href: '/admin/process' },
  { label: '店铺设置', href: '/admin/settings' },
  { label: '账户设置', href: '/admin/account' },
]

export default function AdminConfigTabs() {
  const pathname = usePathname()

  return (
    <div className="sticky top-0 z-10 bg-ios-bg">
      {/* 顶部标题 */}
      <div className="px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-3">
        <h1 className="text-xl font-semibold text-text-main">系统配置</h1>
      </div>

      {/* 子 Tab 导航 */}
      <div className="flex gap-2 px-4 pb-3">
        {configTabs.map((tab) => {
          const isActive = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-white'
                  : 'bg-white text-text-secondary'
              }`}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

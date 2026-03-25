'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface User {
  id: number
  email: string | null
  phone: string | null
  name: string
  role: string
  createdAt: string
  orderCount: number
}

interface OrderItem {
  productName: string
  price: number
  quantity: number
  selectedSpecs?: { selected: string[] }[]
}

interface Order {
  id: number
  orderNo: string
  items: string
  totalPrice: number
  status: string
  createdAt: string
}

const ROLE_LABEL: Record<string, string> = {
  admin: '管理员',
  staff: '员工',
  customer: '顾客',
}

const ROLE_STYLE: Record<string, string> = {
  admin: 'bg-red-100 text-red-700',
  staff: 'bg-blue-100 text-blue-700',
  customer: 'bg-gray-100 text-gray-600',
}

const STATUS_LABEL: Record<string, string> = {
  pending: '待确认',
  confirmed: '制作中',
  ready: '待取餐',
  completed: '已完成',
  cancelled: '已取消',
}

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  ready: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-500',
  cancelled: 'bg-red-100 text-red-500',
}

function formatPrice(fen: number) {
  return (fen / 100).toFixed(2)
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function parseItems(items: string): OrderItem[] {
  try {
    return JSON.parse(items)
  } catch {
    return []
  }
}

export default function UserDetailPage() {
  const router = useRouter()
  const params = useParams()
  const userId = Number(params.id)

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState({ totalAmount: 0, orderCount: 0 })

  // 筛选条件
  const [status, setStatus] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')

  // 获取用户信息
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/admin/users')
        if (res.ok) {
          const data = await res.json()
          const found = data.users.find((u: User) => u.id === userId)
          if (found) {
            setUser(found)
          } else {
            router.push('/admin/users')
          }
        }
      } catch {
        router.push('/admin/users')
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [userId, router])

  // 获取订单列表
  const fetchOrders = useCallback(async (p: number) => {
    setOrdersLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(p))
      params.set('pageSize', '10')
      if (status) params.set('status', status)
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)
      if (minAmount) params.set('minAmount', String(Math.round(parseFloat(minAmount) * 100)))
      if (maxAmount) params.set('maxAmount', String(Math.round(parseFloat(maxAmount) * 100)))

      const res = await fetch(`/api/admin/users/${userId}/orders?${params}`)
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders)
        setTotalPages(data.totalPages)
        setStats(data.stats)
      }
    } catch {
      /* ignore */
    } finally {
      setOrdersLoading(false)
    }
  }, [userId, status, startDate, endDate, minAmount, maxAmount])

  useEffect(() => {
    if (user) {
      fetchOrders(page)
    }
  }, [page, fetchOrders, user])

  const handleFilter = () => {
    setPage(1)
    fetchOrders(1)
  }

  const handleReset = () => {
    setStatus('')
    setStartDate('')
    setEndDate('')
    setMinAmount('')
    setMaxAmount('')
    setPage(1)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ios-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col bg-ios-bg">
      {/* 顶部标题栏 */}
      <header className="sticky top-0 z-30 border-b border-border-color bg-white/95 backdrop-blur-sm">
        <div className="flex h-11 items-center px-4">
          <button
            onClick={() => router.back()}
            className="flex items-center text-primary"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1 className="ml-3 text-[17px] font-semibold text-text-main">
            {user.name} 的订单
          </h1>
          <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-medium ${ROLE_STYLE[user.role] || ''}`}>
            {ROLE_LABEL[user.role] || user.role}
          </span>
        </div>
      </header>

      {/* 用户信息卡片 */}
      <div className="mx-4 mt-4 rounded-xl bg-white p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm font-bold text-text-main">{user.name}</div>
            <div className="mt-1 space-y-0.5">
              {user.email && (
                <p className="text-xs text-text-secondary">{user.email}</p>
              )}
              {user.phone && (
                <p className="text-xs text-text-secondary">{user.phone}</p>
              )}
            </div>
          </div>
          <div className="text-right text-xs text-text-secondary">
            <div>ID: {user.id}</div>
            <div className="mt-1">注册: {formatTime(user.createdAt)}</div>
          </div>
        </div>
      </div>

      {/* 筛选区域 */}
      <div className="mx-4 mt-4 rounded-xl bg-white p-4">
        {/* 状态筛选 */}
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full rounded-lg border border-border-color bg-ios-bg px-3 py-2.5 text-xs text-text-main outline-none focus:border-primary"
        >
          <option value="">全部状态</option>
          <option value="completed">已完成</option>
          <option value="cancelled">已取消</option>
        </select>

        {/* 日期范围 */}
        <div className="mt-2 flex items-center gap-1">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-border-color bg-ios-bg px-2 py-2.5 text-xs text-text-main outline-none focus:border-primary"
          />
          <span className="shrink-0 text-xs text-text-secondary">-</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-border-color bg-ios-bg px-2 py-2.5 text-xs text-text-main outline-none focus:border-primary"
          />
        </div>

        {/* 金额范围 */}
        <div className="mt-2 flex items-center gap-1">
          <input
            type="number"
            placeholder="最小金额"
            value={minAmount}
            onChange={(e) => setMinAmount(e.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-border-color bg-ios-bg px-3 py-2.5 text-xs text-text-main outline-none focus:border-primary"
          />
          <span className="shrink-0 text-xs text-text-secondary">-</span>
          <input
            type="number"
            placeholder="最大金额"
            value={maxAmount}
            onChange={(e) => setMaxAmount(e.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-border-color bg-ios-bg px-3 py-2.5 text-xs text-text-main outline-none focus:border-primary"
          />
        </div>

        <div className="mt-3 flex gap-2">
          <button
            onClick={handleFilter}
            className="flex-1 rounded-lg bg-primary py-2.5 text-xs font-medium text-white"
          >
            筛选
          </button>
          <button
            onClick={handleReset}
            className="rounded-lg border border-border-color px-4 py-2.5 text-xs font-medium text-text-secondary"
          >
            重置
          </button>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="mx-4 mt-4 rounded-xl bg-primary/5 p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-secondary">
            筛选结果: {stats.orderCount} 笔订单
          </span>
          <span className="text-sm font-bold text-primary">
            总金额: ¥{formatPrice(stats.totalAmount)}
          </span>
        </div>
      </div>

      {/* 订单列表 */}
      <div className="flex-1 px-4 pb-6 pt-4">
        {ordersLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-xl bg-white py-12 text-center">
            <p className="text-sm text-text-secondary">暂无订单</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const items = parseItems(order.items)
              return (
                <div key={order.id} className="rounded-xl bg-white p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-text-main">#{order.orderNo}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLE[order.status] || ''}`}>
                      {STATUS_LABEL[order.status] || order.status}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1">
                    {items.map((item, i) => (
                      <div key={i} className="flex justify-between text-xs text-text-secondary">
                        <span>{item.productName} x{item.quantity}</span>
                        <span>&yen;{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-border-color pt-2">
                    <span className="text-xs text-text-secondary">{formatTime(order.createdAt)}</span>
                    <span className="text-sm font-semibold text-primary">&yen;{formatPrice(order.totalPrice)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-border-color px-4 py-2 text-xs font-medium text-text-secondary disabled:opacity-40"
            >
              上一页
            </button>
            <span className="text-xs text-text-secondary">{page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-lg border border-border-color px-4 py-2 text-xs font-medium text-text-secondary disabled:opacity-40"
            >
              下一页
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

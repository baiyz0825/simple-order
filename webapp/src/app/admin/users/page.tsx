'use client'

import { useState, useEffect, useCallback } from 'react'

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

/* ========== 编辑用户弹窗 ========== */

function EditUserModal({
  user,
  onClose,
  onSave,
}: {
  user: User
  onClose: () => void
  onSave: (data: { name: string; role: string }) => void
}) {
  const [name, setName] = useState(user.name)
  const [role, setRole] = useState(user.role)

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
      <div className="mx-6 w-full max-w-sm rounded-2xl bg-white p-6">
        <h3 className="text-center text-lg font-semibold text-text-main">编辑用户</h3>
        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-sm text-text-secondary">用户名</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-border-color bg-ios-bg px-4 py-3 text-sm text-text-main outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-text-secondary">角色</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-xl border border-border-color bg-ios-bg px-4 py-3 text-sm text-text-main outline-none focus:border-primary"
            >
              <option value="customer">顾客</option>
              <option value="staff">员工</option>
              <option value="admin">管理员</option>
            </select>
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-border-color py-3 text-sm font-medium text-text-secondary transition-colors active:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={() => onSave({ name, role })}
            className="flex-1 rounded-xl bg-primary py-3 text-sm font-medium text-white transition-opacity active:opacity-80"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}

/* ========== 用户订单弹窗 ========== */

function UserOrdersModal({
  user,
  onClose,
}: {
  user: User
  onClose: () => void
}) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchOrders = useCallback(async (p: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${user.id}/orders?page=${p}&pageSize=10`)
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders)
        setTotal(data.total)
        setTotalPages(data.totalPages)
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [user.id])

  useEffect(() => {
    fetchOrders(page)
  }, [page, fetchOrders])

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 sm:items-center">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-2xl bg-white sm:rounded-2xl">
        {/* 头部 */}
        <div className="flex items-center justify-between border-b border-border-color px-5 py-4">
          <h3 className="text-lg font-semibold text-text-main">
            {user.name} 的订单 ({total})
          </h3>
          <button onClick={onClose} className="text-text-secondary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 订单列表 */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
            </div>
          ) : orders.length === 0 ? (
            <p className="py-12 text-center text-sm text-text-secondary">暂无订单</p>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => {
                const items = parseItems(order.items)
                return (
                  <div key={order.id} className="rounded-xl bg-ios-bg p-4">
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
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 border-t border-border-color px-5 py-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-border-color px-4 py-1.5 text-xs font-medium text-text-secondary disabled:opacity-40"
            >
              上一页
            </button>
            <span className="text-xs text-text-secondary">{page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-lg border border-border-color px-4 py-1.5 text-xs font-medium text-text-secondary disabled:opacity-40"
            >
              下一页
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ========== 主页面 ========== */

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [viewOrdersUser, setViewOrdersUser] = useState<User | null>(null)
  const [operating, setOperating] = useState(false)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' })
      if (keyword) params.set('keyword', keyword)
      if (roleFilter) params.set('role', roleFilter)

      const res = await fetch(`/api/admin/users?${params}`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users)
        setTotal(data.total)
        setTotalPages(data.totalPages)
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [page, keyword, roleFilter])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchUsers()
  }

  const handleSaveUser = async (data: { name: string; role: string }) => {
    if (!editingUser) return
    setOperating(true)
    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        setEditingUser(null)
        fetchUsers()
      } else {
        const err = await res.json()
        alert(err.error || '操作失败')
      }
    } catch {
      alert('操作失败')
    } finally {
      setOperating(false)
    }
  }

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`确定要删除用户"${user.name}"吗？此操作不可恢复。`)) return
    setOperating(true)
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchUsers()
      } else {
        const err = await res.json()
        alert(err.error || '删除失败')
      }
    } catch {
      alert('删除失败')
    } finally {
      setOperating(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-ios-bg">
      {/* 顶部标题栏 */}
      <header className="sticky top-0 z-30 border-b border-border-color bg-white/95 backdrop-blur-sm">
        <div className="flex h-11 items-center px-4">
          <h1 className="text-[17px] font-semibold text-text-main">用户管理</h1>
          <span className="ml-2 text-xs text-text-secondary">({total})</span>
        </div>
      </header>

      {/* 搜索和筛选 */}
      <div className="bg-white px-4 py-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="搜索用户名/邮箱/手机号"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="flex-1 rounded-xl border border-border-color bg-ios-bg px-4 py-2.5 text-sm text-text-main outline-none focus:border-primary"
          />
          <button
            type="submit"
            className="shrink-0 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white"
          >
            搜索
          </button>
        </form>
        <div className="mt-2 flex gap-2">
          {['', 'customer', 'staff', 'admin'].map((r) => (
            <button
              key={r}
              onClick={() => { setRoleFilter(r); setPage(1) }}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                roleFilter === r
                  ? 'bg-primary text-white'
                  : 'bg-ios-bg text-text-secondary'
              }`}
            >
              {r ? ROLE_LABEL[r] : '全部'}
            </button>
          ))}
        </div>
      </div>

      {/* 用户列表 */}
      <div className="flex-1 overflow-y-auto px-4 pb-20 pt-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center pt-24">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
            <span className="mt-3 text-sm text-text-secondary">加载中...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-24">
            <p className="text-sm text-text-secondary">暂无用户</p>
          </div>
        ) : (
          <div className="space-y-3 sm:grid sm:grid-cols-2 sm:gap-3 sm:space-y-0">
            {users.map((user) => (
              <div key={user.id} className="rounded-xl bg-white p-4">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-text-main">{user.name}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${ROLE_STYLE[user.role] || ''}`}>
                        {ROLE_LABEL[user.role] || user.role}
                      </span>
                    </div>
                    <div className="mt-1.5 space-y-0.5">
                      {user.email && (
                        <p className="text-xs text-text-secondary">{user.email}</p>
                      )}
                      {user.phone && (
                        <p className="text-xs text-text-secondary">{user.phone}</p>
                      )}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-text-secondary">
                    ID: {user.id}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-border-color pt-3">
                  <div className="flex items-center gap-3 text-xs text-text-secondary">
                    <span>订单: {user.orderCount}</span>
                    <span>{formatTime(user.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setViewOrdersUser(user)}
                      className="rounded-lg bg-ios-bg px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors active:bg-gray-200"
                    >
                      订单
                    </button>
                    <button
                      onClick={() => setEditingUser(user)}
                      className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors active:bg-primary/20"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user)}
                      disabled={operating}
                      className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-danger-red transition-colors active:bg-red-100 disabled:opacity-50"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))}
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

      {/* 编辑用户弹窗 */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleSaveUser}
        />
      )}

      {/* 用户订单弹窗 */}
      {viewOrdersUser && (
        <UserOrdersModal
          user={viewOrdersUser}
          onClose={() => setViewOrdersUser(null)}
        />
      )}
    </div>
  )
}

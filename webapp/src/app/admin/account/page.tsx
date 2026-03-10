'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface AdminInfo {
  id: number
  email: string
  name: string
  role: string
}

export default function AdminAccountPage() {
  const router = useRouter()
  const [admin, setAdmin] = useState<AdminInfo | null>(null)
  const [loading, setLoading] = useState(true)

  // 表单
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetch('/api/admin/account')
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json()
          setAdmin(data)
          setName(data.name)
          setEmail(data.email || '')
        } else {
          router.push('/admin/login')
        }
      })
      .catch(() => router.push('/admin/login'))
      .finally(() => setLoading(false))
  }, [router])

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      setMessage({ type: 'error', text: '名称不能为空' })
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      const body: Record<string, string> = {}
      if (name !== admin?.name) body.name = name.trim()
      if (email !== admin?.email) body.email = email.trim()
      if (Object.keys(body).length === 0) {
        setMessage({ type: 'error', text: '没有需要修改的内容' })
        setSaving(false)
        return
      }
      const res = await fetch('/api/admin/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const data = await res.json()
        setAdmin(data)
        setMessage({ type: 'success', text: '个人信息已更新' })
      } else {
        const err = await res.json()
        setMessage({ type: 'error', text: err.error || '更新失败' })
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误' })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword) {
      setMessage({ type: 'error', text: '请输入当前密码' })
      return
    }
    if (!newPassword || newPassword.length < 6) {
      setMessage({ type: 'error', text: '新密码至少6位' })
      return
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: '两次输入的密码不一致' })
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      if (res.ok) {
        setMessage({ type: 'success', text: '密码已修改' })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        const err = await res.json()
        setMessage({ type: 'error', text: err.error || '修改失败' })
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ios-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-ios-bg">
      {/* 顶部标题栏 */}
      <header className="sticky top-0 z-30 border-b border-border-color bg-white/95 backdrop-blur-sm">
        <div className="flex h-11 items-center px-4">
          <h1 className="text-[17px] font-semibold text-text-main">账户设置</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-20 pt-4">
        {/* 提示信息 */}
        {message && (
          <div
            className={`mb-4 rounded-xl px-4 py-3 text-sm font-medium ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-danger-red'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* 基本信息 */}
        <div className="rounded-xl bg-white p-5">
          <h2 className="text-base font-semibold text-text-main">个人信息</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-sm text-text-secondary">名称</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-border-color bg-ios-bg px-4 py-3 text-sm text-text-main outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-text-secondary">邮箱</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-border-color bg-ios-bg px-4 py-3 text-sm text-text-main outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-text-secondary">角色</label>
              <div className="rounded-xl border border-border-color bg-ios-bg px-4 py-3 text-sm text-text-secondary">
                {admin?.role === 'admin' ? '管理员' : admin?.role === 'staff' ? '员工' : admin?.role}
              </div>
            </div>
          </div>
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="mt-5 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white transition-opacity active:opacity-80 disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存信息'}
          </button>
        </div>

        {/* 修改密码 */}
        <div className="mt-4 rounded-xl bg-white p-5">
          <h2 className="text-base font-semibold text-text-main">修改密码</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-sm text-text-secondary">当前密码</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="请输入当前密码"
                className="w-full rounded-xl border border-border-color bg-ios-bg px-4 py-3 text-sm text-text-main outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-text-secondary">新密码</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="至少6位"
                className="w-full rounded-xl border border-border-color bg-ios-bg px-4 py-3 text-sm text-text-main outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-text-secondary">确认新密码</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="再次输入新密码"
                className="w-full rounded-xl border border-border-color bg-ios-bg px-4 py-3 text-sm text-text-main outline-none focus:border-primary"
              />
            </div>
          </div>
          <button
            onClick={handleChangePassword}
            disabled={saving}
            className="mt-5 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white transition-opacity active:opacity-80 disabled:opacity-50"
          >
            {saving ? '修改中...' : '修改密码'}
          </button>
        </div>
      </div>
    </div>
  )
}

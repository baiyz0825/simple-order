'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

type Mode = 'login' | 'register'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/profile'
  const [mode, setMode] = useState<Mode>('login')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (loading) return
    setError('')

    if (!phone || !password) {
      setError('请填写手机号和密码')
      return
    }

    if (mode === 'register' && !name) {
      setError('请填写昵称')
      return
    }

    setLoading(true)
    try {
      const url = mode === 'login' ? '/api/user/login' : '/api/user/register'
      const body = mode === 'login' ? { phone, password } : { phone, password, name }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || '操作失败')
        return
      }

      router.push(redirect)
      router.refresh()
    } catch {
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* 顶部 */}
      <header className="flex h-11 items-center px-4">
        <button
          onClick={() => router.back()}
          className="flex h-8 w-8 items-center justify-center"
        >
          <svg width="10" height="18" viewBox="0 0 10 18" fill="none">
            <path
              d="M9 1L1 9L9 17"
              stroke="#1C1C1E"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </header>

      <div className="flex-1 px-6 pt-8">
        {/* 标题 */}
        <h1 className="text-2xl font-bold text-text-main">
          {mode === 'login' ? '欢迎回来' : '创建账号'}
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          {mode === 'login' ? '登录后查看您的订单' : '注册后即可下单点餐'}
        </p>

        {/* 表单 */}
        <div className="mt-8 space-y-4">
          {mode === 'register' && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-main">
                昵称
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="请输入昵称"
                className="h-12 w-full rounded-xl border border-border-color bg-ios-bg px-4 text-[15px] text-text-main placeholder:text-text-light focus:border-primary focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-main">
              手机号
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="请输入手机号"
              maxLength={11}
              className="h-12 w-full rounded-xl border border-border-color bg-ios-bg px-4 text-[15px] text-text-main placeholder:text-text-light focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-main">
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'register' ? '请设置密码（至少6位）' : '请输入密码'}
              className="h-12 w-full rounded-xl border border-border-color bg-ios-bg px-4 text-[15px] text-text-main placeholder:text-text-light focus:border-primary focus:outline-none"
            />
          </div>

          {/* 错误提示 */}
          {error && (
            <p className="text-sm text-danger-red">{error}</p>
          )}

          {/* 提交按钮 */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="mt-2 h-12 w-full rounded-xl bg-primary text-[15px] font-semibold text-white transition-opacity disabled:opacity-60"
          >
            {loading
              ? '请稍候...'
              : mode === 'login'
                ? '登录'
                : '注册'}
          </button>
        </div>

        {/* 切换模式 */}
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login')
              setError('')
            }}
            className="text-sm text-primary"
          >
            {mode === 'login' ? '还没有账号？立即注册' : '已有账号？去登录'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function UserLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

'use client'

import { useState, useRef, useEffect } from 'react'

interface Option {
  label: string
  value: string | number
}

interface CustomSelectProps {
  value: string | number
  options: Option[]
  onChange: (value: string | number) => void
  placeholder?: string
  className?: string
}

export default function CustomSelect({
  value,
  options,
  onChange,
  placeholder = '请选择',
  className = '',
}: CustomSelectProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((o) => String(o.value) === String(value))

  // 点击外部关闭
  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* 触发按钮 */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-xl border border-border-color bg-ios-bg px-4 py-3 text-left text-sm outline-none focus:border-primary"
      >
        <span className={selectedOption ? 'text-text-main' : 'text-text-light'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-text-secondary transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* 下拉面板 - 使用 bottom sheet 样式 */}
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40">
          <div className="w-full max-w-lg animate-[slideUp_0.25s_ease-out] rounded-t-2xl bg-white pb-[calc(env(safe-area-inset-bottom)+8px)]">
            {/* 标题栏 */}
            <div className="flex items-center justify-between border-b border-border-color px-4 py-3">
              <span className="text-sm text-text-secondary">请选择</span>
              <button
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-primary"
              >
                完成
              </button>
            </div>
            {/* 选项列表 */}
            <div className="max-h-[40vh] overflow-y-auto">
              {options.map((option) => {
                const isSelected = String(option.value) === String(value)
                return (
                  <button
                    key={option.value}
                    onClick={() => {
                      onChange(option.value)
                      setOpen(false)
                    }}
                    className={`flex w-full items-center justify-between px-4 py-3.5 text-left text-sm transition-colors ${
                      isSelected
                        ? 'bg-primary/5 font-medium text-primary'
                        : 'text-text-main active:bg-ios-bg'
                    }`}
                  >
                    <span>{option.label}</span>
                    {isSelected && (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-primary"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

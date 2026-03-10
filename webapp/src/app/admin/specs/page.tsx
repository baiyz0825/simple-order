'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminConfigTabs from '@/components/AdminConfigTabs'

interface SpecOption {
  name: string
  priceDelta: number // 单位: 分
}

interface SpecTemplate {
  id: number
  name: string
  type: 'single' | 'multiple'
  options: string // JSON 字符串
  createdAt: string
}

interface FormData {
  name: string
  type: 'single' | 'multiple'
  options: SpecOption[]
}

export default function SpecsPage() {
  const [specs, setSpecs] = useState<SpecTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    type: 'single',
    options: [{ name: '', priceDelta: 0 }],
  })
  const [saving, setSaving] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

  const fetchSpecs = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/specs')
      if (res.ok) {
        const data = await res.json()
        setSpecs(data)
      }
    } catch (err) {
      console.error('获取属性模板列表失败:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSpecs()
  }, [fetchSpecs])

  const parseOptions = (optionsStr: string): SpecOption[] => {
    try {
      return JSON.parse(optionsStr)
    } catch {
      return []
    }
  }

  const getOptionsPreview = (optionsStr: string): string => {
    const options = parseOptions(optionsStr)
    if (options.length === 0) return '暂无选项'
    return options.map((o) => o.name).join(' / ')
  }

  const openCreate = () => {
    setEditingId(null)
    setFormData({
      name: '',
      type: 'single',
      options: [{ name: '', priceDelta: 0 }],
    })
    setShowModal(true)
  }

  const openEdit = (spec: SpecTemplate) => {
    setEditingId(spec.id)
    const options = parseOptions(spec.options)
    setFormData({
      name: spec.name,
      type: spec.type,
      options: options.length > 0 ? options : [{ name: '', priceDelta: 0 }],
    })
    setShowModal(true)
  }

  const addOption = () => {
    setFormData({
      ...formData,
      options: [...formData.options, { name: '', priceDelta: 0 }],
    })
  }

  const removeOption = (index: number) => {
    if (formData.options.length <= 1) return
    setFormData({
      ...formData,
      options: formData.options.filter((_, i) => i !== index),
    })
  }

  const updateOption = (
    index: number,
    field: keyof SpecOption,
    value: string | number
  ) => {
    const newOptions = [...formData.options]
    if (field === 'name') {
      newOptions[index] = { ...newOptions[index], name: value as string }
    } else {
      newOptions[index] = { ...newOptions[index], priceDelta: value as number }
    }
    setFormData({ ...formData, options: newOptions })
  }

  const handleSave = async () => {
    if (!formData.name.trim()) return
    // 过滤掉空名称的选项
    const validOptions = formData.options.filter((o) => o.name.trim())
    if (validOptions.length === 0) return

    setSaving(true)

    try {
      const payload = {
        name: formData.name,
        type: formData.type,
        options: JSON.stringify(validOptions),
      }

      if (editingId) {
        const res = await fetch(`/api/admin/specs/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('更新失败')
      } else {
        const res = await fetch('/api/admin/specs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('创建失败')
      }
      setShowModal(false)
      fetchSpecs()
    } catch (err) {
      console.error('保存属性模板失败:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/specs/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setDeleteConfirmId(null)
        fetchSpecs()
      }
    } catch (err) {
      console.error('删除属性模板失败:', err)
    }
  }

  return (
    <div className="min-h-screen bg-ios-bg">
      <AdminConfigTabs />

      <div className="px-4 pb-24">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-text-secondary text-sm">
            加载中...
          </div>
        ) : specs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-secondary text-sm">
            <p>暂无属性模板</p>
          </div>
        ) : (
          <div className="space-y-3">
            {specs.map((spec) => (
              <div
                key={spec.id}
                className="rounded-xl bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-medium text-text-main truncate">
                        {spec.name}
                      </h3>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                          spec.type === 'single'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-progress-blue/10 text-progress-blue'
                        }`}
                      >
                        {spec.type === 'single' ? '单选' : '多选'}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-text-secondary truncate">
                      {getOptionsPreview(spec.options)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    {/* Edit */}
                    <button
                      onClick={() => openEdit(spec)}
                      className="text-text-secondary"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        <path d="m15 5 4 4" />
                      </svg>
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => setDeleteConfirmId(spec.id)}
                      className="text-danger-red"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 添加按钮 */}
        <button
          onClick={openCreate}
          className="mt-4 w-full rounded-xl bg-primary py-3 text-sm font-medium text-white transition-opacity active:opacity-80"
        >
          添加属性模板
        </button>
      </div>

      {/* 新增/编辑弹窗 */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-t-2xl bg-white p-6 pb-[calc(env(safe-area-inset-bottom)+24px)] animate-[slideUp_0.3s_ease-out] max-h-[calc(100vh-60px)] overflow-y-auto">
            <h2 className="mb-5 text-lg font-semibold text-text-main">
              {editingId ? '编辑属性模板' : '添加属性模板'}
            </h2>

            <div className="space-y-4">
              {/* 模板名称 */}
              <div>
                <label className="mb-1 block text-sm text-text-secondary">
                  模板名称
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="如: 杯型、温度、糖度"
                  className="w-full rounded-xl border border-border-color bg-ios-bg px-4 py-3 text-sm text-text-main placeholder:text-text-light outline-none focus:border-primary"
                />
              </div>

              {/* 类型选择 */}
              <div>
                <label className="mb-2 block text-sm text-text-secondary">
                  类型
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="specType"
                      checked={formData.type === 'single'}
                      onChange={() =>
                        setFormData({ ...formData, type: 'single' })
                      }
                      className="h-4 w-4 accent-primary"
                    />
                    <span className="text-sm text-text-main">单选</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="specType"
                      checked={formData.type === 'multiple'}
                      onChange={() =>
                        setFormData({ ...formData, type: 'multiple' })
                      }
                      className="h-4 w-4 accent-primary"
                    />
                    <span className="text-sm text-text-main">多选</span>
                  </label>
                </div>
              </div>

              {/* 选项列表 */}
              <div>
                <label className="mb-2 block text-sm text-text-secondary">
                  选项列表
                </label>
                <div className="space-y-2">
                  {formData.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={option.name}
                        onChange={(e) =>
                          updateOption(index, 'name', e.target.value)
                        }
                        placeholder="选项名称"
                        className="flex-1 rounded-lg border border-border-color bg-ios-bg px-3 py-2.5 text-sm text-text-main placeholder:text-text-light outline-none focus:border-primary"
                      />
                      <div className="relative w-24">
                        <input
                          type="number"
                          value={option.priceDelta / 100 || ''}
                          onChange={(e) => {
                            const yuan = parseFloat(e.target.value) || 0
                            updateOption(
                              index,
                              'priceDelta',
                              Math.round(yuan * 100)
                            )
                          }}
                          placeholder="加价(元)"
                          step="0.01"
                          className="w-full rounded-lg border border-border-color bg-ios-bg px-3 py-2.5 text-sm text-text-main placeholder:text-text-light outline-none focus:border-primary"
                        />
                      </div>
                      <button
                        onClick={() => removeOption(index)}
                        disabled={formData.options.length <= 1}
                        className="shrink-0 text-danger-red disabled:opacity-30"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="8" y1="12" x2="16" y2="12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={addOption}
                  className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-border-color py-2.5 text-sm text-text-secondary transition-colors active:bg-ios-bg"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  添加选项
                </button>
              </div>
            </div>

            {/* 按钮 */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 rounded-xl border border-border-color py-3 text-sm font-medium text-text-secondary transition-colors active:bg-ios-bg"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={
                  saving ||
                  !formData.name.trim() ||
                  !formData.options.some((o) => o.name.trim())
                }
                className="flex-1 rounded-xl bg-primary py-3 text-sm font-medium text-white transition-opacity disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-xs rounded-2xl bg-white p-6 text-center">
            <h3 className="text-base font-semibold text-text-main">
              确认删除
            </h3>
            <p className="mt-2 text-sm text-text-secondary">
              删除后无法恢复，确定要删除此属性模板吗？
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 rounded-xl border border-border-color py-2.5 text-sm font-medium text-text-secondary"
              >
                取消
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 rounded-xl bg-danger-red py-2.5 text-sm font-medium text-white"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

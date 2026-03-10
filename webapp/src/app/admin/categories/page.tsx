'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminConfigTabs from '@/components/AdminConfigTabs'

interface ProcessTemplate {
  id: number
  name: string
}

interface Category {
  id: number
  name: string
  sort: number
  isActive: boolean
  processTemplateId: number | null
  createdAt: string
}

interface FormData {
  name: string
  sort: number
  processTemplateId: number | null
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [processes, setProcesses] = useState<ProcessTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    sort: 0,
    processTemplateId: null,
  })
  const [saving, setSaving] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(data)
      }
    } catch (err) {
      console.error('获取分类列表失败:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchProcesses = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/process')
      if (res.ok) {
        const data = await res.json()
        setProcesses(data)
      }
    } catch (err) {
      console.error('获取制作流程列表失败:', err)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
    fetchProcesses()
  }, [fetchCategories, fetchProcesses])

  const getProcessName = (processTemplateId: number | null) => {
    if (!processTemplateId) return '无'
    const p = processes.find((proc) => proc.id === processTemplateId)
    return p ? p.name : '无'
  }

  const openCreate = () => {
    setEditingId(null)
    setFormData({ name: '', sort: 0, processTemplateId: null })
    setShowModal(true)
  }

  const openEdit = (cat: Category) => {
    setEditingId(cat.id)
    setFormData({
      name: cat.name,
      sort: cat.sort,
      processTemplateId: cat.processTemplateId,
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) return
    setSaving(true)

    try {
      if (editingId) {
        const res = await fetch(`/api/admin/categories/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        if (!res.ok) throw new Error('更新失败')
      } else {
        const res = await fetch('/api/admin/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        if (!res.ok) throw new Error('创建失败')
      }
      setShowModal(false)
      fetchCategories()
    } catch (err) {
      console.error('保存分类失败:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (cat: Category) => {
    try {
      const res = await fetch(`/api/admin/categories/${cat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !cat.isActive }),
      })
      if (res.ok) {
        fetchCategories()
      }
    } catch (err) {
      console.error('切换状态失败:', err)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setDeleteConfirmId(null)
        fetchCategories()
      }
    } catch (err) {
      console.error('删除分类失败:', err)
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
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-secondary text-sm">
            <p>暂无分类</p>
          </div>
        ) : (
          <div className="space-y-3">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="rounded-xl bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-medium text-text-main truncate">
                        {cat.name}
                      </h3>
                      <span className="shrink-0 rounded bg-ios-bg px-1.5 py-0.5 text-xs text-text-secondary">
                        排序: {cat.sort}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-text-secondary">
                      制作流程: {getProcessName(cat.processTemplateId)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    {/* Toggle */}
                    <button
                      onClick={() => handleToggle(cat)}
                      className={`relative h-7 w-12 rounded-full transition-colors ${
                        cat.isActive ? 'bg-success-green' : 'bg-text-light'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                          cat.isActive ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => openEdit(cat)}
                      className="text-text-secondary"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        <path d="m15 5 4 4" />
                      </svg>
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => setDeleteConfirmId(cat.id)}
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
          添加分类
        </button>
      </div>

      {/* 新增/编辑弹窗 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-t-2xl bg-white p-6 pb-[calc(env(safe-area-inset-bottom)+24px)] animate-[slideUp_0.3s_ease-out]">
            <h2 className="mb-5 text-lg font-semibold text-text-main">
              {editingId ? '编辑分类' : '添加分类'}
            </h2>

            <div className="space-y-4">
              {/* 分类名称 */}
              <div>
                <label className="mb-1 block text-sm text-text-secondary">
                  分类名称
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="请输入分类名称"
                  className="w-full rounded-xl border border-border-color bg-ios-bg px-4 py-3 text-sm text-text-main placeholder:text-text-light outline-none focus:border-primary"
                />
              </div>

              {/* 排序序号 */}
              <div>
                <label className="mb-1 block text-sm text-text-secondary">
                  排序序号
                </label>
                <input
                  type="number"
                  value={formData.sort}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sort: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                  className="w-full rounded-xl border border-border-color bg-ios-bg px-4 py-3 text-sm text-text-main placeholder:text-text-light outline-none focus:border-primary"
                />
              </div>

              {/* 关联制作流程 */}
              <div>
                <label className="mb-1 block text-sm text-text-secondary">
                  关联制作流程
                </label>
                <select
                  value={formData.processTemplateId ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      processTemplateId: e.target.value
                        ? Number(e.target.value)
                        : null,
                    })
                  }
                  className="w-full rounded-xl border border-border-color bg-ios-bg px-4 py-3 text-sm text-text-main outline-none focus:border-primary"
                >
                  <option value="">无</option>
                  {processes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
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
                disabled={saving || !formData.name.trim()}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-xs rounded-2xl bg-white p-6 text-center">
            <h3 className="text-base font-semibold text-text-main">
              确认删除
            </h3>
            <p className="mt-2 text-sm text-text-secondary">
              删除后无法恢复，确定要删除此分类吗？
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

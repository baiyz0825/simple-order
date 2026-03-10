'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminConfigTabs from '@/components/AdminConfigTabs'

interface ProcessStep {
  name: string
  sort: number
}

interface ProcessTemplate {
  id: number
  name: string
  steps: string // JSON 字符串
  createdAt: string
}

interface FormData {
  name: string
  steps: ProcessStep[]
}

export default function ProcessPage() {
  const [processes, setProcesses] = useState<ProcessTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    steps: [{ name: '', sort: 1 }],
  })
  const [saving, setSaving] = useState(false)

  const fetchProcesses = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/process')
      const data = await res.json()
      setProcesses(data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProcesses()
  }, [fetchProcesses])

  function parseSteps(stepsStr: string): ProcessStep[] {
    try {
      return JSON.parse(stepsStr)
    } catch {
      return []
    }
  }

  function openCreate() {
    setEditingId(null)
    setFormData({ name: '', steps: [{ name: '', sort: 1 }] })
    setShowModal(true)
  }

  function openEdit(process: ProcessTemplate) {
    setEditingId(process.id)
    const steps = parseSteps(process.steps)
    setFormData({
      name: process.name,
      steps: steps.length > 0 ? steps : [{ name: '', sort: 1 }],
    })
    setShowModal(true)
  }

  async function handleSave() {
    if (!formData.name.trim()) return
    const validSteps = formData.steps.filter(s => s.name.trim())
    if (validSteps.length === 0) return

    setSaving(true)
    try {
      const body = {
        name: formData.name.trim(),
        steps: JSON.stringify(validSteps.map((s, i) => ({ name: s.name.trim(), sort: i + 1 }))),
      }

      if (editingId) {
        await fetch(`/api/admin/process/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      } else {
        await fetch('/api/admin/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      }
      setShowModal(false)
      fetchProcesses()
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('确定删除该制作流程？')) return
    try {
      await fetch(`/api/admin/process/${id}`, { method: 'DELETE' })
      fetchProcesses()
    } catch {
      // ignore
    }
  }

  function addStep() {
    setFormData(prev => ({
      ...prev,
      steps: [...prev.steps, { name: '', sort: prev.steps.length + 1 }],
    }))
  }

  function removeStep(index: number) {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index),
    }))
  }

  function updateStep(index: number, name: string) {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.map((s, i) => (i === index ? { ...s, name } : s)),
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-ios-bg">
        <AdminConfigTabs />
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ios-bg pb-24">
      <AdminConfigTabs />

      <div className="space-y-3 px-4 pt-3">
        {processes.length === 0 ? (
          <div className="py-20 text-center text-text-secondary">
            <svg className="mx-auto mb-3 h-12 w-12 text-text-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 5h6" />
            </svg>
            <p>暂无制作流程</p>
          </div>
        ) : (
          processes.map(process => {
            const steps = parseSteps(process.steps)
            return (
              <div key={process.id} className="rounded-xl bg-white p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-text-main">{process.name}</h3>
                    <p className="mt-1 text-sm text-text-secondary">
                      {steps.length} 个步骤
                    </p>
                    {steps.length > 0 && (
                      <div className="mt-2 flex flex-wrap items-center gap-1">
                        {steps
                          .sort((a, b) => a.sort - b.sort)
                          .map((step, i) => (
                            <span key={i} className="flex items-center">
                              <span className="rounded-full bg-ios-bg px-2.5 py-0.5 text-xs text-text-main">
                                {step.name}
                              </span>
                              {i < steps.length - 1 && (
                                <svg className="mx-0.5 h-3 w-3 text-text-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              )}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEdit(process)}
                      className="rounded-lg px-3 py-1.5 text-sm text-primary hover:bg-primary/10"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(process.id)}
                      className="rounded-lg px-3 py-1.5 text-sm text-danger-red hover:bg-danger-red/10"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* 添加按钮 */}
      <div className="fixed bottom-16 left-0 right-0 px-4 pb-2">
        <button
          onClick={openCreate}
          className="w-full rounded-full bg-primary py-3 text-center font-medium text-white active:bg-primary-dark"
        >
          添加制作流程
        </button>
      </div>

      {/* 弹窗 */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-h-[calc(100vh-60px)] overflow-y-auto rounded-t-2xl bg-white pb-[env(safe-area-inset-bottom)]">
            {/* 拖拽指示条 */}
            <div className="sticky top-0 z-10 bg-white pt-3 pb-2 px-4 border-b border-border-color">
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border-color" />
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-text-main">
                  {editingId ? '编辑制作流程' : '新增制作流程'}
                </h2>
                <button onClick={() => setShowModal(false)} className="p-1 text-text-secondary">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="space-y-4 p-4">
              {/* 流程名称 */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-main">流程名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="如：饮品制作流程"
                  className="w-full rounded-lg border border-border-color bg-ios-bg px-3 py-2.5 text-text-main placeholder:text-text-light focus:border-primary focus:outline-none"
                />
              </div>

              {/* 步骤列表 */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-main">制作步骤</label>
                <div className="space-y-2">
                  {formData.steps.map((step, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                        {index + 1}
                      </span>
                      <input
                        type="text"
                        value={step.name}
                        onChange={e => updateStep(index, e.target.value)}
                        placeholder={`步骤 ${index + 1} 名称`}
                        className="flex-1 rounded-lg border border-border-color bg-ios-bg px-3 py-2 text-sm text-text-main placeholder:text-text-light focus:border-primary focus:outline-none"
                      />
                      {formData.steps.length > 1 && (
                        <button
                          onClick={() => removeStep(index)}
                          className="p-1.5 text-danger-red hover:bg-danger-red/10 rounded-lg"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={addStep}
                  className="mt-2 flex items-center gap-1 text-sm text-primary"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  添加步骤
                </button>
              </div>
            </div>

            {/* 底部按钮 */}
            <div className="sticky bottom-0 border-t border-border-color bg-white p-4">
              <button
                onClick={handleSave}
                disabled={saving || !formData.name.trim() || formData.steps.every(s => !s.name.trim())}
                className="w-full rounded-full bg-primary py-3 font-medium text-white disabled:opacity-50 active:bg-primary-dark"
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

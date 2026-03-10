'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminConfigTabs from '@/components/AdminConfigTabs'

interface ShopSettings {
  shopName: string
  shopSubtitle: string
  aboutText: string
  businessHours: string
  address: string
  contactInfo: string
  homeWelcomeText: string
  homeAnnouncementText: string
  homeBannerUrl: string
}

const fieldLabels: Record<keyof ShopSettings, string> = {
  shopName: '店铺名称',
  shopSubtitle: '店铺副标题',
  homeWelcomeText: '首页欢迎语',
  homeAnnouncementText: '首页公告',
  homeBannerUrl: '首页横幅图片URL',
  aboutText: '关于我们',
  businessHours: '营业时间',
  address: '店铺地址',
  contactInfo: '联系方式',
}

const fieldPlaceholders: Record<keyof ShopSettings, string> = {
  shopName: '请输入店铺名称',
  shopSubtitle: '请输入副标题/口号',
  homeWelcomeText: '请输入首页欢迎语',
  homeAnnouncementText: '请输入公告内容（留空则不显示）',
  homeBannerUrl: '请输入横幅图片URL（留空则不显示）',
  aboutText: '请输入店铺介绍',
  businessHours: '例如：每日 08:00 - 22:00',
  address: '请输入店铺地址',
  contactInfo: '请输入联系方式（电话/微信等）',
}

// 使用 textarea 的字段
const textareaFields: (keyof ShopSettings)[] = ['aboutText', 'homeAnnouncementText']

// 字段分组
const fieldGroups: { title: string; fields: (keyof ShopSettings)[] }[] = [
  {
    title: '基本信息',
    fields: ['shopName', 'shopSubtitle', 'businessHours', 'address', 'contactInfo'],
  },
  {
    title: '首页配置',
    fields: ['homeWelcomeText', 'homeAnnouncementText', 'homeBannerUrl'],
  },
  {
    title: '关于我们',
    fields: ['aboutText'],
  },
]

export default function SettingsPage() {
  const [settings, setSettings] = useState<ShopSettings>({
    shopName: '',
    shopSubtitle: '',
    aboutText: '',
    businessHours: '',
    address: '',
    contactInfo: '',
    homeWelcomeText: '',
    homeAnnouncementText: '',
    homeBannerUrl: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settings')
      if (res.ok) {
        const data = await res.json()
        setSettings(data)
      }
    } catch (err) {
      console.error('获取店铺设置失败:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch (err) {
      console.error('保存店铺设置失败:', err)
    } finally {
      setSaving(false)
    }
  }

  const updateField = (key: keyof ShopSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="min-h-screen bg-ios-bg">
      <AdminConfigTabs />

      <div className="px-4 pb-24">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-text-secondary text-sm">
            加载中...
          </div>
        ) : (
          <div className="space-y-6">
            {fieldGroups.map((group) => (
              <div key={group.title}>
                <h3 className="mb-3 text-sm font-medium text-text-secondary px-1">
                  {group.title}
                </h3>
                <div className="space-y-4">
                  {group.fields.map((key) => (
                    <div key={key} className="rounded-xl bg-white p-4">
                      <label className="mb-2 block text-sm font-medium text-text-main">
                        {fieldLabels[key]}
                      </label>
                      {textareaFields.includes(key) ? (
                        <textarea
                          value={settings[key]}
                          onChange={(e) => updateField(key, e.target.value)}
                          placeholder={fieldPlaceholders[key]}
                          rows={4}
                          className="w-full rounded-xl border border-border-color bg-ios-bg px-4 py-3 text-sm text-text-main placeholder:text-text-light outline-none focus:border-primary resize-none"
                        />
                      ) : (
                        <input
                          type="text"
                          value={settings[key]}
                          onChange={(e) => updateField(key, e.target.value)}
                          placeholder={fieldPlaceholders[key]}
                          className="w-full rounded-xl border border-border-color bg-ios-bg px-4 py-3 text-sm text-text-main placeholder:text-text-light outline-none focus:border-primary"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full rounded-xl bg-primary py-3 text-sm font-medium text-white transition-opacity disabled:opacity-50"
            >
              {saving ? '保存中...' : saved ? '✓ 已保存' : '保存设置'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

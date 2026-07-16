'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings, Save, Loader2, CheckCircle } from 'lucide-react'
import { config } from '@/lib/config'

interface OutletSettings {
  id: string
  name: string
  slug: string
  address: string | null
  logoUrl: string | null
  avgPrepTimeMinutes: number
}

interface Counts {
  tables: number
  orders: number
  menuItems: number
}

export default function SettingsPage() {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  const [formData, setFormData] = useState<OutletSettings>({
    id: '',
    name: '',
    slug: '',
    address: '',
    logoUrl: '',
    avgPrepTimeMinutes: 8,
  })

  const [counts, setCounts] = useState<Counts>({ tables: 0, orders: 0, menuItems: 0 })

  // Fetch outlet settings on load
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/admin/settings')
        const data = await res.json()
        if (res.ok && data.outlet) {
          setFormData(data.outlet)
          setCounts(data.counts)
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaved(false)

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          address: formData.address,
          logoUrl: formData.logoUrl,
          avgPrepTimeMinutes: formData.avgPrepTimeMinutes,
        }),
      })

      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-admin-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-admin-text-primary">Pengaturan</h1>
        <p className="text-admin-text-secondary">Kelola pengaturan restoran</p>
      </div>

      <form onSubmit={handleSave}>
        {/* Outlet Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Informasi Outlet
            </CardTitle>
            <CardDescription>
              Pengaturan dasar restoran Anda
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="outletName">Nama Outlet</Label>
                <Input
                  id="outletName"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="outletSlug">Slug URL</Label>
                <Input
                  id="outletSlug"
                  value={formData.slug}
                  disabled
                />
                <p className="text-xs text-admin-text-secondary">
                  Slug tidak dapat diubah setelah outlet dibuat
                </p>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Alamat</Label>
                <Input
                  id="address"
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="logoUrl">URL Logo</Label>
                <Input
                  id="logoUrl"
                  type="url"
                  value={formData.logoUrl || ''}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Pengaturan Order</CardTitle>
            <CardDescription>
              Konfigurasi estimasi dan order
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="avgPrepTime">Rata-rata Waktu Persiapan (menit)</Label>
                <Input
                  id="avgPrepTime"
                  type="number"
                  value={formData.avgPrepTimeMinutes}
                  onChange={(e) => setFormData({ ...formData, avgPrepTimeMinutes: parseInt(e.target.value) || 8 })}
                  min="1"
                  max="120"
                />
                <p className="text-xs text-admin-text-secondary">
                  Digunakan untuk estimasi waktu tunggu pesanan
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Statistik Outlet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-admin-primary">{counts.tables}</p>
                <p className="text-sm text-admin-text-secondary">Meja</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-admin-primary">{counts.menuItems}</p>
                <p className="text-sm text-admin-text-secondary">Menu Item</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-admin-primary">{counts.orders}</p>
                <p className="text-sm text-admin-text-secondary">Total Order</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Simpan Perubahan
              </>
            )}
          </Button>

          {saved && (
            <span className="flex items-center gap-2 text-green-600 font-medium">
              <CheckCircle className="w-4 h-4" />
              Perubahan tersimpan
            </span>
          )}
        </div>
      </form>
    </div>
  )
}

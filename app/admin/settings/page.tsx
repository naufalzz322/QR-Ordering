'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UtensilsCrossed, Save, Loader2, CheckCircle, Table2, ListOrdered } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OutletSettings {
  id: string
  name: string
  slug: string
  address: string | null
  logoUrl: string | null
}

interface Counts {
  tables: number
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
  })

  const [counts, setCounts] = useState<Counts>({ tables: 0, menuItems: 0 })

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
        <Loader2 className="w-8 h-8 animate-spin text-primary-700" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-admin-text-primary">Pengaturan</h1>
        <p className="text-sm text-admin-text-secondary">Kelola informasi dan preferensi outlet</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Outlet Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                <UtensilsCrossed className="w-4 h-4 text-primary-600" />
              </div>
              Profil Outlet
            </CardTitle>
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
                  className="bg-neutral-50"
                />
                <p className="text-xs text-admin-text-secondary">
                  Tidak dapat diubah
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Alamat</Label>
              <Input
                id="address"
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Jl. example No. 1, Kota"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logoUrl">URL Logo</Label>
              <Input
                id="logoUrl"
                type="url"
                value={formData.logoUrl || ''}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                placeholder="https://example.com/logo.png"
              />
            </div>
          </CardContent>
        </Card>

        {/* System Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Info Sistem</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Table2 className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-admin-text-primary">{counts.tables}</p>
                  <p className="text-sm text-admin-text-secondary">Meja</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <ListOrdered className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-admin-text-primary">{counts.menuItems}</p>
                  <p className="text-sm text-admin-text-secondary">Menu Item</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Action */}
        <div className="flex items-center gap-4 pt-2">
          <Button type="submit" disabled={saving} className="px-6">
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
              Tersimpan
            </span>
          )}
        </div>
      </form>
    </div>
  )
}

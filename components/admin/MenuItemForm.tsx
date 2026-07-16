'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Edit, Loader2 } from 'lucide-react'

interface Category {
  id: string
  name: string
  sortOrder: number
}

interface MenuItem {
  id: string
  name: string
  description: string | null
  basePrice: string
  photoUrl: string | null
  isAvailable: boolean
  avgPrepTimeMinutes: number
  categoryId: string
  variants: { id: string; name: string; additionalPrice: string }[]
}

interface MenuItemFormProps {
  item?: MenuItem | null
  categories: Category[]
  onSave: (data: Partial<MenuItem>) => Promise<void>
}

export default function MenuItemForm({ item, categories, onSave }: MenuItemFormProps) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: item?.name || '',
    description: item?.description || '',
    basePrice: item?.basePrice || '',
    categoryId: item?.categoryId || '',
    avgPrepTimeMinutes: item?.avgPrepTimeMinutes?.toString() || '8',
    photoUrl: item?.photoUrl || '',
    isAvailable: item?.isAvailable ?? true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      await onSave({
        ...formData,
        basePrice: formData.basePrice,
        avgPrepTimeMinutes: parseInt(formData.avgPrepTimeMinutes),
      })
      setOpen(false)
    } catch (error) {
      console.error('Failed to save:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          {item ? 'Edit Item' : 'Tambah Item'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? 'Edit Menu Item' : 'Tambah Menu Item Baru'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nama Item *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: Americano"
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Kategori *</Label>
            <Select
              value={formData.categoryId}
              onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price">Harga (Rp) *</Label>
            <Input
              id="price"
              type="number"
              value={formData.basePrice}
              onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
              placeholder="25000"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Deskripsi item..."
              rows={2}
            />
          </div>

          {/* Prep Time */}
          <div className="space-y-2">
            <Label htmlFor="prepTime">Waktu Persiapan (menit)</Label>
            <Input
              id="prepTime"
              type="number"
              value={formData.avgPrepTimeMinutes}
              onChange={(e) => setFormData({ ...formData, avgPrepTimeMinutes: e.target.value })}
              placeholder="8"
              min="1"
              max="120"
            />
          </div>

          {/* Photo URL */}
          <div className="space-y-2">
            <Label htmlFor="photo">URL Foto</Label>
            <Input
              id="photo"
              type="url"
              value={formData.photoUrl}
              onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
              placeholder="https://..."
            />
            {formData.photoUrl && (
              <div className="mt-2 w-24 h-24 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={formData.photoUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              </div>
            )}
          </div>

          {/* Availability */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="available"
              checked={formData.isAvailable}
              onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300"
            />
            <Label htmlFor="available" className="cursor-pointer">
              Tersedia (bukan HABIS)
            </Label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

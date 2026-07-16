'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Edit, Trash2, GripVertical, RefreshCw } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface Category {
  id: string
  name: string
  sortOrder: number
  isActive: boolean
  _count: {
    items: number
  }
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/categories')
      const data = await res.json()
      if (res.ok) {
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const createCategory = async () => {
    if (!newCategoryName.trim()) return

    setSaving(true)
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName, sortOrder: categories.length }),
      })
      if (res.ok) {
        setNewCategoryName('')
        fetchCategories()
      }
    } catch (error) {
      console.error('Failed to create category:', error)
    } finally {
      setSaving(false)
    }
  }

  const deleteCategory = async (id: string) => {
    if (!confirm('Yakin hapus kategori ini?')) return

    setSaving(true)
    try {
      const res = await fetch(`/api/admin/categories?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchCategories()
      }
    } catch (error) {
      console.error('Failed to delete category:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-admin-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-admin-text-primary">Kategori Menu</h1>
        <p className="text-admin-text-secondary">Kelola kategori untuk mengorganisir menu</p>
      </div>

      {/* Add Category */}
      <Card>
        <CardHeader>
          <CardTitle>Tambah Kategori Baru</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Nama kategori..."
              className="max-w-sm"
              onKeyDown={(e) => e.key === 'Enter' && createCategory()}
            />
            <Button onClick={createCategory} disabled={saving || !newCategoryName.trim()}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Categories List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Kategori ({categories.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center gap-4 p-4 bg-white rounded-lg border"
              >
                <GripVertical className="w-5 h-5 text-gray-400 cursor-grab" />

                <div className="flex-1">
                  <h3 className="font-medium text-admin-text-primary">{category.name}</h3>
                  <p className="text-sm text-admin-text-secondary">
                    {category._count.items} item
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={cn(
                    'px-2 py-1 rounded-full text-xs font-medium',
                    category.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  )}>
                    {category.isActive ? 'Aktif' : 'Nonaktif'}
                  </span>

                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Edit className="w-5 h-5 text-admin-text-secondary" />
                  </button>

                  <button
                    onClick={() => deleteCategory(category.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5 text-red-500" />
                  </button>
                </div>
              </div>
            ))}

            {categories.length === 0 && (
              <div className="text-center py-8 text-admin-text-secondary">
                Belum ada kategori
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

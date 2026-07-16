'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ConfirmDialog, useConfirm } from '@/components/ui/confirm-dialog'
import { useToast } from '@/components/ui/toast'
import { Plus, Edit, Trash2, RefreshCw, Loader2, ToggleLeft, ToggleRight, X, UtensilsCrossed, Search, GripVertical, Settings, Eye, Clock, Tag, Check, Image, Upload, ChevronDown, UploadCloud } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MenuItem {
  id: string
  name: string
  description: string | null
  basePrice: string
  photoUrl: string | null
  isAvailable: boolean
  avgPrepTimeMinutes: number
  categoryId: string
  sortOrder: number
  variants: { id: string; name: string; additionalPrice: string }[]
}

interface Category {
  id: string
  name: string
  sortOrder: number
  isActive: boolean
  _count: {
    items: number
  }
  items?: MenuItem[]
}

interface ItemFormData {
  name: string
  description: string
  basePrice: string
  avgPrepTimeMinutes: string
  photoUrl: string
  isAvailable: boolean
  categoryId: string
}

export default function MenuManagement() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Bulk selection
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)

  // Drag state
  const [draggedCategory, setDraggedCategory] = useState<string | null>(null)
  const [draggedItem, setDraggedItem] = useState<string | null>(null)

  // Modals
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')

  const [showItemModal, setShowItemModal] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [detailItem, setDetailItem] = useState<MenuItem | null>(null)
  const [itemForm, setItemForm] = useState<ItemFormData>({
    name: '',
    description: '',
    basePrice: '',
    avgPrepTimeMinutes: '8',
    photoUrl: '',
    isAvailable: true,
    categoryId: '',
  })

  // Image upload state
  const [uploading, setUploading] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [oldPhotoUrl, setOldPhotoUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { confirm, ConfirmDialog: ConfirmDialogComponent } = useConfirm()
  const toast = useToast()

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

  useEffect(() => {
    fetchCategories()
  }, [])

  // Filter items based on active tab and search
  const filteredItems = useMemo(() => {
    let items: MenuItem[] = []

    if (activeTab === 'all') {
      categories.forEach(cat => {
        if (cat.items) items.push(...cat.items)
      })
    } else {
      const cat = categories.find(c => c.id === activeTab)
      if (cat?.items) items = cat.items
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      items = items.filter(item => item.name.toLowerCase().includes(query))
    }

    return items.sort((a, b) => a.sortOrder - b.sortOrder)
  }, [categories, activeTab, searchQuery])

  // Bulk selection handlers
  const toggleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
    } else {
      newSelected.add(itemId)
    }
    setSelectedItems(newSelected)
    setShowBulkActions(newSelected.size > 0)
  }

  const selectAllVisible = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set())
      setShowBulkActions(false)
    } else {
      setSelectedItems(new Set(filteredItems.map(i => i.id)))
      setShowBulkActions(true)
    }
  }

  const bulkToggleAvailability = async (isAvailable: boolean) => {
    setSaving(true)
    try {
      await Promise.all(
        Array.from(selectedItems).map(itemId =>
          fetch('/api/admin/menu', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: itemId, isAvailable }),
          })
        )
      )
      toast.success(`${selectedItems.size} item berhasil diperbarui`)
      setSelectedItems(new Set())
      setShowBulkActions(false)
      fetchCategories()
    } catch (error) {
      console.error('Failed to bulk update:', error)
      toast.error('Gagal bulk update item')
    } finally {
      setSaving(false)
    }
  }

  const bulkDelete = async () => {
    const result = await confirm({
      title: 'Hapus Item Terpilih',
      description: `Hapus ${selectedItems.size} item yang dipilih?`,
      confirmText: 'Hapus',
      cancelText: 'Batal',
      variant: 'danger',
      destructive: true,
    })

    if (!result.confirmed) return

    setSaving(true)
    try {
      await Promise.all(
        Array.from(selectedItems).map(itemId =>
          fetch(`/api/admin/menu?id=${itemId}`, { method: 'DELETE' })
        )
      )
      toast.success(`${selectedItems.size} item berhasil dihapus`)
      setSelectedItems(new Set())
      setShowBulkActions(false)
      fetchCategories()
    } catch (error) {
      console.error('Failed to bulk delete:', error)
      toast.error('Gagal menghapus item')
    } finally {
      setSaving(false)
    }
  }

  // Category actions
  const handleSaveCategory = async () => {
    if (!newCategoryName.trim()) return

    setSaving(true)
    try {
      if (editingCategory) {
        await fetch('/api/admin/categories', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingCategory.id, name: newCategoryName }),
        })
      } else {
        await fetch('/api/admin/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newCategoryName, sortOrder: categories.length }),
        })
      }
      toast.success(editingCategory ? 'Kategori berhasil diperbarui' : 'Kategori berhasil ditambahkan')
      setShowCategoryModal(false)
      setEditingCategory(null)
      setNewCategoryName('')
      fetchCategories()
    } catch (error) {
      console.error('Failed to save category:', error)
      toast.error('Gagal menyimpan kategori')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    const result = await confirm({
      title: 'Hapus Kategori',
      description: 'Yakin hapus kategori ini? Item di dalamnya juga akan terhapus.',
      confirmText: 'Hapus',
      cancelText: 'Batal',
      variant: 'danger',
      destructive: true,
    })

    if (!result.confirmed) return

    setSaving(true)
    try {
      await fetch(`/api/admin/categories?id=${id}`, { method: 'DELETE' })
      toast.success('Kategori berhasil dihapus')
      if (activeTab === id) setActiveTab('all')
      fetchCategories()
    } catch (error) {
      console.error('Failed to delete category:', error)
      toast.error('Gagal menghapus kategori')
    } finally {
      setSaving(false)
    }
  }

  const toggleCategoryActive = async (category: Category) => {
    setSaving(true)
    try {
      await fetch('/api/admin/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: category.id, isActive: !category.isActive }),
      })
      toast.success('Kategori berhasil diperbarui')
      fetchCategories()
    } catch (error) {
      console.error('Failed to toggle category:', error)
      toast.error('Gagal mengupdate kategori')
    } finally {
      setSaving(false)
    }
  }

  // Drag and drop for categories
  const handleDragStartCategory = (e: React.DragEvent, categoryId: string) => {
    setDraggedCategory(categoryId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOverCategory = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!draggedCategory || draggedCategory === targetId) return

    const newCategories = [...categories]
    const draggedIndex = newCategories.findIndex(c => c.id === draggedCategory)
    const targetIndex = newCategories.findIndex(c => c.id === targetId)

    if (draggedIndex !== -1 && targetIndex !== -1) {
      const [removed] = newCategories.splice(draggedIndex, 1)
      newCategories.splice(targetIndex, 0, removed)
      setCategories(newCategories)
    }
  }

  const handleDragEndCategory = async () => {
    if (!draggedCategory) return

    // Save new order
    try {
      await Promise.all(
        categories.map((cat, index) =>
          fetch('/api/admin/categories', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: cat.id, sortOrder: index }),
          })
        )
      )
    } catch (error) {
      console.error('Failed to save category order:', error)
    }

    setDraggedCategory(null)
    fetchCategories()
  }

  // Image upload handler - only preview, upload on save
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let file: File | null = null

    if ('dataTransfer' in e) {
      // Drag and drop
      const files = e.dataTransfer.files
      if (files.length > 0) file = files[0]
    } else {
      // File input change
      if (e.target.files && e.target.files.length > 0) {
        file = e.target.files[0]
      }
    }

    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      toast.error('Format gambar tidak valid. Gunakan JPG, PNG, WebP, atau GIF.')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ukuran file terlalu besar. Maksimal 10MB.')
      return
    }

    // Show preview and store file locally (don't upload yet)
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string)
      setPendingFile(file)
      setItemForm({ ...itemForm, photoUrl: '' }) // Clear old URL until saved
    }
    reader.readAsDataURL(file)

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeImage = () => {
    setItemForm({ ...itemForm, photoUrl: '' })
    setPreviewImage(null)
    setPendingFile(null)
  }

  // Item actions
  const openAddItem = (categoryId?: string) => {
    setEditingItem(null)
    setOldPhotoUrl(null)
    setPendingFile(null)
    setPreviewImage(null)
    setItemForm({
      name: '',
      description: '',
      basePrice: '',
      avgPrepTimeMinutes: '8',
      photoUrl: '',
      isAvailable: true,
      categoryId: categoryId || categories[0]?.id || '',
    })
    setShowItemModal(true)
  }

  const openEditItem = (item: MenuItem) => {
    setEditingItem(item)
    setOldPhotoUrl(item.photoUrl)
    setPendingFile(null)
    setPreviewImage(null)
    setItemForm({
      name: item.name,
      description: item.description || '',
      basePrice: item.basePrice,
      avgPrepTimeMinutes: item.avgPrepTimeMinutes?.toString() || '8',
      photoUrl: item.photoUrl || '',
      isAvailable: item.isAvailable,
      categoryId: item.categoryId,
    })
    setShowItemModal(true)
  }

  const handleSaveItem = async () => {
    if (!itemForm.name || !itemForm.basePrice || !itemForm.categoryId) return

    setSaving(true)
    try {
      let finalPhotoUrl = itemForm.photoUrl

      // Upload new image if there's a pending file
      if (pendingFile) {
        setUploading(true)
        const formData = new FormData()
        formData.append('file', pendingFile)

        const uploadRes = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        })

        if (!uploadRes.ok) {
          throw new Error('Failed to upload image')
        }

        const uploadData = await uploadRes.json()
        finalPhotoUrl = uploadData.imageUrl
        setUploading(false)

        // Delete old image if editing and there's a different old photo
        if (oldPhotoUrl && oldPhotoUrl !== finalPhotoUrl) {
          // Extract path from URL and delete
          const oldPath = oldPhotoUrl.split('/uploads').pop()
          if (oldPath) {
            await fetch('/api/admin/upload', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ path: oldPath }),
            }).catch(() => {}) // Ignore errors for cleanup
          }
        }
      }

      const method = editingItem ? 'PUT' : 'POST'
      const url = editingItem ? `/api/admin/menu?id=${editingItem.id}` : '/api/admin/menu'

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: itemForm.name,
          description: itemForm.description,
          basePrice: itemForm.basePrice,
          avgPrepTimeMinutes: parseInt(itemForm.avgPrepTimeMinutes),
          photoUrl: finalPhotoUrl,
          isAvailable: itemForm.isAvailable,
          categoryId: itemForm.categoryId,
        }),
      })

      toast.success(editingItem ? 'Item berhasil diperbarui' : 'Item berhasil ditambahkan')
      setPendingFile(null)
      setOldPhotoUrl(null)
      setPreviewImage(null)
      setShowItemModal(false)
      fetchCategories()
    } catch (error) {
      console.error('Failed to save item:', error)
      toast.error('Gagal menyimpan item')
    } finally {
      setSaving(false)
      setUploading(false)
    }
  }

  const toggleItemAvailability = async (itemId: string, currentStatus: boolean) => {
    setSaving(true)
    try {
      await fetch('/api/admin/menu', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: itemId, isAvailable: !currentStatus }),
      })
      toast.success(!currentStatus ? 'Item ditandai tersedia' : 'Item ditandai habis')
      fetchCategories()
    } catch (error) {
      console.error('Failed to toggle availability:', error)
      toast.error('Gagal mengupdate item')
    } finally {
      setSaving(false)
    }
  }

  const deleteMenuItem = async (itemId: string) => {
    const result = await confirm({
      title: 'Hapus Item',
      description: 'Yakin hapus item ini?',
      confirmText: 'Hapus',
      cancelText: 'Batal',
      variant: 'danger',
      destructive: true,
    })

    if (!result.confirmed) return

    setSaving(true)
    try {
      await fetch(`/api/admin/menu?id=${itemId}`, { method: 'DELETE' })
      toast.success('Item berhasil dihapus')
      fetchCategories()
    } catch (error) {
      console.error('Failed to delete item:', error)
      toast.error('Gagal menghapus item')
    } finally {
      setSaving(false)
    }
  }

  const openDetailItem = (item: MenuItem) => {
    setDetailItem(item)
    setShowDetailModal(true)
  }

  const getCategoryName = (categoryId: string) => {
    const cat = categories.find(c => c.id === categoryId)
    return cat?.name || 'Unknown'
  }

  const items = filteredItems
  const totalItems = categories.reduce((sum, c) => sum + (c._count?.items || 0), 0)

  if (loading && categories.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-admin-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <ConfirmDialogComponent />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-admin-text-primary">Kelola Menu</h1>
          <p className="text-admin-text-secondary">{totalItems} item di {categories.length} kategori</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowCategoryModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Kategori
          </Button>
          <Button onClick={() => openAddItem(activeTab === 'all' ? undefined : activeTab)}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Item
          </Button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <div className="flex items-center justify-between bg-primary-50 border border-primary-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary-700 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
              {selectedItems.size}
            </div>
            <span className="font-medium">item dipilih</span>
            <button
              onClick={() => {
                setSelectedItems(new Set())
                setShowBulkActions(false)
              }}
              className="p-1 hover:bg-primary-100 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => bulkToggleAvailability(true)}>
              <Check className="w-4 h-4 mr-1" />
              Jadikan Tersedia
            </Button>
            <Button size="sm" variant="outline" onClick={() => bulkToggleAvailability(false)}>
              <X className="w-4 h-4 mr-1" />
              Jadikan Habis
            </Button>
            <Button size="sm" variant="destructive" onClick={bulkDelete}>
              <Trash2 className="w-4 h-4 mr-1" />
              Hapus
            </Button>
          </div>
        </div>
      )}

      {/* Category Tabs - Draggable */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => { setActiveTab('all'); setSelectedItems(new Set()); setShowBulkActions(false) }}
          className={cn(
            'px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors',
            activeTab === 'all'
              ? 'bg-primary-700 text-white'
              : 'bg-white text-admin-text-secondary hover:bg-neutral-100 border'
          )}
        >
          Semua ({totalItems})
        </button>
        {categories
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((cat) => (
            <div
              key={cat.id}
              draggable
              onDragStart={(e) => handleDragStartCategory(e, cat.id)}
              onDragOver={(e) => handleDragOverCategory(e, cat.id)}
              onDragEnd={handleDragEndCategory}
              className={cn(
                'relative group rounded-lg transition-all',
                draggedCategory === cat.id && 'opacity-50'
              )}
            >
              <button
                onClick={() => { setActiveTab(cat.id); setSelectedItems(new Set()); setShowBulkActions(false) }}
                className={cn(
                  'px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-2',
                  activeTab === cat.id
                    ? 'bg-primary-700 text-white'
                    : 'bg-white text-admin-text-secondary hover:bg-neutral-100 border',
                  !cat.isActive && 'opacity-50'
                )}
              >
                <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                {cat.name} ({cat._count?.items || 0})
              </button>
              {/* Hover actions */}
              <div className="absolute -top-1 -right-1 hidden group-hover:flex gap-1 z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditingCategory(cat)
                    setNewCategoryName(cat.name)
                    setShowCategoryModal(true)
                  }}
                  className="p-1 bg-white rounded-full shadow border hover:bg-neutral-50"
                >
                  <Settings className="w-3 h-3 text-admin-text-secondary" />
                </button>
              </div>
            </div>
          ))}
      </div>

      {/* Search and Actions */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-text-secondary" />
          <Input
            placeholder="Cari item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {items.length > 0 && (
          <Button variant="outline" size="sm" onClick={selectAllVisible}>
            <Check className="w-4 h-4 mr-2" />
            {selectedItems.size === items.length ? 'Batal Pilih' : 'Pilih Semua'}
          </Button>
        )}
      </div>

      {/* Items Grid */}
      {loading ? (
        <Card>
          <CardContent className="py-12 flex items-center justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-primary-700" />
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <UtensilsCrossed className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-admin-text-secondary mb-4">
              {searchQuery ? 'Tidak ada item yang cocok' : 'Belum ada item'}
            </p>
            {!searchQuery && (
              <Button onClick={() => openAddItem()}>
                <Plus className="w-4 h-4 mr-2" />
                Tambah Item Pertama
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item) => (
            <Card
              key={item.id}
              className={cn(
                'overflow-hidden transition-all hover:shadow-lg relative',
                !item.isAvailable && 'opacity-70',
                selectedItems.has(item.id) && 'ring-2 ring-primary-500'
              )}
            >
              {/* Selection Checkbox */}
              <button
                onClick={() => toggleSelectItem(item.id)}
                className={cn(
                  'absolute top-2 left-2 z-10 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all',
                  selectedItems.has(item.id)
                    ? 'bg-primary-700 border-primary-700 text-white'
                    : 'bg-white border-gray-300 hover:border-primary-500'
                )}
              >
                {selectedItems.has(item.id) && <Check className="w-4 h-4" />}
              </button>

              {/* Photo - Clickable for detail */}
              <div
                className="aspect-square bg-gray-100 relative cursor-pointer"
                onClick={() => openDetailItem(item)}
              >
                {item.photoUrl ? (
                  <img
                    src={item.photoUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image className="w-12 h-12 text-gray-300" />
                  </div>
                )}
                {/* Availability Badge */}
                <div className="absolute top-2 right-2">
                  <span
                    className={cn(
                      'px-2 py-1 rounded-full text-xs font-bold uppercase',
                      item.isAvailable
                        ? 'bg-green-500 text-white'
                        : 'bg-red-500 text-white'
                    )}
                  >
                    {item.isAvailable ? 'Tersedia' : 'Habis'}
                  </span>
                </div>
                {/* View Detail Overlay */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <div className="bg-white rounded-full p-3">
                    <Eye className="w-6 h-6 text-gray-700" />
                  </div>
                </div>
              </div>

              {/* Content */}
              <CardContent className="p-4">
                <h3 className="font-bold text-admin-text-primary truncate">{item.name}</h3>
                <p className="text-sm text-admin-text-secondary line-clamp-2 mt-1 min-h-[2.5rem]">
                  {item.description || 'Tidak ada deskripsi'}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <div>
                    <p className="font-bold text-lg text-primary-700">
                      Rp {parseFloat(item.basePrice).toLocaleString('id-ID')}
                    </p>
                    <p className="text-xs text-admin-text-secondary">
                      ±{item.avgPrepTimeMinutes} menit
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t">
                  {/* Toggle */}
                  <button
                    onClick={() => toggleItemAvailability(item.id, item.isAvailable)}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-medium text-sm transition-colors',
                      item.isAvailable
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    )}
                    disabled={saving}
                  >
                    {item.isAvailable ? (
                      <>
                        <ToggleRight className="w-4 h-4" />
                        Tersedia
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4" />
                        Habis
                      </>
                    )}
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => openEditItem(item)}
                    className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                  >
                    <Edit className="w-5 h-5 text-admin-text-secondary" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => deleteMenuItem(item.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    disabled={saving}
                  >
                    <Trash2 className="w-5 h-5 text-red-500" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Category Modal */}
      <Dialog open={showCategoryModal} onOpenChange={() => {
        setShowCategoryModal(false)
        setEditingCategory(null)
        setNewCategoryName('')
      }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Kategori</Label>
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Contoh: Minuman"
              />
            </div>
            {editingCategory && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm">Aktif</span>
                <button
                  onClick={() => toggleCategoryActive(editingCategory)}
                  className={cn(
                    'p-1 rounded transition-colors',
                    editingCategory.isActive ? 'text-green-600' : 'text-gray-400'
                  )}
                >
                  {editingCategory.isActive ? (
                    <ToggleRight className="w-8 h-8" />
                  ) : (
                    <ToggleLeft className="w-8 h-8" />
                  )}
                </button>
              </div>
            )}
            <DialogFooter className="gap-2">
              {editingCategory && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleDeleteCategory(editingCategory.id)
                    setShowCategoryModal(false)
                  }}
                  disabled={saving}
                >
                  Hapus
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  setShowCategoryModal(false)
                  setEditingCategory(null)
                  setNewCategoryName('')
                }}
              >
                Batal
              </Button>
              <Button onClick={handleSaveCategory} disabled={saving || !newCategoryName.trim()}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Item Modal */}
      <Dialog open={showItemModal} onOpenChange={() => setShowItemModal(false)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Item' : 'Tambah Item Baru'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Photo Upload Area */}
            <div className="space-y-2">
              <Label>Foto Item</Label>
              <div
                className={cn(
                  'border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer',
                  'hover:border-primary-400 hover:bg-gray-50',
                  (uploading || previewImage) && 'border-primary-300 bg-primary-50'
                )}
                onClick={() => !uploading && fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleImageUpload(e)
                }}
              >
                {uploading ? (
                  <div className="py-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-2" />
                    <p className="text-sm text-admin-text-secondary">Mengupload...</p>
                  </div>
                ) : previewImage ? (
                  <div className="relative">
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="max-h-40 mx-auto rounded-lg object-contain"
                    />
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">Pending - akan diupload saat disimpan</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeImage()
                        }}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                ) : itemForm.photoUrl ? (
                  <div className="relative">
                    <img
                      src={itemForm.photoUrl}
                      alt="Current"
                      className="max-h-40 mx-auto rounded-lg object-contain"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeImage()
                      }}
                      className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="py-4">
                    <UploadCloud className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-admin-text-secondary">
                      Klik atau drag & drop foto di sini
                    </p>
                    <p className="text-xs text-admin-text-secondary mt-1">
                      JPG, PNG, WebP - Maksimal 10MB
                    </p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label>Nama Item *</Label>
              <Input
                value={itemForm.name}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                placeholder="Contoh: Americano"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Kategori *</Label>
              <select
                value={itemForm.categoryId}
                onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })}
                className="w-full h-10 px-3 rounded-md border border-input bg-white text-sm"
              >
                <option value="">Pilih kategori</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label>Harga (Rp) *</Label>
              <Input
                type="number"
                value={itemForm.basePrice}
                onChange={(e) => setItemForm({ ...itemForm, basePrice: e.target.value })}
                placeholder="25000"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea
                value={itemForm.description}
                onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                placeholder="Deskripsi item..."
                rows={2}
              />
            </div>

            {/* Prep Time */}
            <div className="space-y-2">
              <Label>Waktu Persiapan (menit)</Label>
              <Input
                type="number"
                value={itemForm.avgPrepTimeMinutes}
                onChange={(e) => setItemForm({ ...itemForm, avgPrepTimeMinutes: e.target.value })}
                min="1"
                max="120"
              />
            </div>

            {/* Availability Toggle */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <Label className="cursor-pointer">Tersedia (bukan HABIS)</Label>
              <button
                onClick={() => setItemForm({ ...itemForm, isAvailable: !itemForm.isAvailable })}
                className={cn(
                  'p-1 rounded transition-colors',
                  itemForm.isAvailable ? 'text-green-600' : 'text-gray-400'
                )}
              >
                {itemForm.isAvailable ? (
                  <ToggleRight className="w-8 h-8" />
                ) : (
                  <ToggleLeft className="w-8 h-8" />
                )}
              </button>
            </div>

            {/* Actions */}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowItemModal(false)}>
                Batal
              </Button>
              <Button
                onClick={handleSaveItem}
                disabled={saving || !itemForm.name || !itemForm.basePrice || !itemForm.categoryId}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Item Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={() => setShowDetailModal(false)}>
        <DialogContent className="max-w-md">
          {detailItem && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{detailItem.name}</DialogTitle>
              </DialogHeader>

              {/* Photo */}
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                {detailItem.photoUrl ? (
                  <img
                    src={detailItem.photoUrl}
                    alt={detailItem.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image className="w-16 h-16 text-gray-300" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="space-y-4">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-admin-text-secondary">Status</span>
                  <span
                    className={cn(
                      'px-3 py-1 rounded-full text-sm font-bold uppercase',
                      detailItem.isAvailable
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    )}
                  >
                    {detailItem.isAvailable ? 'Tersedia' : 'Habis'}
                  </span>
                </div>

                {/* Category */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-admin-text-secondary">Kategori</span>
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-admin-text-secondary" />
                    <span className="font-medium">{getCategoryName(detailItem.categoryId)}</span>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-admin-text-secondary">Harga</span>
                  <span className="text-xl font-bold text-primary-700">
                    Rp {parseFloat(detailItem.basePrice).toLocaleString('id-ID')}
                  </span>
                </div>

                {/* Prep Time */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-admin-text-secondary">Waktu Persiapan</span>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-admin-text-secondary" />
                    <span className="font-medium">±{detailItem.avgPrepTimeMinutes} menit</span>
                  </div>
                </div>

                {/* Description */}
                <div className="border-t pt-4">
                  <span className="text-sm text-admin-text-secondary block mb-2">Deskripsi</span>
                  <p className="text-admin-text-primary">
                    {detailItem.description || 'Tidak ada deskripsi'}
                  </p>
                </div>

                {/* Variants */}
                {detailItem.variants && detailItem.variants.length > 0 && (
                  <div className="border-t pt-4">
                    <span className="text-sm text-admin-text-secondary block mb-2">Varian</span>
                    <div className="space-y-2">
                      {detailItem.variants.map((variant) => (
                        <div key={variant.id} className="flex justify-between">
                          <span>{variant.name}</span>
                          <span className="font-medium text-primary-700">
                            +Rp {parseFloat(variant.additionalPrice).toLocaleString('id-ID')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <DialogFooter className="gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDetailModal(false)
                    openEditItem(detailItem)
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    deleteMenuItem(detailItem.id)
                    setShowDetailModal(false)
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Hapus
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

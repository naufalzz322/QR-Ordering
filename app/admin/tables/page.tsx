'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table2,
  Download,
  RefreshCw,
  Check,
  X,
  QrCode,
  Copy,
  ExternalLink,
  Plus,
  Trash2,
  Eye,
  Edit,
  ChevronRight,
  XCircle,
  Clock,
  CheckCircle2,
  Loader2
} from 'lucide-react'
import { generateQRPdf, generateQRDataUrl } from '@/lib/qrGenerator'
import { cn } from '@/lib/utils'
import { config } from '@/lib/config'
import { ConfirmDialog, useConfirm } from '@/components/ui/confirm-dialog'
import { useToast } from '@/components/ui/toast'

interface Order {
  id: string
  orderNumber: string
  status: 'PENDING' | 'PROCESSING' | 'READY' | 'COMPLETED' | 'CANCELLED'
  createdAt: string
  totalAmount: string
}

interface Table {
  id: string
  tableNumber: number
  qrToken: string
  status: 'EMPTY' | 'ACTIVE' | 'DONE'
  orders: Order[]
}

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selectedTables, setSelectedTables] = useState<Set<number>>(new Set())
  const [activeTab, setActiveTab] = useState<'manage' | 'qr'>('manage')
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [copiedToken, setCopiedToken] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({})
  const [qrLoading, setQrLoading] = useState<Record<string, boolean>>({})

  // Confirmation dialogs
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; tableId?: string; tableNumber?: number }>({ open: false })
  const [confirmRegenerate, setConfirmRegenerate] = useState<{ open: boolean; table?: Table }>({ open: false })
  const [confirmGenerate, setConfirmGenerate] = useState(false)
  const [loadingAction, setLoadingAction] = useState(false)

  const { confirm, ConfirmDialog: ConfirmDialogComponent } = useConfirm()
  const toast = useToast()

  useEffect(() => {
    fetchTables()
  }, [])

  const fetchTables = async () => {
    try {
      const res = await fetch('/api/admin/tables')
      const data = await res.json()
      setTables(data.tables || [])
    } catch (error) {
      console.error('Failed to fetch tables:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateTables = async () => {
    setLoadingAction(true)
    try {
      const res = await fetch('/api/admin/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 1 }),
      })
      const data = await res.json()
      toast.success('Meja berhasil ditambahkan')
      setTables(data.tables || [])
      setConfirmGenerate(false)
    } catch (error) {
      console.error('Failed to generate tables:', error)
      toast.error('Gagal membuat meja')
    } finally {
      setLoadingAction(false)
    }
  }

  const handleDeleteTable = async () => {
    if (!confirmDelete.tableId) return
    setLoadingAction(true)
    try {
      const res = await fetch(`/api/admin/tables/${confirmDelete.tableId}`, { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Gagal menghapus meja')
        return
      }

      toast.success(data.message || 'Meja berhasil dihapus')
      fetchTables()
      if (selectedTable?.id === confirmDelete.tableId) {
        setShowDetailModal(false)
        setSelectedTable(null)
      }
    } catch (error) {
      console.error('Failed to delete table:', error)
      toast.error('Gagal menghapus meja')
    } finally {
      setLoadingAction(false)
      setConfirmDelete({ open: false })
    }
  }

  const handleRegenerateToken = async () => {
    if (!confirmRegenerate.table) return
    setLoadingAction(true)
    try {
      const res = await fetch(`/api/admin/tables/${confirmRegenerate.table.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regenerateToken: true }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Token berhasil diperbarui!')
        fetchTables()
        if (selectedTable?.id === confirmRegenerate.table.id) {
          const updatedTable = { ...selectedTable, qrToken: data.table.qrToken }
          setSelectedTable(updatedTable)
          // Regenerate QR code with new token
          await generateTableQR(updatedTable)
        }
      } else {
        toast.error(data.error || 'Gagal generate token')
      }
    } catch (error) {
      console.error('Failed to regenerate token:', error)
      toast.error('Gagal membuat token')
    } finally {
      setLoadingAction(false)
      setConfirmRegenerate({ open: false })
    }
  }

  const downloadQRPdf = async () => {
    if (selectedTables.size === 0) return

    setGenerating(true)
    try {
      const selectedTableData = tables
        .filter((t) => selectedTables.has(t.tableNumber))
        .map((t) => ({
          tableNumber: t.tableNumber,
          qrToken: t.qrToken,
          outletName: 'Warung Nusantara',
          outletSlug: config.outletSlug,
        }))

      const pdfBuffer = await generateQRPdf(selectedTableData, config.appUrl)

      const blob = new Blob([new Uint8Array(pdfBuffer)], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `qr-codes-${Date.now()}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('PDF berhasil didownload')
    } catch (error) {
      console.error('Failed to generate PDF:', error)
      toast.error('Gagal mengunduh PDF')
    } finally {
      setGenerating(false)
    }
  }

  const toggleTableSelection = (tableNumber: number) => {
    const newSelection = new Set(selectedTables)
    if (newSelection.has(tableNumber)) {
      newSelection.delete(tableNumber)
    } else {
      newSelection.add(tableNumber)
    }
    setSelectedTables(newSelection)
  }

  const selectAll = () => {
    if (selectedTables.size === tables.length) {
      setSelectedTables(new Set())
    } else {
      setSelectedTables(new Set(tables.map((t) => t.tableNumber)))
    }
  }

  const generateAllQRCodes = async (tablesToGenerate: Table[]) => {
    for (const table of tablesToGenerate) {
      if (qrCodes[table.id] || qrLoading[table.id]) continue

      setQrLoading((prev) => ({ ...prev, [table.id]: true }))
      try {
        const menuUrl = `${config.appUrl}/m/${config.outletSlug}?token=${table.qrToken}`
        const dataUrl = await generateQRDataUrl(menuUrl)
        setQrCodes((prev) => ({ ...prev, [table.id]: dataUrl }))
      } catch (error) {
        console.error(`Failed to generate QR for table ${table.tableNumber}:`, error)
      } finally {
        setQrLoading((prev) => ({ ...prev, [table.id]: false }))
      }
    }
  }

  // Generate QR codes when switching to QR tab
  useEffect(() => {
    if (activeTab === 'qr' && tables.length > 0) {
      // Check if any tables need QR generation
      const needsGeneration = tables.some((t) => !qrCodes[t.id] && !qrLoading[t.id])
      if (needsGeneration) {
        generateAllQRCodes(tables)
      }
    }
  }, [activeTab])

  const openTableDetail = async (table: Table) => {
    setSelectedTable(table)
    setShowDetailModal(true)
    // Generate QR code for this table
    await generateTableQR(table)
  }

  const generateTableQR = async (table: Table) => {
    try {
      const menuUrl = `${config.appUrl}/m/${config.outletSlug}?token=${table.qrToken}`
      const dataUrl = await generateQRDataUrl(menuUrl)
      setQrCodeUrl(dataUrl)
    } catch (error) {
      console.error('Failed to generate QR code:', error)
      setQrCodeUrl(null)
    }
  }

  const copyTableToken = () => {
    if (selectedTable) {
      navigator.clipboard.writeText(selectedTable.qrToken)
      setCopiedToken(true)
      setTimeout(() => setCopiedToken(false), 2000)
    }
  }

  const copyTableUrl = () => {
    if (selectedTable) {
      const url = `${config.appUrl}/m/${config.outletSlug}?token=${selectedTable.qrToken}`
      navigator.clipboard.writeText(url)
    }
  }

  const downloadQRCode = () => {
    if (!qrCodeUrl || !selectedTable) return

    const link = document.createElement('a')
    link.download = `qr-meja-${selectedTable.tableNumber}.png`
    link.href = qrCodeUrl
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Helper to open delete confirmation
  const deleteTable = (table: Table) => {
    setConfirmDelete({ open: true, tableId: table.id, tableNumber: table.tableNumber })
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'EMPTY':
        return { label: 'Kosong', color: 'bg-gray-100 text-gray-600 border-gray-200', icon: XCircle }
      case 'ACTIVE':
        return { label: 'Aktif', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: Clock }
      case 'DONE':
        return { label: 'Selesai', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2 }
      default:
        return { label: status, color: 'bg-gray-100 text-gray-600', icon: XCircle }
    }
  }

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-700">Menunggu</span>
      case 'PROCESSING':
        return <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">Diproses</span>
      case 'READY':
        return <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">Siap</span>
      default:
        return null
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-admin-text-primary">Manajemen Meja</h1>
          <p className="text-admin-text-secondary">Kelola meja dan QR code</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('manage')}
          className={cn(
            'px-4 py-3 font-medium border-b-2 transition-colors',
            activeTab === 'manage'
              ? 'border-admin-primary text-admin-primary'
              : 'border-transparent text-admin-text-secondary hover:text-admin-text-primary'
          )}
        >
          <span className="flex items-center gap-2">
            <Table2 className="w-4 h-4" />
            Manajemen Meja
          </span>
        </button>
        <button
          onClick={() => setActiveTab('qr')}
          className={cn(
            'px-4 py-3 font-medium border-b-2 transition-colors',
            activeTab === 'qr'
              ? 'border-admin-primary text-admin-primary'
              : 'border-transparent text-admin-text-secondary hover:text-admin-text-primary'
          )}
        >
          <span className="flex items-center gap-2">
            <QrCode className="w-4 h-4" />
            QR Codes
          </span>
        </button>
      </div>

      {/* Management Tab */}
      {activeTab === 'manage' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Daftar Meja ({tables.length})</CardTitle>
              <Button size="sm" onClick={() => setConfirmGenerate(true)} disabled={generating}>
                <Plus className="w-4 h-4 mr-1" />
                Tambah Meja
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {tables.length === 0 ? (
              <div className="text-center py-12">
                <Table2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-admin-text-primary mb-2">
                  Belum Ada Meja
                </h3>
                <p className="text-admin-text-secondary mb-4">
                  Tambahkan meja untuk mulai membuat QR code
                </p>
                <Button onClick={() => setConfirmGenerate(true)} disabled={generating}>
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Meja
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-admin-text-secondary">Meja</th>
                      <th className="text-left py-3 px-4 font-medium text-admin-text-secondary">Token</th>
                      <th className="text-right py-3 px-4 font-medium text-admin-text-secondary">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tables.map((table) => (
                        <tr key={table.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center font-bold text-admin-text-primary">
                                {table.tableNumber}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                              {table.qrToken}
                            </code>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openTableDetail(table)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteTable(table)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* QR Codes Tab */}
      {activeTab === 'qr' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>QR Codes ({tables.length} meja)</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  {selectedTables.size === tables.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                </Button>
                <Button
                  size="sm"
                  onClick={downloadQRPdf}
                  disabled={selectedTables.size === 0 || generating}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF ({selectedTables.size})
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {tables.map((table) => (
                <div
                  key={table.id}
                  className={cn(
                    'relative border-2 rounded-xl p-4 cursor-pointer transition-all hover:shadow-lg',
                    selectedTables.has(table.tableNumber)
                      ? 'border-admin-primary bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                  onClick={() => toggleTableSelection(table.tableNumber)}
                >
                  {/* Selection indicator */}
                  <div
                    className={cn(
                      'absolute -top-2 -right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center',
                      selectedTables.has(table.tableNumber)
                        ? 'bg-admin-primary border-admin-primary text-white'
                        : 'bg-white border-gray-300'
                    )}
                  >
                    {selectedTables.has(table.tableNumber) ? (
                      <Check className="w-4 h-4" />
                    ) : null}
                  </div>

                  {/* Table content */}
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center mx-auto mb-2 border overflow-hidden">
                      {qrLoading[table.id] ? (
                        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                      ) : qrCodes[table.id] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={qrCodes[table.id]} alt={`QR Meja ${table.tableNumber}`} className="w-full h-full object-contain" />
                      ) : (
                        <QrCode className="w-10 h-10 text-admin-text-primary" />
                      )}
                    </div>
                    <p className="font-bold text-admin-text-primary mb-1">Meja {table.tableNumber}</p>
                    <span className="text-xs text-admin-text-secondary font-mono">{table.qrToken}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table Detail Modal */}
      {showDetailModal && selectedTable && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowDetailModal(false)}>
          <div
            className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-bold">Detail Meja {selectedTable.tableNumber}</h2>
              <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* QR Code Preview */}
            <div className="p-6 bg-gray-50 flex flex-col items-center">
              <div className="w-48 h-48 bg-white rounded-xl flex items-center justify-center border mb-4 shadow-sm overflow-hidden">
                {qrCodeUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qrCodeUrl} alt="QR Code" className="w-full h-full object-contain" />
                ) : (
                  <Loader2 className="w-12 h-12 animate-spin text-gray-400" />
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={copyTableUrl}>
                  <Copy className="w-4 h-4 mr-1" />
                  Copy Link
                </Button>
                <Button size="sm" variant="outline" onClick={() => qrCodeUrl && downloadQRCode()}>
                  <Download className="w-4 h-4 mr-1" />
                  Download QR
                </Button>
              </div>
            </div>

            {/* Table Info */}
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-sm text-admin-text-secondary">Nomor Meja</label>
                  <p className="font-bold text-lg">{selectedTable.tableNumber}</p>
                </div>
              </div>

              <div>
                <label className="text-sm text-admin-text-secondary">Table Token</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 bg-gray-100 px-3 py-2 rounded font-mono text-sm">
                    {selectedTable.qrToken}
                  </code>
                  <Button size="sm" variant="outline" onClick={copyTableToken}>
                    {copiedToken ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm text-admin-text-secondary">URL</label>
                <p className="text-sm text-admin-primary mt-1 break-all">
                  {config.appUrl}/m/{config.outletSlug}?token={selectedTable.qrToken}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setConfirmRegenerate({ open: true, table: selectedTable })}
                  disabled={selectedTable.orders && selectedTable.orders.length > 0}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate Token
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 text-red-500 border-red-200 hover:bg-red-50"
                  onClick={() => setConfirmDelete({ open: true, tableId: selectedTable.id, tableNumber: selectedTable.tableNumber })}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Hapus
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        open={confirmGenerate}
        onOpenChange={setConfirmGenerate}
        title="Tambah Meja Baru"
        description="Buat 1 meja baru dengan QR code?"
        confirmText="Buat"
        cancelText="Batal"
        variant="info"
        onConfirm={generateTables}
        loading={loadingAction}
      />

      <ConfirmDialog
        open={confirmDelete.open}
        onOpenChange={(open) => !open && setConfirmDelete({ open: false })}
        title="Hapus Meja"
        description={`Hapus Meja ${confirmDelete.tableNumber}? QR code tidak akan berfungsi.`}
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
        destructive
        onConfirm={handleDeleteTable}
        loading={loadingAction}
      />

      <ConfirmDialog
        open={confirmRegenerate.open}
        onOpenChange={(open) => !open && setConfirmRegenerate({ open: false })}
        title="Buat Ulang Token"
        description="Buat token baru? Token lama tidak akan berfungsi lagi."
        confirmText="Buat Ulang"
        cancelText="Batal"
        variant="warning"
        onConfirm={handleRegenerateToken}
        loading={loadingAction}
      />

      <ConfirmDialogComponent />
    </div>
  )
}

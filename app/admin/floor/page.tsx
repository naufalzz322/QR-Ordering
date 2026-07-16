'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { RefreshCw, Check, Loader2, ExternalLink, Table2, Circle, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { config } from '@/lib/config'
import { useToast } from '@/components/ui/toast'

interface TableOrder {
  id: string
  status: string
  totalAmount: string
  orderNumber: string
  createdAt: string
  notes: string | null
  items: { qty: number; menuItem: { name: string }; unitPrice: string; itemNotes?: string | null }[]
}

interface Table {
  id: string
  tableNumber: number
  qrToken: string
  status: 'EMPTY' | 'ACTIVE' | 'DONE'
  orders: TableOrder[]
}

interface Outlet {
  name: string
  slug: string
}

interface Stats {
  total: number
  empty: number
  active: number
  done: number
}

const statusConfig = {
  EMPTY: { label: 'Kosong', bg: 'bg-neutral-100', text: 'text-neutral-600', border: 'border-neutral-300', dot: 'bg-neutral-400' },
  ACTIVE: { label: 'Aktif', bg: 'bg-primary-100', text: 'text-primary-700', border: 'border-primary-400', dot: 'bg-primary-500' },
  DONE: { label: 'Selesai', bg: 'bg-success-50', text: 'text-success-700', border: 'border-success-400', dot: 'bg-success-500' },
}

export default function FloorMonitorPage() {
  const [tables, setTables] = useState<Table[]>([])
  const [outlet, setOutlet] = useState<Outlet | null>(null)
  const [stats, setStats] = useState<Stats>({ total: 0, empty: 0, active: 0, done: 0 })
  const [loading, setLoading] = useState(true)
  const [closingTable, setClosingTable] = useState<string | null>(null)
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null)
  const [cancellingOrder, setCancellingOrder] = useState(false)
  const toast = useToast()

  const fetchFloor = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/floor')
      const data = await res.json()

      if (res.ok) {
        setTables(data.tables || [])
        setStats(data.stats || {})
        setOutlet(data.outlet || null)
      }
    } catch (error) {
      console.error('Failed to fetch floor:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFloor()
    const interval = setInterval(fetchFloor, 30000)
    return () => clearInterval(interval)
  }, [])

  const closeTable = async (tableId: string) => {
    setClosingTable(tableId)

    try {
      const res = await fetch('/api/admin/floor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId }),
      })

      if (res.ok) {
        toast.success('Meja berhasil direset')
        fetchFloor()
      }
    } catch (error) {
      console.error('Failed to close table:', error)
      toast.error('Gagal reset meja')
    } finally {
      setClosingTable(null)
    }
  }

  const cancelOrder = async () => {
    if (!cancelOrderId) return
    setCancellingOrder(true)

    try {
      const res = await fetch(`/api/kitchen/order/${cancelOrderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      })

      if (res.ok) {
        toast.success('Pesanan berhasil dibatalkan')
        setCancelOrderId(null)
        fetchFloor()
      }
    } catch (error) {
      console.error('Failed to cancel order:', error)
      toast.error('Gagal membatalkan pesanan')
    } finally {
      setCancellingOrder(false)
    }
  }

  const getCancelOrderNumber = () => {
    if (!cancelOrderId || !selectedTable) return ''
    const order = selectedTable.orders.find(o => o.id === cancelOrderId)
    return order?.orderNumber || ''
  }

  const getStatusConfig = (status: string) => {
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.EMPTY
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-admin-text-primary">Floor Monitor</h1>
          <p className="text-admin-text-secondary">Pantau status semua meja real-time</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchFloor} disabled={loading}>
            <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
            Refresh
          </Button>
          <Link href={`/kitchen/${config.outletSlug}`} target="_blank">
            <Button variant="outline">
              <ExternalLink className="w-4 h-4 mr-2" />
              Kitchen Display
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-admin-text-secondary">Total Meja</p>
                <p className="text-2xl font-bold text-admin-text-primary">{stats.total}</p>
              </div>
              <Table2 className="w-6 h-6 text-primary-700" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-admin-text-secondary">Kosong</p>
                <p className="text-2xl font-bold text-neutral-600">{stats.empty}</p>
              </div>
              <Circle className="w-6 h-6 text-neutral-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-admin-text-secondary">Aktif</p>
                <p className="text-2xl font-bold text-primary-600">{stats.active}</p>
              </div>
              <div className="w-3 h-3 bg-primary-500 rounded-full" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-admin-text-secondary">Selesai</p>
                <p className="text-2xl font-bold text-success-600">{stats.done}</p>
              </div>
              <Check className="w-6 h-6 text-success-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Legend */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-6 justify-center">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-neutral-100 border border-neutral-300"></div>
              <span className="text-sm text-admin-text-secondary">Kosong - Siap digunakan</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-primary-100 border border-primary-400"></div>
              <span className="text-sm text-admin-text-secondary">Aktif - Ada order berjalan</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-success-50 border border-success-400"></div>
              <span className="text-sm text-admin-text-secondary">Selesai - Perlu dibersihkan</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Floor Grid */}
      {loading ? (
        <Card>
          <CardContent className="py-12 flex items-center justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-primary-700" />
          </CardContent>
        </Card>
      ) : tables.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-admin-text-secondary mb-4">Belum ada meja</p>
            <Link href="/admin/tables">
              <Button>Setup Meja</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Layout Lantai</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {tables.map((table) => {
                const status = getStatusConfig(table.status)

                return (
                  <div
                    key={table.id}
                    className={cn(
                      'relative rounded-xl p-4 border-2 transition-all cursor-pointer hover:shadow-lg',
                      status.bg,
                      status.border
                    )}
                    onClick={() => {
                      setSelectedTable(table)
                      setShowDetailModal(true)
                    }}
                  >
                    {/* Table Number */}
                    <div className="text-center">
                      <p className={cn('text-3xl font-black', status.text)}>
                        {table.tableNumber}
                      </p>
                      <p className={cn('text-xs font-medium mt-1 uppercase tracking-wide', status.text)}>
                        Meja
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div className="mt-3 text-center">
                      <span className={cn(
                        'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
                        status.bg,
                        status.text
                      )}>
                        <span className={cn('w-2 h-2 rounded-full', status.dot)} />
                        {status.label}
                      </span>
                    </div>

                    {/* Order Info */}
                    {table.orders.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-black/10">
                        <p className="text-xs text-center text-admin-text-secondary">
                          {table.orders.length} order aktif
                        </p>
                      </div>
                    )}

                    {/* Action Button */}
                    {table.status === 'DONE' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-3 w-full"
                        onClick={() => closeTable(table.id)}
                        disabled={closingTable === table.id}
                      >
                        {closingTable === table.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-1" />
                            Reset
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Aksi Cepat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/tables">
              <Button variant="outline">
                Setup Meja & QR
              </Button>
            </Link>
            <Link href="/admin/reports" target="_blank">
              <Button variant="outline">
                Lihat Laporan
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Table Detail Modal */}
      {showDetailModal && selectedTable && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowDetailModal(false)}>
          <div
            className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h2 className="text-lg font-bold">Meja {selectedTable.tableNumber}</h2>
                <p className="text-sm text-admin-text-secondary capitalize">
                  Status: {getStatusConfig(selectedTable.status).label}
                </p>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Orders */}
            <div className="p-4">
              {selectedTable.orders.length === 0 ? (
                <div className="text-center py-8">
                  <Table2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-admin-text-secondary">Tidak ada order di meja ini</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="font-medium">Order ({selectedTable.orders.length})</h3>
                  {selectedTable.orders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-bold">{order.orderNumber}</p>
                          <p className="text-xs text-admin-text-secondary">
                            {new Date(order.createdAt).toLocaleString('id-ID')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                            order.status === 'PENDING' && 'bg-yellow-100 text-yellow-700',
                            order.status === 'PROCESSING' && 'bg-blue-100 text-blue-700',
                            order.status === 'READY' && 'bg-green-100 text-green-700',
                            order.status === 'COMPLETED' && 'bg-gray-100 text-gray-700',
                            order.status === 'CANCELLED' && 'bg-red-100 text-red-700'
                          )}>
                            {order.status}
                          </span>
                          {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
                            <button
                              onClick={() => setCancelOrderId(order.id)}
                              className="p-1.5 hover:bg-red-50 rounded text-red-500"
                              title="Batalkan"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Order Notes */}
                      {order.notes && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-xs font-medium text-blue-700 mb-1">Catatan Pesanan:</p>
                          <p className="text-sm text-blue-800">{order.notes}</p>
                        </div>
                      )}

                      {/* Items */}
                      <div className="space-y-2 border-t pt-3">
                        {order.items.map((item, idx) => (
                          <div key={idx}>
                            <div className="flex justify-between text-sm">
                              <span className="text-admin-text-secondary">
                                {item.qty}x {item.menuItem.name}
                              </span>
                              <span className="font-medium">
                                Rp {(parseFloat(item.unitPrice) * item.qty).toLocaleString('id-ID')}
                              </span>
                            </div>
                            {item.itemNotes && (
                              <p className="text-xs text-yellow-600 italic mt-1 bg-yellow-50 px-2 py-1 rounded">
                                Catatan: {item.itemNotes}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Total */}
                      <div className="flex justify-between items-center mt-3 pt-3 border-t">
                        <span className="font-medium">Total</span>
                        <span className="font-bold text-primary-700">
                          Rp {(parseFloat(order.totalAmount)).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t">
              <Button className="w-full" onClick={() => setShowDetailModal(false)}>
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Confirmation */}
      <ConfirmDialog
        open={!!cancelOrderId}
        onOpenChange={(open) => !open && setCancelOrderId(null)}
        title="Batalkan Pesanan?"
        description={`Yakin ingin membatalkan pesanan ${getCancelOrderNumber()}?`}
        confirmText="Batal"
        cancelText="Tidak"
        variant="danger"
        destructive
        onConfirm={cancelOrder}
        loading={cancellingOrder}
      />
    </div>
  )
}

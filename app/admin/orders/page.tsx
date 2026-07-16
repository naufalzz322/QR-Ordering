'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RefreshCw, Check, Loader2, ExternalLink, ListOrdered, ChefHat, CheckCircle, XCircle, ClipboardList, Search, ChevronLeft, ChevronRight, Eye, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'
import { formatTime } from '@/lib/utils'
import Link from 'next/link'
import { config } from '@/lib/config'
import { useToast } from '@/components/ui/toast'

interface OrderItem {
  id: string
  qty: number
  unitPrice: string
  menuItem: {
    name: string
  }
}

interface Order {
  id: string
  orderNumber: string
  status: 'PENDING' | 'PROCESSING' | 'READY' | 'COMPLETED' | 'CANCELLED'
  totalAmount: string
  queuePosition: number | null
  createdAt: string
  table: {
    tableNumber: number
  }
  items: OrderItem[]
}

interface Stats {
  total: number
  pending: number
  processing: number
  ready: number
  completed: number
}

const statusConfig = {
  PENDING: { label: 'Baru', color: 'bg-error-100 text-error-700', border: 'border-error-200', icon: ListOrdered },
  PROCESSING: { label: 'Diproses', color: 'bg-warning-50 text-warning-700', border: 'border-warning-200', icon: ChefHat },
  READY: { label: 'Siap', color: 'bg-success-50 text-success-700', border: 'border-success-200', icon: CheckCircle },
  COMPLETED: { label: 'Selesai', color: 'bg-neutral-100 text-neutral-700', border: 'border-neutral-200', icon: CheckCircle },
  CANCELLED: { label: 'Batal', color: 'bg-error-100 text-error-700', border: 'border-error-200', icon: XCircle },
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, processing: 0, ready: 0, completed: 0 })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const toast = useToast()

  const LIMIT = 10

  const fetchOrders = useCallback(async (pageNum: number = 0) => {
    setLoading(true)
    try {
      const statusParam = filter === 'all' ? '' : `&status=${filter}`
      const searchParam = searchInput ? `&search=${encodeURIComponent(searchInput)}` : ''
      const res = await fetch(`/api/admin/orders?limit=${LIMIT}&page=${pageNum}${statusParam}${searchParam}`)
      const data = await res.json()

      if (res.ok) {
        setOrders(data.orders || [])
        setStats(data.stats || {})
        setTotalCount(data.total || 0)
        setPage(pageNum)
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }, [filter, searchInput])

  // Debounced search on type
  const handleSearchChange = (value: string) => {
    setSearchInput(value)

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      setPage(0)
    }, 300)
  }

  useEffect(() => {
    fetchOrders(0)
  }, [filter, searchInput])

  useEffect(() => {
    const interval = setInterval(() => fetchOrders(page), 30000)
    return () => clearInterval(interval)
  }, [filter, searchInput, page, fetchOrders])

  const getStatusIcon = (status: string) => {
    const Icon = statusConfig[status as keyof typeof statusConfig]?.icon || ClipboardList
    return <Icon className="w-4 h-4" />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-admin-text-primary">Orders</h1>
          <p className="text-admin-text-secondary">Kelola semua pesanan</p>
        </div>
        <Button variant="outline" onClick={() => fetchOrders(page)} disabled={loading}>
          <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter('all')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-admin-text-secondary">Total</p>
                <p className="text-2xl font-bold text-admin-text-primary">{stats.total}</p>
              </div>
              <ClipboardList className="w-6 h-6 text-primary-700" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn('cursor-pointer transition-shadow', filter === 'PENDING' && 'ring-2 ring-error-500')}
          onClick={() => setFilter('PENDING')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-admin-text-secondary">Baru</p>
                <p className="text-2xl font-bold text-error-600">{stats.pending}</p>
              </div>
              <ListOrdered className="w-6 h-6 text-error-600" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn('cursor-pointer transition-shadow', filter === 'PROCESSING' && 'ring-2 ring-warning-500')}
          onClick={() => setFilter('PROCESSING')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-admin-text-secondary">Diproses</p>
                <p className="text-2xl font-bold text-warning-600">{stats.processing}</p>
              </div>
              <ChefHat className="w-6 h-6 text-warning-600" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn('cursor-pointer transition-shadow', filter === 'READY' && 'ring-2 ring-success-500')}
          onClick={() => setFilter('READY')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-admin-text-secondary">Siap</p>
                <p className="text-2xl font-bold text-success-600">{stats.ready}</p>
              </div>
              <CheckCircle className="w-6 h-6 text-success-600" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn('cursor-pointer transition-shadow', filter === 'COMPLETED' && 'ring-2 ring-neutral-500')}
          onClick={() => setFilter('COMPLETED')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-admin-text-secondary">Selesai</p>
                <p className="text-2xl font-bold text-neutral-600">{stats.completed}</p>
              </div>
              <Check className="w-6 h-6 text-neutral-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'PENDING', 'PROCESSING', 'READY', 'COMPLETED'].map((status) => (
          <Button
            key={status}
            variant={filter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(status)}
            className={cn(
              filter === status && 'bg-primary-700 hover:bg-primary-800'
            )}
          >
            {status === 'all' ? 'Semua' : statusConfig[status as keyof typeof statusConfig]?.label}
          </Button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-text-secondary" />
          <Input
            placeholder="Cari nomor order..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Daftar Orders ({totalCount})</CardTitle>
            {totalCount > LIMIT && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchOrders(page - 1)}
                  disabled={page === 0 || loading}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-admin-text-secondary px-2">
                  {page * LIMIT + 1}-{Math.min((page + 1) * LIMIT, totalCount)} dari {totalCount}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchOrders(page + 1)}
                  disabled={(page + 1) * LIMIT >= totalCount || loading}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-primary-700" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-admin-text-secondary">
              Tidak ada order dengan status ini
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const statusInfo = statusConfig[order.status as keyof typeof statusConfig]
                const StatusIcon = statusInfo?.icon || ClipboardList

                return (
                  <div
                    key={order.id}
                    className={cn(
                      'border rounded-lg p-4 hover:bg-neutral-50 transition-colors',
                      statusInfo.border
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-bold text-admin-text-primary">{order.orderNumber}</p>
                        <p className="text-sm text-admin-text-secondary">
                          Meja {order.table.tableNumber} - {formatTime(order.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary-700">
                          {formatCurrency(parseFloat(order.totalAmount))}
                        </p>
                        <span className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                          statusInfo.color
                        )}>
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.label}
                        </span>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-1 mb-3 pl-4 border-l-2 border-neutral-200">
                      {order.items.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-admin-text-secondary">
                            {item.qty}x {item.menuItem.name}
                          </span>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <p className="text-xs text-admin-text-secondary">
                          +{order.items.length - 3} item lainnya
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-neutral-200">
                      <div className="flex items-center gap-4">
                        {order.queuePosition && (
                          <span className="text-xs text-admin-text-secondary">
                            #{order.queuePosition} di antrean
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedOrder(order)
                            setShowDetailModal(true)
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Detail
                        </Button>
                        <Link href={`/kitchen/${config.outletSlug}`} target="_blank">
                          <Button size="sm" variant="outline">
                            <ExternalLink className="w-4 h-4 mr-1" />
                            Kitchen
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Modal */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowDetailModal(false)}>
          <div
            className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h2 className="text-lg font-bold">{selectedOrder.orderNumber}</h2>
                <p className="text-sm text-admin-text-secondary">
                  Meja {selectedOrder.table.tableNumber} - {new Date(selectedOrder.createdAt).toLocaleString('id-ID')}
                </p>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Order Info */}
            <div className="p-4 space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-admin-text-secondary">Status</span>
                {(() => {
                  const statusInfo = statusConfig[selectedOrder.status as keyof typeof statusConfig]
                  return (
                    <span className={cn(
                      'inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium',
                      statusInfo.color
                    )}>
                      <statusInfo.icon className="w-4 h-4" />
                      {statusInfo.label}
                    </span>
                  )
                })()}
              </div>

              {/* Total */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-admin-text-secondary">Total</span>
                <span className="font-bold text-lg text-primary-700">
                  {formatCurrency(parseFloat(selectedOrder.totalAmount))}
                </span>
              </div>

              {/* Queue Position */}
              {selectedOrder.queuePosition && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-admin-text-secondary">Posisi Antrean</span>
                  <span className="font-medium">#{selectedOrder.queuePosition}</span>
                </div>
              )}

              {/* Items */}
              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">Item Pesanan</h3>
                <div className="space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{item.qty}x {item.menuItem.name}</p>
                      </div>
                      <p className="font-medium">
                        {formatCurrency(parseFloat(item.unitPrice) * item.qty)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
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
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Clock, ChefHat, Check, Package, RefreshCw, Volume2, VolumeX, Loader2, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ToastProvider, Toaster, useToast } from '@/components/ui/toast'

interface Outlet {
  name: string
  slug: string
}

interface OrderItem {
  id: string
  qty: number
  itemNotes: string | null
  menuItem: {
    name: string
  }
}

interface Order {
  id: string
  orderNumber: string
  status: 'PENDING' | 'PROCESSING' | 'READY' | 'COMPLETED' | 'CANCELLED'
  notes: string | null
  items: OrderItem[]
  table: {
    tableNumber: number
  }
  queuePosition: number | null
  estimatedDoneAt: string | null
  createdAt: string
  processedAt: string | null
}

function KitchenContent() {
  const params = useParams()
  const outletSlug = params.outletSlug as string
  const toast = useToast()

  const [outlet, setOutlet] = useState<Outlet | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null)

  // Confirmation dialog state
  const [confirmAction, setConfirmAction] = useState<{
    open: boolean
    order?: Order
    action?: 'start' | 'finish' | 'cancel'
  }>({ open: false })

  // Processing timers: stores the timestamp when each order started processing
  const [processingTimers, setProcessingTimers] = useState<Record<string, number>>({})

  // Tick every second to update processing timers
  const [, setTick] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  // Initialize timers when orders are fetched
  useEffect(() => {
    setProcessingTimers(prev => {
      const updated = { ...prev }
      orders.forEach(order => {
        if (order.status === 'PROCESSING' && order.processedAt && !(order.id in updated)) {
          updated[order.id] = new Date(order.processedAt).getTime()
        }
      })
      return Object.keys(updated).length !== Object.keys(prev).length ? updated : prev
    })
  }, [orders])

  // Use ref to track previous orders
  const ordersRef = useRef<Order[]>([])

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`/api/kitchen/orders?outlet=${outletSlug}`)
      const data = await res.json()

      if (res.ok) {
        const currentOrders = ordersRef.current
        const newOrderCount = data.orders.filter(
          (o: Order) => o.status === 'PENDING' && !currentOrders.find(prev => prev.id === o.id)
        ).length

        // Play sound for new PENDING orders
        if (newOrderCount > 0 && soundEnabled) {
          playNotificationSound()
        }

        ordersRef.current = data.orders
        setOrders(data.orders)
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }, [outletSlug, soundEnabled])

  useEffect(() => {
    const fetchOutlet = async () => {
      try {
        const res = await fetch(`/api/public/menu/${outletSlug}`)
        const data = await res.json()
        if (res.ok && data.outlet) {
          setOutlet(data.outlet)
        }
      } catch (error) {
        console.error('Failed to fetch outlet:', error)
      }
    }

    fetchOutlet()
    fetchOrders()

    // Poll every 5 seconds (reduced from 3s to reduce API load)
    const interval = setInterval(fetchOrders, 5000)
    return () => clearInterval(interval)
  }, [fetchOrders, outletSlug])

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 880
      oscillator.type = 'sine'
      gainNode.gain.value = 0.3

      oscillator.start()

      setTimeout(() => { gainNode.gain.value = 0 }, 200)
      setTimeout(() => { gainNode.gain.value = 0.3 }, 400)
      setTimeout(() => { gainNode.gain.value = 0 }, 600)
      setTimeout(() => { gainNode.gain.value = 0.3 }, 800)
      setTimeout(() => {
        gainNode.gain.value = 0
        oscillator.stop()
        audioContext.close()
      }, 1000)
    } catch (e) {
      console.log('Audio not supported')
    }
  }

  const updateOrderStatus = async (orderId: string, status: string) => {
    setUpdatingOrder(orderId)
    try {
      const res = await fetch(`/api/kitchen/order/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (res.ok) {
        fetchOrders()
      }
    } catch (error) {
      console.error('Failed to update order:', error)
    } finally {
      setUpdatingOrder(null)
      setConfirmAction({ open: false })
    }
  }

  const handleConfirmAction = () => {
    if (!confirmAction.order || !confirmAction.action) return
    const statusMap = {
      start: 'PROCESSING',
      finish: 'READY',
      cancel: 'CANCELLED',
    }
    updateOrderStatus(confirmAction.order.id, statusMap[confirmAction.action])
  }

  const getConfirmConfig = () => {
    if (!confirmAction.order) return { title: '', description: '', confirmText: '', variant: 'info' as const }
    const tableNumber = confirmAction.order.table.tableNumber
    switch (confirmAction.action) {
      case 'start':
        return {
          title: 'Mulai Proses?',
          description: `Mulai proses pesanan untuk Meja ${tableNumber}?`,
          confirmText: 'Mulai',
          variant: 'warning' as const,
        }
      case 'finish':
        return {
          title: 'Tandai Siap?',
          description: `Pesanan Meja ${tableNumber} siap diambil?`,
          confirmText: 'Ya, Siap',
          variant: 'success' as const,
        }
      case 'cancel':
        return {
          title: 'Batalkan Pesanan?',
          description: `Batalkan pesanan Meja ${tableNumber}?`,
          confirmText: 'Ya, Batalkan',
          variant: 'danger' as const,
          destructive: true,
        }
      default:
        return { title: '', description: '', confirmText: '', variant: 'info' as const }
    }
  }

  const getOrderAge = (createdAt: string) => {
    const minutes = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000)
    return minutes
  }

  const getAgeColor = (minutes: number) => {
    if (minutes < 5) return 'text-white'
    if (minutes < 10) return 'text-yellow-300'
    return 'text-red-300'
  }

  const formatTimer = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getCardStyle = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'order-card-new'
      case 'PROCESSING':
        return 'order-card-processing'
      case 'READY':
        return 'order-card-ready'
      default:
        return 'bg-gray-700'
    }
  }

  const getBorderStyle = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'border-l-red-500'
      case 'PROCESSING':
        return 'border-l-amber-500'
      case 'READY':
        return 'border-l-green-500'
      default:
        return 'border-l-gray-500'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { text: 'BARU', color: 'bg-red-600', pulse: true }
      case 'PROCESSING':
        return { text: 'PROSES', color: 'bg-amber-600', pulse: false }
      case 'READY':
        return { text: 'SIAP', color: 'bg-green-600', pulse: false }
      default:
        return { text: status, color: 'bg-gray-600', pulse: false }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen kitchen-bg flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-white mx-auto mb-4" />
          <p className="text-gray-400">Memuat pesanan...</p>
        </div>
      </div>
    )
  }

  const pendingOrders = orders.filter(o => o.status === 'PENDING')
  const processingOrders = orders.filter(o => o.status === 'PROCESSING')
  const readyOrders = orders.filter(o => o.status === 'READY')

  return (
    <div className="min-h-screen kitchen-bg">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-white">Kitchen Display</h1>
            {outlet && (
              <>
                <span className="text-gray-400">|</span>
                <span className="text-lg text-orange-400 font-medium">{outlet.name}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-400" />
              <span className="text-white font-medium">
                {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled)
                if (!soundEnabled) {
                  playNotificationSound()
                }
              }}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              title={soundEnabled ? 'Matikan suara' : 'Nyalakan suara'}
            >
              {soundEnabled ? (
                <Volume2 className="w-6 h-6 text-green-400" />
              ) : (
                <VolumeX className="w-6 h-6 text-gray-500" />
              )}
            </button>
            <button
              onClick={fetchOrders}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <RefreshCw className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-3">
        <div className="flex items-center gap-8 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Total:</span>
            <span className="text-white font-bold text-lg">{orders.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-full"></span>
            <span className="text-red-400">Baru: <span className="font-bold">{pendingOrders.length}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-amber-500 rounded-full"></span>
            <span className="text-amber-400">Proses: <span className="font-bold">{processingOrders.length}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            <span className="text-green-400">Siap: <span className="font-bold">{readyOrders.length}</span></span>
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="p-6">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96">
            <ChefHat className="w-24 h-24 text-gray-600 mb-4" />
            <h2 className="text-2xl font-medium text-gray-400 mb-2">Belum Ada Pesanan</h2>
            <p className="text-gray-500">Pesanan baru akan muncul di sini</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {orders.map((order) => {
              const statusInfo = getStatusLabel(order.status)

              return (
                <div
                  key={order.id}
                  className={cn(
                    'rounded-lg overflow-hidden shadow-lg border-l-4 transition-all duration-300',
                    getCardStyle(order.status),
                    getBorderStyle(order.status)
                  )}
                >
                  {/* Card Header */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-4xl font-black text-white">
                          {order.table.tableNumber}
                        </h3>
                        <p className="text-gray-300 text-sm font-medium">MEJA</p>
                      </div>
                      <div className="text-right">
                        <span className={cn(
                          'px-3 py-1 rounded text-xs font-bold text-white',
                          statusInfo.color,
                          statusInfo.pulse && 'animate-pulse'
                        )}>
                          {statusInfo.text}
                        </span>
                        <p className="text-gray-400 text-xs mt-1">{order.orderNumber}</p>
                      </div>
                    </div>

                    {/* Estimate & Processing Timer */}
                    <div className="flex items-center justify-between text-sm mb-3 py-2 border-t border-white/10">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-300" />
                        <span className="text-gray-300 font-medium">
                          Est: {order.estimatedDoneAt
                            ? Math.max(0, Math.round((new Date(order.estimatedDoneAt).getTime() - new Date(order.createdAt).getTime()) / 60000)) + ' min'
                            : '-'}
                        </span>
                      </div>
                      {order.status === 'PROCESSING' && processingTimers[order.id] && (
                        <div className="flex items-center gap-2 bg-white/20 rounded px-2 py-1">
                          <ChefHat className="w-4 h-4 text-amber-300" />
                          <span className="text-amber-300 font-bold tabular-nums">
                            {formatTimer(Date.now() - processingTimers[order.id])}
                          </span>
                        </div>
                      )}
                      {order.queuePosition && order.status === 'PENDING' && (
                        <span className="px-2 py-0.5 bg-white/20 rounded text-xs text-white">
                          #{order.queuePosition}
                        </span>
                      )}
                    </div>

                    {/* Order Notes */}
                    {order.notes && (
                      <div className="mb-3 p-2 bg-blue-900/50 border border-blue-500/50 rounded">
                        <p className="text-blue-300 text-xs font-medium">Catatan:</p>
                        <p className="text-blue-200 text-sm">{order.notes}</p>
                      </div>
                    )}

                    {/* Items */}
                    <div className="space-y-2 mb-4">
                      {order.items.map((item) => (
                        <div key={item.id} className="bg-black/20 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <span className="text-2xl font-black text-white">{item.qty}x</span>
                            <div>
                              <p className="text-white font-bold text-lg leading-tight">{item.menuItem.name}</p>
                              {item.itemNotes && (
                                <p className="text-amber-300 text-sm font-medium italic mt-1 flex items-center gap-1">
                                  <AlertTriangle className="w-4 h-4" />
                                  {item.itemNotes}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-white/10 space-y-2">
                      {order.status === 'PENDING' && (
                        <>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => setConfirmAction({ open: true, order, action: 'cancel' })}
                              disabled={updatingOrder === order.id}
                              variant="outline"
                              className="flex-1 border-red-500 text-red-400 hover:bg-red-900/30 font-bold text-lg py-5"
                            >
                              {updatingOrder === order.id ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                'BATAL'
                              )}
                            </Button>
                            <Button
                              onClick={() => setConfirmAction({ open: true, order, action: 'start' })}
                              disabled={updatingOrder === order.id}
                              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-lg py-5"
                            >
                              {updatingOrder === order.id ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                <>
                                  <ChefHat className="w-5 h-5 mr-2" />
                                  MULAI
                                </>
                              )}
                            </Button>
                          </div>
                        </>
                      )}
                      {order.status === 'PROCESSING' && (
                        <Button
                          onClick={() => setConfirmAction({ open: true, order, action: 'finish' })}
                          disabled={updatingOrder === order.id}
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-lg py-6"
                        >
                          {updatingOrder === order.id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <>
                              <Check className="w-5 h-5 mr-2" />
                              SELESAI
                            </>
                          )}
                        </Button>
                      )}
                      {order.status === 'READY' && (
                        <Button
                          onClick={() => updateOrderStatus(order.id, 'COMPLETED')}
                          disabled={updatingOrder === order.id}
                          variant="outline"
                          className="w-full border-2 border-green-500 text-green-400 hover:bg-green-900/30 font-bold text-lg py-6"
                        >
                          {updatingOrder === order.id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <>
                              <Package className="w-5 h-5 mr-2" />
                              SELESAIKAN
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmAction.open}
        onOpenChange={(open) => !open && setConfirmAction({ open: false })}
        title={getConfirmConfig().title}
        description={getConfirmConfig().description}
        confirmText={getConfirmConfig().confirmText}
        cancelText="Batal"
        variant={getConfirmConfig().variant}
        destructive={getConfirmConfig().destructive}
        onConfirm={handleConfirmAction}
        loading={!!updatingOrder}
      />
      <Toaster />
    </div>
  )
}

export default function KitchenPage() {
  return (
    <ToastProvider>
      <KitchenContent />
    </ToastProvider>
  )
}

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Clock, ChefHat, Check, Package, RefreshCw, Volume2, VolumeX, Loader2, AlertTriangle, Sun, Moon, UtensilsCrossed } from 'lucide-react'
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
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

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

  const formatTimer = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getCardStyles = (status: string) => {
    const base = theme === 'dark'
      ? 'bg-gray-800/80 border-white/10'
      : 'bg-white border-neutral-200'

    switch (status) {
      case 'PENDING':
        return cn(base, 'border-l-4 border-l-red-500')
      case 'PROCESSING':
        return cn(base, 'border-l-4 border-l-amber-500')
      case 'READY':
        return cn(base, 'border-l-4 border-l-green-500')
      default:
        return cn(base, 'border-l-4 border-l-neutral-400')
    }
  }

  const getTableBadgeStyle = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-red-100 text-red-700'
      case 'PROCESSING':
        return 'bg-amber-100 text-amber-700'
      case 'READY':
        return 'bg-green-100 text-green-700'
      default:
        return 'bg-neutral-100 text-neutral-700'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { text: 'BARU', color: 'bg-red-500 text-white', pulse: true }
      case 'PROCESSING':
        return { text: 'PROSES', color: 'bg-amber-500 text-white', pulse: false }
      case 'READY':
        return { text: 'SIAP', color: 'bg-green-500 text-white', pulse: false }
      default:
        return { text: status, color: 'bg-neutral-500 text-white', pulse: false }
    }
  }

  const getItemBg = (status: string) => {
    return theme === 'dark' ? 'bg-black/20' : 'bg-neutral-50'
  }

  const getTextColor = (variant: 'primary' | 'secondary' | 'muted') => {
    switch (variant) {
      case 'primary':
        return theme === 'dark' ? 'text-white' : 'text-admin-text-primary'
      case 'secondary':
        return theme === 'dark' ? 'text-gray-300' : 'text-admin-text-secondary'
      case 'muted':
        return theme === 'dark' ? 'text-gray-500' : 'text-neutral-400'
      default:
        return theme === 'dark' ? 'text-white' : 'text-admin-text-primary'
    }
  }

  if (loading) {
    return (
      <div className={cn(
        'min-h-screen flex items-center justify-center transition-colors',
        theme === 'dark' ? 'bg-gray-900' : 'bg-neutral-100'
      )}>
        <div className="text-center">
          <RefreshCw className={cn(
            'w-12 h-12 animate-spin mx-auto mb-4',
            theme === 'dark' ? 'text-white' : 'text-admin-primary'
          )} />
          <p className={getTextColor('muted')}>Memuat pesanan...</p>
        </div>
      </div>
    )
  }

  const pendingOrders = orders.filter(o => o.status === 'PENDING')
  const processingOrders = orders.filter(o => o.status === 'PROCESSING')
  const readyOrders = orders.filter(o => o.status === 'READY')

  return (
    <div className={cn(
      'min-h-screen transition-colors',
      theme === 'dark' ? 'bg-gray-900' : 'bg-neutral-100'
    )}>
      {/* Header */}
      <header className={cn(
        'border-b px-6 py-4 transition-colors',
        theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-neutral-200'
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center',
              theme === 'dark' ? 'bg-orange-600' : 'bg-primary-600'
            )}>
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className={cn('text-xl font-bold', getTextColor('primary'))}>Kitchen Display</h1>
              {outlet && (
                <p className={cn('text-sm', theme === 'dark' ? 'text-orange-400' : 'text-primary-600')}>
                  {outlet.name}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg',
              theme === 'dark' ? 'bg-gray-800' : 'bg-neutral-100'
            )}>
              <Clock className={cn('w-4 h-4', getTextColor('muted'))} />
              <span className={cn('font-medium tabular-nums', getTextColor('primary'))}>
                {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={cn(
                'p-2 rounded-lg transition-colors',
                theme === 'dark' ? 'hover:bg-gray-800 text-gray-400 hover:text-white' : 'hover:bg-neutral-100 text-neutral-500 hover:text-admin-text-primary'
              )}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled)
                if (!soundEnabled) {
                  playNotificationSound()
                }
              }}
              className={cn(
                'p-2 rounded-lg transition-colors',
                theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-neutral-100'
              )}
              title={soundEnabled ? 'Matikan suara' : 'Nyalakan suara'}
            >
              {soundEnabled ? (
                <Volume2 className={cn('w-5 h-5', theme === 'dark' ? 'text-green-400' : 'text-green-600')} />
              ) : (
                <VolumeX className={cn('w-5 h-5', getTextColor('muted'))} />
              )}
            </button>
            <button
              onClick={fetchOrders}
              className={cn(
                'p-2 rounded-lg transition-colors',
                theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-neutral-100'
              )}
            >
              <RefreshCw className={cn('w-5 h-5', getTextColor('primary'))} />
            </button>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className={cn(
        'border-b px-6 py-3 transition-colors',
        theme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-white/50 border-neutral-200'
      )}>
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className={getTextColor('muted')}>Total:</span>
            <span className={cn('font-bold text-lg', getTextColor('primary'))}>{orders.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
            <span className={getTextColor('muted')}>Baru: <span className={cn('font-bold', theme === 'dark' ? 'text-red-400' : 'text-red-600')}>{pendingOrders.length}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span>
            <span className={getTextColor('muted')}>Proses: <span className={cn('font-bold', theme === 'dark' ? 'text-amber-400' : 'text-amber-600')}>{processingOrders.length}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-green-500 rounded-full"></span>
            <span className={getTextColor('muted')}>Siap: <span className={cn('font-bold', theme === 'dark' ? 'text-green-400' : 'text-green-600')}>{readyOrders.length}</span></span>
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="p-6">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96">
            <div className={cn(
              'w-24 h-24 rounded-2xl flex items-center justify-center mb-4',
              theme === 'dark' ? 'bg-gray-800' : 'bg-neutral-200'
            )}>
              <ChefHat className={cn('w-12 h-12', getTextColor('muted'))} />
            </div>
            <h2 className={cn('text-2xl font-medium mb-2', getTextColor('secondary'))}>Belum Ada Pesanan</h2>
            <p className={getTextColor('muted')}>Pesanan baru akan muncul di sini</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {orders.map((order) => {
              const statusInfo = getStatusBadge(order.status)

              return (
                <div
                  key={order.id}
                  className={cn(
                    'rounded-xl overflow-hidden shadow-lg border transition-all hover:shadow-xl',
                    getCardStyles(order.status)
                  )}
                >
                  {/* Card Header */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className={cn(
                        'w-16 h-16 rounded-xl flex flex-col items-center justify-center',
                        getTableBadgeStyle(order.status)
                      )}>
                        <span className="text-2xl font-black">{order.table.tableNumber}</span>
                      </div>
                      <div className="text-right">
                        <span className={cn(
                          'px-3 py-1 rounded-full text-xs font-bold',
                          statusInfo.color,
                          statusInfo.pulse && 'animate-pulse'
                        )}>
                          {statusInfo.text}
                        </span>
                        <p className={cn('text-xs mt-1', getTextColor('muted'))}>{order.orderNumber}</p>
                      </div>
                    </div>

                    {/* Processing Timer */}
                    {order.status === 'PROCESSING' && processingTimers[order.id] && (
                      <div className={cn(
                        'flex items-center justify-center gap-2 mb-4 p-2 rounded-lg',
                        theme === 'dark' ? 'bg-amber-900/30' : 'bg-amber-50'
                      )}>
                        <ChefHat className={cn('w-5 h-5', theme === 'dark' ? 'text-amber-400' : 'text-amber-600')} />
                        <span className={cn(
                          'font-bold text-xl tabular-nums',
                          theme === 'dark' ? 'text-amber-400' : 'text-amber-700'
                        )}>
                          {formatTimer(Date.now() - processingTimers[order.id])}
                        </span>
                      </div>
                    )}

                    {/* Queue Position */}
                    {order.queuePosition && order.status === 'PENDING' && (
                      <div className={cn(
                        'inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium mb-4',
                        theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-neutral-100 text-neutral-600'
                      )}>
                        <span className={getTextColor('muted')}>Posisi antrian:</span>
                        <span className={cn('font-bold', getTextColor('primary'))}>#{order.queuePosition}</span>
                      </div>
                    )}

                    {/* Order Notes */}
                    {order.notes && (
                      <div className={cn(
                        'mb-4 p-3 rounded-lg border',
                        theme === 'dark' ? 'bg-blue-900/30 border-blue-700/50' : 'bg-blue-50 border-blue-200'
                      )}>
                        <p className={cn(
                          'text-xs font-medium flex items-center gap-1',
                          theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                        )}>
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Catatan:
                        </p>
                        <p className={cn('text-sm mt-1', theme === 'dark' ? 'text-blue-200' : 'text-blue-800')}>
                          {order.notes}
                        </p>
                      </div>
                    )}

                    {/* Items */}
                    <div className="space-y-2 mb-4">
                      {order.items.map((item) => (
                        <div key={item.id} className={cn('rounded-lg p-3', getItemBg(order.status))}>
                          <div className="flex items-start gap-3">
                            <span className={cn(
                              'text-2xl font-black min-w-[40px]',
                              theme === 'dark' ? 'text-white' : 'text-admin-text-primary'
                            )}>
                              {item.qty}x
                            </span>
                            <div>
                              <p className={cn(
                                'font-bold text-lg leading-tight',
                                theme === 'dark' ? 'text-white' : 'text-admin-text-primary'
                              )}>
                                {item.menuItem.name}
                              </p>
                              {item.itemNotes && (
                                <p className={cn(
                                  'text-sm font-medium italic mt-1 flex items-center gap-1',
                                  theme === 'dark' ? 'text-amber-400' : 'text-amber-600'
                                )}>
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  {item.itemNotes}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="space-y-2">
                      {order.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => setConfirmAction({ open: true, order, action: 'cancel' })}
                            disabled={updatingOrder === order.id}
                            variant="outline"
                            className={cn(
                              'flex-1 font-bold text-base py-5',
                              theme === 'dark'
                                ? 'border-red-500/50 text-red-400 hover:bg-red-900/30'
                                : 'border-red-300 text-red-600 hover:bg-red-50'
                            )}
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
                            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-base py-5"
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
                      )}
                      {order.status === 'PROCESSING' && (
                        <Button
                          onClick={() => setConfirmAction({ open: true, order, action: 'finish' })}
                          disabled={updatingOrder === order.id}
                          className="w-full bg-green-500 hover:bg-green-600 text-white font-bold text-base py-5"
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
                          className={cn(
                            'w-full font-bold text-base py-5',
                            theme === 'dark'
                              ? 'border-2 border-green-500 text-green-400 hover:bg-green-900/30'
                              : 'border-2 border-green-400 text-green-600 hover:bg-green-50'
                          )}
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

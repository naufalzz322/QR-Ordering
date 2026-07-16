'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useParams } from 'next/navigation'
import { CheckCircle, Clock, ArrowLeft, Loader2, Plus, AlertTriangle, Lightbulb, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useCartStore } from '@/stores/cartStore'
import { cn } from '@/lib/utils'

interface Order {
  id: string
  orderNumber: string
  status: 'PENDING' | 'PROCESSING' | 'READY' | 'COMPLETED' | 'CANCELLED'
  estimatedDoneAt: string | null
  createdAt: string
  processedAt: string | null
}

interface Estimate {
  queuePosition: number
  estimatedWaitMinutes: number
  isImmediately: boolean
}

function OrderSuccessContent() {
  const params = useParams()
  const outletSlug = params.outletSlug as string
  const searchParams = useSearchParams()

  const orderId = searchParams.get('orderId')

  const { clearCart, setOrderInfo } = useCartStore()
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0)
  const [initialized, setInitialized] = useState(false)
  const [order, setOrder] = useState<Order | null>(null)
  const [estimate, setEstimate] = useState<Estimate | null>(null)
  const [loading, setLoading] = useState(true)
  const [polling, setPolling] = useState(false)

  // Fetch order status from API
  const fetchOrderStatus = async () => {
    if (!orderId) return
    try {
      const res = await fetch(`/api/public/order/${orderId}/status`)
      const data = await res.json()
      if (res.ok && data.order) {
        setOrder(data.order)
        setEstimate(data.estimate)
        // Update cart store with live data
        setOrderInfo({
          id: data.order.id,
          orderNumber: data.order.orderNumber,
          queuePosition: data.estimate.queuePosition,
          estimatedMinutes: data.estimate.estimatedWaitMinutes,
          status: data.order.status,
          createdAt: data.order.createdAt,
        })
      }
    } catch (error) {
      console.error('Failed to fetch order status:', error)
    } finally {
      setLoading(false)
      setPolling(false)
    }
  }

  // Save order info to store and clear cart on mount
  useEffect(() => {
    if (orderId && !initialized) {
      setInitialized(true)

      // Save initial order info to store
      setOrderInfo({
        id: orderId,
        orderNumber: orderId,
        queuePosition: 0,
        estimatedMinutes: 0,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      })

      // Clear cart since order was placed
      clearCart()

      // Fetch real-time status
      fetchOrderStatus()
    }
  }, [orderId, setOrderInfo, clearCart, initialized])

  // Set up polling for real-time updates
  useEffect(() => {
    if (!orderId) return

    // Poll every 3 seconds for faster status updates
    const interval = setInterval(() => {
      setPolling(true)
      fetchOrderStatus()
    }, 3000)

    return () => clearInterval(interval)
  }, [orderId])

  // Initialize elapsed timer when order is PROCESSING
  useEffect(() => {
    if (order && order.status === 'PROCESSING' && order.processedAt) {
      // Calculate elapsed time from processedAt
      const elapsed = Math.floor((Date.now() - new Date(order.processedAt).getTime()) / 1000)
      setElapsedSeconds(Math.max(0, elapsed))
    } else if (order && order.status !== 'PROCESSING') {
      // Reset elapsed when not processing
      setElapsedSeconds(0)
    }
  }, [order])

  // Timer tick - increments elapsed every second
  useEffect(() => {
    if (order?.status !== 'PROCESSING') return

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [order?.status])

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!orderId) {
    return (
      <div className="min-h-screen bg-guest-bg flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-guest-text-muted mb-4">Order tidak ditemukan</p>
          <Link href={`/m/${outletSlug}`}>
            <Button className="bg-guest-primary hover:bg-guest-primary-hover text-white">
              Kembali ke Menu
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const waitMinutes = estimate?.estimatedWaitMinutes ?? 0
  const queuePosition = estimate?.queuePosition ?? 0

  return (
    <div className="min-h-screen bg-guest-bg pb-8">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="px-4 py-4 flex items-center gap-4">
          <Link href={`/m/${outletSlug}`} className="p-2 -ml-2 hover:bg-neutral-100 rounded-full">
            <ArrowLeft className="w-5 h-5 text-guest-text" />
          </Link>
          <h1 className="text-lg font-bold text-guest-text">Pesanan Terkirim!</h1>
          {polling && (
            <RefreshCw className="w-5 h-5 animate-spin text-guest-text-muted ml-auto" />
          )}
        </div>
      </header>

      <div className="max-w-lg mx-auto p-4">
        {/* Success Animation */}
        <div className="text-center mb-8 pt-8">
          <div className="w-24 h-24 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <CheckCircle className="w-12 h-12 text-success-600" />
          </div>
          <h1 className="text-2xl font-bold text-guest-text mb-2">Pembayaran Berhasil!</h1>
          <p className="text-guest-text-muted">
            Pesanan Anda sedang diproses di dapur
          </p>
        </div>

        {/* Order Info Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <div className="text-center mb-6">
            <p className="text-sm text-guest-text-muted mb-1">Nomor Pesanan</p>
            <p className="text-2xl font-bold text-guest-primary">{orderId}</p>
          </div>

          {/* Pending/Queue Status - Show when PENDING */}
          {order?.status === 'PENDING' && estimate && (
            <div className="bg-warning-50 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="w-6 h-6 text-warning-600" />
                <div>
                  <p className="font-bold text-warning-700">Menunggu di Antrean</p>
                  <p className="text-sm text-warning-600">
                    Pesanan Anda: #{queuePosition}
                  </p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-warning-700">
                  ~+/- {waitMinutes} menit
                </p>
                <p className="text-sm text-warning-600 mt-1">estimasi menunggu</p>
              </div>
              {waitMinutes > 20 && (
                <p className="text-sm text-warning-600 mt-2 text-center flex items-center justify-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  Mohon maaf, antrean sedang panjang
                </p>
              )}
            </div>
          )}

          {/* Processing Time - Show when PROCESSING */}
          {order?.status === 'PROCESSING' && (
            <div className="bg-guest-bg rounded-xl p-6 mb-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Original estimate */}
                <div className="text-center p-3 bg-white rounded-lg">
                  <p className="text-xs text-guest-text-muted mb-1">Estimasi</p>
                  <p className="text-2xl font-bold text-guest-primary">
                    ~{waitMinutes} min
                  </p>
                </div>
                {/* Elapsed since processing started */}
                <div className="text-center p-3 bg-warning-50 rounded-lg">
                  <p className="text-xs text-warning-600 mb-1">Diproses</p>
                  <p className="text-2xl font-bold text-warning-600 tabular-nums">
                    {formatCountdown(elapsedSeconds)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Ready Status */}
          {order?.status === 'READY' && (
            <div className="bg-success-50 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-success-600" />
                <div>
                  <p className="font-bold text-success-700">Pesanan Siap!</p>
                  <p className="text-sm text-success-600">Silakan ambil di counter</p>
                </div>
              </div>
            </div>
          )}

          {/* Payment Status */}
          <div className="flex items-center justify-center gap-2 text-success-600 mb-4">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Pembayaran berhasil</span>
          </div>

          {/* Instructions */}
          <div className="text-center text-sm text-guest-text-muted">
            <p>Pantau status pesanan Anda di halaman ini</p>
            <p>Kami akan kabari saat pesanan siap</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8">
          <Link href={`/m/${outletSlug}/status/${orderId}`} className="block mb-4">
            <Button className="w-full bg-guest-primary hover:bg-guest-primary-hover text-white py-6 text-base font-medium">
              Pantau Status Pesanan
            </Button>
          </Link>

          <Link href={`/m/${outletSlug}`} className="block">
            <Button
              variant="outline"
              className="w-full py-6 text-base font-medium border-2 border-guest-primary text-guest-primary hover:bg-guest-bg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Pesan Lagi
            </Button>
          </Link>
        </div>

        {/* Tips */}
        <div className="mt-12 p-4 bg-primary-50 rounded-xl border border-primary-100">
          <h3 className="font-semibold text-primary-700 mb-2 flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Tips
          </h3>
          <ul className="text-sm text-primary-600 space-y-1">
            <li>Pesanan sudah dibayar dan sedang diproses</li>
            <li>Siapkan nomor pesanan saat mengambil</li>
            <li>Pantau status pesanan di halaman ini</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-guest-bg flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-guest-primary" />
        </div>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  )
}

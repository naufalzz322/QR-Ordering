'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Clock, CheckCircle, ChefHat, Package, RefreshCw, AlertCircle, AlertTriangle, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { config } from '@/lib/config'

interface OrderItem {
  id: string
  qty: number
  unitPrice: string
  itemNotes: string | null
  menuItem: {
    name: string
  }
}

interface Order {
  id: string
  orderNumber: string
  status: 'PENDING' | 'PROCESSING' | 'READY' | 'COMPLETED' | 'CANCELLED'
  items: OrderItem[]
  table: {
    tableNumber: number
  }
  queuePosition: number | null
  estimatedDoneAt: string | null
  createdAt: string
  processedAt: string | null
}

interface Estimate {
  queuePosition: number
  estimatedWaitMinutes: number
  isImmediately: boolean
}

const statusSteps = [
  { key: 'PENDING', label: 'Diterima', icon: CheckCircle },
  { key: 'PROCESSING', label: 'Diproses', icon: ChefHat },
  { key: 'READY', label: 'Siap', icon: Package },
  { key: 'COMPLETED', label: 'Selesai', icon: CheckCircle },
]

const statusOrder = ['PENDING', 'PROCESSING', 'READY', 'COMPLETED']

export default function OrderStatusPage() {
  const params = useParams()
  const orderId = params.orderId as string

  const [order, setOrder] = useState<Order | null>(null)
  const [estimate, setEstimate] = useState<Estimate | null>(null)
  const [loading, setLoading] = useState(true)
  const [polling, setPolling] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0)
  const [confirming, setConfirming] = useState(false)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/public/order/${orderId}/status`)
      const data = await res.json()

      if (res.ok) {
        setOrder(data.order)
        // Only update estimate, don't reset countdown
        setEstimate(data.estimate)
      }
    } catch (error) {
      console.error('Failed to fetch order status:', error)
    } finally {
      setLoading(false)
      setPolling(false)
    }
  }, [orderId])

  useEffect(() => {
    fetchStatus()

    // Poll every 3 seconds for faster status updates
    const interval = setInterval(() => {
      setPolling(true)
      fetchStatus()
    }, 3000)

    return () => clearInterval(interval)
  }, [fetchStatus])

  // Initialize elapsed timer when order is PROCESSING
  useEffect(() => {
    if (order && order.status === 'PROCESSING' && order.processedAt) {
      // Set elapsed time from processedAt
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

  const getCurrentStepIndex = () => {
    if (!order) return -1
    return statusOrder.indexOf(order.status)
  }

  const confirmPickup = async () => {
    if (!orderId) return
    setConfirming(true)
    try {
      const res = await fetch(`/api/public/order/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      })

      if (res.ok) {
        // Refresh status to show updated state
        fetchStatus()
      }
    } catch (error) {
      console.error('Failed to confirm pickup:', error)
    } finally {
      setConfirming(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-guest-bg flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-10 h-10 animate-spin text-guest-primary mx-auto mb-4" />
          <p className="text-guest-text-muted">Memuat status pesanan...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-guest-bg flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-guest-text mb-2">Pesanan Tidak Ditemukan</h2>
          <p className="text-guest-text-muted mb-6">
            Nomor pesanan tidak valid atau sudah tidak aktif
          </p>
          <Link href={`/m/${params.outletSlug || config.outletSlug}`}>
            <Button className="bg-guest-primary hover:bg-guest-primary-hover text-white">
              Kembali ke Menu
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-guest-bg pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="px-4 py-4 flex items-center gap-4">
          <Link href={`/m/${params.outletSlug || config.outletSlug}`} className="p-2 -ml-2 hover:bg-neutral-100 rounded-full">
            <ArrowLeft className="w-5 h-5 text-guest-text" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-guest-text">Status Pesanan</h1>
            <p className="text-sm text-guest-text-muted">Meja {order.table.tableNumber}</p>
          </div>
          {polling && (
            <RefreshCw className="w-5 h-5 animate-spin text-guest-text-muted" />
          )}
        </div>
      </header>

      <div className="max-w-lg mx-auto p-4">
        {/* Order Number Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6 text-center">
          <p className="text-sm text-guest-text-muted mb-1">Nomor Pesanan</p>
          <p className="text-3xl font-bold text-guest-primary">{order.orderNumber}</p>
        </div>

        {/* Status Stepper */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <div className="relative">
            {/* Progress Line Background */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 w-3/4 h-0.5 bg-neutral-200">
              <div
                className="h-full bg-success-500 transition-all duration-700 ease-out"
                style={{
                  width: `${Math.max(0, (getCurrentStepIndex() / (statusOrder.length - 1)) * 100)}%`,
                }}
              />
            </div>

            {/* Steps */}
            <div className="relative flex justify-between">
              {statusSteps.map((step, index) => {
                const isCompleted = index < getCurrentStepIndex()
                const isCurrent = index === getCurrentStepIndex()
                const Icon = step.icon

                return (
                  <div key={step.key} className="flex flex-col items-center z-10">
                    <div
                      className={cn(
                        'w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm',
                        isCompleted
                          ? 'bg-success-500 text-white'
                          : isCurrent
                          ? 'bg-guest-primary text-white ring-4 ring-primary-100'
                          : 'bg-neutral-200 text-neutral-400'
                      )}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <p
                      className={cn(
                        'text-xs mt-2 font-medium text-center',
                        isCompleted ? 'text-success-600' : isCurrent ? 'text-guest-primary' : 'text-neutral-400'
                      )}
                    >
                      {step.label}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Current Status Banner */}
        <div className={cn(
          'rounded-xl p-4 mb-6',
          order.status === 'PENDING' && 'bg-error-50 border border-error-200',
          order.status === 'PROCESSING' && 'bg-warning-50 border border-warning-200',
          order.status === 'READY' && 'bg-success-50 border border-success-200',
          order.status === 'COMPLETED' && 'bg-neutral-50 border border-neutral-200',
        )}>
          <div className="flex items-center gap-3">
            {order.status === 'PENDING' && <Clock className="w-6 h-6 text-error-600" />}
            {order.status === 'PROCESSING' && <ChefHat className="w-6 h-6 text-warning-600" />}
            {order.status === 'READY' && <Package className="w-6 h-6 text-success-600" />}
            {order.status === 'COMPLETED' && <CheckCircle className="w-6 h-6 text-neutral-500" />}

            <div>
              <p className={cn(
                'font-bold text-lg',
                order.status === 'PENDING' && 'text-error-700',
                order.status === 'PROCESSING' && 'text-warning-700',
                order.status === 'READY' && 'text-success-700',
                order.status === 'COMPLETED' && 'text-neutral-700',
              )}>
                {order.status === 'PENDING' && 'Pesanan Diterima'}
                {order.status === 'PROCESSING' && 'Sedang Diproses'}
                {order.status === 'READY' && 'Pesanan Siap!'}
                {order.status === 'COMPLETED' && 'Selesai'}
              </p>
              <p className="text-sm text-guest-text-muted">
                {order.status === 'PENDING' && 'Menunggu diproses oleh dapur'}
                {order.status === 'PROCESSING' && 'Dapur sedang menyiapkan pesanan'}
                {order.status === 'READY' && 'Silakan ambil pesanan di counter'}
                {order.status === 'COMPLETED' && 'Terima kasih!'}
              </p>
            </div>
          </div>
        </div>

        {/* Wait Estimate Card - Only show when PENDING (waiting in queue) */}
        {order.status === 'PENDING' && estimate && (
          <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-warning-100 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-warning-600" />
              </div>
              <div>
                <p className="text-sm text-guest-text-muted">Estimasi Menunggu</p>
                <p className="text-2xl font-bold text-warning-600">
                  ~+/- {estimate.estimatedWaitMinutes} menit
                </p>
              </div>
            </div>

            {estimate.queuePosition && estimate.queuePosition > 1 && (
              <p className="text-sm text-guest-text-muted text-center mt-2">
                Pesanan Anda: #{estimate.queuePosition} di antrean
              </p>
            )}

            {estimate.estimatedWaitMinutes > 20 && (
              <p className="text-sm text-warning-600 mt-2 text-center flex items-center justify-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                Mohon maaf, antrean sedang panjang
              </p>
            )}
          </div>
        )}

        {/* Processing Time - Show when PROCESSING */}
        {order.status === 'PROCESSING' && (
          <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
            <div className="grid grid-cols-2 gap-4">
              {/* Original estimate */}
              <div className="text-center p-3 bg-guest-bg rounded-lg">
                <p className="text-xs text-guest-text-muted mb-1">Estimasi</p>
                <p className="text-2xl font-bold text-guest-primary">
                  ~{estimate?.estimatedWaitMinutes ?? 0} min
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

        {/* Order Items */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="font-semibold text-guest-text mb-4">Pesanan Anda:</h2>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between items-start py-2 border-b border-neutral-100 last:border-0">
                <div>
                  <p className="font-medium text-guest-text">
                    {item.qty}x {item.menuItem.name}
                  </p>
                  {item.itemNotes && (
                    <p className="text-sm text-warning-600 italic">
                      Note: {item.itemNotes}
                    </p>
                  )}
                </div>
                <p className="text-guest-text font-medium">
                  {formatCurrency(parseFloat(item.unitPrice) * item.qty)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      {order.status === 'COMPLETED' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
          <div className="max-w-lg mx-auto">
            <Link href={`/m/${params.outletSlug || config.outletSlug}`} className="block">
              <Button className="w-full bg-guest-primary hover:bg-guest-primary-hover text-white py-6">
                Pesan Lagi
              </Button>
            </Link>
          </div>
        </div>
      )}

      {order.status === 'READY' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
          <div className="max-w-lg mx-auto flex gap-3">
            <Link href={`/m/${params.outletSlug || config.outletSlug}`} className="flex-1">
              <Button variant="outline" className="w-full py-6">
                Pesan Lagi
              </Button>
            </Link>
            <Button
              onClick={confirmPickup}
              disabled={confirming}
              className="flex-1 bg-success-600 hover:bg-success-700 text-white py-6"
            >
              {confirming ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                'Konfirmasi Ambil'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/stores/cartStore'

export function OrderTrackerFloatingButton() {
  const router = useRouter()
  const { orderInfo, outletSlug, setOrderInfo } = useCartStore()
  const [polling, setPolling] = useState(false)

  // Poll for real-time updates
  useEffect(() => {
    if (!orderInfo || orderInfo.status === 'COMPLETED' || orderInfo.status === 'CANCELLED') {
      return
    }

    const fetchOrderStatus = async () => {
      if (!orderInfo.orderNumber || !outletSlug) return

      try {
        const res = await fetch(`/api/public/order/${orderInfo.orderNumber}/status`)
        const data = await res.json()

        if (res.ok && data.order && data.estimate) {
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
        setPolling(false)
      }
    }

    // Initial fetch
    fetchOrderStatus()

    // Poll every 3 seconds
    const interval = setInterval(() => {
      setPolling(true)
      fetchOrderStatus()
    }, 3000)

    return () => clearInterval(interval)
  }, [orderInfo?.orderNumber, outletSlug, setOrderInfo])

  // Only show when there's an active order and not completed/cancelled
  if (!orderInfo || orderInfo.status === 'COMPLETED' || orderInfo.status === 'CANCELLED') {
    return null
  }

  const handleClick = () => {
    if (outletSlug && orderInfo) {
      router.push(`/m/${outletSlug}/status/${orderInfo.id}`)
    }
  }

  const getStatusColor = () => {
    switch (orderInfo.status) {
      case 'READY':
        return 'border-success-500 bg-success-50'
      case 'PROCESSING':
        return 'border-primary-500 bg-primary-50'
      case 'PENDING':
      default:
        return 'border-warning-500 bg-warning-50'
    }
  }

  const getStatusIcon = () => {
    switch (orderInfo.status) {
      case 'READY':
        return (
          <svg className="w-5 h-5 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )
      case 'PROCESSING':
        return (
          <svg className="w-5 h-5 text-primary-600 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        )
      case 'PENDING':
      default:
        return (
          <svg className="w-5 h-5 text-warning-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
    }
  }

  return (
    <button
      onClick={handleClick}
      className={`
        fixed bottom-24 right-4 z-50
        bg-white rounded-2xl shadow-xl
        border-2 ${getStatusColor()}
        px-4 py-3 flex items-center gap-3
        hover:shadow-2xl transition-all active:scale-95
        max-w-xs
        animate-float-pulse
      `}
      style={{
        animation: 'floatPulse 2s ease-in-out infinite',
      }}
    >
      {/* Animated border glow effect */}
      <div className="absolute inset-0 rounded-2xl animate-pulse-overlay pointer-events-none" />

      {/* Status Icon with glow */}
      <div className="relative">
        <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-md">
          {getStatusIcon()}
        </div>
        {/* Heartbeat indicator dot */}
        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-warning-500 rounded-full animate-ping" />
        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-warning-500 rounded-full" />
      </div>

      {/* Order Info */}
      <div className="text-left flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-warning-600 uppercase">
            {orderInfo.status === 'READY' ? 'Siap!' : 'Pesanan Aktif'}
          </span>
        </div>
        <p className="text-sm font-bold text-gray-900 truncate">
          #{orderInfo.orderNumber.split('-').pop()}
        </p>
        <p className="text-xs text-gray-500">
          {orderInfo.status === 'READY'
            ? 'Ambil di kasir'
            : `Queue #${orderInfo.queuePosition} • ~${orderInfo.estimatedMinutes} min`
          }
        </p>
      </div>

      {/* Arrow indicator */}
      <div className="flex-shrink-0">
        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>

      <style jsx>{`
        @keyframes floatPulse {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }

        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }

        .animate-ping {
          animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
    </button>
  )
}

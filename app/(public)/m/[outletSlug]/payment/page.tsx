'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, CreditCard, Smartphone, CheckCircle, Loader2, QrCode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useCartStore } from '@/stores/cartStore'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { OrderTrackerFloatingButton } from '@/components/OrderTrackerFloatingButton'

type PaymentMethod = 'cash' | 'qris'

export default function PaymentPage() {
  const params = useParams()
  const router = useRouter()
  const outletSlug = params.outletSlug as string

  const { items, getTotal, tableToken, setOrderId, clearCart, orderNotes } = useCartStore()

  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null)
  const [processing, setProcessing] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  const total = getTotal()

  // Handle QRIS mockup
  useEffect(() => {
    if (showQR && selectedPayment === 'qris') {
      const timer = setTimeout(() => {
        handlePaymentConfirm()
      }, 5000) // Simulate payment completion after 5 seconds
      return () => clearTimeout(timer)
    }
  }, [showQR, selectedPayment])

  const handlePaymentSelect = (method: PaymentMethod) => {
    setSelectedPayment(method)
  }

  const handleProceedToQR = () => {
    if (!selectedPayment) return
    setShowQR(true)
  }

  const handlePaymentConfirm = async () => {
    // If no orderId, create the order first
    if (items.length === 0 || !tableToken) {
      router.push(`/m/${outletSlug}`)
      return
    }

    setProcessing(true)

    try {
      // Create the order
      const res = await fetch('/api/public/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({
            menuItemId: item.menuItemId,
            variantId: item.variantId,
            qty: item.qty,
            itemNotes: item.itemNotes,
          })),
          tableToken,
          notes: orderNotes,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create order')
      }

      // Set order ID in cart store
      setOrderId(data.order.orderNumber)

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1000))

      setPaymentSuccess(true)

      // Redirect to success page after showing success
      setTimeout(() => {
        router.push(`/m/${outletSlug}/success?orderId=${data.order.orderNumber}&queue=${data.estimate.queuePosition}&wait=${data.estimate.estimatedWaitMinutes}`)
      }, 2000)
    } catch (err) {
      console.error('Payment error:', err)
      setProcessing(false)
    }
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen guest-bg flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-guest-text mb-2">Pembayaran Berhasil!</h1>
          <p className="text-guest-text-muted">Mengalihkan ke halaman pesanan...</p>
          <Loader2 className="w-6 h-6 animate-spin text-guest-primary mx-auto mt-4" />
        </div>
      </div>
    )
  }

  if (showQR && selectedPayment === 'qris') {
    return (
      <div className="min-h-screen guest-bg pb-32">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-40">
          <div className="px-4 py-4 flex items-center gap-4">
            <button
              onClick={() => setShowQR(false)}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="w-5 h-5 text-guest-text" />
            </button>
            <h1 className="text-lg font-bold text-guest-text">Scan QR Code</h1>
          </div>
        </header>

        <div className="max-w-lg mx-auto p-4">
          {/* QR Code Display */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-64 h-64 bg-white border-2 border-gray-200 rounded-xl mx-auto flex items-center justify-center mb-4">
                  {/* Mock QR Code */}
                  <div className="relative">
                    <QrCode className="w-48 h-48 text-gray-800" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-white rounded-lg border-4 border-orange-500 flex items-center justify-center">
                        <span className="text-xs font-bold text-orange-500">QRIS</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="animate-pulse">
                  <p className="text-guest-text-muted mb-2">Memindai QR Code...</p>
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-guest-primary" />
                    <span className="text-sm text-guest-text">Menunggu pembayaran</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Amount */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-guest-text-muted mb-1">Total Pembayaran</p>
                <p className="text-3xl font-bold text-guest-primary">{formatCurrency(total)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-blue-50 rounded-xl">
            <h3 className="font-semibold text-blue-800 mb-2">Cara Bayar:</h3>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>Buka aplikasi mobile banking atau e-wallet Anda</li>
              <li>Pilih menu Scan QR / QRIS</li>
              <li>Scan QR Code di atas</li>
              <li>Masukkan nominal pembayaran</li>
              <li>Konfirmasi dan selesaikan pembayaran</li>
            </ol>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen guest-bg pb-32">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="px-4 py-4 flex items-center gap-4">
          <Link href={`/m/${outletSlug}/checkout`} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5 text-guest-text" />
          </Link>
          <h1 className="text-lg font-bold text-guest-text">Pilih Metode Pembayaran</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto p-4">
        {/* Order Summary */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <h2 className="font-semibold text-guest-text mb-4">Ringkasan Pesanan</h2>
            <div className="space-y-3 mb-4">
              {items.slice(0, 3).map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-guest-text-muted">
                    {item.qty}x {item.name}
                  </span>
                  <span className="text-guest-text font-medium">
                    {formatCurrency((item.basePrice + item.additionalPrice) * item.qty)}
                  </span>
                </div>
              ))}
              {items.length > 3 && (
                <p className="text-sm text-guest-text-muted">
                  +{items.length - 3} item lainnya
                </p>
              )}
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between">
                <span className="text-lg font-semibold text-guest-text">Total</span>
                <span className="text-2xl font-bold text-guest-primary">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <h2 className="font-semibold text-guest-text mb-4">Metode Pembayaran</h2>
        <div className="space-y-4">
          {/* Cash */}
          <Card
            className={cn(
              'cursor-pointer transition-all',
              selectedPayment === 'cash' && 'ring-2 ring-guest-primary bg-orange-50'
            )}
            onClick={() => handlePaymentSelect('cash')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={cn(
                  'w-14 h-14 rounded-xl flex items-center justify-center',
                  selectedPayment === 'cash' ? 'bg-guest-primary text-white' : 'bg-gray-100 text-gray-600'
                )}>
                  <CreditCard className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-guest-text">Tunai</h3>
                  <p className="text-sm text-guest-text-muted">Bayar di kasir</p>
                </div>
                <div className={cn(
                  'w-6 h-6 rounded-full border-2 flex items-center justify-center',
                  selectedPayment === 'cash' ? 'border-guest-primary bg-guest-primary' : 'border-gray-300'
                )}>
                  {selectedPayment === 'cash' && (
                    <CheckCircle className="w-4 h-4 text-white" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* QRIS */}
          <Card
            className={cn(
              'cursor-pointer transition-all',
              selectedPayment === 'qris' && 'ring-2 ring-guest-primary bg-orange-50'
            )}
            onClick={() => handlePaymentSelect('qris')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={cn(
                  'w-14 h-14 rounded-xl flex items-center justify-center',
                  selectedPayment === 'qris' ? 'bg-guest-primary text-white' : 'bg-gray-100 text-gray-600'
                )}>
                  <QrCode className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-guest-text">QRIS</h3>
                  <p className="text-sm text-guest-text-muted">Scan dengan mobile banking / e-wallet</p>
                </div>
                <div className={cn(
                  'w-6 h-6 rounded-full border-2 flex items-center justify-center',
                  selectedPayment === 'qris' ? 'border-guest-primary bg-guest-primary' : 'border-gray-300'
                )}>
                  {selectedPayment === 'qris' && (
                    <CheckCircle className="w-4 h-4 text-white" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Supported Apps */}
        <div className="mt-6 p-4 bg-gray-50 rounded-xl">
          <p className="text-sm text-guest-text-muted mb-3">Didukung oleh:</p>
          <div className="flex flex-wrap gap-2">
            {['GoPay', 'OVO', 'DANA', 'ShopeePay', 'BCA', 'Mandiri', 'BRI', 'BNI'].map((app) => (
              <span
                key={app}
                className="px-3 py-1 bg-white rounded-full text-xs font-medium text-gray-600 border"
              >
                {app}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <div className="max-w-lg mx-auto">
          <Button
            onClick={() => {
              if (selectedPayment === 'cash') {
                handlePaymentConfirm()
              } else if (selectedPayment === 'qris') {
                handleProceedToQR()
              }
            }}
            disabled={!selectedPayment || processing}
            className="w-full bg-guest-primary hover:bg-guest-primary-hover text-white text-lg py-6"
          >
            {processing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Memproses...
              </>
            ) : selectedPayment === 'qris' ? (
              'Lanjutkan ke Pembayaran'
            ) : selectedPayment === 'cash' ? (
              'Konfirmasi Pesanan'
            ) : (
              'Pilih Metode Pembayaran'
            )}
          </Button>
          <p className="text-center text-xs text-guest-text-muted mt-2">
            {selectedPayment === 'cash' && 'Silakan bayar di kasir setelah pesanan siap'}
            {selectedPayment === 'qris' && 'Anda akan diarahkan ke halaman pembayaran QRIS'}
          </p>
        </div>
      </div>

      {/* Floating Order Tracker Button */}
      <OrderTrackerFloatingButton />
    </div>
  )
}

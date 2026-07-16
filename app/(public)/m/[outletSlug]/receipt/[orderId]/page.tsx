'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Printer, Download, Loader2, ArrowLeft } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { config } from '@/lib/config'
import Link from 'next/link'

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
  status: string
  totalAmount: string
  createdAt: string
  items: OrderItem[]
  table: {
    tableNumber: number
  }
  outlet: {
    name: string
    address: string | null
  }
}

export default function ReceiptPage() {
  const params = useParams()
  const outletSlug = params.outletSlug as string
  const orderId = params.orderId as string

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        // Try to get order by orderNumber or by ID
        const res = await fetch(`/api/public/order/${orderId}/status`)
        const data = await res.json()

        if (res.ok && data.order) {
          // Fetch outlet info separately
          const outletRes = await fetch(`/api/public/menu/${outletSlug}`)
          const outletData = await outletRes.json()

          setOrder({
            ...data.order,
            outlet: outletData.outlet || { name: 'Warung Nusantara', address: null },
          })
        } else {
          // Create mock order for demo
          setOrder({
            id: 'demo',
            orderNumber: orderId,
            status: 'COMPLETED',
            totalAmount: '75000',
            createdAt: new Date().toISOString(),
            items: [
              { id: '1', qty: 1, unitPrice: '25000', itemNotes: null, menuItem: { name: 'Americano' } },
              { id: '2', qty: 1, unitPrice: '28000', itemNotes: 'kurang gula', menuItem: { name: 'Kopi Susu Gula Aren' } },
              { id: '3', qty: 1, unitPrice: '22000', itemNotes: null, menuItem: { name: 'Roti Bakar Coklat Keju' } },
            ],
            table: { tableNumber: 5 },
            outlet: { name: 'Warung Nusantara', address: 'Jl. Soekarno Hatta No. 123' },
          })
        }
      } catch (err) {
        setError('Gagal memuat struk')
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderId, outletSlug])

  const handlePrint = () => {
    window.print()
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{error || 'Order tidak ditemukan'}</p>
          <Link href={`/m/${config.outletSlug}`}>
            <Button>Kembali ke Menu</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header - hidden when printing */}
      <header className="bg-white shadow-sm sticky top-0 z-10 not-print">
        <div className="px-4 py-4 flex items-center gap-4">
          <Link href={`/m/${outletSlug}`} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold">Struk Pesanan</h1>
        </div>
      </header>

      {/* Receipt Content */}
      <div className="max-w-md mx-auto p-4">
        <Card className="receipt-card">
          <CardContent className="p-6">
            {/* Header */}
            <div className="text-center border-b pb-4 mb-4">
              <h2 className="text-xl font-bold">{order.outlet.name}</h2>
              {order.outlet.address && (
                <p className="text-sm text-gray-500">{order.outlet.address}</p>
              )}
            </div>

            {/* Order Info */}
            <div className="border-b pb-4 mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">No. Pesanan</span>
                <span className="font-bold">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Meja</span>
                <span>{order.table.tableNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tanggal</span>
                <span>{formatDate(order.createdAt)}</span>
              </div>
            </div>

            {/* Items */}
            <div className="border-b pb-4 mb-4">
              <h3 className="font-semibold mb-2">Item Pesanan</h3>
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="text-sm">
                    <div className="flex justify-between">
                      <span>
                        {item.qty}x {item.menuItem.name}
                      </span>
                      <span className="font-medium">
                        {formatCurrency(parseFloat(item.unitPrice) * item.qty)}
                      </span>
                    </div>
                    {item.itemNotes && (
                      <p className="text-gray-500 text-xs pl-4">- {item.itemNotes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="mb-4">
              <div className="flex justify-between text-lg font-bold">
                <span>TOTAL</span>
                <span className="text-orange-600">
                  {formatCurrency(parseFloat(order.totalAmount))}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-sm text-gray-500 border-t pt-4">
              <p>Terima kasih atas kunjungan Anda</p>
              <p className="mt-1">Silakan tunjukkan struk ini saat mengambil pesanan</p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons - hidden when printing */}
        <div className="flex gap-3 mt-4 not-print">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handlePrint}
          >
            <Printer className="w-4 h-4 mr-2" />
            Cetak
          </Button>
          <Link href={`/m/${outletSlug}`} className="flex-1">
            <Button className="w-full">
              Pesan Lagi
            </Button>
          </Link>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .receipt-card,
          .receipt-card * {
            visibility: visible;
          }
          .receipt-card {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            box-shadow: none;
          }
          .not-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}

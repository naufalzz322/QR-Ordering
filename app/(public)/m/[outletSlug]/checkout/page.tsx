'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Minus, Plus, X, ShoppingCart, Loader2, UtensilsCrossed } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useCartStore } from '@/stores/cartStore'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { OrderTrackerFloatingButton } from '@/components/OrderTrackerFloatingButton'
import Image from 'next/image'

interface Table {
  id: string
  tableNumber: number
  qrToken: string
  activeOrders: number
}

export default function CheckoutPage() {
  const params = useParams()
  const router = useRouter()
  const outletSlug = params.outletSlug as string

  const { items, getTotal, updateQty, removeItem, tableNumber, tableToken, setTableNumber, setTableInfo, orderNotes, setOrderNotes } = useCartStore()

  const [tables, setTables] = useState<Table[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [showTableSelector, setShowTableSelector] = useState(false)
  const [pendingTable, setPendingTable] = useState<Table | null>(null)

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const res = await fetch(`/api/public/tables?outlet=${outletSlug}`)
        const data = await res.json()
        if (res.ok && data.tables) {
          // Map tables with active orders count
          const tablesWithStatus: Table[] = data.tables.map((table: { id: string; tableNumber: number; qrToken: string; _count?: { orders: number } }) => ({
            id: table.id,
            tableNumber: table.tableNumber,
            qrToken: table.qrToken,
            activeOrders: table._count?.orders || 0,
          }))
          setTables(tablesWithStatus)

          // Auto-select table if token exists in cart
          if (tableToken && !tableNumber) {
            const matchedTable = tablesWithStatus.find((t: Table) => t.qrToken === tableToken)
            if (matchedTable) {
              setTableNumber(matchedTable.tableNumber)
              setTableInfo(outletSlug, matchedTable.qrToken, matchedTable.tableNumber)
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch tables:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchTables()
  }, [outletSlug, tableToken, tableNumber, setTableNumber, setTableInfo])

  const handleTableSelect = (table: Table) => {
    // If table has active orders, show confirmation
    if (table.activeOrders > 0) {
      setPendingTable(table)
    } else {
      confirmTableSelect(table)
    }
  }

  const confirmTableSelect = (table: Table) => {
    setTableNumber(table.tableNumber)
    setTableInfo(outletSlug, table.qrToken, table.tableNumber)
    setShowTableSelector(false)
    setPendingTable(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-guest-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-guest-primary" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-guest-bg flex items-center justify-center p-4">
        <div className="text-center">
          <ShoppingCart className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-guest-text mb-2">Keranjang Kosong</h2>
          <p className="text-guest-text-muted mb-6">Pilih menu favorit Anda dulu</p>
          <Link href={`/m/${outletSlug}`}>
            <Button className="bg-guest-primary hover:bg-guest-primary-hover text-white">
              Lihat Menu
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-guest-bg pb-32">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="px-4 py-4 flex items-center gap-4">
          <Link href={`/m/${outletSlug}`} className="p-2 -ml-2 hover:bg-neutral-100 rounded-full">
            <ArrowLeft className="w-5 h-5 text-guest-text" />
          </Link>
          <h1 className="text-lg font-bold text-guest-text">Checkout</h1>
          {tableNumber ? (
            <button
              onClick={() => setShowTableSelector(true)}
              className="ml-auto flex items-center gap-2 px-3 py-1 bg-guest-primary/10 rounded-full text-sm text-guest-primary hover:bg-guest-primary/20 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              Meja {tableNumber}
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          ) : (
            <button
              onClick={() => setShowTableSelector(true)}
              className="ml-auto px-3 py-1 bg-guest-primary text-white text-sm rounded-full"
            >
              Pilih Meja
            </button>
          )}
        </div>
      </header>

      {/* Cart Items */}
      <div className="p-4 space-y-4">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex gap-4">
              {/* Image */}
              <div className="w-20 h-20 bg-neutral-100 rounded-lg flex-shrink-0 overflow-hidden">
                {item.photoUrl ? (
                  <Image
                    src={item.photoUrl}
                    alt={item.name}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <UtensilsCrossed className="w-8 h-8 text-neutral-300" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-guest-text">{item.name}</h3>
                {item.variantName && (
                  <p className="text-sm text-guest-text-muted">{item.variantName}</p>
                )}
                <p className="text-guest-primary font-bold mt-1">
                  {formatCurrency((item.basePrice + item.additionalPrice) * item.qty)}
                </p>
              </div>

              {/* Quantity controls */}
              <div className="flex flex-col items-end justify-between">
                <button
                  onClick={() => removeItem(item.id)}
                  className="p-1 hover:bg-neutral-100 rounded text-guest-text-muted"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2 bg-guest-bg rounded-full px-2 py-1">
                  <button
                    onClick={() => {
                      if (item.qty > 1) {
                        updateQty(item.id, item.qty - 1)
                      } else {
                        removeItem(item.id)
                      }
                    }}
                    className="p-1 hover:bg-neutral-200 rounded-full"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-semibold w-6 text-center">{item.qty}</span>
                  <button
                    onClick={() => updateQty(item.id, item.qty + 1)}
                    className="p-1 hover:bg-neutral-200 rounded-full"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Item notes */}
            {item.itemNotes && (
              <div className="mt-3 pt-3 border-t border-neutral-100">
                <p className="text-sm text-guest-text-muted italic">
                  Catatan: {item.itemNotes}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Order Notes */}
      <div className="px-4">
        <label className="text-sm font-medium text-guest-text mb-2 block">
          Catatan Pesanan (opsional)
        </label>
        <Textarea
          value={orderNotes}
          onChange={(e) => setOrderNotes(e.target.value)}
          placeholder="Contoh: allergi kacang, meja outdoor..."
          className="bg-white"
          rows={2}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-error-50 border border-error-200 rounded-lg text-error-600 text-sm">
          {error}
        </div>
      )}

      {/* Bottom Summary */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 p-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <span className="text-guest-text-muted">Total</span>
            <span className="text-2xl font-bold text-guest-primary">
              {formatCurrency(getTotal())}
            </span>
          </div>

          <Button
            onClick={() => router.push(`/m/${outletSlug}/payment`)}
            disabled={!tableNumber}
            className={cn(
              'w-full text-lg py-6',
              tableNumber
                ? 'bg-guest-primary hover:bg-guest-primary-hover text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            )}
          >
            {tableNumber ? 'Lanjut ke Pembayaran' : 'Pilih Meja Dulu'}
          </Button>

          {tableNumber && (
            <p className="text-center text-xs text-guest-text-muted mt-2">
              Pesanan akan diantar ke Meja {tableNumber}
            </p>
          )}
        </div>
      </div>

      {/* Table Selector Modal */}
      {showTableSelector && (
        <div className="fixed inset-0 z-[80] bg-black/50 flex items-end sm:items-center sm:justify-center" onClick={() => tableNumber && setShowTableSelector(false)}>
          <div
            className="bg-white w-full max-h-[70vh] sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-lg font-bold">Pilih Meja</h2>
              {tableNumber && (
                <button onClick={() => setShowTableSelector(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <p className="text-sm text-guest-text-muted mb-3">
                Pilih nomor meja untuk pengantaran pesanan
              </p>

              {/* Status Legend */}
              <div className="flex items-center gap-4 mb-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-success-500 border-2 border-success-500"></div>
                  <span className="text-guest-text-muted">Tersedia</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-neutral-300 border-2 border-neutral-300"></div>
                  <span className="text-guest-text-muted">Sedang digunakan</span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {tables.map((table) => {
                  const isOccupied = table.activeOrders > 0
                  const isSelected = tableNumber === table.tableNumber
                  return (
                    <button
                      key={table.id}
                      onClick={() => handleTableSelect(table)}
                      className={cn(
                        'relative py-3 px-2 rounded-xl text-center font-semibold transition-all',
                        isSelected
                          ? 'bg-guest-primary text-white ring-2 ring-guest-primary ring-offset-2'
                          : isOccupied
                          ? 'bg-neutral-100 text-neutral-400 border-2 border-neutral-200 cursor-pointer hover:border-neutral-300'
                          : 'bg-success-50 text-guest-text border-2 border-success-200 hover:border-success-400'
                      )}
                    >
                      {table.tableNumber}
                      {isOccupied && !isSelected && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-neutral-400 rounded-full"></span>
                      )}
                      {!isOccupied && !isSelected && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-success-500 rounded-full"></span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Occupied Table Confirmation Dialog */}
      {pendingTable && (
        <div className="fixed inset-0 z-[90] bg-black/60 flex items-center justify-center p-4" onClick={() => setPendingTable(null)}>
          <div
            className="bg-white w-full max-w-sm rounded-2xl overflow-hidden animate-slide-up shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-warning-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-guest-text mb-2">
                Meja {pendingTable.tableNumber} Sedang Digunakan
              </h3>
              <p className="text-sm text-guest-text-muted mb-6">
                Meja ini sedang memiliki pesanan aktif. Pesanan Anda tetap akan diantar ke meja ini.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setPendingTable(null)}
                  className="flex-1"
                >
                  Batal
                </Button>
                <Button
                  onClick={() => confirmTableSelect(pendingTable)}
                  className="flex-1 bg-guest-primary hover:bg-guest-primary-hover text-white"
                >
                  Tetap Pilih
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Order Tracker Button */}
      <OrderTrackerFloatingButton />
    </div>
  )
}

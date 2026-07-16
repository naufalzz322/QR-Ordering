'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { ShoppingCart, Minus, Plus, X, UtensilsCrossed } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/stores/cartStore'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { config } from '@/lib/config'
import Image from 'next/image'
import { OrderTrackerFloatingButton } from '@/components/OrderTrackerFloatingButton'

interface MenuItem {
  id: string
  name: string
  description: string | null
  basePrice: string
  photoUrl: string | null
  isAvailable: boolean
  avgPrepTimeMinutes: number
  variants: { id: string; name: string; additionalPrice: string; isDefault?: boolean }[]
}

interface Category {
  id: string
  name: string
  items: MenuItem[]
}

interface Outlet {
  name: string
  slug: string
  logoUrl: string | null
}

function MenuPage() {
  const params = useParams()
  const router = useRouter()
  const outletSlug = params.outletSlug as string

  const [outlet, setOutlet] = useState<Outlet | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [tables, setTables] = useState<{ id: string; tableNumber: number; qrToken: string; activeOrders: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [tokenError, setTokenError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<string>('')
  const [qty, setQty] = useState(1)
  const [itemNotes, setItemNotes] = useState('')
  const [showCart, setShowCart] = useState(false)
  const [showTableSelector, setShowTableSelector] = useState(false)
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [pendingTable, setPendingTable] = useState<{ id: string; qrToken: string; tableNumber: number } | null>(null)

  const { items, addItem, updateQty, removeItem, setTableInfo, setTableNumber, tableToken, tableNumber, getTotal, getTotalQty } = useCartStore()

  // Handle token from URL (for table tracking)
  const searchParams = useSearchParams()
  const tokenInitialized = useRef(false)

  useEffect(() => {
    const tableTokenParam = searchParams.get('token')
    if (tableTokenParam && !tokenInitialized.current) {
      tokenInitialized.current = true
      setTableInfo(outletSlug, tableTokenParam)
    }
  }, [searchParams, outletSlug, setTableInfo])

  // Fetch tables and auto-select if token exists
  useEffect(() => {
    const fetchTables = async () => {
      try {
        const res = await fetch(`/api/public/tables?outlet=${outletSlug}`)
        const data = await res.json()
        if (res.ok && data.tables) {
          const tablesWithStatus = data.tables.map((table: { id: string; tableNumber: number; qrToken: string; _count?: { orders: number } }) => ({
            id: table.id,
            tableNumber: table.tableNumber,
            qrToken: table.qrToken,
            activeOrders: table._count?.orders || 0,
          }))
          setTables(tablesWithStatus)

          // Validate token if exists in URL
          const tokenParam = searchParams.get('token')
          if (tokenParam) {
            const matchedTable = tablesWithStatus.find((t: typeof tablesWithStatus[0]) => t.qrToken === tokenParam)
            if (matchedTable) {
              // Valid token - auto select
              setTokenError(null)
              if (!tableNumber) {
                setTableNumber(matchedTable.tableNumber)
                setTableInfo(outletSlug, tokenParam, matchedTable.tableNumber)
              }
            } else {
              // Invalid token
              setTokenError('Token meja tidak valid')
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch tables:', error)
      }
    }
    fetchTables()
  }, [outletSlug, searchParams, tableNumber, setTableNumber, setTableInfo])

  useEffect(() => {
    fetchMenu(true)
    // Poll for HABIS updates every 10 seconds
    const interval = setInterval(() => fetchMenu(false), 10000)
    return () => clearInterval(interval)
  }, [outletSlug])

  const fetchMenu = async (isInitial = false) => {
    try {
      const res = await fetch(`/api/public/menu/${outletSlug}`)
      const data = await res.json()

      if (res.ok) {
        setOutlet(data.outlet)
        setCategories(data.categories)
        if (isInitial && data.categories.length > 0) {
          setSelectedCategory(data.categories[0].id)
        }
      } else {
        console.error('Failed to fetch menu:', data.error)
      }
    } catch (error) {
      console.error('Failed to fetch menu:', error)
    } finally {
      if (isInitial) {
        setLoading(false)
      }
    }
  }

  const openItemModal = (item: MenuItem) => {
    setSelectedItem(item)
    setSelectedVariant(item.variants.find(v => v.isDefault)?.id || item.variants[0]?.id || '')
    setQty(1)
    setItemNotes('')
  }

  const closeItemModal = () => {
    setSelectedItem(null)
    setSelectedVariant('')
    setQty(1)
    setItemNotes('')
  }

  const getSelectedVariant = () => {
    if (!selectedItem) return null
    return selectedItem.variants.find(v => v.id === selectedVariant) || selectedItem.variants[0]
  }

  const getItemPrice = () => {
    if (!selectedItem) return 0
    const variant = getSelectedVariant()
    const basePrice = parseFloat(selectedItem.basePrice)
    const additionalPrice = variant ? parseFloat(variant.additionalPrice) : 0
    return basePrice + additionalPrice
  }

  const handleAddToCart = () => {
    if (!selectedItem) return

    addItem({
      menuItemId: selectedItem.id,
      name: selectedItem.name,
      basePrice: parseFloat(selectedItem.basePrice),
      variantId: selectedVariant || undefined,
      variantName: getSelectedVariant()?.name,
      additionalPrice: getSelectedVariant() ? parseFloat(getSelectedVariant()!.additionalPrice) : 0,
      qty,
      itemNotes: itemNotes || undefined,
      photoUrl: selectedItem.photoUrl || undefined,
    })

    closeItemModal()
  }

  const getCartItemQty = (menuItemId: string, variantId?: string) => {
    const item = items.find(i => i.menuItemId === menuItemId && i.variantId === variantId)
    return item?.qty || 0
  }

  const currentCategory = categories.find(c => c.id === selectedCategory)

  if (loading) {
    return (
      <div className="min-h-screen guest-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-guest-text-muted">Memuat menu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen guest-bg pb-20">
      {/* Table Selection Banner - shown when no table detected */}
      {!tableToken && !bannerDismissed && (
        <div className="bg-guest-primary/10 border-b border-guest-primary/20 px-4 py-3">
          <div className="flex items-center justify-between max-w-lg mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-guest-primary/20 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-guest-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-guest-text">
                  {tableNumber ? `Meja ${tableNumber}` : 'Dining in?'}
                </p>
                {!tableNumber && (
                  <p className="text-xs text-guest-text-muted">Pilih meja untuk pengantaran pesanan</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {tableNumber ? (
                <button
                  onClick={() => setShowTableSelector(true)}
                  className="text-xs text-guest-primary font-medium hover:underline"
                >
                  Ganti
                </button>
              ) : (
                <button
                  onClick={() => setShowTableSelector(true)}
                  className="px-3 py-1.5 bg-guest-primary text-white text-xs font-medium rounded-full hover:bg-guest-primary-hover transition-colors"
                >
                  Pilih Meja
                </button>
              )}
              <button
                onClick={() => setBannerDismissed(true)}
                className="p-1 text-guest-text-muted hover:text-guest-text"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invalid Token Error Banner */}
      {tokenError && !bannerDismissed && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3">
          <div className="flex items-center justify-between max-w-lg mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-red-700">{tokenError}</p>
                <p className="text-xs text-red-600">Token meja tidak ditemukan atau sudah tidak berlaku</p>
              </div>
            </div>
            <button
              onClick={() => {
                setTokenError(null)
                setBannerDismissed(true)
              }}
              className="p-1 text-red-400 hover:text-red-600"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 bg-white shadow-sm z-40">
        <div className="px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-guest-primary rounded-lg flex items-center justify-center">
              <UtensilsCrossed className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-guest-text">{outlet?.name || 'Menu'}</span>
          </Link>
          <div className="flex items-center gap-3">
            {/* Table indicator */}
            {tableNumber && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-guest-primary/10 rounded-full">
                <svg className="w-3.5 h-3.5 text-guest-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span className="text-xs font-medium text-guest-primary">Meja {tableNumber}</span>
              </div>
            )}
            <button
              onClick={() => setShowCart(true)}
              className="relative p-2 hover:bg-neutral-100 rounded-full transition-colors"
            >
              <ShoppingCart className="w-6 h-6 text-guest-text" />
              {getTotalQty() > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-guest-cart-badge text-white text-xs rounded-full flex items-center justify-center animate-badge-bounce">
                  {getTotalQty()}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Category Tabs - Scrollable with chevron + gradient indicators */}
        <div className="relative group">
          {/* Gradient fades on both sides */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" id="scroll-left-fade" />
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" id="scroll-right-fade" />

          {/* Scrollable tabs container */}
          <div
            className="px-4 pb-3 overflow-x-auto scrollbar-hide scroll-smooth"
            ref={(el) => {
              if (el) {
                const updateIndicators = () => {
                  const leftFade = document.getElementById('scroll-left-fade')
                  const rightFade = document.getElementById('scroll-right-fade')
                  const leftChevron = document.getElementById('scroll-left-chevron')
                  const rightChevron = document.getElementById('scroll-right-chevron')

                  const isAtStart = el.scrollLeft <= 10
                  const isAtEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 10
                  const hasOverflow = el.scrollWidth > el.clientWidth

                  // Fade gradients
                  if (leftFade) leftFade.style.opacity = (!isAtStart && hasOverflow) ? '1' : '0'
                  if (rightFade) rightFade.style.opacity = (!isAtEnd && hasOverflow) ? '1' : '0'

                  // Chevron arrows
                  if (leftChevron) leftChevron.style.opacity = (!isAtStart && hasOverflow) ? '1' : '0'
                  if (rightChevron) rightChevron.style.opacity = (!isAtEnd && hasOverflow) ? '1' : '0'
                }

                el.addEventListener('scroll', updateIndicators)
                // Re-check on resize
                const resizeObserver = new ResizeObserver(updateIndicators)
                resizeObserver.observe(el)
                updateIndicators()
              }
            }}
          >
            <div className="flex gap-2 min-w-max">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                    selectedCategory === category.id
                      ? 'bg-guest-primary text-white'
                      : 'bg-gray-100 text-guest-text-muted hover:bg-gray-200'
                  )}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Left Chevron - fades when at start */}
          <button
            id="scroll-left-chevron"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-12 flex items-center justify-start pl-1 z-20 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            onClick={() => {
              const container = document.querySelector('.overflow-x-auto') as HTMLElement
              if (container) container.scrollBy({ left: -150, behavior: 'smooth' })
            }}
          >
            <div className="w-6 h-6 bg-white/90 rounded-full shadow-md flex items-center justify-center">
              <svg className="w-4 h-4 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
          </button>

          {/* Right Chevron - fades when at end */}
          <button
            id="scroll-right-chevron"
            className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-12 flex items-center justify-end pr-1 z-20 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            onClick={() => {
              const container = document.querySelector('.overflow-x-auto') as HTMLElement
              if (container) container.scrollBy({ left: 150, behavior: 'smooth' })
            }}
          >
            <div className="w-6 h-6 bg-white/90 rounded-full shadow-md flex items-center justify-center">
              <svg className="w-4 h-4 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>
      </header>

      {/* Menu Grid */}
      <div className="px-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          {currentCategory?.items.map((item) => {
            const inCart = getCartItemQty(item.id)
            return (
              <div
                key={item.id}
                onClick={() => item.isAvailable && openItemModal(item)}
                className={cn(
                  'bg-white rounded-xl overflow-hidden shadow-sm transition-all',
                  item.isAvailable ? 'cursor-pointer hover:shadow-md active:scale-95' : 'opacity-60 cursor-not-allowed'
                )}
              >
                {/* Photo */}
                <div className="relative aspect-square bg-gray-100 overflow-hidden">
                  {item.photoUrl ? (
                    <Image
                      src={item.photoUrl}
                      alt={item.name}
                      fill
                      className={cn('object-cover transition-transform', !item.isAvailable && 'grayscale')}
                      sizes="(max-width: 768px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><UtensilsCrossed className="w-8 h-8 text-neutral-300" /></div>
                  )}
                  {!item.isAvailable && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="bg-white px-3 py-1 rounded-full text-sm font-bold text-gray-700 shadow-lg">
                        HABIS
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3">
                  <h3 className="font-semibold text-guest-text text-sm mb-1 line-clamp-1">{item.name}</h3>
                  <p className="text-guest-primary font-bold text-sm">
                    {formatCurrency(parseFloat(item.basePrice))}
                  </p>

                  {/* Quick Add / Qty Controls */}
                  {inCart > 0 ? (
                    <div className="mt-2 flex items-center justify-between bg-guest-bg rounded-lg p-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          const cartItem = items.find(i => i.menuItemId === item.id)
                          if (cartItem) {
                            if (cartItem.qty > 1) {
                              updateQty(cartItem.id, cartItem.qty - 1)
                            } else {
                              removeItem(cartItem.id)
                            }
                          }
                        }}
                        className="p-1.5 hover:bg-gray-200 rounded-full transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-semibold text-sm">{inCart}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          const cartItem = items.find(i => i.menuItemId === item.id)
                          if (cartItem) {
                            updateQty(cartItem.id, cartItem.qty + 1)
                          }
                        }}
                        className="p-1.5 hover:bg-gray-200 rounded-full transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ) : item.isAvailable ? (
                    <button className="mt-2 w-full py-1.5 bg-guest-primary text-white text-sm font-medium rounded-lg hover:bg-guest-primary-hover transition-colors">
                      + Tambah
                    </button>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Item Detail Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center sm:justify-center"
          onClick={closeItemModal}
        >
          <div
            className="bg-white w-full max-h-[90vh] sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={closeItemModal}
              className="absolute top-4 right-4 z-10 p-2 bg-white/90 backdrop-blur rounded-full shadow hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Image */}
            <div className="relative h-48 sm:h-56 bg-gray-100 overflow-hidden">
              {selectedItem.photoUrl ? (
                <Image
                  src={selectedItem.photoUrl}
                  alt={selectedItem.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 448px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><UtensilsCrossed className="w-12 h-12 text-neutral-300" /></div>
              )}
            </div>

            {/* Content */}
            <div className="p-5 pb-24">
              <h2 className="text-xl font-bold text-guest-text mb-1">{selectedItem.name}</h2>
              <p className="text-guest-primary font-bold text-lg mb-2">
                {formatCurrency(getItemPrice())}
              </p>
              {selectedItem.description && (
                <p className="text-guest-text-muted text-sm mb-4">{selectedItem.description}</p>
              )}

              {/* Variants */}
              {selectedItem.variants.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-guest-text mb-2">Varian:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedItem.variants.map((variant) => (
                      <button
                        key={variant.id}
                        onClick={() => setSelectedVariant(variant.id)}
                        className={cn(
                          'px-4 py-2 rounded-full text-sm border transition-colors',
                          selectedVariant === variant.id
                            ? 'border-guest-primary bg-guest-primary text-white'
                            : 'border-gray-200 hover:border-guest-primary'
                        )}
                      >
                        {variant.name}
                        {parseFloat(variant.additionalPrice) > 0 && (
                          <span className="ml-1 text-xs opacity-80">
                            +{formatCurrency(parseFloat(variant.additionalPrice))}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="mb-4">
                <p className="text-sm font-medium text-guest-text mb-2">Catatan:</p>
                <textarea
                  value={itemNotes}
                  onChange={(e) => setItemNotes(e.target.value)}
                  placeholder="Contoh: kurang pedas, tanpa gula..."
                  className="w-full p-3 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-guest-primary/50"
                  rows={2}
                />
              </div>
            </div>

            {/* Fixed Bottom Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 sm:relative sm:border-0 sm:p-5 sm:bg-transparent">
              <div className="flex items-center gap-4 max-w-md mx-auto">
                <div className="flex items-center gap-3 bg-gray-100 rounded-full px-3 py-2">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="p-1.5 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="font-semibold w-8 text-center">{qty}</span>
                  <button
                    onClick={() => setQty(qty + 1)}
                    className="p-1.5 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                <Button
                  onClick={handleAddToCart}
                  className="flex-1 bg-guest-primary hover:bg-guest-primary-hover text-white py-4"
                >
                  Tambah {formatCurrency(getItemPrice() * qty)}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {showCart && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowCart(false)}>
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[85vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-lg font-bold">Keranjang Saya</h2>
              <button onClick={() => setShowCart(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[50vh] sm:max-h-[60vh]">
              {items.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-guest-text-muted">Keranjang kosong</p>
                  <p className="text-sm text-gray-400 mt-1">Pilih menu favorit Anda</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="w-16 h-16 bg-neutral-100 rounded-lg flex-shrink-0 overflow-hidden">
                        {item.photoUrl ? (
                          <Image
                            src={item.photoUrl}
                            alt={item.name}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <UtensilsCrossed className="w-6 h-6 text-neutral-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-guest-text">{item.name}</h3>
                        {item.variantName && (
                          <p className="text-sm text-guest-text-muted">{item.variantName}</p>
                        )}
                        <p className="text-guest-primary font-bold">
                          {formatCurrency((item.basePrice + item.additionalPrice) * item.qty)}
                        </p>
                        {item.itemNotes && (
                          <p className="text-xs text-guest-text-muted italic mt-1">Catatan: {item.itemNotes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (item.qty > 1) {
                              updateQty(item.id, item.qty - 1)
                            } else {
                              removeItem(item.id)
                            }
                          }}
                          className="p-1.5 bg-gray-100 rounded-full hover:bg-gray-200"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-semibold w-6 text-center">{item.qty}</span>
                        <button
                          onClick={() => updateQty(item.id, item.qty + 1)}
                          className="p-1.5 bg-gray-100 rounded-full hover:bg-gray-200"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="p-4 border-t sticky bottom-0 bg-white">
                <div className="flex justify-between mb-4">
                  <span className="text-guest-text-muted">Total</span>
                  <span className="text-2xl font-bold text-guest-primary">
                    {formatCurrency(getTotal())}
                  </span>
                </div>
                <Button
                  onClick={() => router.push(`/m/${outletSlug}/checkout`)}
                  className="w-full bg-guest-primary hover:bg-guest-primary-hover text-white py-6 text-lg"
                >
                  Pesan Sekarang
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Cart Button */}
      {getTotalQty() > 0 && !showCart && (
        <button
          onClick={() => setShowCart(true)}
          className="floating-cart bg-guest-primary text-white px-5 py-4 rounded-full shadow-xl flex items-center gap-3 hover:bg-guest-primary-hover transition-all active:scale-95"
        >
          <ShoppingCart className="w-6 h-6" />
          <span className="font-semibold">{getTotalQty()} item</span>
          <span className="font-bold">•</span>
          <span className="font-bold">{formatCurrency(getTotal())}</span>
        </button>
      )}

      {/* Table Selector Modal */}
      {showTableSelector && (
        <div className="fixed inset-0 z-[70] bg-black/50 flex items-end sm:items-center sm:justify-center" onClick={() => setShowTableSelector(false)}>
          <div
            className="bg-white w-full max-h-[70vh] sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-lg font-bold">Pilih Meja</h2>
              <button onClick={() => setShowTableSelector(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <p className="text-sm text-guest-text-muted mb-3">
                Pilih nomor meja untuk pengantaran pesanan ke meja Anda
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
                      onClick={() => {
                        if (isOccupied) {
                          setPendingTable({ id: table.id, qrToken: table.qrToken, tableNumber: table.tableNumber })
                        } else {
                          setTableNumber(table.tableNumber)
                          setTableInfo(outletSlug, table.qrToken, table.tableNumber)
                          setShowTableSelector(false)
                          setBannerDismissed(true)
                        }
                      }}
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
            {tableNumber && (
              <div className="p-4 border-t bg-gray-50">
                <p className="text-sm text-center text-guest-text-muted">
                  Pesanan akan diantar ke <span className="font-semibold text-guest-primary">Meja {tableNumber}</span>
                </p>
              </div>
            )}
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
                  onClick={() => {
                    setTableNumber(pendingTable.tableNumber)
                    setTableInfo(outletSlug, pendingTable.qrToken, pendingTable.tableNumber)
                    setShowTableSelector(false)
                    setBannerDismissed(true)
                    setPendingTable(null)
                  }}
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

export default function MenuPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen guest-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-guest-text-muted">Memuat menu...</p>
        </div>
      </div>
    }>
      <MenuPage />
    </Suspense>
  )
}

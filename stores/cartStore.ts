import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  menuItemId: string
  name: string
  basePrice: number
  variantId?: string
  variantName?: string
  additionalPrice: number
  qty: number
  itemNotes?: string
  photoUrl?: string
}

interface OrderInfo {
  id: string
  orderNumber: string
  queuePosition: number
  estimatedMinutes: number
  status: 'PENDING' | 'PROCESSING' | 'READY' | 'COMPLETED' | 'CANCELLED'
  createdAt: string
}

interface CartState {
  items: CartItem[]
  tableToken: string | null
  tableNumber: number | null
  outletSlug: string | null
  orderId: string | null
  orderInfo: OrderInfo | null
  orderNotes: string

  addItem: (item: Omit<CartItem, 'id'>) => void
  updateQty: (id: string, qty: number) => void
  updateNotes: (id: string, notes: string) => void
  removeItem: (id: string) => void
  clearCart: () => void
  setTableInfo: (outletSlug: string, tableToken: string, tableNumber?: number) => void
  setTableNumber: (tableNumber: number) => void
  clearTableInfo: () => void
  setOrderId: (orderId: string) => void
  setOrderInfo: (info: OrderInfo) => void
  clearOrderInfo: () => void
  setOrderNotes: (notes: string) => void
  getTotal: () => number
  getTotalQty: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      tableToken: null,
      tableNumber: null,
      outletSlug: null,
      orderId: null,
      orderInfo: null,
      orderNotes: '',

      addItem: (item) => {
        set((state) => {
          // Check if same item + variant exists
          const existing = state.items.find(
            (i) => i.menuItemId === item.menuItemId && i.variantId === item.variantId
          )

          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === existing.id ? { ...i, qty: i.qty + item.qty } : i
              ),
            }
          }

          return {
            items: [
              ...state.items,
              { ...item, id: crypto.randomUUID() },
            ],
          }
        })
      },

      updateQty: (id, qty) => {
        set((state) => ({
          items:
            qty <= 0
              ? state.items.filter((i) => i.id !== id)
              : state.items.map((i) => (i.id === id ? { ...i, qty } : i)),
        }))
      },

      updateNotes: (id, notes) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, itemNotes: notes } : i
          ),
        }))
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        }))
      },

      clearCart: () => {
        set({ items: [], orderId: null, orderNotes: '' })
      },

      setTableInfo: (outletSlug, tableToken, tableNumber) => {
        set({ outletSlug, tableToken, tableNumber: tableNumber || null })
      },

      setTableNumber: (tableNumber) => {
        set({ tableNumber })
      },

      clearTableInfo: () => {
        set({ tableToken: null, tableNumber: null })
      },

      setOrderId: (orderId) => {
        set({ orderId })
      },

      setOrderInfo: (info) => {
        set({ orderInfo: info })
      },

      clearOrderInfo: () => {
        set({ orderInfo: null })
      },

      setOrderNotes: (notes) => {
        set({ orderNotes: notes })
      },

      getTotal: () => {
        const { items } = get()
        return items.reduce(
          (sum, item) => sum + (item.basePrice + item.additionalPrice) * item.qty,
          0
        )
      },

      getTotalQty: () => {
        const { items } = get()
        return items.reduce((sum, item) => sum + item.qty, 0)
      },
    }),
    {
      name: 'qr-cart-storage',
      partialize: (state) => ({
        items: state.items,
        tableToken: state.tableToken,
        tableNumber: state.tableNumber,
        outletSlug: state.outletSlug,
        orderId: state.orderId,
        orderInfo: state.orderInfo,
        orderNotes: state.orderNotes,
      }),
    }
  )
)

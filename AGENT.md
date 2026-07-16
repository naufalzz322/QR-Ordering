# AGENT.md — QR Table Ordering System
**Segmen 05 · Kuliner**

---

## 1. Stack

```
Framework:     Next.js 14 (App Router)
Database:      PostgreSQL via Supabase
ORM:          Prisma
Auth:         NextAuth.js (admin only — guests no auth)
Realtime:     Supabase Realtime (postgres changes subscription)
Storage:      Supabase Storage (menu photos)
Styling:      Tailwind CSS v3
QR Gen:       qrcode npm package
PDF:          jsPDF (QR card printing)
Deploy:       Vercel + Supabase
```

---

## 2. Folder Structure

```
/
├── app/
│   ├── (public)/                    → guest-facing pages
│   │   ├── m/
│   │   │   └── [outletSlug]/
│   │   │       ├── page.tsx       → menu digital
│   │   │       ├── cart/page.tsx  → cart page
│   │   │       └── status/
│   │   │           └── [orderId]/
│   │   │               └── page.tsx → order tracking
│   │   └── layout.tsx
│   │
│   ├── kitchen/
│   │   └── [outletSlug]/
│   │       └── page.tsx           → KDS (no auth, internal URL)
│   │
│   ├── (admin)/
│   │   ├── layout.tsx
│   │   ├── page.tsx              → dashboard
│   │   ├── menu/
│   │   │   ├── page.tsx         → menu list
│   │   │   ├── [id]/page.tsx   → edit item
│   │   │   └── categories/
│   │   │       └── page.tsx     → category management
│   │   ├── tables/
│   │   │   └── page.tsx         → table setup + QR generation
│   │   ├── orders/
│   │   │   └── page.tsx         → all orders
│   │   └── reports/
│   │       └── page.tsx         → sales reports
│   │
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── layout.tsx
│   │
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── public/
│       │   ├── menu/[outletSlug]/route.ts
│       │   ├── order/route.ts
│       │   └── order/[id]/status/route.ts
│       ├── kitchen/
│       │   ├── orders/route.ts
│       │   └── order/[id]/status/route.ts
│       ├── admin/
│       │   ├── menu/route.ts
│       │   ├── menu/[id]/route.ts
│       │   ├── categories/route.ts
│       │   ├── tables/route.ts
│       │   ├── tables/[id]/route.ts
│       │   ├── tables/[id]/qr/route.ts
│       │   ├── orders/route.ts
│       │   └── reports/route.ts
│       └── upload/route.ts
│
├── components/
│   ├── ui/
│   ├── public/
│   │   ├── MenuHeader.tsx
│   │   ├── CategoryTabs.tsx
│   │   ├── MenuGrid.tsx
│   │   ├── MenuItemCard.tsx
│   │   ├── ItemDetailModal.tsx
│   │   ├── FloatingCartButton.tsx
│   │   ├── CartDrawer.tsx
│   │   └── OrderStatusTracker.tsx
│   ├── kitchen/
│   │   ├── KitchenHeader.tsx
│   │   ├── OrderCard.tsx
│   │   └── KitchenGrid.tsx
│   ├── admin/
│   │   ├── DashboardStats.tsx
│   │   ├── MenuItemForm.tsx
│   │   ├── CategoryList.tsx
│   │   ├── TableGrid.tsx
│   │   ├── QRDownloadButton.tsx
│   │   ├── OrderList.tsx
│   │   └── SalesChart.tsx
│   └── layout/
│       ├── AdminSidebar.tsx
│       └── MobileNav.tsx
│
├── lib/
│   ├── prisma.ts
│   ├── auth.ts
│   ├── supabase.ts              → client + storage
│   ├── waitEstimate.ts           → F-08 estimation logic
│   └── realtime.ts             → Supabase subscription helpers
│
├── stores/
│   └── cartStore.ts             → Zustand for guest cart
│
└── prisma/
    └── schema.prisma
```

---

## 3. Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Outlet {
  id          String      @id @default(cuid())
  name        String
  slug        String      @unique
  address     String?
  logoUrl     String?
  avgPrepTimeMinutes Int  @default(8)
  tables      Table[]
  categories  Category[]
  menuItems   MenuItem[]
  orders      Order[]
  createdAt   DateTime    @default(now())
}

model Table {
  id          String      @id @default(cuid())
  outletId    String
  outlet      Outlet      @relation(fields: [outletId], references: [id])
  tableNumber Int
  qrToken     String      @unique @default(cuid())
  status      TableStatus @default(EMPTY)
  orders      Order[]
  createdAt   DateTime    @default(now())
}

enum TableStatus {
  EMPTY
  ACTIVE
  DONE
}

model Category {
  id         String     @id @default(cuid())
  outletId   String
  outlet     Outlet    @relation(fields: [outletId], references: [id])
  name       String
  sortOrder  Int        @default(0)
  isActive   Boolean    @default(true)
  items      MenuItem[]
  createdAt  DateTime   @default(now())
}

model MenuItem {
  id                String        @id @default(cuid())
  outletId         String
  outlet           Outlet       @relation(fields: [outletId], references: [id])
  categoryId       String
  category         Category     @relation(fields: [categoryId], references: [id])
  name             String
  description      String?
  basePrice        Decimal       @db.Decimal(10, 0)
  photoUrl         String?
  isAvailable      Boolean      @default(true)
  avgPrepTimeMinutes Int        @default(8)
  sortOrder        Int          @default(0)
  variants         MenuVariant[]
  orderItems       OrderItem[]
  createdAt        DateTime      @default(now())
}

model MenuVariant {
  id              String   @id @default(cuid())
  menuItemId     String
  menuItem       MenuItem @relation(fields: [menuItemId], references: [id])
  name           String
  additionalPrice Decimal  @db.Decimal(10, 0) @default(0)
}

model Order {
  id              String      @id @default(cuid())
  orderNumber     String      @unique
  tableId         String
  table           Table      @relation(fields: [tableId], references: [id])
  outletId        String
  outlet          Outlet     @relation(fields: [outletId], references: [id])
  status          OrderStatus @default(PENDING)
  notes           String?
  items           OrderItem[]
  totalAmount     Decimal     @db.Decimal(12, 0)
  estimatedDoneAt DateTime?
  queuePosition   Int?
  createdAt       DateTime    @default(now())
  processedAt     DateTime?
  completedAt     DateTime?
}

enum OrderStatus {
  PENDING
  PROCESSING
  READY
  COMPLETED
  CANCELLED
}

model OrderItem {
  id         String   @id @default(cuid())
  orderId    String
  order      Order   @relation(fields: [orderId], references: [id])
  menuItemId String
  menuItem   MenuItem @relation(fields: [menuItemId], references: [id])
  variantId  String?
  qty        Int
  unitPrice  Decimal  @db.Decimal(10, 0)
  itemNotes  String?
}
```

---

## 4. Wait Time Estimation (`/lib/waitEstimate.ts`)

```typescript
import prisma from './prisma';

/**
 * Calculate queue position and estimated wait time
 * Called when a new order is created
 */
export async function calculateWaitEstimate(
  outletId: string,
  newOrderCreatedAt: Date
): Promise<{
  queuePosition: number;
  estimatedWaitMinutes: number;
  estimatedDoneAt: Date;
  isImmediately: boolean;
}> {
  // Count orders ahead in queue
  const aheadCount = await prisma.order.count({
    where: {
      outletId,
      status: { in: ['PENDING', 'PROCESSING'] },
      createdAt: { lt: newOrderCreatedAt },
    },
  });

  const queuePosition = aheadCount + 1;
  const isImmediately = queuePosition === 1;

  // Get average prep time for this outlet
  const avgPrepResult = await prisma.menuItem.aggregate({
    where: { outletId },
    _avg: { avgPrepTimeMinutes: true },
  });

  const avgPrepTime = avgPrepResult._avg.avgPrepTimeMinutes ?? 8;

  // Calculate estimated wait
  const estimatedWaitMinutes = isImmediately
    ? avgPrepTime
    : queuePosition * avgPrepTime;

  const estimatedDoneAt = new Date(
    Date.now() + estimatedWaitMinutes * 60_000
  );

  return {
    queuePosition,
    estimatedWaitMinutes,
    estimatedDoneAt,
    isImmediately,
  };
}

/**
 * Recalculate queue positions when an order is processed
 * Called after order status changes
 */
export async function recalculateQueuePositions(
  outletId: string
): Promise<void> {
  // Get all active orders sorted by creation time
  const activeOrders = await prisma.order.findMany({
    where: {
      outletId,
      status: { in: ['PENDING', 'PROCESSING'] },
    },
    orderBy: { createdAt: 'asc' },
  });

  // Get outlet avg prep time
  const avgPrepResult = await prisma.menuItem.aggregate({
    where: { outletId },
    _avg: { avgPrepTimeMinutes: true },
  });
  const avgPrepTime = avgPrepResult._avg.avgPrepTimeMinutes ?? 8;

  // Batch update queue positions
  const updates = activeOrders.map((order, index) => {
    const newQueuePosition = index + 1;
    const isImmediately = newQueuePosition === 1;
    const estimatedWaitMinutes = isImmediately
      ? avgPrepTime
      : newQueuePosition * avgPrepTime;

    return prisma.order.update({
      where: { id: order.id },
      data: {
        queuePosition: newQueuePosition,
        estimatedDoneAt: new Date(Date.now() + estimatedWaitMinutes * 60_000),
      },
    });
  });

  await prisma.$transaction(updates);
}

/**
 * Format wait estimate for display
 */
export function formatWaitEstimate(
  estimatedMinutes: number,
  isImmediately: boolean
): string {
  if (isImmediately || estimatedMinutes <= 0) {
    return '±Segera';
  }
  return `~±${estimatedMinutes} menit`;
}
```

---

## 5. Cart Store (`/stores/cartStore.ts`)

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  basePrice: number;
  variantId?: string;
  variantName?: string;
  additionalPrice: number;
  qty: number;
  itemNotes?: string;
}

interface CartState {
  items: CartItem[];
  tableToken: string | null;
  outletSlug: string | null;
  orderId: string | null;

  addItem: (item: Omit<CartItem, 'id'>) => void;
  updateQty: (id: string, qty: number) => void;
  updateNotes: (id: string, notes: string) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  setTableInfo: (outletSlug: string, tableToken: string) => void;
  setOrderId: (orderId: string) => void;

  getTotal: () => number;
  getTotalQty: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      tableToken: null,
      outletSlug: null,
      orderId: null,

      addItem: (item) => {
        set((state) => {
          // Check if same item + variant exists
          const existing = state.items.find(
            (i) => i.menuItemId === item.menuItemId && i.variantId === item.variantId
          );

          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === existing.id
                  ? { ...i, qty: i.qty + item.qty }
                  : i
              ),
            };
          }

          return {
            items: [
              ...state.items,
              { ...item, id: crypto.randomUUID() },
            ],
          };
        });
      },

      updateQty: (id, qty) => {
        set((state) => ({
          items:
            qty <= 0
              ? state.items.filter((i) => i.id !== id)
              : state.items.map((i) => (i.id === id ? { ...i, qty } : i)),
        }));
      },

      updateNotes: (id, notes) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, itemNotes: notes } : i
          ),
        }));
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        }));
      },

      clearCart: () => {
        set({ items: [], orderId: null });
      },

      setTableInfo: (outletSlug, tableToken) => {
        set({ outletSlug, tableToken });
      },

      setOrderId: (orderId) => {
        set({ orderId });
      },

      getTotal: () => {
        const { items } = get();
        return items.reduce(
          (sum, item) => sum + (item.basePrice + item.additionalPrice) * item.qty,
          0
        );
      },

      getTotalQty: () => {
        const { items } = get();
        return items.reduce((sum, item) => sum + item.qty, 0);
      },
    }),
    {
      name: 'qr-cart-storage',
      partialize: (state) => ({
        items: state.items,
        tableToken: state.tableToken,
        outletSlug: state.outletSlug,
        orderId: state.orderId,
      }),
    }
  )
);
```

---

## 6. API Routes

### POST `/api/public/order`

```typescript
// Create new order
export async function POST(req: Request) {
  const { items, tableToken, notes } = await req.json();

  // Find table by token
  const table = await prisma.table.findUnique({
    where: { qrToken: tableToken },
  });

  if (!table) {
    return Response.json({ error: 'Invalid table' }, { status: 400 });
  }

  // Calculate total
  let totalAmount = 0;
  const orderItems = [];

  for (const item of items) {
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: item.menuItemId },
    });

    if (!menuItem) continue;

    const variant = item.variantId
      ? await prisma.menuVariant.findUnique({
          where: { id: item.variantId },
        })
      : null;

    const unitPrice = Number(menuItem.basePrice) +
      (variant ? Number(variant.additionalPrice) : 0);

    totalAmount += unitPrice * item.qty;

    orderItems.push({
      menuItemId: item.menuItemId,
      variantId: item.variantId,
      qty: item.qty,
      unitPrice,
      itemNotes: item.itemNotes,
    });
  }

  // Generate order number
  const count = await prisma.order.count({
    where: { outletId: table.outletId },
  });
  const orderNumber = `ORD-M${String(table.tableNumber).padStart(2, '0')}-${String(count + 1).padStart(3, '0')}`;

  // Calculate wait estimate
  const newOrderTime = new Date();
  const estimate = await calculateWaitEstimate(table.outletId, newOrderTime);

  // Create order
  const order = await prisma.order.create({
    data: {
      orderNumber,
      tableId: table.id,
      outletId: table.outletId,
      totalAmount,
      notes,
      items: { create: orderItems },
      estimatedDoneAt: estimate.estimatedDoneAt,
      queuePosition: estimate.queuePosition,
      status: 'PENDING',
    },
    include: { items: { include: { menuItem: true } } },
  });

  // Update table status
  await prisma.table.update({
    where: { id: table.id },
    data: { status: 'ACTIVE' },
  });

  return Response.json({
    order,
    estimate: {
      queuePosition: estimate.queuePosition,
      estimatedWaitMinutes: estimate.estimatedWaitMinutes,
      isImmediately: estimate.isImmediately,
    },
  });
}
```

### PATCH `/api/kitchen/order/[id]/status`

```typescript
// Update order status from KDS
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { status } = await req.json();

  const order = await prisma.order.update({
    where: { id },
    data: { status },
  });

  // If completed or cancelled, recalculate queue for remaining orders
  if (status === 'COMPLETED' || status === 'CANCELLED') {
    await recalculateQueuePositions(order.outletId);
  }

  // If completed, check if table should be closed
  if (status === 'COMPLETED') {
    const otherActiveOrders = await prisma.order.count({
      where: {
        tableId: order.tableId,
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
      },
    });

    if (otherActiveOrders === 0) {
      await prisma.table.update({
        where: { id: order.tableId },
        data: { status: 'DONE' },
      });
    }
  }

  return Response.json({ order });
}
```

### GET `/api/public/order/[id]/status`

```typescript
// Get order status for polling
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { menuItem: true } },
      table: true,
    },
  });

  if (!order) {
    return Response.json({ error: 'Order not found' }, { status: 404 });
  }

  // Get current estimate
  const estimate = {
    queuePosition: order.queuePosition,
    estimatedWaitMinutes: order.estimatedDoneAt
      ? Math.max(0, Math.round((order.estimatedDoneAt.getTime() - Date.now()) / 60000))
      : 0,
    isImmediately: order.queuePosition === 1,
  };

  return Response.json({ order, estimate });
}
```

---

## 7. Supabase Realtime (KDS)

```typescript
// /app/kitchen/[outletSlug]/page.tsx
'use client';

import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function KitchenPage({ params }: { params: Promise<{ outletSlug: string }> }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [outletSlug, setOutletSlug] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    params.then(p => setOutletSlug(p.outletSlug));
  }, [params]);

  useEffect(() => {
    if (!outletSlug) return;

    // Initial load
    fetchOrders();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('kitchen-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Order',
          filter: `outletId=eq.${outletSlug}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            playNotificationSound();
          }
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [outletSlug]);

  async function fetchOrders() {
    const res = await fetch(`/api/kitchen/orders?outlet=${outletSlug}`);
    const data = await res.json();
    setOrders(data.orders);
  }

  async function playNotificationSound() {
    const audio = new Audio('/notification.mp3');
    audio.volume = 0.5;
    audio.play().catch(() => {});
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <KitchenHeader outletSlug={outletSlug} />
      <KitchenGrid orders={orders} onStatusChange={fetchOrders} />
    </div>
  );
}
```

---

## 8. Seed Data

```typescript
const demoOutlet = {
  name: "Kafe Coklat Surabaya",
  slug: "kafe-coklat-sby",
  avgPrepTimeMinutes: 8,
  tables: 12,
};

const demoCategories = [
  { name: "Minuman", sortOrder: 0 },
  { name: "Makanan Berat", sortOrder: 1 },
  { name: "Snack", sortOrder: 2 },
  { name: "Dessert", sortOrder: 3 },
];

const demoMenuItems = [
  // Minuman
  { name: "Americano", basePrice: 25000, avgPrepTime: 4, category: "Minuman" },
  { name: "Kopi Susu Gula Aren", basePrice: 28000, avgPrepTime: 5, category: "Minuman" },
  { name: "Matcha Latte", basePrice: 32000, avgPrepTime: 5, category: "Minuman" },
  { name: "Cappuccino", basePrice: 28000, avgPrepTime: 4, category: "Minuman" },
  { name: "Es Teh Manis", basePrice: 10000, avgPrepTime: 2, category: "Minuman" },
  { name: "Jus Jeruk", basePrice: 18000, avgPrepTime: 3, category: "Minuman" },
  // Makanan
  { name: "Nasi Goreng Spesial", basePrice: 35000, avgPrepTime: 12, category: "Makanan Berat" },
  { name: "Mie Goreng Jawa", basePrice: 32000, avgPrepTime: 10, category: "Makanan Berat" },
  { name: "Ayam Geprek", basePrice: 30000, avgPrepTime: 8, category: "Makanan Berat" },
  { name: "Rice Bowl Teriyaki", basePrice: 38000, avgPrepTime: 10, category: "Makanan Berat" },
  // Snack
  { name: "Roti Bakar Coklat Keju", basePrice: 22000, avgPrepTime: 8, category: "Snack" },
  { name: "Pisang Goreng Keju", basePrice: 18000, avgPrepTime: 6, category: "Snack" },
  { name: "French Fries", basePrice: 15000, avgPrepTime: 5, category: "Snack" },
  // Dessert
  { name: "Pudding Coklat", basePrice: 15000, avgPrepTime: 3, category: "Dessert" },
  { name: "Es Krim Vanila", basePrice: 12000, avgPrepTime: 2, category: "Dessert" },
];

// Demo scenario for F-08:
// - Meja 03: order ACTIVE (PROCESSING), queuePosition=1 → "±Segera"
// - Meja 07: order PENDING, queuePosition=2 → "~±16 menit" (2×8 avg)
// - Meja 11: order PENDING, queuePosition=3 → "~±24 menit"
```

---

## 9. Development Sequence

### Sprint 1: Foundation (Hari 1-4)

```
[ ] Project setup + Prisma init
[ ] NextAuth (admin only)
[ ] Prisma schema + migrate
[ ] Outlet setup + seed
[ ] Table CRUD + QR generation
[ ] PDF export for QR cards
[ ] Base UI components
```

### Sprint 2: Menu Digital (Hari 5-8)

```
[ ] Menu API (public)
[ ] Category tabs component
[ ] Menu grid with items
[ ] Item detail modal
[ ] Item "HABIS" state
[ ] Floating cart button
```

### Sprint 3: Cart & Ordering (Hari 9-12)

```
[ ] Cart store (Zustand)
[ ] Cart drawer
[ ] Order submit API
[ ] Order confirmation page
[ ] Status tracking page
[ ] F-08: Wait estimation on order
```

### Sprint 4: KDS (Hari 13-16)

```
[ ] Kitchen orders API
[ ] Order card component
[ ] Kitchen grid layout
[ ] Status update actions
[ ] Supabase realtime subscription
[ ] Notification sound
[ ] F-08: Recalculate on status change
```

### Sprint 5: Admin Panel (Hari 17-20)

```
[ ] Admin dashboard
[ ] Menu CRUD
[ ] Category management
[ ] Table management
[ ] Floor monitor
[ ] Toggle HABIS real-time
```

### Sprint 6: Reports (Hari 21-22)

```
[ ] Sales reports API
[ ] Daily summary
[ ] Best sellers chart
[ ] Hourly distribution
[ ] CSV export
[ ] Polish + demo walkthrough
```

---

## 10. Testing Checklist

### E2E Tests

- [ ] QR scan → menu load < 2s (cold)
- [ ] Add 3 items + notes → cart shows correctly
- [ ] Submit order → confirmation + status page
- [ ] KDS: new order appears < 3s
- [ ] KDS: notification sound plays
- [ ] KDS: mark order done → status updates
- [ ] Guest: status page polls correctly
- [ ] F-08: estimate shows for new order
- [ ] F-08: estimate updates when queue changes
- [ ] F-08: "±Segera" for first in queue
- [ ] Toggle HABIS → item shows overlay
- [ ] Table close → status resets
- [ ] Reports calculate accurately

### Unit Tests

```typescript
// lib/waitEstimate.test.ts
expect(formatWaitEstimate(0, true)).toBe('±Segera');
expect(formatWaitEstimate(8, false)).toBe('~±8 menit');
expect(formatWaitEstimate(16, false)).toBe('~±16 menit');
```

---

## 11. Environment Variables

```env
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_OUTLET_SLUG=
```

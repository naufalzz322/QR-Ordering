# DESIGN.md — QR Table Ordering System
**Segmen 05 · Kuliner**

---

## 1. Design Principles

**Tiga antarmuka, tiga prioritas berbeda.** Tamu: visual dan apetizing. Dapur: cepat dibaca dari jarak 2 meter. Admin: fungsional dan dense-information.

### 1.1 Core Principles

1. **Tamu interface: food photography first** — menu harus bikin lapar, foto adalah hero
2. **KDS: kontrast tinggi** — dapur panas, pencahayaan buruk, tombol besar
3. **Tidak ada friction untuk tamu** — scan → order selesai: max 3 tap
4. **Real-time everywhere** — status berubah, semua layar ikut berubah

---

## 2. Color System

### 2.1 Tamu Interface (Menu Digital)

| Token | Hex | Usage |
|-------|-----|-------|
| `background` | `#FFFBF0` | Warm cream — appetite-friendly |
| `surface` | `#FFFFFF` | Cards |
| `primary` | `#C2410C` | Orange — kuliner, energi |
| `primary-hover` | `#9A3412` | Orange darker |
| `cart-badge` | `#DC2626` | Red — attention |
| `text` | `#1C1917` | Body text |
| `text-muted` | `#78716C` | Secondary text |
| `price` | `#C2410C` | Bold orange |
| `habis-overlay` | `rgba(0,0,0,0.6)` | Out of stock |

### 2.2 Kitchen Display (KDS)

| Token | Hex | Usage |
|-------|-----|-------|
| `background` | `#111827` | Dark — easy to read |
| `card-new` | `#7F1D1D` | Red bg, urgent |
| `card-processing` | `#78350F` | Amber bg, progress |
| `card-ready` | `#14532D` | Green bg, done |
| `text` | `#FFFFFF` | White |
| `border-new` | `#DC2626` | Red border |
| `border-processing` | `#D97706` | Amber border |
| `border-ready` | `#16A34A` | Green border |

### 2.3 Admin Panel

| Token | Hex | Usage |
|-------|-----|-------|
| `background` | `#F8F9FA` | Page bg |
| `surface` | `#FFFFFF` | Cards |
| `primary` | `#C2410C` | Orange — brand |
| `text-primary` | `#111827` | Headings |
| `text-secondary` | `#6B7280` | Body |

### 2.4 Status Colors

| Status | Color | Usage |
|--------|-------|-------|
| `empty-table` | `#6B7280` | Empty table |
| `active-table` | `#C2410C` | Has active orders |
| `done-table` | `#16A34A` | Ready to clean |

---

## 3. Typography

### 3.1 Tamu Interface

```
Font: Inter
```

| Element | Size | Weight | Usage |
|---------|------|--------|-------|
| `category-tab` | 14px | 600 | Category selector |
| `item-name` | 14px | 600 | Menu item name |
| `item-price` | 14px | 700 | Price display |
| `cart-item` | 14px | 500 | Cart item name |
| `cart-total` | 24px | 700 | Grand total |
| `button-text` | 16px | 600 | CTA buttons |

### 3.2 Kitchen Display

```
Font: Inter
Bold weights for visibility
```

| Element | Size | Weight | Usage |
|---------|------|--------|-------|
| `table-number` | 56px | 800 | "MEJA 05" |
| `item-name` | 20px | 600 | Item in order |
| `item-note` | 14px | 400 | Special instructions |
| `time-wait` | 16px | 500 | Wait time |
| `button` | 16px | 700 | Action buttons |

### 3.3 Wait Estimate Display

| Element | Size | Weight | Color | Usage |
|---------|------|--------|-------|-------|
| `estimate-time` | 28px | 800 | `#C2410C` | "~±12 menit" |
| `queue-position` | 13px | 400 | `#78716C` | "#3 di antrean" |
| `soon-label` | 14px | 600 | `#16A34A` | "±Segera" |

---

## 4. Guest Interface — Menu Digital

### 4.1 Menu Page Layout

```
┌────────────────────────────────────────┐
│  ☰  Kafe Coklat SBY        🛒 [3]   │ ← header with cart badge
├────────────────────────────────────────┤
│                                        │
│  [Minuman] [Makanan] [Snack] [Dessert]│ ← category tabs, scrollable
│                                        │
│  ┌──────────┐ ┌──────────┐           │
│  │  [FOTO]  │ │  [FOTO]  │           │
│  │          │ │          │           │
│  │ Americano│ │ Kopi Susu│           │
│  │ Rp 25k  │ │ Rp 28k  │           │
│  │    [+]  │ │    [+]  │           │
│  └──────────┘ └──────────┘           │
│                                        │
│  ┌──────────┐ ┌──────────┐           │
│  │  [FOTO]  │ │  [FOTO]  │           │
│  │   HABIS  │ │          │           │
│  │ Matcha   │ │ Es Teh   │           │
│  │ Rp 32k  │ │ Rp 10k  │           │
│  │  ✕✕✕   │ │    [+]  │           │
│  └──────────┘ └──────────┘           │
│                                        │
│  [Floating cart button - bottom right] │
└────────────────────────────────────────┘
```

### 4.2 Item Detail Modal

```
┌────────────────────────────────────────┐
│  ✕                                      │
│  ┌──────────────────────────────────┐  │
│  │                                  │  │
│  │           [FOTO BESAR]           │  │
│  │                                  │  │
│  └──────────────────────────────────┘  │
│                                        │
│  Americano                              │
│  Rp 25.000                            │
│  ──────────────────────────────────── │
│  kopi hitam dengan rasa yang kaya       │
│  dan seimbang                         │
│                                        │
│  Varian:                               │
│  ○ Regular                             │
│  ● Large (+Rp 5.000)                  │
│                                        │
│  Catatan:                              │
│  ┌──────────────────────────────────┐  │
│  │                                  │  │
│  └──────────────────────────────────┘  │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │  [        TAMBAH Rp 25.000      ]│  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
```

### 4.3 Cart Drawer

```
┌────────────────────────────────────────┐
│  Keranjang Saya                    ✕   │
│  ──────────────────────────────────── │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │ [FOTO] Americano         [-] 2 [+]│  │
│  │         Regular                   │  │
│  │         [Hapus]                 │  │
│  └──────────────────────────────────┘  │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │ [FOTO] Nasi Goreng     [-] 1 [+] │  │
│  │         - kurang pedas           │  │
│  │         [Hapus]                 │  │
│  └──────────────────────────────────┘  │
│                                        │
│  ──────────────────────────────────── │
│  Catatan Pesanan:                     │
│  ┌──────────────────────────────────┐  │
│  │ allergi kacang                  │  │
│  └──────────────────────────────────┘  │
│                                        │
│  ──────────────────────────────────── │
│  Subtotal                    Rp 78.000 │
│  ──────────────────────────────────── │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │      PESAN SEKARANG Rp 78.000    │  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
```

---

## 5. Order Status Tracking

### 5.1 Status Page

```
┌────────────────────────────────────────┐
│  ← Kembali                           │
│                                        │
│  Status Pesanan                       │
│  ──────────────────────────────────── │
│                                        │
│  Pesanan #ORD-M05-001                  │
│  Meja 05                              │
│  ──────────────────────────────────── │
│                                        │
│  ●─────────────────────────────────── │
│  │                                      │
│  ● Pesanan Diterima        ✓         │
│  │                                      │
│  ● Sedang Diproses        ●         │ ← active, pulsing
│  │                                      │
│  ○ Siap Diambil                      │
│  │                                      │
│  ○ Selesai                            │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │  Estimasi menunggu                │  │
│  │  ⏱️  ±12 menit                  │  │
│  │  Pesanan Anda: #3 di antrean    │  │
│  │                                    │  │
│  │  ⚠️ Mohon maaf, antrean        │  │ ← only if > 20min
│  │     sedang panjang 🙏              │  │
│  └──────────────────────────────────┘  │
│                                        │
│  ──────────────────────────────────── │
│  Pesanan Anda:                         │
│                                        │
│  2x Americano (Regular)              │
│  1x Nasi Goreng Spesial              │
│     kurang pedas                       │
│                                        │
│  [      TAMBAH PESANAN →       ]      │
│                                        │
└────────────────────────────────────────┘
```

### 5.2 Wait Estimate Card

```
┌─────────────────────────────────────┐
│  Estimasi menunggu                 │
│                                      │
│  ⏱️  ±12 menit                    │
│                                      │
│  Pesanan Anda: #3 di antrean        │
└─────────────────────────────────────┘

Style:
  Card: bg #FFFBF0, border 1px #FED7AA, rounded-xl
  Ikon: 24px orange
  Angka: 28px/800/#C2410C
  Queue: 13px/400/#78716C
```

---

## 6. Kitchen Display System (KDS)

### 6.1 Layout (Tablet Landscape)

```
┌────────────────────────────────────────────────────────────────────────┐
│  Kitchen Display              Kafe Coklat SBY          10:45 AM       │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │  MEJA 03        │  │  MEJA 07        │  │  MEJA 11        │  │
│  │  🔴 BARU         │  │  🟡 PROSES      │  │  🔴 BARU         │  │
│  │─────────────────│  │─────────────────│  │─────────────────│  │
│  │                  │  │                  │  │                  │  │
│  │  2x Americano   │  │  1x Nasi Goreng │  │  3x Kopi Susu   │  │
│  │  1x Nasi Goreng │  │    - kurang pedas│  │  1x Roti Bakar  │  │
│  │    - kurang pedas│  │                  │  │                  │  │
│  │                  │  │                  │  │                  │  │
│  │─────────────────│  │─────────────────│  │─────────────────│  │
│  │  ⏱️  ±8mnt    │  │  ⏱️  ±16mnt   │  │                  │  │
│  │  [ MULAI ]     │  │  [ SELESAI ]   │  │  [ MULAI ]     │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Order Card Specs

**NEW Order (BARU):**
```
┌──────────────────────────────┐
│  MEJA 03                   │
│  🔴 BARU                   │ ← red badge
│  ─────────────────────────  │
│                              │
│  2x Americano              │
│  1x Nasi Goreng            │
│    - kurang pedas           │
│                              │
│  ─────────────────────────  │
│  ⏱️  ±8mnt   [±Segera]  │ ← wait estimate in card
│                              │
│  [       MULAI PROSES     ]│ ← full-width button
└──────────────────────────────┘

Style:
  Background: #7F1D1D
  Border-left: 4px #DC2626
  Text: #FFFFFF
  Pulse animation on border
```

**PROCESSING Order:**
```
┌──────────────────────────────┐
│  MEJA 07                   │
│  🟡 PROSES                 │ ← amber badge
│  ─────────────────────────  │
│                              │
│  1x Nasi Goreng            │
│    - kurang pedas           │
│                              │
│  ─────────────────────────  │
│  ⏱️  ±16mnt   [Queue: 2]│
│                              │
│  [       SELESAI           ]│
└──────────────────────────────┘

Style:
  Background: #78350F
  Border-left: 4px #D97706
```

**READY Order:**
```
┌──────────────────────────────┐
│  MEJA 05                   │
│  🟢 SIAP                   │ ← green badge
│  ─────────────────────────  │
│                              │
│  2x Americano              │
│                              │
│  ─────────────────────────  │
│  ✓ SELESAIKAN               │ ← no action needed
└──────────────────────────────┘

Style:
  Background: #14532D
  Border-left: 4px #16A34A
```

---

## 7. Admin Panel Layout

### 7.1 Dashboard

```
┌────────────────────────────────────────────────────────────────────────┐
│  Admin Kafe Coklat SBY                           [Admin ▼] [Logout]  │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  Hari Ini                    │  Periode: [Hari Ini ▼]              │
│  ┌──────────┐ ┌──────────┐  │  ┌──────────────────────────────────┐ │
│  │ Total    │ │ Revenue  │  │  │  Order Hari Ini                   │ │
│  │ Order   │ │          │  │  │  ──────────────────────────────  │ │
│  │  47     │ │ Rp 2.1jt│  │  │  47 order · avg Rp 45.000       │ │
│  └──────────┘ └──────────┘  │  └──────────────────────────────────┘ │
│                                                                        │
│  Menu Terlaris (Hari Ini)                                             │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  1. Americano              23 porsi                    Rp 575.000 │ │
│  │  2. Kopi Susu Gula Aren   19 porsi                    Rp 532.000 │ │
│  │  3. Nasi Goreng Spesial   15 porsi                    Rp 525.000 │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Floor Monitor

```
┌────────────────────────────────────────────────────────────────────────┐
│  Floor Monitor                                        [Meja] [Laporan] │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ │
│  │  MEJA  │ │  MEJA  │ │  MEJA  │ │  MEJA  │ │  MEJA  │ │  MEJA  │ │
│  │   01   │ │   02   │ │   03   │ │   04   │ │   05   │ │   06   │ │
│  │        │ │        │ │        │ │        │ │        │ │        │ │
│  │  🔵    │ │  🟢    │ │  🟠    │ │  🔵    │ │  🟢    │ │  🔵    │ │
│  │ EMPTY  │ │  DONE  │ │ ACTIVE │ │ EMPTY  │ │  DONE  │ │ EMPTY  │ │
│  │        │ │ [Reset]│ │ [View] │ │        │ │ [Reset]│ │        │ │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ │
│                                                                        │
│  🟢 = Done (siap dibersihkan)    🟠 = Active (ada order)           │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Component Specifications

### 8.1 MenuItemCard

```tsx
interface MenuItemCardProps {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
  cartQty?: number;
}

// States:
// - Available: full color, + button visible
// - Out of stock: grayscale, "HABIS" overlay, + button disabled
// - In cart: shows [- qty +] controls

// Animation:
// - Add to cart: brief scale pulse on card
// - Badge update: number changes with spring animation
```

### 8.2 FloatingCartButton

```tsx
interface FloatingCartButtonProps {
  totalQty: number;
  totalAmount: number;
  onClick: () => void;
}

// Fixed position: bottom-right
// Size: 56x56px
// Badge: top-right, red circle with white text
// Animation:
// - Appears: slide up when first item added
// - Badge: bounce animation on count change
```

### 8.3 OrderCard (KDS)

```tsx
interface OrderCardProps {
  order: Order;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
}

// States:
// - PENDING: red border, "MULAI PROSES" button
// - PROCESSING: amber border, "SELESAI" button
// - READY: green border, no action
// - COMPLETED: gray, auto-archive

// Animation:
// - New order: slide in from right + pulse border
// - Status change: smooth background color transition
```

### 8.4 WaitEstimateBadge

```tsx
interface WaitEstimateBadgeProps {
  minutes: number;
  queuePosition: number;
  isImmediately: boolean;
}

// Display logic:
// - isImmediately: green badge "±Segera"
// - minutes <= 5: normal orange display
// - minutes > 20: warning note below

// Animation:
// - Countdown: smooth number transition
// - Status change: brief flash when queue moves
```

---

## 9. Navigation

### 9.1 Admin Sidebar

```
┌─────────────────────────────┐
│  🍽️ QR Ordering Admin     │
├─────────────────────────────┤
│  📊 Dashboard             │
│  📋 Menu                 │
│     ├─ Semua Item        │
│     └─ Kategori          │
│  🪑 Meja & QR           │
│  📦 Orders              │
│  📈 Laporan             │
├─────────────────────────────┤
│  ⚙️  Pengaturan          │
└─────────────────────────────┘
```

### 9.2 Guest Bottom Nav (minimal)

```
┌────────────────────────────────────────┐
│                                        │
│           [Content Area]               │
│                                        │
├────────────────────────────────────────┤
│                                        │
│     [Menu]              [Pesanan Saya] │
│                                        │
└────────────────────────────────────────┘
```

---

## 10. Empty States

### 10.1 Empty Cart

```
┌────────────────────────────────────────┐
│                                        │
│           🛒                          │
│                                        │
│      Keranjang kosong                  │
│                                        │
│      Pesan sesuatu yummy!              │
│                                        │
│      [Lihat Menu →]                   │
│                                        │
└────────────────────────────────────────┘
```

### 10.2 No Orders (KDS)

```
┌────────────────────────────────────────┐
│                                        │
│           🍳                          │
│                                        │
│     Belum ada pesanan                  │
│                                        │
│     Pesanan baru akan muncul          │
│     di sini                          │
│                                        │
└────────────────────────────────────────┘
```

### 10.3 No Menu Items

```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│  📋                                                  │
│                                                          │
│  Belum Ada Item di Menu                               │
│  Tambahkan item untuk mulai berjualan                 │
│                                                          │
│  [Tambah Item Pertama →]                             │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 11. Micro-interactions

### 11.1 Add to Cart

```css
/* Button press */
.btn-add {
  transition: transform 100ms;
}

.btn-add:active {
  transform: scale(0.95);
}

/* Badge bounce */
@keyframes badge-bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

.badge-update {
  animation: badge-bounce 200ms ease-out;
}
```

### 11.2 Order Card Transitions

```css
/* New order slide in */
@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.order-card.new {
  animation: slide-in 300ms ease-out;
}

/* Status change */
.order-card {
  transition: background-color 200ms ease-out, border-color 200ms ease-out;
}
```

### 11.3 Wait Estimate Update

```css
/* Number transition */
.estimate-number {
  transition: opacity 150ms, transform 150ms;
}

.estimate-number.updating {
  opacity: 0.7;
  transform: translateY(-2px);
}

/* Queue position change flash */
@keyframes queue-flash {
  0% { background-color: #16A34A; }
  100% { background-color: transparent; }
}

.queue-position-changed {
  animation: queue-flash 500ms ease-out;
}
```

---

## 12. Performance Targets

| Metric | Target | Rationale |
|--------|--------|-----------|
| Menu cold load | < 2s | First impression |
| Menu warm load | < 500ms | Subsequent visits |
| Order submit | < 2s | Core flow |
| KDS update | < 3s | Real-time requirement |
| Cart add | < 100ms | Instant feedback |
| Wait estimate update | < 1s | Queue visibility |

---

## 13. Accessibility

### 13.1 Guest Interface

- All images have alt text
- Price includes currency for screen readers
- Touch targets minimum 44x44px
- Color not sole indicator (icons accompany states)

### 13.2 KDS

- High contrast colors (WCAG AAA for dark mode)
- Large fonts (minimum 16px)
- Status changes announced via aria-live
- Audio notification accompanies visual

### 13.3 Admin

- Keyboard navigation for all actions
- Focus visible indicators
- Form validation with error messages

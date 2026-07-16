# PRD — QR Table Ordering System
**Segmen:** 05 · Kuliner
**Target:** Restoran Franchise Lokal, Kafe Multi-Cabang, Central Kitchen
**Status:** MVP Demo · Pytagotech 2026

---

## 1. Problem Statement

Kafe dan restoran besar kehilangan pelanggan di jam peak karena antrian kasir yang panjang. Order via waitress rawan salah karena lisan atau tulisan tangan. Di franchise dengan banyak cabang, menu dan harga bisa berbeda-beda antar outlet karena tidak ada sistem terpusat. Di central kitchen yang pemasok banyak outlet, data order real-time krusial tapi tidak pernah tersedia.

**Root cause:** Tidak ada sistem ordering digital terpusat yang menghubungkan meja → dapur → kasir tanpa friction.

---

## 2. Goals & Success Metrics

| Goal | Metric |
|------|--------|
| Antrian kasir berkurang | Waktu tunggu bayar turun >50% di jam peak |
| Kesalahan order turun | Error dari "salah dengar/salah tulis" turun ke 0 |
| Update menu instan | Perubahan menu/harga di admin langsung aktif <1 menit |
| Visibility dapur real-time | Order masuk ke dapur <5 detik setelah tamu submit |

---

## 3. User Personas

### 3A. Tamu

| Attribute | Description |
|-----------|-------------|
| **Tugas** | Scan QR, pilih menu, order, bayar |
| **Pain** | Antri lama, takut order salah didengar |
| **Need** | Order sendiri dari HP, pantau status pesanan |
| **Tech level** | Rata-rata, familiar WA/TikTok |
| **Device** | Mobile (HP Android) |

### 3B. Staf Dapur

| Attribute | Description |
|-----------|-------------|
| **Tugas** | Terima dan proses pesanan |
| **Pain** | Kertas order sering hilang, tidak ada urutan jelas |
| **Need** | Layar jelas menampilkan antrean real-time |
| **Device** | Tablet/ monitor di dapur |

### 3C. Admin / Kasir

| Attribute | Description |
|-----------|-------------|
| **Tugas** | Kelola menu, konfirmasi pembayaran, tutup meja |
| **Pain** | Update menu butuh update fisik semua cabang |
| **Need** | Satu panel untuk menu + monitor semua meja |
| **Device** | Desktop/laptop |

### 3D. Owner / Manajer

| Attribute | Description |
|-----------|-------------|
| **Tugas** | Analisis penjualan, keputusan menu, performa cabang |
| **Need** | Laporan penjualan, menu terlaris, jam sibuk |
| **Device** | Desktop/mobile |

---

## 4. Scope MVP

### 4.1 In Scope

**Customer-facing (via QR, no install):**
- Scan QR → buka menu di browser
- Browse menu dengan foto, nama, harga, deskripsi
- Add to cart, ubah qty, note pesanan
- Submit order ke dapur
- Tracking status: Diterima → Diproses → Siap → Selesai

**Dapur display:**
- Halaman kitchen display (tablet/monitor dapur)
- Daftar order antrean real-time
- Update status per item

**Admin panel:**
- CRUD menu (kategori, item, foto, harga, status)
- Monitor semua meja real-time
- Cetak struk / tutup meja
- Laporan penjualan harian

### 4.2 Out of Scope

- Payment gateway (QRIS → fase berikutnya)
- Loyalty/poin program
- Multi-cabang management (MVP: satu outlet)
- KDS hardware integration
- Inventory management

---

## 5. Feature Specification

### F-01 · QR Code per Meja

**As an** admin
**I want to** generate unique QR codes for each table
**So that** customers can access the menu by scanning

**Setup Flow:**
1. Admin input jumlah meja (e.g., 12)
2. Generate QR per meja dengan URL unik
3. Download QR (PDF A5, 1 per page)

**URL Format:** `/m/[outletSlug]/[tableToken]`

**Business Rules:**
- Scan QR → langsung buka menu (no install, no login)
- Session per meja: cart tersimpan selama tab browser terbuka
- Multi-device: cart terpisah per HP (session-based)

**Acceptance Criteria:**
- [ ] Generate QR untuk 1-50 meja
- [ ] QR bisa di-print dan discan
- [ ] PDF export berfungsi
- [ ] Unique token tidak bisa ditebak

---

### F-02 · Menu Digital (Tamu)

**As a** customer
**I want to** browse menu and add items to cart
**So that** I can order without calling waiter

**Menu Display:**

| Element | Description |
|---------|-------------|
| Header | Logo outlet, nomor meja |
| Category tabs | Horizontal scroll, sticky |
| Item grid | 2 kolom (mobile), 3-4 kolom (tablet) |
| Item card | Foto 1:1, nama, harga, tombol +/- |

**Item Card States:**

| State | Visual |
|-------|--------|
| Available | Full color, tombol + aktif |
| Out of stock | Grayscale, overlay "HABIS", tombol disabled |
| In cart | Tombol berubah [- qty +] |

**Item Detail Modal:**
- Foto besar
- Nama + deskripsi
- Varian (jika ada): ukuran, level pedas
- Note input
- Tombol tambah

**Acceptance Criteria:**
- [ ] Menu load < 2 detik (cold)
- [ ] Kategori tab berfungsi
- [ ] Item "HABIS" tampil berbeda
- [ ] Add to cart dengan animasi
- [ ] Cart badge update real-time

---

### F-03 · Cart & Order

**As a** customer
**I want to** review and submit my order
**So that** my order reaches the kitchen

**Cart Page:**

| Element | Description |
|---------|-------------|
| Item list | Foto, nama, qty control, harga |
| Note per item | Text input collapsible |
| General note | Textarea di bawah |
| Subtotal | Auto-calculated |
| Grand total | Bold, besar |
| Tombol pesan | Full-width, prominent |

**Order Submit:**
- Konfirmasi: "Pesanan dikirim ke dapur!"
- Cart reset setelah submit
- Halaman status tracking muncul
- Bisa order lagi (tambah pesanan)

**Acceptance Criteria:**
- [ ] Cart persist selama session
- [ ] Qty bisa diubah langsung di cart
- [ ] Note tersimpan per item
- [ ] Grand total akurat
- [ ] Submit < 3 detik

---

### F-04 · Kitchen Display System (KDS)

**As a** kitchen staff
**I want to** see incoming orders in real-time
**So that** I can process them in order

**Display Layout:**

```
┌────────────────────────────────────────────────────────────────┐
│  Kitchen Display                    Kafe Coklat SBY    10:45 AM  │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐  │
│  │ MEJA 03 · 5min │ │ MEJA 07 · 12min │ │ MEJA 11 · 18min │  │
│  │ 🔴 BARU         │ │ 🟡 PROSES      │ │ 🔴 BARU         │  │
│  │─────────────────│ │─────────────────│ │─────────────────│  │
│  │ 2x Americano    │ │ 1x Nasi Goreng │ │ 3x Kopi Susu   │  │
│  │ 1x Nasi Goreng │ │   - kurang pedas│ │ 1x Roti Bakar  │  │
│  │   - kurang pedas│ │                 │ │                 │  │
│  │─────────────────│ │─────────────────│ │─────────────────│  │
│  │ [ MULAI ]      │ │ [ SELESAI ]    │ │ [ MULAI ]      │  │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**Order Card States:**

| Status | Border | Background | Action |
|--------|--------|------------|--------|
| BARU | `#DC2626` | `#7F1D1D` | MULAI PROSES |
| PROSES | `#D97706` | `#78350F` | SELESAI |
| SIAP | `#16A34A` | `#14532D` | - |
| DONE | gray | `#374151` | Archive |

**Sorting:** Baru di kiri, urutan waktu

**Acceptance Criteria:**
- [ ] Order muncul < 3 detik setelah submit
- [ ] Notifikasi suara saat order baru
- [ ] Card highlight saat status berubah
- [ ] Estimasi wait time tampil

---

### F-05 · Status Tracking (Tamu)

**As a** customer
**I want to** track my order status on my phone
**So that** I know when to pick up

**Tracking Display:**

```
┌────────────────────────────────────────┐
│  Status Pesanan                       │
│  ─────────────────────────────────── │
│                                        │
│  Pesanan #ORD-M05-001                  │
│  Meja 05                              │
│  ─────────────────────────────────── │
│                                        │
│  ● Pesanan Diterima     ✓            │
│  │                                      │
│  ● Sedang Diproses       ●            │
│  │                                      │
│  ○ Siap Diambil                      │
│  │                                      │
│  ○ Selesai                            │
│                                        │
│  ┌─────────────────────────────────┐  │
│  │  Estimasi menunggu              │  │
│  │  ⏱️  ±12 menit                 │  │
│  │  Pesanan Anda: #3 di antrean    │  │
│  └─────────────────────────────────┘  │
│                                        │
│  [Pesanan Anda]                        │
│  2x Americano                         │
│  1x Nasi Goreng (kurang pedas)       │
│                                        │
│  [Tambah Pesanan →]                   │
│                                        │
└────────────────────────────────────────┘
```

**Acceptance Criteria:**
- [ ] Status update real-time
- [ ] Progress stepper akurat
- [ ] Estimasi waktu tampil
- [ ] Bisa tambah pesanan tanpa buat baru

---

### F-06 · Admin: Menu Management

**As an** admin
**I want to** manage menu items and categories
**So that** menu is always up-to-date

**Category Management:**
- Tambah/edit/hapus/rename kategori
- Drag to reorder
- Set active/inactive

**Item Management:**

| Field | Type | Required |
|-------|------|----------|
| name | string | yes |
| categoryId | FK | yes |
| description | string | no |
| basePrice | decimal | yes |
| photo | file | no |
| avgPrepTimeMinutes | integer | no (default: 8) |
| isAvailable | boolean | yes |
| variants | JSON | no |

**Toggle "Habis":**
- Toggle isAvailable → langsung propagate ke semua tamu
- Real-time update via polling (5 detik) atau Supabase Realtime

**Acceptance Criteria:**
- [ ] CRUD lengkap kategori
- [ ] CRUD lengkap item
- [ ] Upload foto berfungsi
- [ ] Toggle HABIS real-time

---

### F-07 · Admin: Floor Monitor & Reports

**As an** admin
**I want to** monitor all tables and view sales reports
**So that** I can manage operations efficiently

**Floor Monitor:**
- Grid semua meja dengan status
- Klik meja → lihat order aktif
- Tutup meja → reset ke Kosong

**Meja Status Colors:**

| Status | Color | Description |
|--------|-------|-------------|
| Kosong | gray | Tidak ada order |
| Aktif | orange | Ada order aktif |
| Selesai | green | Perlu dibersihkan |

**Reports:**

| Report | Metrics |
|--------|---------|
| Harian | Total order, revenue, avg order value |
| Menu terlaris | Items sold by quantity |
| Jam sibuk | Orders per hour |
| Table performance | Revenue per table |

**Acceptance Criteria:**
- [ ] Floor view update real-time
- [ ] Close table resets status
- [ ] Reports calculate accurately
- [ ] Export CSV berfungsi

---

### F-08 · Estimasi Waktu Penyajian

**As a** customer
**I want to** see estimated wait time for my order
**So that** I know how long to wait

**Logic:**
```
queuePosition = COUNT(orders WHERE status IN (PENDING, PROCESSING) AND createdAt < thisOrder.createdAt)
estimatedWaitMinutes = queuePosition × globalAvgPrepTime
estimatedDoneAt = now + estimatedWaitMinutes
```

**Display Locations:**

**A. Halaman Tracking (HP Tamu):**
```
┌─────────────────────────────────┐
│ Estimasi menunggu               │
│ ⏱️  ±12 menit                  │
│ Pesanan Anda: #3 di antrean    │
└─────────────────────────────────┘
```

**B. Kitchen Display Card:**
```
┌──────────────────────────────┐
│ MEJA 05 · 5mnt [±8mnt]      │
│ 2x Americano                  │
│ [MULAI PROSES]              │
└──────────────────────────────┘
```

**Edge Cases:**

| Scenario | Display |
|----------|---------|
| Queue = 1 (first) | "±Segera" atau "Segera" |
| Queue > 1 | "~±X menit" |
| Wait > 20 minutes | Note: "Mohon maaf, antrean sedang panjang" |
| Global toggle off | Hide all estimates |

**Acceptance Criteria:**
- [ ] Estimate accurate (±2 menit)
- [ ] Updates when queue changes
- [ ] "Segera" for first in queue
- [ ] Admin can toggle feature

---

## 6. User Story (INVEST Format)

### US-01: Order dari Scan QR

```
As a customer
I want to scan a QR code and order from my phone
So that I don't need to wait for a waiter
```

**Acceptance Criteria:**
- QR scan opens menu < 2 seconds
- Can browse categories and items
- Cart persists during session
- Order submit succeeds with confirmation

### US-02: Dapur Terima Order

```
As a kitchen staff
I want to see orders on a screen
So that I can process them in order
```

**Acceptance Criteria:**
- New order appears < 3 seconds
- Audio notification plays
- Can mark order as started/completed
- Orders sorted by time

### US-03: Pantau Pesanan

```
As a customer
I want to track my order status on my phone
So that I know when food is ready
```

**Acceptance Criteria:**
- Status updates in real-time
- Wait estimate is accurate
- Can add more items to existing order

### US-04: Toggle Item Habis

```
As an admin
I want to mark items as sold out
So that customers don't order unavailable items
```

**Acceptance Criteria:**
- Toggle reflects immediately on all connected devices
- Item shows "HABIS" overlay
- Can re-enable when restocked

---

## 7. Data Model

```prisma
model Outlet {
  id          String      @id @default(cuid())
  name        String
  slug        String      @unique
  address     String?
  logoUrl     String?
  tables      Table[]
  categories  Category[]
  menuItems   MenuItem[]
  orders      Order[]
  createdAt   DateTime    @default(now())
}

model Table {
  id          String     @id @default(cuid())
  outletId    String
  outlet      Outlet    @relation(fields: [outletId], references: [id])
  tableNumber Int
  qrToken     String    @unique @default(cuid())
  status      TableStatus @default(EMPTY)
  orders      Order[]
  createdAt   DateTime   @default(now())
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
  basePrice        Decimal
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
  additionalPrice Decimal  @default(0)
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
  totalAmount     Decimal
  estimatedDoneAt DateTime?
  queuePosition   Int?
  createdAt       DateTime    @default(now())
  processedAt     DateTime?
  completedAt      DateTime?
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
  unitPrice  Decimal
  itemNotes  String?
}
```

---

## 8. Technical Architecture

### 8.1 Stack

```
Framework:     Next.js 14 (App Router)
Database:      PostgreSQL via Supabase
ORM:          Prisma
Auth:         NextAuth.js (admin only)
Realtime:     Supabase Realtime (postgres changes)
Storage:      Supabase Storage (menu photos)
Styling:      Tailwind CSS v3
QR Gen:       qrcode library
PDF:          jsPDF (QR card printing)
Deploy:       Vercel + Supabase
```

### 8.2 API Design

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/public/menu/[outletSlug]` | GET | Get menu (public) |
| `/api/public/order` | POST | Submit order (public) |
| `/api/public/order/[id]/status` | GET | Get order status |
| `/api/kitchen/orders` | GET | Get pending orders (KDS) |
| `/api/kitchen/order/[id]/status` | PATCH | Update order status |
| `/api/admin/menu` | GET/POST | Menu CRUD |
| `/api/admin/menu/[id]` | GET/PUT/DELETE | Item CRUD |
| `/api/admin/categories` | GET/POST | Category CRUD |
| `/api/admin/tables` | GET/POST | Table CRUD |
| `/api/admin/tables/[id]/qr` | GET | Generate QR for table |
| `/api/admin/reports` | GET | Sales reports |
| `/api/admin/floor` | GET | Floor status |
| `/api/admin/floor/[tableId]/close` | POST | Close table |

---

## 9. Demo Script

**Opening Hook:** "Berapa meja yang bisa Anda layani sebelum dapur mulai kewalahan di jam makan siang?"

**Flow:**
1. Scan QR dari HP → menu muncul < 2 detik
2. Pilih 3 item + note → submit order
3. **Tunjukkan estimasi waktu:** "~±12 menit, pesanan #3 di antrean"
4. KDS di tablet: order masuk real-time + suara notif
5. Update status: "Diproses" → "Selesai"
6. HP tamu: status update + estimasi berubah
7. Admin: toggle item "Habis" → langsung abu di semua HP
8. Laporan: menu terlaris, jam peak

**Close:** "Tidak ada antrian kasir. Tidak ada order salah. Dapur tidak perlu teriak-teriak. Tamu tahu berapa lama menunggu."

---

## 10. Timeline

| Phase | Duration |
|-------|----------|
| Setup + schema + Supabase | 1 hari |
| QR generation + PDF export | 1 hari |
| Menu CRUD + foto upload | 2 hari |
| Menu digital tamu | 3 hari |
| Cart + order submit | 2 hari |
| Status tracking (tamu) | 2 hari |
| KDS (Kitchen Display) | 3 hari |
| Admin: floor monitor | 2 hari |
| Admin: reports + export | 2 hari |
| F-08: Estimasi waktu | 2 hari |
| Seed data + polish | 2 hari |
| **Total** | **~22 hari kerja** |

---

## 11. Definition of Done

- [ ] QR scan → menu load < 2s
- [ ] Order submit → KDS < 3s
- [ ] KDS audio notification works
- [ ] Status tracking real-time update
- [ ] Toggle HABIS propagates < 5s
- [ ] Reports accurate
- [ ] Mobile UX tested on Android
